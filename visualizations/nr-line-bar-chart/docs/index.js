import React from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  HeadingText,
  Link
  // NrqlQuery,
  // Spinner,
  // AutoSizer,
  // BlockText,
  // List,
  // ListItem
} from 'nr1';

export default function Docs() {
  return (
    <div style={{ textAlign: 'left' }}>
      <HeadingText>Documentation</HeadingText>
      <Card>
        <CardHeader>Example Line Queries</CardHeader>
        <CardBody>
          SELECT count(*) as 'Views' from PageView where TIMESERIES 1 day since
          last week
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Example Bar Queries</CardHeader>
        <CardBody>
          SELECT percentile(duration, 80) as 'Load' from PageView TIMESERIES 1
          day since last week
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Tick Format</CardHeader>
        <CardBody>
          The tick format is powered by moment. View their documentation for
          other configuration options.
          <Link to="https://momentjs.com/docs/#/parsing/string-format/">
            Moment Date Parsing Documentation.
          </Link>
        </CardBody>
      </Card>

      <hr />
    </div>
  );
}
