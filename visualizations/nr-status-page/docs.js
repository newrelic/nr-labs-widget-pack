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
            Use the Status Page chart to display a single status feed in a
            dashboard. Currently supported providers are Status Page, Google,
            Status IO, NRQL, New Relic Workload, RSS, and Status Pal.
          </BlockText>
        </CardBody>
      </Card>
      <Card collapsible defaultCollapsed>
        <CardHeader title="Requirements" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            In order to populate the chart, a status page provider, a title in
            the form of plain text or a public url to a logo, and a direct link
            to the feed must be provided. NOTE: For Status Pal providers, the
            Status Input must be a valid subdomain. For NRQL/Workload providers,
            an accountId must be provided. Example Status Inputs:
            <br />
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>Status Page</h4>
                <ul className="docs-list">
                  <li>
                    <a>https://www.githubstatus.com</a>
                  </li>
                  <li>
                    <a>https://jira-software.status.atlassian.com</a>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>Google</h4>
                <ul className="docs-list">
                  <li>
                    <a>https://status.cloud.google.com</a>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>Status IO</h4>
                <ul className="docs-list">
                  <li>
                    <a>
                      https://ezidebit.status.io/pages/history/598a973f96a8201305000142
                    </a>
                  </li>
                  <li>
                    <a>
                      https://status.docker.com/pages/history/533c6539221ae15e3f000031
                    </a>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>NRQL</h4>
                <p>
                  NRQL queries require three fields/aliases to be returned:
                  EventTimeStamp, EventStatus, EventName
                </p>
                <ul className="docs-list">
                  <li>
                    <code>
                      FROM NrAiIncident SELECT timestamp as EventTimeStamp,
                      priority as EventStatus, conditionName as EventName,
                      entity.name LIMIT 50
                    </code>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>Workload</h4>
                <p>Workload requires a valid workload entity guid</p>
                <ul className="docs-list">
                  <li>
                    <code>MTYwNjg2MnxOUjF8V09SS0xPQUR8M3fimMTM4</code>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>RSS</h4>
                <ul className="docs-list">
                  <li>
                    <a>https://status.newrelic.com/history.rss</a>
                  </li>
                  <li>
                    <a>https://www.githubstatus.com/history.rss</a>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <>
                <h4>Status Pal</h4>
                <ul className="docs-list">
                  <li>
                    `galaxygate` from <a>https://status.galaxygate.net/</a>
                  </li>
                  <li>
                    `smtp` from <a>https://smtp.statuspal.io</a>
                  </li>
                </ul>
              </>
            </Spacing>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM]}>
              <p>
                More examples can be found in the Labs Widget Pack{' '}
                <a
                  href="https://github.com/newrelic/nr-labs-widget-pack"
                  target="_blank"
                  rel="noreferrer"
                >
                  README
                </a>
              </p>
            </Spacing>
            <br />
            <br />
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
