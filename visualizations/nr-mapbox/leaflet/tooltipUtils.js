/**
 * Tooltip auto-generation utilities
 *
 * Automatically generates tooltip configuration from data fields
 * prefixed with "tooltip_"
 */

// Convert a string to sentence case (i.e - "some_field_name" -> "Some field name")
export function sentenceCase(str) {
  if (!str) return '';

  // Replace underscores and hyphens w/ spaces
  const cleaned = str.replace(/[_-]/g, ' ');

  // Camel-case
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

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
        label: sentenceCase(fieldName),
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
