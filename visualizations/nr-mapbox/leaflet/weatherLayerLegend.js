import React, { useState, useEffect } from 'react';
import { SegmentedControl, SegmentedControlItem } from 'nr1';
import { UNIT_TOGGLE_CONFIG, convertLabelValue } from './unitConversions';

// Color ramps sourced from https://openweathermap.org/map_legend and https://ahorn.lima-city.de/owm/
// Gradient stop positions are expressed as % of the layer's display range.
// Classic (_cls) layers use an even-spaced legend bar matching the OWM rainbow colour scale.
const LAYER_LEGENDS = {
  precipitation_cls: {
    label: 'Precipitation (classic)',
    unit: 'mm',
    min: '0.10',
    max: '100',
    stops: [
      [0, 'rgba(4,0,80,1)'], //  0.10 mm – deep navy
      [8, 'rgba(10,20,130,1)'], //  0.25 mm – navy blue
      [17, 'rgba(20,70,175,1)'], //  0.5 mm – medium blue
      [25, 'rgba(0,130,225,1)'], //  1.0 mm – sky blue
      [33, 'rgba(0,185,240,1)'], //  2.5 mm – cyan
      [42, 'rgba(50,190,70,1)'], //    5 mm – green
      [50, 'rgba(145,215,25,1)'], //  7.5 mm – yellow-green
      [58, 'rgba(255,245,0,1)'], //   10 mm – yellow
      [67, 'rgba(255,200,0,1)'], //   15 mm – amber
      [75, 'rgba(255,140,0,1)'], //   20 mm – orange
      [83, 'rgba(255,80,0,1)'], //   25 mm – orange-red
      [92, 'rgba(215,15,0,1)'], //   50 mm – red
      [100, 'rgba(165,0,0,1)'] //  100 mm – dark red
    ]
  },
  precipitation_new: {
    label: 'Precipitation',
    unit: 'mm/h',
    min: '0',
    max: '140+',
    stops: [
      [0, 'rgba(200,230,255,0)'], //   0 mm/h – transparent (no rain)
      [0.7, 'rgba(160,230,255,0.4)'], //   1 mm/h – pale sky blue (trace)
      [3.6, 'rgba(0,210,255,0.7)'], //   5 mm/h – cyan (light)
      [7.1, 'rgba(0,200,100,0.85)'], //  10 mm/h – green (light-medium)
      [14.3, 'rgba(100,220,0,0.9)'], //  20 mm/h – yellow-green (medium)
      [21.4, 'rgba(255,220,0,0.95)'], //  30 mm/h – yellow (medium-heavy)
      [35.7, 'rgba(255,130,0,1)'], //  50 mm/h – orange (heavy)
      [71.4, 'rgba(220,0,0,1)'], // 100 mm/h – red (very heavy)
      [100, 'rgba(180,0,200,1)'] // 140 mm/h – magenta (extreme)
    ]
  },
  clouds_new: {
    label: 'Clouds',
    unit: '%',
    min: '0',
    max: '100',
    stops: [
      [0, 'rgba(255,255,255,0)'],
      [10, 'rgba(253,253,255,0.1)'],
      [20, 'rgba(252,251,255,0.2)'],
      [30, 'rgba(250,250,255,0.3)'],
      [40, 'rgba(249,248,255,0.4)'],
      [50, 'rgba(247,247,255,0.5)'],
      [60, 'rgba(246,245,255,0.75)'],
      [70, 'rgba(244,244,255,1)'],
      [80, 'rgba(243,242,255,1)'],
      [90, 'rgba(242,241,255,1)'],
      [100, 'rgba(240,240,255,1)']
    ]
  },
  temp_new: {
    label: 'Temperature',
    unit: '°C',
    min: '-65',
    max: '30',
    stops: [
      [0, 'rgba(130,22,146,1)'], // -65°C deep purple
      [26, 'rgba(130,22,146,1)'], // -40°C deep purple
      [37, 'rgba(130,87,219,1)'], // -30°C violet
      [47, 'rgba(32,140,236,1)'], // -20°C sky blue
      [58, 'rgba(32,196,232,1)'], // -10°C cyan
      [68, 'rgba(35,221,221,1)'], // 0°C teal
      [79, 'rgba(194,255,40,1)'], // 10°C yellow-green
      [89, 'rgba(255,240,40,1)'], // 20°C yellow
      [95, 'rgba(255,194,40,1)'], // 25°C amber
      [100, 'rgba(252,128,20,1)'] // 30°C orange
    ]
  },
  // Pressure — stops 94000→108000 Pa (displayed as 940→1080 hPa)
  // positions as % of 14000 Pa range
  pressure_new: {
    label: 'Pressure',
    unit: 'hPa',
    min: '940',
    max: '1080',
    stops: [
      [0, 'rgba(0,115,255,1)'], // 940 hPa bright blue
      [14, 'rgba(0,170,255,1)'], // 954 hPa sky blue
      [29, 'rgba(75,208,214,1)'], // 968 hPa cyan
      [43, 'rgba(141,231,199,1)'], // 982 hPa light green
      [50, 'rgba(176,247,32,1)'], // 989 hPa yellow-green
      [57, 'rgba(240,184,0,1)'], // 996 hPa amber
      [71, 'rgba(251,85,21,1)'], // 1010 hPa orange
      [86, 'rgba(243,54,59,1)'], // 1024 hPa red
      [100, 'rgba(198,0,0,1)'] // 1080 hPa deep red
    ]
  },
  wind_new: {
    label: 'Wind speed',
    unit: 'm/s',
    min: '0',
    max: '200',
    stops: [
      [0.5, 'rgba(255,255,255,0)'], // ~1 m/s transparent
      [2.5, 'rgba(238,206,206,0.4)'], // 5 m/s blush pink
      [7.5, 'rgba(179,100,188,0.7)'], // 15 m/s purple
      [12.5, 'rgba(63,33,59,0.8)'], // 25 m/s dark plum
      [25, 'rgba(116,76,172,0.9)'], // 50 m/s medium purple
      [50, 'rgba(70,0,175,1)'], // 100 m/s blue-purple
      [100, 'rgba(13,17,38,1)'] // 200 m/s near-black navy
    ]
  },
  snow: {
    label: 'Snow (QPF)',
    unit: 'cm',
    min: '0.10',
    max: '100',
    stops: [
      [0, 'rgba(4,0,80,1)'], //  0.10 cm – deep navy
      [8, 'rgba(10,20,130,1)'], //  0.25 cm – navy blue
      [17, 'rgba(20,70,175,1)'], //  0.5 cm – medium blue
      [25, 'rgba(0,130,225,1)'], //  1.0 cm – sky blue
      [33, 'rgba(0,185,240,1)'], //  2.5 cm – cyan
      [42, 'rgba(50,190,70,1)'], //    5 cm – green
      [50, 'rgba(145,215,25,1)'], //  7.5 cm – yellow-green
      [58, 'rgba(255,245,0,1)'], //   10 cm – yellow
      [67, 'rgba(255,200,0,1)'], //   15 cm – amber
      [75, 'rgba(255,140,0,1)'], //   20 cm – orange
      [83, 'rgba(255,80,0,1)'], //   25 cm – orange-red
      [92, 'rgba(215,15,0,1)'], //   50 cm – red
      [100, 'rgba(165,0,0,1)'] //  100 cm – dark red
    ]
  },
  clouds_cls: {
    label: 'Clouds (classic)',
    unit: '',
    min: '0',
    max: '1',
    stops: [
      [0, 'rgba(10,10,10,1)'], // 0.10 – near-black
      [25, 'rgba(74,74,74,1)'], // ~0.30 – dark grey
      [50, 'rgba(128,128,128,1)'], // ~0.54 – mid grey
      [75, 'rgba(185,185,185,1)'], // ~0.77 – light grey
      [100, 'rgba(248,248,248,1)'] // 0.983 – near-white
    ]
  },
  // Temperature classic
  temp: {
    label: 'Temperature (classic)',
    unit: '°C',
    min: '-40',
    max: '40',
    stops: [
      [0, 'rgba(5,0,100,1)'], // -40°C deep purple
      [6, 'rgba(10,10,140,1)'], // -35°C dark blue-purple
      [13, 'rgba(20,50,180,1)'], // -30°C medium blue
      [19, 'rgba(0,110,215,1)'], // -25°C blue
      [25, 'rgba(0,155,235,1)'], // -20°C sky blue
      [31, 'rgba(0,195,235,1)'], // -15°C cyan
      [38, 'rgba(0,205,170,1)'], // -10°C teal
      [44, 'rgba(0,195,65,1)'], //  -5°C green
      [50, 'rgba(160,225,0,1)'], //   0°C yellow-green
      [56, 'rgba(255,245,0,1)'], //   5°C yellow
      [63, 'rgba(255,205,0,1)'], //  10°C yellow-orange
      [69, 'rgba(255,160,50,1)'], //  15°C light orange
      [75, 'rgba(255,120,35,1)'], //  20°C orange
      [81, 'rgba(255,75,55,1)'], //  25°C coral
      [88, 'rgba(240,35,25,1)'], //  30°C red-orange
      [94, 'rgba(210,10,15,1)'], //  35°C red
      [100, 'rgba(170,0,0,1)'] //  40°C dark red
    ]
  }
};

