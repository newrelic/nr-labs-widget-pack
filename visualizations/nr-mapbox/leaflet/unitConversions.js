// Unit conversion utilities for the weather legend toggle.
// Only layers listed here will show a unit toggle in the legend.

// UNIT_TOGGLE_CONFIG maps a layerType key to:
//   nativeUnit  – the unit string used in LAYER_LEGENDS (the "metric" side)
//   altUnit     – the alternate unit string shown on the other toggle segment
//   convert     – function(nativeValue: number) → altValue: number
//   precision   – decimal places to use when formatting the converted value
export const UNIT_TOGGLE_CONFIG = {
  temp_new: {
    nativeUnit: '°C',
    altUnit: '°F',
    convert: c => (c * 9) / 5 + 32,
    precision: 0
  },
  temp: {
    nativeUnit: '°C',
    altUnit: '°F',
    convert: c => (c * 9) / 5 + 32,
    precision: 0
  },
  precipitation_cls: {
    nativeUnit: 'mm',
    altUnit: 'in',
    convert: mm => mm / 25.4,
    precision: 3
  },
  precipitation_new: {
    nativeUnit: 'mm/h',
    altUnit: 'in/h',
    convert: mm => mm / 25.4,
    precision: 2
  },
  snow: {
    nativeUnit: 'cm',
    altUnit: 'in',
    convert: cm => cm / 2.54,
    precision: 2
  }
};

/**
 * Convert a min/max label string to the alternate unit.
 *
 * Handles:
 *  - plain numbers ("30", "-65", "0.10")
 *  - numbers with a trailing "+" suffix ("140+")
 *
 * Returns the converted string, or the original string if it cannot
 * be parsed (e.g. empty strings).
 *
 * @param {string} valueStr  - The raw string from LAYER_LEGENDS (min or max)
 * @param {string} layerType - The OWM layer type key
 * @param {string} targetUnit - The unit being converted to
 * @returns {string}
 */
export function convertLabelValue(valueStr, layerType, targetUnit) {
  const config = UNIT_TOGGLE_CONFIG[layerType];
  if (!config || targetUnit === config.nativeUnit) return valueStr;

  const hasSuffix = valueStr.endsWith('+');
  const numStr = hasSuffix ? valueStr.slice(0, -1) : valueStr;
  const num = parseFloat(numStr);

  if (!Number.isFinite(num)) return valueStr;

  const converted = config.convert(num);
  const formatted = converted.toFixed(config.precision);

  return hasSuffix ? `${formatted}+` : formatted;
}
