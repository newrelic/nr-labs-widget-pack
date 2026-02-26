import { Status } from './hooks/useCustomColors';
import * as L from 'leaflet';
import { SEVERITY_COLORS } from './constants';

// interface ClusterStatusCounts {
//   NONE: number;
//   OK: number;
//   WARNING: number;
//   CRITICAL: number;
// }

// Format a marker value with prefix, suffix, and precision
export function formatMarkerValue(data) {
  const value = data.value;
  const iconLabel = data.icon_label;
  const prefix = data.icon_label_prefix || data.value_prefix || '';
  const suffix = data.icon_label_suffix || data.value_suffix || '';
  const precision = data.icon_label_precision || data.value_precision || 2;

  if (iconLabel !== undefined) {
    // Apply precision if icon_label is a number
    const formattedLabel = !isNaN(iconLabel)
      ? Number(iconLabel).toFixed(precision)
      : iconLabel;
    return `${prefix}${formattedLabel}${suffix}`;
  }

  if (value !== undefined && !isNaN(value)) {
    return `${prefix}${Number(value).toFixed(precision)}${suffix}`;
  }

  return '';
}

// Aggregate status counts for a set of locations
function aggregateStatusCounts(locations) {
  const statusCounts = {
    NONE: 0,
    OK: 0,
    WARNING: 0,
    CRITICAL: 0
  };

  locations.forEach(marker => {
    // Try multiple paths to find the status
    const status =
      marker?.options?.data?.status ||
      marker?.options?.children?.props?.location?.status ||
      marker?.options?.children?.props?.status ||
      marker?.status ||
      Status.NONE;

    if (status in statusCounts) {
      statusCounts[status]++;
    }
  });

  return statusCounts;
}

// Generate a conic-gradient style for a cluster pie chart based on status breakdown
function generatePieStyle(
  clusterStatusBreakdown,
  totalLocations,
  customColors
) {
  let pieStyle = `background: ${customColors[Status.CLUSTER].borderColor};`;
  const totalStatus =
    clusterStatusBreakdown.OK +
    clusterStatusBreakdown.WARNING +
    clusterStatusBreakdown.CRITICAL;

  if (totalStatus > 0) {
    const criticalDegree = Math.floor(
      (clusterStatusBreakdown.CRITICAL / totalLocations) * 360
    );
    const warningDegree = Math.floor(
      (clusterStatusBreakdown.WARNING / totalLocations) * 360
    );

    pieStyle = `background: conic-gradient(${
      customColors[Status.CRITICAL].borderColor
    } 0deg ${criticalDegree}deg, ${
      customColors[Status.WARNING].borderColor
    } ${criticalDegree}deg ${warningDegree + criticalDegree}deg, ${
      customColors[Status.OK].borderColor
    } ${warningDegree + criticalDegree}deg 360deg);`;
  }

  return pieStyle;
}

// Calculate the aggregated label for a cluster based on the aggregation mode
function calculateAggregatedLabel(cluster, aggregationMode) {
  const childCount = cluster.getChildCount();

  if (
    !aggregationMode ||
    aggregationMode === '' ||
    aggregationMode === 'count' ||
    childCount === 0
  ) {
    return childCount.toString();
  }

  let total = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;
  let suffix = '';
  let prefix = '';
  let precision = 0;
  let valueCount = 0;

  cluster.getAllChildMarkers().forEach(child => {
    // Try multiple paths to find the location data
    const location =
      child.options?.data ||
      child.options?.children?.props?.location ||
      child.options?.children?.props ||
      {};

    const value = location.value;

    if (value !== undefined && !isNaN(value)) {
      valueCount++;
      const numValue = Number(value);
      total += numValue;
      minValue = Math.min(minValue, numValue);
      maxValue = Math.max(maxValue, numValue);
    }

    // all markers have the same suffix, prefix, and precision
    prefix = location.cluster_label_prefix || prefix;
    suffix = location.cluster_label_suffix || suffix;
    precision = location.cluster_label_precision || precision;
  });

  // If no numeric values found, fall back to count
  if (valueCount === 0) {
    return childCount.toString();
  }

  // Ensure precision is a valid number
  const precisionNum = parseInt(precision, 10) || 0;

  let aggregatedValue;
  switch (aggregationMode) {
    case 'average':
      // Use valueCount for average to only count markers with values
      aggregatedValue = total / valueCount;
      break;
    case 'min':
      aggregatedValue = minValue;
      break;
    case 'max':
      aggregatedValue = maxValue;
      break;
    default:
      // 'sum'
      aggregatedValue = total;
      break;
  }

  return `${prefix}${aggregatedValue.toFixed(precisionNum)}${suffix}`;
}