function buildGradient(stops) {
  const parts = stops.map(([pct, color]) => `${color} ${pct}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

export default function WeatherLegend({ layerType }) {
  const layer = LAYER_LEGENDS[layerType] || LAYER_LEGENDS.precipitation_new;
  const gradient = buildGradient(layer.stops);

  const toggleConfig = UNIT_TOGGLE_CONFIG[layerType];

  // Active unit defaults to the layer's native unit.
  // Reset whenever the layer type changes.
  const [activeUnit, setActiveUnit] = useState(layer.unit);
  useEffect(() => {
    setActiveUnit(layer.unit);
  }, [layerType, layer.unit]);

  const isAltUnit = toggleConfig && activeUnit === toggleConfig.altUnit;

  const displayUnit = isAltUnit ? toggleConfig.altUnit : layer.unit;
  const displayMin = isAltUnit
    ? convertLabelValue(layer.min, layerType, toggleConfig.altUnit)
    : layer.min;
  const displayMax = isAltUnit
    ? convertLabelValue(layer.max, layerType, toggleConfig.altUnit)
    : layer.max;

  return (
    <div className="weather-legend">
      <div className="weather-legend__title">{layer.label}</div>
      <div className="weather-legend__bar" style={{ background: gradient }} />
      <div className="weather-legend__labels">
        <span>
          {displayMin} {displayUnit}
        </span>
        <span>
          {displayMax} {displayUnit}
        </span>
      </div>
      {toggleConfig && (
        <div className="weather-legend__toggle">
          <SegmentedControl
            value={activeUnit}
            onChange={(_, value) => setActiveUnit(value)}
          >
            <SegmentedControlItem
              value={toggleConfig.nativeUnit}
              label={toggleConfig.nativeUnit}
            />
            <SegmentedControlItem
              value={toggleConfig.altUnit}
              label={toggleConfig.altUnit}
            />
          </SegmentedControl>
        </div>
      )}
    </div>
  );
}
