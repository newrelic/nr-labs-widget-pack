import React, { useEffect, useState } from 'react';
import { navigation, Button, Card, CardBody } from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

function NerdletLoader(props) {
  const { actions, textAlign, immediateUrlReplace, showDocs } = props;
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (immediateUrlReplace) {
      window.location.replace(immediateUrlReplace);
    }

    const tempErrors = [];

    actions.forEach((action, index) => {
      const errorObj = { name: `Action ${index + 1}`, errors: [] };

      if (!action.name) {
        errorObj.errors.push(`Requires name`);
      }
      if (!action.actionType) {
        errorObj.errors.push(`Requires action type`);
      }
      if (!action.id) {
        errorObj.errors.push(`Requires a nerdlet id or hyperlink`);
      }

      if (errorObj.errors.length > 0) {
        tempErrors.push(errorObj);
      }
    });

    setErrors(tempErrors);
  }, [actions]);

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <>
      {showDocs && <Docs />}
      <Card style={{ textAlign }}>
        <CardBody>
          {actions.map((action, index) => {
            const {
              name,
              actionType,
              id,
              urlState,
              sizeType,
              buttonType
            } = action;

            let onClick;

            if (actionType === 'hyperlink') {
              onClick = () => window.open(id);
            } else if (actionType === 'stackedNerdletId') {
              let json = null;
              try {
                json = JSON.parse(urlState);
              } catch (e) {
                // eslint-disable-next-line
                console.log('failed to parse json urlState', e);
              }

              onClick = () => {
                const nerdlet = {
                  id,
                  urlState: json
                };
                navigation.openStackedNerdlet(nerdlet);
              };
            } else if (actionType === 'stackedEntityGuid') {
              onClick = () => {
                navigation.openStackedEntity(id);
              };
            } else if (actionType === 'stackedLink') {
              onClick = () => {
                navigation.openStackedNerdlet({
                  id: 'link-wrapper',
                  urlState: {
                    url: id
                  }
                });
              };
            } else if (actionType === 'windowReplace') {
              onClick = () => {
                window.location.replace(id);
              };
            }

            return (
              <div
                key={index}
                style={{ padding: '5px', display: 'inline-block' }}
              >
                <Button
                  onClick={onClick}
                  sizeType={Button.SIZE_TYPE[sizeType]}
                  type={Button.TYPE[buttonType]}
                >
                  {name}
                </Button>
                &nbsp; &nbsp;
              </div>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}

export default NerdletLoader;
