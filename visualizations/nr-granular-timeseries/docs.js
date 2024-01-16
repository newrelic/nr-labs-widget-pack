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
            Use the Granular Timeseries Chart to see longer periods of data in
            high granularity above the default 366 allowance.
            <br />
            <br />
            The Granular Timeseries Chart, supports Line, Area & Sparkline chart
            types.
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
                  Each query must use and end with the <code>TIMESERIES</code>{' '}
                  clause, and also contain the bucket eg. TIMESERIES 1 second
                </li>
                <li>
                  Do not use <code>SINCE</code> or <code>UNTIL</code> clauses as
                  they will automatically be determined based on the time range
                  picker
                </li>
                <li>
                  If using the <code>LIMIT</code> clause, this should be placed
                  before and not after the <code>TIMESERIES</code> clause
                </li>
                <li>
                  Be aware that with longer time ranges, the chart will need
                  more time to load. Use of this chart is ideal for shorter
                  ranges, such as 7 - 14 days.
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                A valid timeseries query for the chart could look like this:{' '}
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>SELECT count(*) FROM Transaction TIMESERIES</code>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                A valid event query for the chart could look like this:{' '}
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT count(*) FROM Transaction FACET appName TIMESERIES 1
                second
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
