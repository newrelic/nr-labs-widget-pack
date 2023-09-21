import React from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  HeadingText,
  BlockText,
  Spacing
} from 'nr1';

import RenderPropertyInfo from '../../shared/PropertyInfo';

const properties = require('./nr1.json');

// if the key matches a config property name, the additional information will be added
const additionalDocs = {};

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Action Loader, is used to trigger other platform actions and
            features.
            <br />
            <br />
            Below are a list of action types available:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>Stacked Nerdlet ID</li>
                <li>Stacked Nerdlet GUID</li>
                <li>Hyperlink</li>
                <li>Stacked Link (experimental)</li>
                <li>Window URL Replace (experimental)</li>
              </ul>
            </Spacing>
          </BlockText>
        </CardBody>
      </Card>

      <Card collapsible defaultCollapsed>
        <CardHeader title="Properties" />
        <CardBody style={{ marginLeft: '35px' }}>
          {properties.configuration
            .filter(c => c.name !== 'showDocs')
            .map(config => {
              return RenderPropertyInfo(config, false, additionalDocs);
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
