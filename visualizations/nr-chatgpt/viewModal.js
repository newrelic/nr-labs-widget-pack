import React, { useEffect } from 'react';
import { HeadingText, Button, Modal, BlockText, MultilineTextField } from 'nr1';
import { extractNRQL, openChartBuilder, renderChart } from './utils';
import { useSetState } from '@mantine/hooks';

export function ViewModal(props) {
  const { data, setState, accountId } = props;
  const [state, localSetState] = useSetState({
    extractedNRQL: null,
    chartType: null
  });

  useEffect(() => {
    const extractedNRQL = extractNRQL(data?.document?.r || '');

    if (extractedNRQL) {
      localSetState({
        extractedNRQL,
        chartType: extractedNRQL.toLowerCase().includes('timeseries')
          ? 'line'
          : 'billboard'
      });
    } else {
      localSetState({ extractedNRQL: null, chartType: null });
    }
  }, [data]);

  return (
    <>
      <Modal
        hidden={!data}
        onClose={() => setState({ selectedDocument: null })}
      >
        {data && (
          <>
            <HeadingText type={HeadingText.TYPE.HEADING_5}>
              ID: {data?.id}
            </HeadingText>
            <br />
            <HeadingText type={HeadingText.TYPE.HEADING_5}>
              Question
            </HeadingText>
            <BlockText type={BlockText.TYPE.PARAGRAPH}>
              {data?.document?.q}
            </BlockText>
            <br />
            <HeadingText type={HeadingText.TYPE.HEADING_5}>
              Response
            </HeadingText>
            <MultilineTextField
              style={{ width: '100%' }}
              value={data?.document?.r}
            />
            <br /> <br />
            {state?.extractedNRQL && (
              <>
                {renderChart(
                  state.extractedNRQL,
                  accountId,
                  state?.chartType,
                  500
                )}
              </>
            )}
            {state?.extractedNRQL && (
              <>
                <Button
                  onClick={() => {
                    openChartBuilder({ query: state.extractedNRQL, accountId });
                    setState({ selectedDocument: null });
                  }}
                >
                  Open in chart builder
                </Button>
              </>
            )}
            <Button
              style={{ float: 'right' }}
              onClick={() => setState({ selectedDocument: false })}
            >
              Close
            </Button>
          </>
        )}
      </Modal>
    </>
  );
}
