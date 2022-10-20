import React, { useEffect, useState } from 'react';
import { navigation, Button, Card, CardBody, HeadingText } from 'nr1';

function NerdletLoader(props) {
  const { actions, textAlign } = props;
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const tempErrors = [];

    actions.forEach((action, index) => {
      if (!action.name) {
        tempErrors.push(`${index + 1}: Requires name`);
      }
      if (!action.actionType) {
        tempErrors.push(`${index + 1}: Requires action type`);
      }
      if (!action.id) {
        tempErrors.push(`${index + 1}: Requires a nerdlet id or hyperlink`);
      }
    });

    setErrors(tempErrors);
  }, [actions]);

  if (errors.length > 0) {
    return ErrorState(errors);
  }

  return (
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
  );
}

const ErrorState = errors => (
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
    </CardBody>
  </Card>
);

export default NerdletLoader;
