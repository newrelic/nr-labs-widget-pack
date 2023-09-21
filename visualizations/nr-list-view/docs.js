import React from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  HeadingText,
  BlockText,
  Spacing,
  Link
} from 'nr1';

import RenderPropertyInfo from '../../shared/PropertyInfo';

const properties = require('./nr1.json');

// if the key matches a config property name, the additional information will be added
const additionalDocs = {
  tickFormat: {
    description: '', // optional override of the property config description
    additionalInfo: '', // optional extra info
    links: [
      {
        name: 'Parsing documentation',
        link: 'https://day.js.org/docs/en/display/format'
      }
    ]
  }
};

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            List View displays NRQL-queried data in a list. The list items are
            rows returned by the query, and formatted using a template.
            <br />
            <br />
            Below are a list of additional features:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>Coerce values to number, date and boolean types</li>
                <li>Format numbers and dates</li>
                <li>
                  Convert between digital size types (bytes, kilobytes, ...)
                </li>
                <li>Search bar to filter list to the searched text</li>
              </ul>
            </Spacing>
            Read the{' '}
            <Link to="https://github.com/newrelic/nr-labs-widget-pack/blob/main/list-view-template.md">
              Template String documentation
            </Link>{' '}
            for details.
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
