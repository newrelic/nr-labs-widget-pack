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

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Use the Entity Navigator chart to display health status of targeted
            entities. A single entity type can be defined per widget.
            <br />
            <br />
            The chart supports high density and golden signal views, which can
            be toggled with the <code>Include Data</code> option.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Requirements" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, a valid entity domain must first be
            selected.
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                An optional <code>entitySearch</code> query can also be
                specified to filter entities as desired. Common examples:
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <code>tags.environment = 'production'</code>
                </li>
                <li>
                  <code>name like '%aws%' and reporting is true</code>
                </li>
                <li>
                  <code>type in ('APPLICATION', 'HOST', 'MONITOR')</code>
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <p>
                More examples can be found in the New Relic{' '}
                <a
                  href="https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-entities-api-tutorial/#search-querybuilder"
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs
                </a>
              </p>
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
              return RenderPropertyInfo(config, false, {});
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
