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
            <br />
            <br />
            Check out the <b>Query Syntax</b> and <b>Advanced Features</b>{' '}
            sections for assistance with setup or configuration.
            <br />
            <a
              href="https://github.com/newrelic/nr-labs-widget-pack/?tab=readme-ov-file#map-widget"
              target="_blank"
              rel="noopener noreferrer"
            >
              For more in-depth configuration/examples, see README documentation
            </a>
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
                  that is used as the tooltip title for each marker on the map.
                </li>
                <li>
                  Location data using one of the supported methods (see below)
                </li>
              </ul>
            </Spacing>
            <br />
            <b>Location Methods</b> (at least one required):
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.EXTRA_LARGE]}>
              <ul>
                <li>
                  <b>FACET lat/lng</b> (recommended): Use precision to ensure
                  values aren't rounded
                  <br />
                  <code>
                    FACET string(lat, precision: 5) as 'lat', string(lng,
                    precision: 5) as 'lng'
                  </code>
                </li>
                <li>
                  <b>lat/lng fields</b>: Include lat and lng (or
                  latitude/longitude) in SELECT
                  <br />
                  <code>
                    SELECT latest(latitude) as 'lat', latest(longitude) as 'lng'
                    ...
                  </code>
                </li>
                <b>city field</b>: City name for automatic coordinate lookup
                from built-in database
                <br />
                <code>FACET city as 'city'</code>
                <br />
                <li>
                  <i>
                    Note: City lookup supports major world cities. If your city
                    isn't found, use explicit lat/lng.
                  </i>
                </li>
              </ul>
            </Spacing>
            <br />
            <b>Optional Query Fields:</b>
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <code>'rotate:VALUE'</code> - Rotation angle in degrees
                  (Mapbox only)
                </li>
                <li>
                  <code>'value'</code> - Primary metric for heatmap gradients
                  and marker labels
                </li>
                <li>
                  <code>'icon_label'</code>, <code>'icon_label_prefix'</code>,{' '}
                  <code>'icon_label_suffix'</code> - Custom marker label
                  formatting
                </li>
                <li>
                  <code>'icon_url'</code>, <code>'icon_svg'</code>,{' '}
                  <code>'icon_size'</code> - Custom marker icons
                </li>
                <li>
                  <code>'icon_radius'</code> - Circle radius for high density
                  mode
                </li>
                <li>
                  <code>'link'</code> - External URL to open when marker is
                  clicked
                </li>
                <li>
                  <code>'custom_color'</code> - Hex color to override marker
                  color
                </li>
              </ul>
            </Spacing>
            <br />
            <b>Example Queries:</b>
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                FROM BrowserInteraction SELECT latest(city) as 'name:City',
                count(*) as 'Views' WHERE appName = 'WebPortal' SINCE 60 seconds
                ago FACET city LIMIT MAX
              </code>
            </Spacing>
            <br /> <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                FROM FlightData SELECT latest(flightNo) as 'name:Flight No',
                latest(track) as 'rotate:track', latest(departure),
                latest(destination) FACET string(lat, precision: 5) as 'lat',
                string(lng, precision: 5) as 'lng' SINCE 60 seconds ago LIMIT
                MAX
              </code>
            </Spacing>
          </BlockText>
        </CardBody>
      </Card>

      <Card collapsible defaultCollapsed>
        <CardHeader title="Advanced Features" />
        <CardBody style={{ marginLeft: '35px' }}>
          <BlockText spacingType={[BlockText.SPACING_TYPE.MEDIUM]}>
            <b>Region Heatmaps</b>
            <br />
            Display data aggregated by geographic regions (countries, US states,
            UK regions). Use the <code>regionQuery</code> configuration to
            specify a separate NRQL query for region data.
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <b>geoISOCountry</b>: ISO 3166-1 alpha-2 or alpha-3 country
                  code (e.g., "US", "USA", "GB", "GBR")
                </li>
                <li>
                  <b>geoUSState</b>: US state 2-letter code, FIPS number, or
                  full name (e.g., "CA", "06", "California")
                </li>
                <li>
                  <b>geoUKRegion</b>: UK region name (e.g., "London",
                  "Scotland", "Wales")
                </li>
              </ul>
            </Spacing>
            Configure <code>regionHeatmapSteps</code> (number of color
            gradations) and <code>regionColors</code> (comma-separated hex
            colors) to control the gradient.
            <br />
            <br />
            Example region query:
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                FROM PageView SELECT count(*) as 'value' FACET regionCode as
                'geoUSState' LIMIT MAX
              </code>
            </Spacing>
            <br />
            <br />
            <b>Auto-generated Tooltips</b>
            <br />
            Enable <code>enableAutoTooltip</code> to automatically generate
            tooltip content from fields prefixed with <code>tooltip_</code> in
            your query results.
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <code>tooltip_header</code>: Custom tooltip title (use "NONE"
                  to hide)
                </li>
                <li>
                  <code>tooltip_*</code>: Any field starting with "tooltip_"
                  will be displayed with a formatted label (e.g.,
                  tooltip_error_rate → "Error rate")
                </li>
              </ul>
            </Spacing>
            Example:
            <br />
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <code>
                SELECT latest(city) as 'tooltip_header', count(*) as
                'tooltip_total_events', average(duration) as
                'tooltip_avg_duration' FROM Transaction ...
              </code>
            </Spacing>
            <br />
            <br />
            <b>Dashboard Deep-linking</b>
            <br />
            Add dashboard navigation buttons to marker popups by including these
            fields in your query:
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <code>dash_guid</code>: Dashboard entity GUID to open
                </li>
                <li>
                  <code>dash_filter</code>: (optional) Filter string to apply
                  (e.g., "region = 'US-West'")
                </li>
                <li>
                  <code>dash_variables</code>: (optional) JSON string of
                  dashboard variables (e.g., '&#123;"env": "prod"&#125;')
                </li>
              </ul>
            </Spacing>
            <br />
            <b>Marker Thresholds &amp; Status Colors</b>
            <br />
            Configure threshold rules via the <b>Marker Thresholds</b> UI
            configuration to evaluate marker values and assign statuses (OK,
            WARNING, CRITICAL).
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  <b>Target Attribute</b>: Query field to evaluate (e.g.,
                  "errorRate", "count")
                </li>
                <li>
                  <b>Value Above/Below/Equal</b>: Threshold conditions
                </li>
                <li>
                  <b>Status</b>: Status to assign when threshold is violated
                  (OK, WARNING, CRITICAL)
                </li>
                <li>
                  <b>Marker Color</b>: Override color for matching markers
                </li>
              </ul>
            </Spacing>
            Alternatively, use <code>markerColors</code> to define default
            colors for all status levels (comma-separated hex values: cluster,
            no-status, ok, warning, critical).
            <br />
            <br />
            <b>High Density Mode</b>
            <br />
            For datasets with 1000+ markers, enable High Density mode to render
            lightweight CircleMarkers instead of standard icons for optimal
            performance.
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  Enable via <code>highDensityMode</code> configuration option
                </li>
                <li>
                  Or include <code>icon_radius</code> in your query to trigger
                  automatically
                </li>
                <li>
                  Configure <code>highDensityRadius</code> for default circle
                  size
                </li>
              </ul>
            </Spacing>
            <br />
            <br />
            <b>Marker Clustering</b>
            <br />
            Group nearby markers into clusters when zoomed out. Enable via{' '}
            <code>enableClustering</code> configuration option.
            <Spacing type={[Spacing.TYPE.MEDIUM, Spacing.TYPE.LARGE]}>
              <ul>
                <li>
                  Clusters display count and pie chart of status distribution of
                  markers
                </li>
                <li>
                  Cluster color reflects highest severity (Critical &gt; Warning
                  &gt; OK)
                </li>
                <li>
                  <code>disableClusterZoom</code>: Zoom level at which
                  clustering stops
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
