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
            Use the Area & Event Chart to highlight changes in your environment
            against other metrics. Eg. scaling events against load.
            <br />
            <br />
            The chart allows you to define multiple timeseries and event
            queries.
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
                  At least 1 timeseries query and optionally 1 event query
                </li>
                <li>
                  Timeseries queries should contain the <code>TIMESERIES</code>{' '}
                  clause
                </li>
                <li>
                  Event queries should NOT contain the <code>TIMESERIES </code>{' '}
                  clause
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
              <code>FROM TransactionError SELECT error.message</code>
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
