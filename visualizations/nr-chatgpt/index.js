import React, { useEffect, useState } from 'react';
import {
  Spinner,
  AutoSizer,
  Button,
  Card,
  CardBody,
  HeadingText,
  TextField,
  MultilineTextField,
  Dropdown,
  DropdownItem,
  NerdGraphQuery,
  UserStorageQuery,
  UserStorageMutation
} from 'nr1';
import { useSetState } from '@mantine/hooks';

import { Configuration, OpenAIApi } from 'openai';
import { ResponseModal } from './responseModal';
import { ErrorModal } from './errorModal';
import { ResultTable } from './resultTable';
import { ViewModal } from './viewModal';
import { assessResponse, openChartBuilder, renderChart } from './utils';

const { v4: uuidv4 } = require('uuid');

const initState = {
  cgptTextResponse: '',
  cgptFullResponse: '',
  cgptError: null,
  cgptErrorTitle: '',
  showChartBuilderButton: false,
  chartType: null,
  selectedDocument: null,
  extractedNRQL: null
};

export default function ChatGPT(props) {
  const {
    accountId,
    cgptOrgId,
    cgptApiKey,
    cgptMaxTokens,
    cgptModel,
    cgptTemp
  } = props;
  const [errors, setErrors] = useState([]);
  const [question, setQuestion] = useState('');
  const [state, setState] = useSetState({
    started: false,
    cgptRequesting: false,
    userHistory: [],
    accounts: [],
    responseModalOpen: false,
    errorModalOpen: false,
    viewModalOpen: false,
    writingUserResult: false,
    ...initState
  });

  useEffect(() => {
    const tempErrors = [];

    if (!accountId) {
      tempErrors.push('Default Account ID required');
    }

    if (!cgptOrgId) {
      tempErrors.push(
        'OpenAI Organization ID required -> https://platform.openai.com/account/org-settings'
      );
    }

    if (!cgptApiKey) {
      tempErrors.push(
        'OpenAI API Key required -> https://platform.openai.com/account/api-keys'
      );
    }

    if (cgptMaxTokens && isNaN(cgptMaxTokens)) {
      tempErrors.push('Max Tokens should be a number');
    }

    if (cgptTemp && isNaN(cgptTemp)) {
      tempErrors.push('Sampling Temperature should be a number');
    }

    setErrors(tempErrors);
  }, [accountId, cgptApiKey, cgptOrgId, cgptMaxTokens, cgptTemp]);

  useEffect(async () => {
    const accountsResp = await NerdGraphQuery.query({
      query: `{
      actor {
        accounts {
          id
          name
        }
      }
    }`
    });
    const accounts = accountsResp?.data?.actor?.accounts || [];

    const userHistoryResp = await UserStorageQuery.query({
      collection: 'history'
    });

    setState({
      started: true,
      accounts,
      userHistory: userHistoryResp?.data || []
    });
  }, []);

  const writeUserResult = () => {
    return new Promise(resolve => {
      const documentId = uuidv4();
      const document = {
        q: question,
        r: state?.cgptTextResponse,
        d: new Date().getTime()
      };
      const { userHistory } = state;

      userHistory.push({ id: documentId, document });
      setState({ writingUserResult: true, userHistory });

      UserStorageMutation.mutate({
        actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'history',
        documentId,
        document
      }).then(data => {
        setState({ writingUserResult: false });
        resolve(data);
      });
    });
  };

  const deleteUserResult = documentId => {
    return new Promise(resolve => {
      UserStorageMutation.mutate({
        actionType: UserStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
        collection: 'history',
        documentId
      }).then(data => {
        const newUserHistory = state?.userHistory.filter(
          d => d.id !== documentId
        );
        setState({ userHistory: newUserHistory });
        resolve(data);
      });
    });
  };

  const ErrorState = (errors, clearable) => (
    <Card className="ErrorState">
      <CardBody className="ErrorState-cardBody">
        <HeadingText
          className="ErrorState-headingText"
          spacingType={[HeadingText.SPACING_TYPE.LARGE]}
          type={HeadingText.TYPE.HEADING_3}
        >
          Oops! Something went wrong.
        </HeadingText>

        {errors.map(err => (
          <>
            {err}
            <br />
          </>
        ))}
        {clearable && (
          <Button onClick={() => setState({ cgptError: null })}>
            Clear Errors
          </Button>
        )}
      </CardBody>
    </Card>
  );

  const askChatGpt = async () => {
    setState({
      cgptRequesting: true,
      ...initState
    });

    const configuration = new Configuration({
      organization: cgptOrgId,
      apiKey: cgptApiKey
    });

    const openai = new OpenAIApi(configuration);

    try {
      openai
        .createCompletion({
          model: cgptModel || 'text-davinci-003',
          prompt: question,
          max_tokens: parseInt(cgptMaxTokens || 30),
          temperature: parseInt(cgptTemp || 1)
        })
        .then(response => {
          if (response?.status === 200) {
            // eslint-disable-next-line
            console.log(
              `model: ${cgptModel ||
                'default model'}, q: ${question}, tokens: ${cgptMaxTokens ||
                30}`
            );

            const textResponse = response?.data?.choices?.[0]?.text;

            setState({
              cgptTextResponse: textResponse.trim(),
              cgptFullResponse: response,
              cgptRequesting: false
            });

            assessResponse(setState, question, textResponse);
          } else {
            setState({
              cgptErrorTitle: 'Request Error',
              errorModalOpen: true,
              cgptError:
                'Something went wrong, check the console for more info',
              cgptRequesting: false
            });
            // eslint-disable-next-line
            console.log(response);
          }
        })
        .catch(e => {
          setState({
            cgptErrorTitle: 'Request Error',
            errorModalOpen: true,
            cgptError: e,
            cgptRequesting: false
          });
        });
    } catch (e) {
      setState({
        cgptErrorTitle: 'Request Error',
        errorModalOpen: true,
        cgptError: e,
        cgptRequesting: false
      });
    }
  };

  if (state?.cgptError) {
    return ErrorState([state.cgptError], true);
  }

  if (errors && errors.length > 0) {
    return ErrorState(errors);
  }

  const renderChartBuilderOptions = query => {
    return (
      <>
        <Dropdown title="Open in Chart Builder">
          {(state.accounts || [])
            .sort((a, b) => a.id - b.id)
            .map(a => (
              <DropdownItem
                key={a.id}
                onClick={() =>
                  openChartBuilder({
                    query: query || state?.extractedNRQL,
                    accountId: a.id
                  })
                }
              >
                {a.id}: {a.name}
              </DropdownItem>
            ))}
        </Dropdown>
        &nbsp;
      </>
    );
  };

  if (state.started !== true) {
    return <Spinner />;
  }

  return (
    <AutoSizer>
      {({ width }) => (
        <Card style={{}}>
          <ErrorModal
            title={state?.cgptErrorTitle}
            error={state?.cgptError}
            open={state?.errorModalOpen}
            setState={setState}
          />
          <ResponseModal
            json={state?.cgptFullResponse}
            open={state?.responseModalOpen}
            setState={setState}
          />
          <ViewModal
            data={state?.selectedDocument}
            setState={setState}
            accountId={accountId}
          />

          <CardBody>
            <TextField
              style={{ width: width - 170 }}
              type={TextField.TYPE.SEARCH}
              placeholder="Write a NRQL query to get the count of transactions"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              loading={state.cgptRequesting}
            />
            &nbsp;&nbsp;&nbsp;
            <Button
              style={{ width: 100 }}
              sizeType={Button.SIZE_TYPE.SMALL}
              onClick={() => askChatGpt()}
              disabled={!question || question.length < 5}
            >
              Request
            </Button>
            <br />
            <br />
            {state?.cgptTextResponse && (
              <>
                <MultilineTextField
                  style={{ width: width - 170, display: 'inline-block' }}
                  label="Response (modify if required, increase max tokens if response is too short)"
                  onChange={e => setState({ cgptTextResponse: e.target.value })}
                  value={state?.cgptTextResponse}
                />
                &nbsp;&nbsp;&nbsp;
                <div
                  style={{
                    width: 100,
                    display: 'inline-block'
                  }}
                >
                  <Button
                    style={{ width: 100, marginTop: '-33px' }}
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() => writeUserResult()}
                    loading={state?.writingUserResult}
                  >
                    Save
                  </Button>
                  <br />
                  <br />
                  <Button
                    style={{ width: 100, marginTop: '-33px' }}
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() => setState({ ...initState })}
                  >
                    Clear
                  </Button>
                </div>
              </>
            )}
            {state?.extractedNRQL && renderChartBuilderOptions()}
            {state?.cgptFullResponse && (
              <>
                <Button
                  sizeType={Button.SIZE_TYPE.SMALL}
                  onClick={() => setState({ responseModalOpen: true })}
                >
                  View ChatGPT Payload
                </Button>
                &nbsp;
              </>
            )}
            {state?.extractedNRQL && (
              <div>
                {renderChart(
                  state.extractedNRQL,
                  accountId,
                  state.chartType,
                  500
                )}
              </div>
            )}
            {(state?.userHistory || []).length > 0 && (
              <ResultTable
                width={width}
                setState={setState}
                userHistory={state?.userHistory}
                deleteUserResult={deleteUserResult}
              />
            )}
          </CardBody>
        </Card>
      )}
    </AutoSizer>
  );
}
