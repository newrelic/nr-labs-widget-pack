[![New Relic One Catalog Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/New_Relic_One_Catalog_Project.png)](https://opensource.newrelic.com/oss-category/#new-relic-one-catalog-project)

# Labs Widget Pack

![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr-labs-widget-pack?include_prereleases&sort=semver) 

A library of New Relic custom chart widgets created by the New Relic Labs team, for use in New Relic dashboards.

To get started:
- [Review the set of widgets included in the pack](#widgets)
- [Enable the pack in your account](#enable)
- [Review how to get help](#help)

## Widgets <a id="widgets"></a>

Click on the short description in each section to view chart details.


### Line & Bar Chart

<details>

  <summary>Display changes in quantity alongside trends over time.</summary>

  <br/>

  <img src="screenshots/bar_line_01.png" height="450" alt="Bar and Line chart screenshot" />

   #### Overview
  Use the Line & Bar chart to understand changes in quantity values (rendered as bars) alongside trends over time (rendered as lines). For instance, you may be interested in understanding how infrastructure load is impacted by throughput on your web site. Or you may want to see if web page response time effects the total number of orders processed - these are perfect use cases for a Line & Bar Chart.

  The Line & Bar chart plots data across three axes:
  - the X axis represents time
  - the left Y axis represents the values for the Bar Charts
  - the right Y axis represents the values for the Line Charts
  
  The chart allows you to define multiple line and bar queries, so it is highly recommended that the queries are aligned in terms of units and time periods.

  #### Requirements
  In order to use this chart, there are a few requirements:
  - You must provide at least 1 bar query and 1 time query
  - Each query must use the `TIMESERIES` clause, with the same bucket eg. `TIMESERIES 1 day`
  - If using the `SINCE` clause it is strongly recommended to be the same across all configured queries

  A valid bar query for the chart could look like this:
  `SELECT percentile(duration, 80) as 'Load' from PageView TIMESERIES 1 day since last week`

  A valid line query for the chart could look like this:
  `SELECT count(*) as 'Views' from PageView where TIMESERIES 1 day since last week`

  To include multiple lines and/or bars in the chart, you can either:
  - define additional queries following the guidelines above
  - include a `FACET` clause in your query. Note that if you are faceting on the same attribute in both the line and the bar queries, you will need to alias one of those facets in order to avoid name collisions in the chart output.
  ---
</details>

### Granular Timeseries Charts

<details>

  <summary>Perform timeseries queries above the default 366 bucket allowance.</summary>

  <!-- <br/> -->

  <!-- <img src="screenshots/bar_line_01.png" height="450" alt="Bar and Line chart screenshot" /> -->

   #### Overview
  Use the Granular Timeseries Chart to see longer periods of data in high granularity above the default 366 allowance.

  The Granular Timeseries Chart, supports Line, Area & Sparkline chart types.

  #### Requirements
  In order to use this chart, there are a few requirements:
  - Each query must use and end with the `TIMESERIES` clause, and also contain the bucket eg. `TIMESERIES 1 second`
  - Do not use SINCE or UNTIL clauses as they will automatically be determined based on the time range picker
  - If using the LIMIT clause, this should be placed before and not after the TIMESERIES clause

  A valid query for the chart could look like this:
  `SELECT count(*) FROM Transaction FACET appName TIMESERIES 1 second`

  ---
</details>

### Multiline Compare Chart
<details>

  <summary>Display multiple comparison periods in a single timeseries chart.</summary>
  
  <img src="screenshots/multiline_01.png" height="450" alt="Multi Line Compare chart screenshot" />

  ---
</details>

### Multiline and Event Overlay Chart
<details>

  <summary>Render events as markers on a line chart.</summary>
  
  <img src="screenshots/multiline_event_02.png" height="450" alt="Line and Event overlay screenshot" />

  ---
</details>

### Area and Event Overlay Chart
<details>

  <summary>Render events as markers on an area chart.</summary>
  
  <img src="screenshots/area_event_01.png" height="450" alt="Area and Event overlay screenshot" />

  ---
</details>

### Scatter and Event Overlay Chart
<details>

  <summary>Render events as markers on a scatter chart.</summary>
  
  <img src="screenshots/scatter_event_01.png" height="450" alt="Scatter and Event overlay screenshot" />

  ---
</details>

### Radar Chart
<details>

  <summary>Plot one or more groups of values over multiple variables, and compare them on a two-dimensional plane.</summary>
  
  <img src="screenshots/radar_01.png" height="450" alt="Radar chart screenshot" />

  ---
</details>

### Mapbox Widget
<details>

  <summary>Plot any data that includes latitude and longitude onto an interactive map, leveraging the Mapbox API.</summary>
  
  #### Overview
  <img src="screenshots/mapbox_01.png" height="450" alt="Mapbox screenshot" />

  Supports multiple NRQL queries and custom markers

  #### Requirements
  In order to use this chart, there are a few requirements:
  - Requires a Map Box Access Token from https://account.mapbox.com/auth/signup/
  - Query should contain one alias with 'name:SOME_VALUE' which will be used as the marker name
  - Query should have a FACET for latitude and longitude, use precision to ensure the FACET does not round the number
    ```
    FACET string(lat, precision: 5) as 'lat', string(lng, precision: 5) as 'lng' 
    ```
  - Rotation can be set using the following alias with 'rotate:SOME_VALUE'
  - Example Query:
    ```
    FROM FlightData SELECT latest(flightNo) as 'name:Flight No', latest(track) as 'rotate:track', latest(departure), latest(destination) FACET string(lat, precision: 5) as 'lat', string(lng, precision: 5) as 'lng' SINCE 60 seconds ago LIMIT MAX
    ```
    ---
</details>

### List View
<details>

  <summary>Display query results in a list, with smart formatting options.</summary>
  
  #### Overview
  <img src="screenshots/list-view-screenshot-1.png" height="450" alt="List view screenshot" />

  List View displays NRQL-queried data in a list. The list items are rows returned by the query, and formatted using a [template](./list-view-template.md). Below are a list of additional features.

  - Coerce values to number, date and boolean types
  - Format numbers and dates
  - Convert between digital size types (bytes, kilobytes, ...)
  - Search bar to filter list to the searched text

  #### Requirements
  
  For full details on how to use and format results in this chart, read the [Template String documentation](./list-view-template.md). 
  
  ---
</details>

### Action Loader
<details>

  <summary>Incorporate buttons into your dashboards, with configurable onClick actions.</summary>
  
  #### Overview
  Incorporate buttons into your dashboards, with configurable onClick actions.

  #### Example w/ Stacked Nerdlet
  ```
  Nerdlet Id: service-maps.home

  URL State
  {"entityGuid":"MTYwNjg2MnxBUE18QVBQTElDQVRJT058NjI2OTA3NjE"}
  ```
  ---
</details>

# Enabling this Nerdpack <a id="enable"></a>

This pack of visualizations is available via the New Relic Catalog. 

To enable it in your account, go to `Add Data > Apps and Visualzations` and search for "Labs Widget Pack". Click the icon and subscribe this to your accounts.

Once subscribed you can browse to `Apps -> Custom Visualizations` to [add any of the widgets to a dashboard](https://docs.newrelic.com/docs/query-your-data/explore-query-data/dashboards/add-custom-visualizations-your-dashboards/).

#### Manual Deployment
If you need to customize the widgets in this pack, you can fork the code base and follow the instructions on how to [Customize a Nerdpack](https://developer.newrelic.com/build-apps/customize-nerdpack). If you have a change you feel everyone can benefit from, [please submit a PR](#contrib)!

# Support <a id="help"></a>

This project is actively maintained by the New Relic Labs team. Connect with us directly by [creating issues](../../issues) or [asking questions in the discussions section](../../discussions) of this repo.

We also encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

New Relic has open-sourced this project, which is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT.

# Security

As noted in our [security policy](https://github.com/newrelic/nr-labs-widget-pack/security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

# Contributing <a id="contrib"></a>

Contributions are encouraged! If you open an enhancement request, we'll invite you to contribute the change yourself. Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+nrlabswidgetpack@newrelic.com.

# Open source license

This project is distributed under the [Apache 2 license](LICENSE).


