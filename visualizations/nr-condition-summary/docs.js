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
            Use the Alert Condition Summary chart to display the current state
            of alert conditions. This includes counts of conditions in each
            state, as well as how many open issues each condition has triggered.
            <br />
            <br />
            The chart supports displaying individual conditions, or grouping by
            tags/metadata. Group mode is enabled when the `Group By` dropdown is
            set to something other than `None`.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Requirements" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, a valid condition filter must first
            be configured. Examples:
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <ul>
                <li>
                  <code>tags.team = 'global_ops'</code>
                </li>
                <li>
                  <code>name like '%myConditionName%'</code>
                </li>
                <li>
                  <code>tags.accountId in (1,2,3)</code>
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
