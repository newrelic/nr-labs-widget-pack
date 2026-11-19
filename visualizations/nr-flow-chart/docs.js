import React from 'react';

import { Card, CardHeader, CardBody, HeadingText, BlockText } from 'nr1';

import RenderPropertyInfo from '../../shared/PropertyInfo';

const properties = require('./nr1.json');

// if the key matches a config property name, the additional information will be added
const additionalDocs = {};

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>Documentation</HeadingText>
      <Card collapsible>
        <CardHeader title="Overview" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Flow Chart displays NRQL-queried data in a sankey flow diagram. It
            is typically used to visualize the flow of data between different
            entities or stages in a process.
          </BlockText>
        </CardBody>
      </Card>

      <Card collapsible defaultCollapsed>
        <CardHeader title="Query Syntax" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            Each result row becomes one link: the first FACET attribute is the
            source, the second is the target, and the aggregate is the link
            value. Names are deduplicated, so a name that is both a target and a
            source becomes a single node.
            <br />
            <br />
            Example:
            <br />
            <code>
              FROM PageView SELECT count(*) FACET pageUrl,
              salesforceCustomerName LIMIT 25
            </code>
            <br />
            <br />
            Rules:
            <br />
            - Exactly two FACET attributes and one numeric aggregate.
            <br />
            - Set LIMIT explicitly. NRQL facets default to 10 results.
            <br />
            - TIMESERIES is not supported.
            <br />
            - Do not add SINCE to the query when the time picker is enabled.
            <br />- Add a prefix or suffix to values with constants in SELECT
            clause, e.g. <code>SELECT count(*), '$' as 'prefix'</code> or{' '}
            <code>' ms' as 'suffix'</code>. They are used in labels only and are
            removed before the query runs. Show values and percent with the Node
            label content property.
            <br />
            - Hover a node or a link to highlight it. Click to pin the
            highlight, click it again or the empty chart to clear. Use the Sort
            order property to change node order (default: source, largest
            first).
            <br />
            - Blank facet values are shown as (none). Rows with a value of 0 or
            less are skipped, as are rows where both facets are Other (the NRQL
            bucket for results beyond LIMIT).
            <br />- Flows that loop back on themselves (A to B to A) cannot be
            drawn and produce an error.
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
