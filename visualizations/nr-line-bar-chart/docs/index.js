import React from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  HeadingText,
  BlockText,
  Spacing
} from 'nr1';

import RenderPropertyInfo from '../../../shared/PropertyInfo';

const properties = require('../nr1.json');

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
            Use the Line & Bar chart to understand changes in quantity values
            (rendered as bars) alongside trends over time (rendered as lines).
            For instance, you may be interested in understanding how
            infrastructure load is impacted by throughput on your web site. Or
            you may want to see if web page response time effects the total
            number of orders processed - these are perfect use cases for a Line
            & Bar Chart.
            <br />
            <br />
            The Line & Bar chart plots data across three axes:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>the X axis represents time</li>
                <li>
                  the left Y axis represents the values for the Line Charts
                </li>
                <li>
                  the right Y axis represents the values for the Bar Charts
                </li>
              </ul>
            </Spacing>
            The chart allows you to define multiple line and bar queries, so it
            is highly recommended that the queries are aligned in terms of units
            and time periods.
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
                <li>At least 1 bar query and 1 time query</li>
                <li>
                  Each query must use the <code>TIMESERIES</code> clause, with
                  the same bucket eg. <code>TIMESERIES 1 day</code>
                </li>
                <li>
                  If using the <code>SINCE</code> clause it is strongly
                  recommended to be the same across all configured queries
                </li>
                <li>
                  Only use unique names for your line and bar queries to avoid
                  issues.
                </li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>A valid bar query for the chart could look like this: </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT percentile(duration, 80) as 'Load' from PageView
                TIMESERIES 1 day since last week
              </code>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>A valid line query for the chart could look like this: </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT count(*) as 'Views' from PageView TIMESERIES 1 day since
                last week
              </code>
            </Spacing>
            <br />
            <br />
            To include multiple lines and/or bars in the chart, you can either:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>
                  define additional queries following the guidelines above
                </li>
                <li>
                  include a FACET clause in your query. Note that if you are
                  faceting on the same attribute in both the line and the bar
                  queries, you will need to alias one of those facets in order
                  to avoid name collisions in the chart output.
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
              return RenderPropertyInfo(config, false, additionalDocs);
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
