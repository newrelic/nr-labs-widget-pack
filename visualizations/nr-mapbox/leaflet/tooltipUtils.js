/**
 * Tooltip auto-generation utilities
 *
 * Automatically generates tooltip configuration from data fields
 * prefixed with "tooltip_"
 */

// Generate tooltip configuration from data fields
export function generateTooltipConfig(data) {
  if (!data) return [];

  // If array, extract config from first item (like geo-location-viz does)
  const arrayData = Array.isArray(data) ? data[0] : data;
  if (!arrayData) return [];

  const tooltipConfig = [];

  Object.keys(arrayData).forEach(key => {
    if (key.startsWith('tooltip_') && key !== 'tooltip_header') {
      // Extract the field name after "tooltip_"
      const fieldName = key.replace('tooltip_', '');

      tooltipConfig.push({
        label: fieldName,
        queryField: key
      });
    }
  });

  return tooltipConfig;
}

// Get the tooltip header value
export function getTooltipHeader(data) {
  if (!data) return null;

  const header = data.tooltip_header;

  // no header
  if (!header || header === 'NONE' || header === '') {
    return null;
  }

  return header;
}

export default {
  generateTooltipConfig,
  getTooltipHeader
};
