import React, { useContext, useState, useEffect } from 'react';
import {
  NrqlQuery,
  AreaChart,
  LineChart,
  Spinner,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';
import { discoverErrors } from './utils';
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
    chartType,
    enableFilters,
    pollInterval
  } = props;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalQuery, setQuery] = useState(null);
  const [errors, setErrors] = useState([]);
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
        resp.data.forEach(series => {
          if (series.cumulativeApplied) return;
          let cumulative = 0;
          series.data.forEach(d => {
            cumulative += d.y;
            d.y = cumulative;
          });
          series.cumulativeApplied = true;
        });
        setData(resp.data);
        setLoading(false);
      }
    }
  };

  const renderChart = (chartType, data) => {
    if (!chartType || chartType === 'line') {
      return <LineChart data={data} fullWidth fullHeight />;
    } else if (chartType === 'area') {
      return <AreaChart data={data} fullWidth fullHeight />;
    }
  };

  if (loading && !data) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <>
      {showDocs && <Docs />}
      {renderChart(chartType, data)}
    </>
  );
}

export default CumulativeChart;
