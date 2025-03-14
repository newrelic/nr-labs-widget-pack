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
            Use the Alert Billboard chart to display the current count of active
            issues alongside a count of issue open events over a time range
            selected. This widget also supports optional filtering by a specific
            entity type.
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
                <li>
                  <code>tags.policyId = '123'</code>
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
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
            <br />
            <br />
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <p>
                An optional entity type filter can also be applied - Such as
                APPLICATION, HOST, or MONITOR.
              </p>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <p>
                To determine all entity types that are alerting, run the
                following NRQL query:{' '}
              </p>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                FROM NrAiIssue SELECT uniques(entity.types[0]) since 1 week ago
              </code>
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
