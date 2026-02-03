import { useState, useEffect, useCallback, useMemo } from 'react';
import { COLORS } from '../constants';

// Interpolate between two hex colors
const interpolateColor = (color1, color2, ratio) => {
  const hex = color => {
    const c = color.replace('#', '');
    return {
      r: parseInt(c.substring(0, 2), 16),
      g: parseInt(c.substring(2, 4), 16),
      b: parseInt(c.substring(4, 6), 16)
    };
  };

  const c1 = hex(color1);
  const c2 = hex(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Generate a gradient array between multiple color stops
const generateGradient = (colors, steps) => {
  if (!colors || colors.length < 2 || steps < 2) {
    return colors || COLORS.HEATMAP.default;
  }

  const result = [];
  const segmentSize = (steps - 1) / (colors.length - 1);

  for (let i = 0; i < colors.length - 1; i++) {
    const startColor = colors[i];
    const endColor = colors[i + 1];
    const segmentSteps = Math.round(segmentSize);

    for (let j = 0; j < segmentSteps; j++) {
      const ratio = j / segmentSteps;
      result.push(interpolateColor(startColor, endColor, ratio));
    }
  }

  result.push(colors[colors.length - 1]);
  return result.slice(0, steps);
};

// Custom hook to handle heatmap gradient calculations for markers and regions
const useHeatmap = (
  heatmapSteps = 0,
  regionHeatmapSteps = 0,
  markerColors = null,
  regionColors = null
) => {
  // Markers state
  const [markerGradient, setMarkerGradient] = useState([]);
  const [markerMinValue, setMarkerMinValue] = useState(Infinity);
  const [markerMaxValue, setMarkerMaxValue] = useState(-Infinity);

  // Regions state
  const [regionGradient, setRegionGradient] = useState([]);
  const [regionMinValue, setRegionMinValue] = useState(Infinity);
  const [regionMaxValue, setRegionMaxValue] = useState(-Infinity);

  // Parse marker colors
  const markerColorStops = useMemo(() => {
    if (markerColors && markerColors.includes(',')) {
      return markerColors.split(',').map(c => c.trim());
    }
    return COLORS.HEATMAP.default;
  }, [markerColors]);

  // Parse region colors
  const regionColorStops = useMemo(() => {
    if (regionColors && regionColors.includes(',')) {
      return regionColors.split(',').map(c => c.trim());
    }
    return COLORS.HEATMAP.default;
  }, [regionColors]);

  // Generate marker gradient when steps or colors change
  useEffect(() => {
    const steps = parseInt(heatmapSteps, 10) || 0;
    if (steps > 0) {
      const effectiveSteps = Math.max(steps, markerColorStops.length);
      setMarkerGradient(generateGradient(markerColorStops, effectiveSteps));
    } else {
      setMarkerGradient([]);
    }
  }, [heatmapSteps, markerColorStops]);

  // Generate region gradient when steps or colors change
  useEffect(() => {
    const steps = parseInt(regionHeatmapSteps, 10) || 0;
    if (steps > 0) {
      const effectiveSteps = Math.max(steps, regionColorStops.length);
      setRegionGradient(generateGradient(regionColorStops, effectiveSteps));
    } else {
      setRegionGradient([]);
    }
  }, [regionHeatmapSteps, regionColorStops]);

  // Set the min/max range for marker values
  const setMarkerRange = useCallback(locations => {
    if (!locations || locations.length === 0) return;

    let min = Infinity;
    let max = -Infinity;

    locations.forEach(location => {
      const value = location.value;
      if (value !== undefined && !isNaN(value)) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    });

    setMarkerMinValue(min);
    setMarkerMaxValue(max);
  }, []);

  // Set the min/max range for region values
  const setRegionRange = useCallback(regions => {
    if (!regions || regions.length === 0) return;

    let min = Infinity;
    let max = -Infinity;

    regions.forEach(region => {
      const value = region.value;
      if (value !== undefined && !isNaN(value)) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    });

    setRegionMinValue(min);
    setRegionMaxValue(max);
  }, []);

  // Get gradient color for a marker value
  const getMarkerGradientColor = useCallback(
    value => {
      if (
        !markerGradient.length ||
        markerMinValue === Infinity ||
        markerMaxValue === -Infinity ||
        markerMinValue === markerMaxValue
      ) {
        return COLORS.NONE.color;
      }

      const clampedValue = Math.max(
        markerMinValue,
        Math.min(value, markerMaxValue)
      );
      const ratio =
        (clampedValue - markerMinValue) / (markerMaxValue - markerMinValue);
      const index = Math.floor(ratio * (markerGradient.length - 1));
      return markerGradient[index] || COLORS.NONE.color;
    },
    [markerGradient, markerMinValue, markerMaxValue]
  );

  // Get gradient color for a region value
  const getRegionGradientColor = useCallback(
    value => {
      // No gradient configured
      if (!regionGradient.length) {
        return COLORS.NONE.color;
      }

      // Min/max not set yet - use middle of gradient as default
      if (regionMinValue === Infinity || regionMaxValue === -Infinity) {
        return regionGradient[Math.floor(regionGradient.length / 2)];
      }

      // All values are the same - use middle of gradient
      if (regionMinValue === regionMaxValue) {
        return regionGradient[Math.floor(regionGradient.length / 2)];
      }

      const clampedValue = Math.max(
        regionMinValue,
        Math.min(value, regionMaxValue)
      );
      const ratio =
        (clampedValue - regionMinValue) / (regionMaxValue - regionMinValue);
      const index = Math.floor(ratio * (regionGradient.length - 1));
      return regionGradient[index] || COLORS.NONE.color;
    },
    [regionGradient, regionMinValue, regionMaxValue]
  );

  return {
    // Marker heatmap
    heatmapSteps: parseInt(heatmapSteps, 10) || 0,
    setMarkerRange,
    getMarkerGradientColor,
    markerGradient,

    // Region heatmap
    regionHeatmapSteps: parseInt(regionHeatmapSteps, 10) || 0,
    setRegionRange,
    getRegionGradientColor,
    regionGradient
  };
};

export { useHeatmap };
