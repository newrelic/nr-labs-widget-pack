import { Status } from './hooks/useCustomColors';
import * as L from 'leaflet';

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

  locations.forEach(location => {
    const status =
      location?.options?.children?.props?.location?.status ||
      location?.options?.children?.props?.status ||
      location?.status ||
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
    const location =
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
