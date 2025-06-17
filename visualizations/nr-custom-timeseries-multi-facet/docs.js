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
            Use the Custom Timeseries Multi Facet chart to plot your own
            timestamp field on a line, area, or bar chart, while grouping by a
            single attribute of your choosing.
            <br />
            <br />
            The chart allows you to define multiple timeseries queries. Note
            that a maximum of 5000 timestamps can be returned in any given time
            period.
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
                  At least 1 query that may include a single select value and
                  single facet of the attribute you want to group by
                </li>
                <li>
                  Queries should not contain <code>TIMESERIES</code> or{' '}
                  <code>SINCE</code> clauses
                </li>
                <li>
                  Queries may only use the <code>LIMIT</code> clause when using
                  a facet. This controls the number of groups plotted.
                </li>
                <li>
                  Queries may only use the <code>SELECT .. as ..</code> clause
                  when no facet is supplied. This will be used as the title of
                  the single group.
                </li>
                <li>
                  Required fields Account ID and Custom Timestamp Name must be
                  filled in
                </li>
                <li>
                  Custom timestamp field must be formatted as seconds or
                  milliseconds since Epoch
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>A valid query for the chart could look like this: </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT count(*) FROM Transaction facet myGroup LIMIT MAX
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
