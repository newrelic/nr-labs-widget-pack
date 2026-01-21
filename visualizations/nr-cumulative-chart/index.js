import React, { useContext, useState, useEffect } from 'react';
import {
  NrqlQuery,
  AutoSizer,
  Spinner,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';
import {
  discoverErrors,
  formatXAxis,
  formatYAxisValue,
  parseThreshold,
  transformToRechartsFormat
} from './utils';
import { subVariables } from '../shared/utils';
import { useInterval } from '@mantine/hooks';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return '';
  }

  if (timeRange.beginTime && timeRange.endTime) {
    return `SINCE ${timeRange.beginTime} UNTIL ${timeRange.endTime}`;
  } else if (timeRange.begin_time && timeRange.end_time) {
    return `SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`;
  } else if (timeRange.duration <= HOUR) {
    return `SINCE ${timeRange.duration / MINUTE} MINUTES AGO`;
  } else if (timeRange.duration <= DAY) {
    return `SINCE ${timeRange.duration / HOUR} HOURS AGO`;
  } else {
    return `SINCE ${timeRange.duration / DAY} DAYS AGO`;
  }
};

function CumulativeChart(props) {
  const {
    showDocs,
    accountId,
    query,
    xFormat,
    units,
    criticalThreshold,
    warningThreshold,
    healthyThreshold,
    chartType,
    enableFilters,
    pollInterval
  } = props;
  const [data, setData] = useState({ chartData: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [finalQuery, setQuery] = useState(null);
  const [errors, setErrors] = useState([]);
  const [visibleSeries, setVisibleSeries] = useState(new Set()); // Empty = show all
  const platformContext = useContext(PlatformStateContext);
  const { filters, selectedVariables } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;
  const filterClause = filters ? `WHERE ${filters}` : '';

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    if (query) {
      let tempQuery = subVariables(query, selectedVariables);
      const sinceClause = timeRangeToNrql(timeRange);

      if (enableFilters) {
        tempQuery += ` ${filterClause}`;
      }

      if (sinceClause !== '') {
        tempQuery += ` ${sinceClause}`;
      }

      setQuery(tempQuery);
    }

    const inputErrors = discoverErrors(props);
    if (inputErrors.length > 0) {
      const errorObj = { name: `Input Errors`, errors: inputErrors };
      setErrors([errorObj]);
    } else {
      setErrors([]);
    }
  }, [query, selectedVariables, enableFilters, filterClause, timeRange]);

  useEffect(async () => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [accountId, finalQuery, pollInterval, timeRange]);

  const fetchData = async () => {
    if (finalQuery && accountId) {
      setLoading(true);
      const resp = await NrqlQuery.query({
        query: finalQuery,
        accountIds: [parseInt(accountId)],
        formatType: NrqlQuery.FORMAT_TYPE.CHART
      });

      if (resp.error) {
        const dataError = { name: `Data Fetch Errors`, errors: resp.error };
        setErrors([dataError]);
      }

      if (resp.data && !resp.error) {
        // Apply cumulative calculation
        resp.data.forEach(series => {
          if (series.cumulativeApplied) return;
          let cumulative = 0;
          series.data.forEach(d => {
            cumulative += d.y;
            d.y = cumulative;
          });
          series.cumulativeApplied = true;
        });

        const transformedData = await transformToRechartsFormat(resp.data);
        setData(transformedData);
        setLoading(false);
      }
    }
  };

  // Tooltip timestamp
  const formatTooltipLabel = timestamp => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle legend click to toggle series visibility
  const handleLegendClick = (dataKey, allSeriesKeys) => {
    setVisibleSeries(prev => {
      if (prev.size === 0) {
        return new Set([dataKey]);
      }

      const newVisible = new Set(prev);

      if (newVisible.has(dataKey)) {
        if (newVisible.size === 1) {
          return new Set();
        }
        newVisible.delete(dataKey);
      } else {
        newVisible.add(dataKey);
        if (newVisible.size === allSeriesKeys.length) {
          return new Set();
        }
      }

      return newVisible;
    });
  };

  const isSeriesHidden = seriesKey => {
    if (visibleSeries.size === 0) return false;
    return !visibleSeries.has(seriesKey);
  };

  // Render threshold areas and lines
  const renderThresholds = () => {
    const thresholds = [];

    const critical = parseThreshold(criticalThreshold);
    const warning = parseThreshold(warningThreshold);
    const healthy = parseThreshold(healthyThreshold);

    if (healthy) {
      thresholds.push(
        <ReferenceArea
          key="healthy-area"
          y1={healthy.y1}
          y2={healthy.y2}
          fill="var(--healthy-threshold-color)"
          fillOpacity={0.15}
          ifOverflow="extendDomain"
        />,
        <ReferenceLine
          key="healthy-line"
          y={healthy.y2}
          stroke="var(--healthy-threshold-color)"
          strokeWidth={0.8}
        />
      );
    }

    if (warning) {
      thresholds.push(
        <ReferenceArea
          key="warning-area"
          y1={warning.y1}
          y2={warning.y2}
          fill="var(--warning-threshold-color)"
          fillOpacity={0.15}
          ifOverflow="extendDomain"
        />,
        <ReferenceLine
          key="warning-line"
          y={warning.y2}
          stroke="var(--warning-threshold-color)"
          strokeWidth={0.8}
        />
      );
    }

    if (critical) {
      thresholds.push(
        <ReferenceArea
          key="critical-area"
          y1={critical.y1}
          y2={critical.y2}
          fill="var(--critical-threshold-color)"
          fillOpacity={0.15}
          ifOverflow="extendDomain"
        />,
        <ReferenceLine
          key="critical-line"
          y={critical.y2}
          stroke="var(--critical-threshold-color)"
          strokeWidth={0.8}
        />
      );
    }

    return thresholds;
  };

  const renderChart = (chartType, data, width, height) => {
    const { chartData, series } = data;

    if (!chartData || chartData.length === 0) {
      return null;
    }

    const commonProps = {
      data: chartData,
      width: width * 0.99,
      height: height * 0.99,
      margin: { top: 10, right: 30, left: 10, bottom: 10 }
    };

    if (!chartType || chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid vertical={false} stroke="var(--grid-color)" />
          <XAxis
            dataKey="x"
            tickFormatter={timestamp => formatXAxis(timestamp, xFormat)}
            stroke="var(--axis-color)"
            tick={{ fill: 'var(--tick-color)', fontSize: 11 }}
          />
          <YAxis
            stroke="var(--axis-color)"
            tick={{ fill: 'var(--tick-color)', fontSize: 11 }}
            tickFormatter={value => formatYAxisValue(value, units)}
          />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={value => formatYAxisValue(value, units)}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '4px'
            }}
            labelStyle={{ color: 'var(--tooltip-label)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            onClick={e =>
              handleLegendClick(
                e.dataKey,
                series.map(s => s.key)
              )
            }
            formatter={(value, entry) => (
              <span
                style={{
                  color: isSeriesHidden(entry.dataKey)
                    ? 'var(--legend-hidden-color)'
                    : 'var(--tick-color)',
                  textDecoration: isSeriesHidden(entry.dataKey)
                    ? 'line-through'
                    : 'none',
                  cursor: 'pointer'
                }}
              >
                {value}
              </span>
            )}
          />
          {renderThresholds()}
          {data.predictedStartTime && (
            <ReferenceArea
              x1={data.predictedStartTime}
              x2={data.predictedEndTime}
              fill="#808080"
              fillOpacity={0.2}
              ifOverflow="extendDomain"
            />
          )}
          {series.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={isSeriesHidden(s.key)}
            />
          ))}
          {series.map(s => (
            <Line
              key={`${s.key}_predicted`}
              type="monotone"
              dataKey={`${s.key}_predicted`}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              hide={isSeriesHidden(s.key)}
              legendType="none"
            />
          ))}
        </LineChart>
      );
    } else if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid vertical={false} stroke="var(--grid-color)" />
          <XAxis
            dataKey="x"
            tickFormatter={timestamp => formatXAxis(timestamp, xFormat)}
            stroke="var(--axis-color)"
            tick={{ fill: 'var(--tick-color)', fontSize: 11 }}
          />
          <YAxis
            stroke="var(--axis-color)"
            tick={{ fill: 'var(--tick-color)', fontSize: 11 }}
            tickFormatter={value => formatYAxisValue(value, units)}
          />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={value => formatYAxisValue(value, units)}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '4px'
            }}
            labelStyle={{ color: 'var(--tooltip-label)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            onClick={e =>
              handleLegendClick(
                e.dataKey,
                series.map(s => s.key)
              )
            }
            formatter={(value, entry) => (
              <span
                style={{
                  color: isSeriesHidden(entry.dataKey)
                    ? 'var(--legend-hidden-color)'
                    : 'var(--tick-color)',
                  textDecoration: isSeriesHidden(entry.dataKey)
                    ? 'line-through'
                    : 'none',
                  cursor: 'pointer'
                }}
              >
                {value}
              </span>
            )}
          />
          {renderThresholds()}
          {data.predictedStartTime && (
            <ReferenceArea
              x1={data.predictedStartTime}
              x2={data.predictedEndTime}
              fill="#808080"
              fillOpacity={0.2}
              stroke="none"
              ifOverflow="extendDomain"
            />
          )}
          {series.map(s => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.3}
              strokeWidth={2}
              hide={isSeriesHidden(s.key)}
            />
          ))}
          {series.map(s => (
            <Area
              key={`${s.key}_predicted`}
              type="monotone"
              dataKey={`${s.key}_predicted`}
              name={s.name}
              stroke={s.color}
              strokeDasharray="5 5"
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={2}
              hide={isSeriesHidden(s.key)}
              legendType="none"
            />
          ))}
        </AreaChart>
      );
    }
  };

  if (loading && (!data || !data.chartData)) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <div className="cumulative-chart-container">
          {showDocs && <Docs />}
          {renderChart(chartType, data, width, height)}
        </div>
      )}
    </AutoSizer>
  );
}

export default CumulativeChart;
