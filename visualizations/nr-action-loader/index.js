import React, { useEffect, useState } from 'react';
import { navigation, Button, Card, CardBody } from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';
import toSafeUrl from '../../shared/toSafeUrl';

function NerdletLoader(props) {
  const { actions, textAlign, immediateUrlReplace, showDocs } = props;
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const tempErrors = [];

    if (immediateUrlReplace) {
      const safeUrl = toSafeUrl(immediateUrlReplace);
      if (safeUrl) {
        window.location.replace(safeUrl);
      } else {
        tempErrors.push({
          name: 'Immediate URL Replace',
          errors: ['Must be an http(s) URL']
        });
      }
    }

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
      } else if (
        (action.actionType === 'hyperlink' ||
          action.actionType === 'stackedLink' ||
          action.actionType === 'windowReplace') &&
        !toSafeUrl(action.id)
      ) {
        errorObj.errors.push(`Hyperlink must be an http(s) URL`);
      }

      if (errorObj.errors.length > 0) {
        tempErrors.push(errorObj);
      }
    });

    setErrors(tempErrors);
  }, [actions, immediateUrlReplace]);

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
              onClick = () => {
                const url = toSafeUrl(id);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              };
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
                const url = toSafeUrl(id);
                if (!url) return;
                navigation.openStackedNerdlet({
                  id: 'link-wrapper',
                  urlState: {
                    url
                  }
                });
              };
            } else if (actionType === 'windowReplace') {
              onClick = () => {
                const url = toSafeUrl(id);
                if (url) window.location.replace(url);
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