// Custom cluster icon
export const createClusterCustomIcon = (
  cluster,
  customColors,
  aggregationMode
) => {
  const locations = cluster.getAllChildMarkers();
  const clusterStatusBreakdown = aggregateStatusCounts(locations);

  const pieStyle = generatePieStyle(
    clusterStatusBreakdown,
    locations.length,
    customColors
  );

  const clusterLabel = calculateAggregatedLabel(cluster, aggregationMode);

  return L.divIcon({
    html: `<div class="outerPie" style="${pieStyle};">
      <div class="innerPie" style="color: ${customColors[Status.CLUSTER]
        .textColor ||
        customColors[Status.CLUSTER].groupText ||
        '#fff'}; background-color: ${customColors[Status.CLUSTER].color};">
        <span>
          ${clusterLabel}
        </span>
      </div>
    </div>`,
    className: 'marker-cluster-custom',
    iconSize: L.point(54, 54, true)
  });
};

// Generate a custom icon based on the location prop
export const createCustomIcon = (location, customColors, gradientColor) => {
  const status = location.status || 'NONE';
  let { color, borderColor, textColor } = customColors[status];

  if (gradientColor) {
    color = gradientColor;
    borderColor = `${gradientColor}cc`;
    textColor = '#fff';
  }

  let markerLabel = ' ';
  if (location.formatted_value) {
    markerLabel = location.formatted_value;
  }

  const iconSize =
    location.icon_size && !isNaN(location.icon_size) ? location.icon_size : 20;

  if (location.icon_url && location.icon_url !== '') {
    // Icon - expect an http url to icon file
    return new L.Icon({
      iconUrl: location.icon_url,
      iconSize: [iconSize, iconSize]
    });
  } else if (location.icon_svg && location.icon_svg !== '') {
    // SVG icon - expect a string containing <path> elements -- examples see https://icons.getbootstrap.com/
    return L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg"  fill="${color}"  viewBox="0 0 16 16">${location.icon_svg}</svg>`,
      className: '',
      iconSize: [iconSize, iconSize]
    });
  } else {
    // classic circle with label icon
    return L.divIcon({
      html: `<div style="color: ${textColor}; background-color: ${color}; box-shadow:0 0 0 6px ${borderColor};"><span>${markerLabel}</span></div>`,
      className: 'custom-marker-icon',
      iconSize: [42, 42]
    });
  }
};
// --- Weather alert helpers ---

// Map NWS event strings (lower-cased) to icon category keys
const EVENT_ICON_MAP = [
  { key: 'tornado', terms: ['tornado'] },
  { key: 'hurricane', terms: ['hurricane', 'tropical storm', 'typhoon'] },
  { key: 'flood', terms: ['flood', 'surge', 'tsunami'] },
  {
    key: 'winter',
    terms: [
      'winter',
      'snow',
      'blizzard',
      'ice',
      'sleet',
      'freeze',
      'frost',
      'cold'
    ]
  },
  { key: 'wind', terms: ['wind', 'gale', 'dust storm', 'sand storm'] },
  { key: 'heat', terms: ['heat', 'hot'] },
  { key: 'fire', terms: ['fire', 'red flag', 'smoke'] },
  { key: 'fog', terms: ['fog', 'visibility'] },
  {
    key: 'thunderstorm',
    terms: ['thunder', 'lightning', 'severe storm', 'hail']
  }
];

