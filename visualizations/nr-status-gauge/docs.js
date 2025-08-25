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
            Use the Status Gauge widget to display a single value result in
            conjunction with thresholds that render a status, as well as an
            optional table that breaks down the result value into percentage
            buckets of a user defined count unit (i.e - page views,
            transactions, etc).
            <br />
            <br />
            For example, if an average duration for a microservice has a value
            of 5 seconds with the critical threshold set as &gt; 6 seconds and
            the healthy being &lt; 6 seconds, an additional table will also
            render that displays how many transactions fall in each threshold
            bucket, expressed as a percentage of volume of transactions.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Requirements" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, an accountId, a valid query that
            returns a single value, critical/healthy thresholds, and units must
            be configured.
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>
                An optional <code>Table Title</code> can also be specified to
                define the name of the volume table. Valid queries may look
                like:
              </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <code>
                    FROM PageViewTiming SELECT
                    percentile(largestContentfulPaint, 75) where entityGuid =
                    'MTYwNjg2Mn'
                  </code>
                </li>
                <li>
                  <code>
                    SELECT average(duration) FROM Transaction where tags.env =
                    'production' since 1 day ago
                  </code>
                </li>
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
              return RenderPropertyInfo(config, false, {});
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
