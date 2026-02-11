import { useState, useEffect } from 'react';
import { COLORS } from '../constants';

export const Status = {
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  OK: 'OK',
  NONE: 'NONE',
  CLUSTER: 'CLUSTER'
};

const useCustomColors = (
  markerColors,
  hasCluster = true,
  defaultColors = COLORS
) => {
  const [customColors, setCustomColors] = useState(defaultColors);

  useEffect(() => {
    if (!markerColors) {
      setCustomColors(defaultColors);
      return;
    }
    const colorsArray = markerColors.split(',');

    const keys = hasCluster
      ? [
          Status.CLUSTER,
          Status.NONE,
          Status.OK,
          Status.WARNING,
          Status.CRITICAL
        ]
      : [Status.NONE, Status.OK, Status.WARNING, Status.CRITICAL];

    const colorsObject = { ...defaultColors };

    for (let i = 0; i < colorsArray.length && i < keys.length; i++) {
      const statusKey = keys[i];
      const newColor = colorsArray[i].trim();

      colorsObject[statusKey] = {
        ...colorsObject[statusKey],
        color: newColor,
        borderColor: `${newColor}99`
      };
    }
    setCustomColors(colorsObject);
  }, [markerColors, hasCluster, defaultColors]);

  return { customColors };
};

export { useCustomColors };