// Inline SVG paths for each icon category (Bootstrap Icons v1.11 paths, scaled to 24x24)
const ICON_SVGS = {
  tornado: `<path d="M2 4a1 1 0 0 0 0 2h11a1 1 0 0 0 0-2H2zm0 4a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2H2zm0 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2H2zm0 4a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2H2zm13.5-9.5C15.5 4.6 11 2 8 2"/>`,
  hurricane: `<path d="M8 1a.5.5 0 0 1 .5.5v.55a7 7 0 0 1 6.95 7.95H16a.5.5 0 0 1 0 1h-.59A7 7 0 0 1 8.5 17.45v.55a.5.5 0 0 1-1 0v-.55A7 7 0 0 1 .55 10H0a.5.5 0 0 1 0-1h.55A7 7 0 0 1 7.5 2.05v-.55A.5.5 0 0 1 8 1zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 8 3zm0 2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm0 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,
  flood: `<path d="M7.27 1.047a1 1 0 0 1 1.46 0l6.345 6.77c.6.638.146 1.683-.73 1.683H2.654C1.778 9.5 1.324 8.455 1.925 7.817L7.27 1.047zM8 2.56 2.264 8.5h11.472L8 2.56zM.5 11a.5.5 0 0 1 .5-.5h14a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5zm2 2a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm2 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>`,
  winter: `<path d="M8 16a.5.5 0 0 1-.5-.5v-1.293l-.646.647a.5.5 0 0 1-.707-.708L7.5 12.793V8.866l-3.4 1.963-.496 1.85a.5.5 0 1 1-.966-.26l.237-.882-1.12.646a.5.5 0 0 1-.5-.866l1.12-.646-.882-.237a.5.5 0 1 1 .26-.966l1.848.495L7 8 3.601 6.037l-1.85.495a.5.5 0 0 1-.258-.966l.881-.237-1.12-.646a.5.5 0 1 1 .5-.866l1.12.646-.237-.881a.5.5 0 1 1 .966-.258l.495 1.849L7.5 7.134V3.207L6.147 1.854a.5.5 0 1 1 .707-.708l.646.647V.5a.5.5 0 1 1 1 0v1.293l.647-.647a.5.5 0 1 1 .707.708L8.5 3.207v3.927l3.4-1.963.496-1.85a.5.5 0 1 1 .966.26l-.236.882 1.12-.646a.5.5 0 0 1 .5.866l-1.12.646.882.237a.5.5 0 1 1-.26.966l-1.848-.495L9 8l3.4 1.963 1.849-.495a.5.5 0 0 1 .26.966l-.882.237 1.12.646a.5.5 0 0 1-.5.866l-1.12-.646.236.882a.5.5 0 1 1-.966.258l-.495-1.849-3.4-1.963v3.927l1.353 1.353a.5.5 0 0 1-.707.708l-.647-.647V15.5a.5.5 0 0 1-.5.5z"/>`,
  wind: `<path d="M12.5 2A2.5 2.5 0 0 0 10 4.5a.5.5 0 0 1-1 0A3.5 3.5 0 1 1 12.5 8H.5a.5.5 0 0 1 0-1h12a2.5 2.5 0 0 0 0-5zm-7 8a1.5 1.5 0 1 1 1.5 1.5H.5a.5.5 0 0 1 0-1H7A.5.5 0 0 0 7 10zm7 3a2.5 2.5 0 1 1-2.5 2.5.5.5 0 0 1 1 0A1.5 1.5 0 1 0 14 13H.5a.5.5 0 0 1 0-1H14z"/>`,
  heat: `<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>`,
  fire: `<path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16zm0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15z"/>`,
  fog: `<path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-2 2a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM8 1a.5.5 0 0 1 .5.5v.55a7 7 0 0 1 6.95 7.95H16a.5.5 0 0 1 0 1h-.59A7 7 0 0 1 8.5 11.45v.55a.5.5 0 0 1-1 0v-.55A7 7 0 0 1 .55 10H0a.5.5 0 0 1 0-1h.55A7 7 0 0 1 7.5 2.05v-.55A.5.5 0 0 1 8 1z"/>`,
  thunderstorm: `<path d="M10.5 8.5a2.5 2.5 0 0 1-5 0V3a2.5 2.5 0 0 1 5 0v5.5zM3.176 9.032a.5.5 0 0 1 .292.643l-.75 2h1.579l-1.999 3.292a.5.5 0 0 1-.858-.52L3.925 11H1a.5.5 0 0 1-.466-.682l1-2.5a.5.5 0 0 1 .642-.286z"/><path d="M15 3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h.5v1.5a3.5 3.5 0 1 0 7 0V7H13a2 2 0 0 0 2-2V3zm-2-1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10z"/>`,
  general: `<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>`
};

function getEventIconKey(eventName) {
  if (!eventName) return 'general';
  const lower = eventName.toLowerCase();
  for (const { key, terms } of EVENT_ICON_MAP) {
    if (terms.some(t => lower.includes(t))) return key;
  }
  return 'general';
}

/**
 * Create a Leaflet DivIcon for a weather alert.
 * Icon is themed by event type and color-coded by severity.
 *
 * @param {object} alert - Parsed alert object with .severity and .event
 * @returns {L.DivIcon}
 */
export function createWeatherAlertIcon(alert) {
  const severity = alert.severity || 'Unknown';
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Unknown;
  const iconKey = getEventIconKey(alert.event);
  const path = ICON_SVGS[iconKey] || ICON_SVGS.general;
  const size = 32;

  const html = `
    <div class="weather-alert-icon" style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.85);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#ffffff" viewBox="0 0 16 16">
        ${path}
      </svg>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4]
  });
}
