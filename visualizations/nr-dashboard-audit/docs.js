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
            Use the Dashboard Audit widget to run NRQL queries against dashboard
            usage or audit data within `NrdbQuery` or `NrAuditEvent`. Dashboard
            name will automatically be added to the result set. Table is the
            only widget type currently supported.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Requirements" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, a valid non-timeseries NRQL query
            must be supplied, as well as the unique identifier for the dashboard
            data fetched (i.e - dashboardId, entityGuid, etc). The dashboard
            identifier supplied must reside in the data set fetched by the NRQL
            query.
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <ul>
                <li>
                  <code>
                    FROM NrdbQuery SELECT count(*) where productFeature =
                    'Dashboards' and source.dashboardId is not null facet
                    source.dashboardId, user LIMIT MAX since last month until
                    now
                  </code>
                </li>
                <li>
                  <code>
                    FROM NrAuditEvent SELECT * where actionIdentifier like
                    '%dashboard%' since last month until now
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
