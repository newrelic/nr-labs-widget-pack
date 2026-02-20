/**
 * GeoJSON data exports for region-based visualizations
 *
 * Supports:
 * - Countries (via ISO A2/A3 codes)
 * - US States (via state code, number, or name)
 * - UK Regions (via region name)
 * - Canada Provinces (via province code, number, or name)
 */

// Countries GeoJSON
export { default as countries } from './countries.geojson.json';

// US States GeoJSON with state codes
export { default as usStates } from './us-states';

// UK Regions GeoJSON
export { default as ukRegions } from './uk-regions/all-uk-regions';

// Canada Provinces GeoJSON with province codes
export { default as canProvinces } from './can-provinces/ca.geojson.json';
