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
            Use the Billboard & Line Chart to plot a single value and an
            optional timeseries in the same chart. e.g. Latest active alerts vs
            the trend of alerts.
            <br />
            <br />
            The chart allows for definition of a single billboard query and
            timeseries query, as well as an optional separate compare with query
            (that will be used to determine a percent change value)
            <br />
            <br />
            Compare with clauses can also be used directly within the billboard
            query itself.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Query Syntax" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, there are a few requirements:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>
                  1 billboard query and optionally 1 compare with query and
                  timeseries query.
                </li>
                <li>
                  Billboard and compare with queries should not contain the{' '}
                  <code>TIMESERIES</code> clause
                </li>
                <li>
                  Timeseries queries should contain the <code>TIMESERIES</code>{' '}
                  clause
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                A valid billboard or compare with query for the chart could look
                like this:{' '}
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>FROM NrAiIssue SELECT uniqueCount(issueId) </code>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                A valid timeseries query for the chart could look like this:{' '}
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>SELECT count(*) FROM Transaction TIMESERIES</code>
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
