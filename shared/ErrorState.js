import React from 'react';

import {
  Card,
  CardBody,
  HeadingText,
  BlockText,
  Icon,
  List,
  ListItem
} from 'nr1';

export default function ErrorState(props) {
  const { errors, showDocs, Docs } = props;
  return (
    <Card className="DocState">
      <CardBody className="ErrorState-cardBody">
        <div className="ErrorState-errors">
          <HeadingText
            spacingType={[
              HeadingText.SPACING_TYPE.LARGE,
              HeadingText.SPACING_TYPE.OMIT
            ]}
            type={HeadingText.TYPE.HEADING_2}
          >
            Just a few steps needed to finish up
          </HeadingText>

          <HeadingText
            type={HeadingText.TYPE.HEADING_5}
            spacingType={[
              HeadingText.SPACING_TYPE.OMIT,
              HeadingText.SPACING_TYPE.LARGE,
              HeadingText.SPACING_TYPE.LARGE,
              HeadingText.SPACING_TYPE.LARGE
            ]}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Icon
                type={Icon.TYPE.INTERFACE__SIGN__EXCLAMATION__V_ALTERNATE}
                color="rgb(61, 157, 255)"
                style={{ paddingRight: '4px' }}
              />
              Enable the documentation toggle in the visualization properites
              for detailed help.
            </span>
          </HeadingText>

          {(errors || []).map((err, idx) => (
            <div key={idx} className="ErrorState-errorBody">
              <HeadingText
                spacingType={[
                  HeadingText.SPACING_TYPE.OMIT,
                  HeadingText.SPACING_TYPE.OMIT,
                  HeadingText.SPACING_TYPE.SMALL,
                  HeadingText.SPACING_TYPE.OMIT
                ]}
              >
                {err.name}
              </HeadingText>
              <BlockText>
                <List>
                  {(err?.errors || []).map((err, i) => (
                    <ListItem style={{ paddingBottom: '2px' }} key={i}>
                      {err}
                    </ListItem>
                  ))}
                </List>
              </BlockText>
            </div>
          ))}
        </div>
        {showDocs && <Docs />}
      </CardBody>
    </Card>
  );
}
