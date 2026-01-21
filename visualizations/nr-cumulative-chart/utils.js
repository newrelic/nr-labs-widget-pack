import dayjs from 'dayjs';

export const discoverErrors = props => {
  const { accountId, query } = props;
  const lowerQuery = (query || '').toLowerCase();

  const errors = [];

  if (!accountId) {
    errors.push('Account ID required');
  }

  if (!query) {
    errors.push('Query required');
  } else if (!lowerQuery.includes('timeseries')) {
    errors.push('TIMESERIES keyword required');
  }

  return errors;
};

// Format Y-axis values based on selected units
export const formatYAxisValue = (value, units) => {
  if (value == null) return '';

  switch (units) {
    case 'BYTES':
      if (value >= 1e12) return `${(value / 1e12).toFixed(1)} TB`;
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)} GB`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)} MB`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)} KB`;
      return `${value} B`;

    case 'MILLISECONDS':
      if (value >= 86400000) return `${(value / 86400000).toFixed(1)}d`;
      if (value >= 3600000) return `${(value / 3600000).toFixed(1)}h`;
      if (value >= 60000) return `${(value / 60000).toFixed(1)}m`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
      return `${value}ms`;

    case 'SECONDS':
      if (value >= 86400) return `${(value / 86400).toFixed(1)}d`;
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`;
      if (value >= 60) return `${(value / 60).toFixed(1)}m`;
      return `${value}s`;

    case 'PERCENTAGE':
      return `${value.toLocaleString()}%`;

    case 'COUNT':
    default:
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return value.toLocaleString();
  }
};

// Parse threshold value - can be single number or range "start-end"
export const parseThreshold = thresholdValue => {
  if (!thresholdValue || thresholdValue.trim() === '') return null;

  const trimmed = thresholdValue.trim();

  // Check if it's a range (contains hyphen but not negative number at start)
  if (trimmed.includes('-') && !trimmed.startsWith('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const start = parseFloat(parts[0]);
      const end = parseFloat(parts[1]);
      if (!isNaN(start) && !isNaN(end)) {
        return { y1: Math.min(start, end), y2: Math.max(start, end) };
      }
    }
  }

  // Single value - render from 0 to that value
  const value = parseFloat(trimmed);
  if (!isNaN(value)) {
    return { y1: 0, y2: value };
  }

  return null;
};

const getDefaultColor = index => {
  const colors = [
    '#a35ebf',
    '#85c956',
    '#f5a020',
    '#00b3d7',
    '#fa6e37',
    '#4ce5b1',
    '#a672d1',
    '#6eb1e9',
    '#f7d138',
    '#e55b5b'
  ];
  return colors[index % colors.length];
};

export const formatXAxis = (timestamp, xFormat) => {
  return dayjs(timestamp).format(xFormat || 'hh:mm');
};

// Transform nr1 data format to Recharts format
export const transformToRechartsFormat = nr1Data => {
  if (!nr1Data || nr1Data.length === 0)
    return {
      chartData: [],
      series: [],
      predictedStartTime: null,
      predictedEndTime: null
    };

  let predictedStartTime = null;
  let predictedEndTime = null;

  const series = nr1Data.map(s => ({
    key: s.metadata.id || s.metadata.name,
    name: s.metadata.name,
    color: s.metadata.color || getDefaultColor(nr1Data.indexOf(s))
  }));

  const timestampMap = new Map();

  nr1Data.forEach(s => {
    const seriesKey = s.metadata.id || s.metadata.name;
    const predictedBuckets = s.metadata.predictedBuckets || 0;
    const totalPoints = s.data.length;
    const predictedStartIndex = totalPoints - predictedBuckets;

    s.data.forEach((point, index) => {
      // Use predictedBuckets from metadata to determine if point is predicted
      const isPredicted = predictedBuckets > 0 && index >= predictedStartIndex;
      const isConnectionPoint =
        predictedBuckets > 0 && index === predictedStartIndex - 1;

      // Track predicted time range using x values (which match chart data domain)
      // Include the connection point in the range since the dashed line starts there
      if (isPredicted || isConnectionPoint) {
        if (!predictedStartTime || point.x < predictedStartTime) {
          predictedStartTime = point.x;
        }
        if (!predictedEndTime || point.x > predictedEndTime) {
          predictedEndTime = point.x;
        }
      }

      if (!timestampMap.has(point.x)) {
        timestampMap.set(point.x, { x: point.x });
      }

      const dataPoint = timestampMap.get(point.x);

      if (isPredicted) {
        dataPoint[`${seriesKey}_predicted`] = point.y;
      } else {
        dataPoint[seriesKey] = point.y;

        // For the last actual point before prediction, also add to predicted
        // to create a continuous connection between solid and dashed lines
        if (isConnectionPoint) {
          dataPoint[`${seriesKey}_predicted`] = point.y;
        }
      }
    });
  });

  // Convert map to array / sort by timestamp
  const chartData = Array.from(timestampMap.values()).sort((a, b) => a.x - b.x);

  return { chartData, series, predictedStartTime, predictedEndTime };
};
