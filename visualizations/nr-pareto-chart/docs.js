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

const additionalDocs = {};

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Use the Pareto Line & Bar chart to understand ...
            <br />
            <br />
            {/* The Line & Bar chart plots data across three axes:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>the X represents a FACET</li>
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
            and time periods. */}
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
                  Query must use a <code>FACET</code> clause.
                </li>
                <li>Query must have two attributes selected</li>
                <li>
                  The first attribute will be used for the bar data and the
                  second for the line
                </li>
                <li>You should not select more than two attributes</li>
              </ul>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <div>A valid query for the chart could look like this: </div>
            </Spacing>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT count(*), average(duration) FROM Transaction FACET
                appName
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
              return RenderPropertyInfo(config, false, additionalDocs);
            })}
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
