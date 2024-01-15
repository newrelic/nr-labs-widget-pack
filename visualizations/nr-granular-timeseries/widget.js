import React, { useState, useContext, useEffect } from 'react';
import {
  NrqlQuery,
  LineChart,
  AreaChart,
  SparklineChart,
  SectionMessage,
  NerdletStateContext
} from 'nr1';
import ErrorState from '../shared/errorState';
import { discoverErrors } from './utils';
import { subVariables } from '../shared/utils';
import { useInterval } from '@mantine/hooks';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR; // eslint-disable-line
const MAX_BUCKETS = 366;

const timeRangeToWindowBuckets = (timeRange, query) => {
  const lowerQuery = query.toLowerCase();
  const timeQuerySplit = lowerQuery.split('timeseries ');
  const timeSplit = (timeQuerySplit?.[1] || '1 minute').split(' ');
  const unit = parseFloat(timeSplit[0]);
  const period = timeSplit[1].trim();

  let bucketInSeconds = 0;
  if (period.includes('second')) {
    bucketInSeconds = unit;
  } else if (period.includes('minute')) {
    bucketInSeconds = unit * 60;
  } else if (period.includes('hour')) {
    bucketInSeconds = unit * 60 * 60;
  } else if (period.includes('day')) {
    bucketInSeconds = unit * 60 * 60 * 24;
  } else if (period.includes('week')) {
    bucketInSeconds = unit * 60 * 60 * 24 * 7;
  } else if (period.includes('month')) {
    bucketInSeconds = unit * 2.628e6;
  }

  let totalWindowInSeconds = 0;
  if (!timeRange) {
    totalWindowInSeconds = 30 * 60; // 60 minutes to seconds
    const endTime = new Date().getTime();
    const startTime = endTime - totalWindowInSeconds * 1000;

    const windows = calculateTimeWindows(
      startTime,
      endTime,
      totalWindowInSeconds,
      bucketInSeconds
    );

    return { windows, totalWindowInSeconds, bucketInSeconds };
  } else if (timeRange.beginTime && timeRange.endTime) {
    totalWindowInSeconds = (timeRange.endTime - timeRange.beginTime) / 1000;

    const windows = calculateTimeWindows(
      timeRange.beginTime,
      timeRange.endTime,
      totalWindowInSeconds,
      bucketInSeconds
    );

    return { windows, totalWindowInSeconds, bucketInSeconds };
  } else if (timeRange.duration) {
    totalWindowInSeconds = timeRange.duration / 1000;
    const endTime = new Date().getTime();
    const startTime = endTime - totalWindowInSeconds * 1000;

    const windows = calculateTimeWindows(
      startTime,
      endTime,
      totalWindowInSeconds,
      bucketInSeconds
    );

    return { windows, totalWindowInSeconds, bucketInSeconds };
  }
};

function calculateTimeWindows(
  startTime,
  endTime,
  totalWindowInSeconds,
  bucketInSeconds
) {
  const totalBuckets = Math.ceil(totalWindowInSeconds / bucketInSeconds);

  if (totalBuckets <= MAX_BUCKETS) {
    // If totalBuckets is within the limit, return a single window
    return [{ startTime, endTime }];
  }

  const maxTotalWindows = Math.ceil(totalBuckets / MAX_BUCKETS);
  const windowSizeInSeconds = totalWindowInSeconds / maxTotalWindows;

  const windows = [];

  for (let i = 0; i < maxTotalWindows; i++) {
    const windowStartTime = startTime + i * windowSizeInSeconds * 1000;
    const windowEndTime = Math.min(
      windowStartTime + windowSizeInSeconds * 1000,
      endTime
    );

    windows.push({
      startTime: windowStartTime,
      endTime: windowEndTime
    });
  }

  return windows;
}

export default function Widget(props) {
  const {
    accountId,
    enableFilters,
    platformContext,
    query,
    pollInterval,
    chartType,
    disableWarnings
  } = props;
  const { timeRange } = platformContext;
  const nerdletContext = useContext(NerdletStateContext);
  const { filters, selectedVariables } = nerdletContext;
  const [finalData, setFinalData] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [finalQuery, setQuery] = useState(null);
  const [inputErrors, setInputErrors] = useState([]);
  const filterClause = filters ? `WHERE ${filters}` : '';

  useEffect(() => {
    if (query) {
      let tempQuery = subVariables(query, selectedVariables);

      if (enableFilters) {
        tempQuery += ` ${filterClause}`;
      }

      setQuery(tempQuery);
    }

    const inputErrors = discoverErrors(props);
    setInputErrors(inputErrors);
  }, [query, selectedVariables, enableFilters, filterClause, timeRange]);

  const fetchData = async () => {
    if (finalQuery && accountId) {
      const {
        windows,
        totalWindowInSeconds,
        bucketInSeconds
      } = timeRangeToWindowBuckets(timeRange, finalQuery);

      const excessiveBucketWarning = Math.ceil(
        totalWindowInSeconds / bucketInSeconds / MAX_BUCKETS
      );

      // if this figure is above excessiveBucketWarning figure set warning
      if (excessiveBucketWarning > 5) {
        const message = `Your query is ~${excessiveBucketWarning}x more then the default ${MAX_BUCKETS} buckets`;
        setWarnings(message);
      } else {
        setWarnings(null);
      }

      const queries = windows.map(
        w => `${finalQuery} SINCE ${w.startTime} UNTIL ${w.endTime}`
      );

      const queryPromises = queries.map(q =>
        NrqlQuery.query({
          query: q,
          accountIds: [parseInt(accountId)],
          formatType: NrqlQuery.FORMAT_TYPE.CHART
        })
      );

      const queryData = await Promise.all(queryPromises);
      const dataByName = {};
      queryData.forEach(d => {
        d.data.forEach(facet => {
          const { metadata, data } = facet;
          if (!dataByName[metadata.name]) {
            dataByName[metadata.name] = facet;
          } else {
            dataByName[metadata.name].data = [
              ...dataByName[metadata.name].data,
              ...data
            ];
          }
        });
      });

      const flatData = Object.keys(dataByName).map(name => dataByName[name]);
      setFinalData(flatData);
    }
  };

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  const renderChart = (chartType, finalData) => {
    if (!chartType || chartType === 'line') {
      return <LineChart data={finalData} fullWidth fullHeight />;
    } else if (chartType === 'area') {
      return <AreaChart data={finalData} fullWidth fullHeight />;
    } else if (chartType === 'sparkline') {
      return <SparklineChart data={finalData} fullWidth fullHeight />;
    }
  };

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [finalQuery, accountId, pollInterval, timeRange]);

  if (inputErrors.length > 0) {
    return <ErrorState errors={inputErrors} />;
  }

  if (finalQuery && finalData) {
    return (
      <>
        {warnings && !disableWarnings && (
          <SectionMessage
            type={SectionMessage.TYPE.WARNING}
            title={warnings}
            description="You can disable this warning in the configuration."
          />
        )}
        {renderChart(chartType, finalData)}
      </>
    );
  } else {
    // eslint-disable-next-line
    console.log('unhandled case', props);
    return <></>;
  }
}
