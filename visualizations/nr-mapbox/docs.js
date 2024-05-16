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
            Identify geographic trends and relationships by charting your data
            across a map.
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
                  One alias with{' '}
                  <b>
                    <code>'name:SOME_VALUE'</code>
                  </b>{' '}
                  that is used as the principal value for the data point on the
                  map. The name must be identified in the query using an alias
                </li>
                <li>
                  Have a FACET for latitude and longitude, to allow the data
                  point to be situated correctly on the map, use precision to
                  ensure the FACET does not round the number eg. <br />
                  <b>
                    <code>
                      FACET string(lat, precision: 5) as 'lat', string(lng,
                      precision: 5) as 'lng'
                    </code>
                  </b>
                </li>
              </ul>
            </Spacing>
            <br />
            The lat/long can be specified in one of four ways:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>
                  latitude/longitude attributes in your query: name or alias
                  columns in your query using as lat/long or latitude/longitude
                  eg.
                  <br />
                  <b>
                    <code>
                      SELECT latest(myCol) as 'lat' FROM ... / SELECT
                      latest(lat) FROM ...
                    </code>
                  </b>
                </li>
                <li>
                  coordinates attribute in your query: a single coordinates
                  attribute that includes both lat/long, separated by a comma.
                  You can include a column named coordinates, or alias a column
                  in your query as 'coordinates' eg.
                  <br />
                  <b>
                    <code>
                      SELECT latest(coordinates) FROM ... / SELECT latest(myCol)
                      as 'coordinates' FROM ...
                    </code>
                  </b>
                </li>
                <li>
                  facet clause: Add a facet clause that targets lat/long
                  attributes. The facets must be the first two facets listed, in
                  order of lat and then long. To prevent rounding issues, cast
                  the values to string and set the precision eg.
                  <br />
                  <b>
                    <code>
                      ...FACET string(myLatCol, precision:5), string(myLongCol,
                      precision:5))
                    </code>
                  </b>
                </li>
                <li>
                  coordinate lookup: if your data does not contain lat or long,
                  you can use the city attribute to perform a coordinate lookup.
                  Include a city column in your query eg.
                  <br />
                  <b>
                    <code>
                      'SELECT latest(city) ...' / SELECT latest(myCol) as
                      'city'). This feature is in beta - if your city is not
                      found, please open an issue on the github repo.
                    </code>
                  </b>
                </li>
              </ul>
            </Spacing>
            <br />
            The query accepts additional optional elements:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  ROTATION, which allows you to point the marker in a given
                  direction (for instance, if you are tracking a flight, have
                  your marker point in the direction the plane is flying). The
                  rotation must be identified in the query using an alias, with
                  the format{' '}
                  <b>
                    <code>'rotate:VALUE'</code>
                  </b>
                </li>
                <li>
                  Additional descriptive attributes, to include more information
                  about the marker.
                </li>
              </ul>
            </Spacing>
            <br />
            A valid query for the chart could look like this:
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <b>
                <code>
                  FROM BrowserInteraction SELECT latest(city) as 'name:City',
                  count(*) as 'Views' WHERE appName = 'WebPortal' SINCE 60
                  seconds ago FACET asnLatitude, asnLongitude LIMIT MAX
                </code>
              </b>
            </Spacing>
            <br /> <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <b>
                <code>
                  FROM FlightData SELECT latest(flightNo) as 'name:Flight No',
                  latest(track) as 'rotate:track', latest(departure),
                  latest(destination) FACET string(lat, precision: 5) as 'lat',
                  string(lng, precision: 5) as 'lng' SINCE 60 seconds ago LIMIT
                  MAX
                </code>
              </b>
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
