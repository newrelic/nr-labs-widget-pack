export const transformData = (data, chartType) => {
  switch (chartType) {
    case 'billboard': {
      // eslint-disable-next-line
      console.log('billboard');
      return toBillboard(data);
    }
    case 'table': {
      return data;
    }
    default: {
      return toBillboard(data);
    }
  }
};

export const toBillboard = data => {
  const chartData = (data || []).map(d => {
    const facet = Object.keys(d)
      .filter(key => key !== 'targetValue')
      .map(key => d[key])
      .join(',');

    return {
      metadata: {
        id: facet || 'value',
        name: facet || 'value',
        viz: 'main',
        color: 'red',
        units_data: {
          y: 'COUNT'
        }
      },
      data: [{ y: d.targetValue }]
    };
  });

  return chartData || [];
};

export const toBar = data => {
  const numbers = (data || []).map(d => d.targetValue);
  const colors = getRandomColorByValue(numbers, false);

  const chartData = data.map((d, index) => {
    const facet = Object.keys(d)
      .filter(key => key !== 'targetValue')
      .map(key => d[key])
      .join(',');

    return {
      metadata: {
        id: facet || 'value',
        name: facet || 'value',
        viz: 'main',
        color: colors?.[index] || 'black',
        units_data: {
          y: 'COUNT'
        }
      },
      data: [{ y: d.targetValue }]
    };
  });

  return chartData || [];
};

export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomColorByValue(values, reverse = false) {
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const normalizedValues = values.map(
    value => (value - minVal) / (maxVal - minVal)
  );

  const interpolateColor = value => {
    const coolColor = [0, 0, 255]; // Blue
    const warmColor = [255, 0, 0]; // Red
    let interpolatedColor = coolColor.map((coolVal, index) =>
      Math.round(coolVal + (warmColor[index] - coolVal) * value)
    );

    if (reverse) {
      interpolatedColor = interpolatedColor.map((_, index) =>
        Math.round(
          warmColor[index] + (coolColor[index] - warmColor[index]) * value
        )
      );
    }

    return `#${interpolatedColor
      .map(val => val.toString(16).padStart(2, '0'))
      .join('')}`;
  };

  const colors = normalizedValues.map(value => interpolateColor(value));
  return colors;
}
