import React, { useEffect, useState, useContext } from 'react';
import {
  LineChart,
  NrqlQuery,
  Spinner,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import { useInterval } from '@mantine/hooks';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return 'SINCE 30 minutes ago';
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

function LineEventChart(props) {
  const {
    pollInterval,
    enableTimePicker,
    timeQueries,
    eventQueries,
    showDocs
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const platformContext = useContext(PlatformStateContext);
  const { filters } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;

  const interval = useInterval(() => {
    if (timeQueries.length > 0 && errors.length === 0) {
      fetchData();
    }
  }, (pollInterval || 60) * 1000);

  const fetchData = async () => {
    const queries = [];
    const timeQuery = timeRangeToNrql(timeRange);

    timeQueries.forEach(q => {
      const { accountId, query, enableFilters } = q;
      /* eslint-disable */
      const newQuery = `${query} ${enableFilters ? filters || '' : ''} ${enableTimePicker ? timeQuery : ''
        }`;
      /* eslint-enable */

      queries.push({ query: newQuery, accountId, type: 'line' });
    });

    (eventQueries || [])
      .filter(e => e.accountId && e.query && e.name)
      .forEach(q => {
        const { accountId, query, enableFilters, color, name } = q;

        /* eslint-disable */
        const newQuery = `${query} ${enableFilters ? filters || '' : ''} ${enableTimePicker ? timeQuery : ''
          }`;
        /* eslint-enable */

        queries.push({
          query: newQuery,
          accountId,
          type: 'event',
          color,
          name
        });
      });

    // eslint-disable-next-line
    console.log(`fetching data ${new Date().toLocaleTimeString()}`);
    // eslint-disable-next-line
    console.log(`queries ${JSON.stringify(queries)}`);

    const nrqlData = await Promise.all(queries.map(q => doNrql(q)));

    // perform data merging
    const finalData = [];
    nrqlData.forEach((d, i) => {
      const { data, color, name, type } = d;

      if (type === 'event') {
        const eventData = {
          metadata: {
            id: `${name}_${i}`,
            name: name.replace(/Kubernetes/g, 'K8s'),
            color: color || '#000000',
            viz: 'event'
          },
          data: data[0].data.map(d => ({
            x0: d?.begin_time || d?.timestamp,
            x1: d?.begin_time + 1 || d?.timestamp + 1
          }))
        };

        finalData.push(eventData);
      } else {
        finalData.push(...(data || []));
      }
    });

    setDataSets(finalData);
  };

  const doNrql = data => {
    return new Promise(resolve => {
      const { query, accountId, name, color, type } = data;
      NrqlQuery.query({ query, accountIds: [accountId] }).then(value => {
        resolve({ ...value, name, color, type });
      });
    });
  };

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, eventQueries, timeQueries]);

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];

    if (timeQueries.length === 0) {
      tempErrors.push({
        name: 'You need to supply at least one timeseries query'
      });
    } else {
      timeQueries.forEach((t, i) => {
        const { query, accountId } = t;
        const lowerQuery = (query || '').toLowerCase();
        const errorObj = { name: `Time Query ${i + 1}`, errors: [] };

        if (!lowerQuery) {
          errorObj.errors.push(`Query is undefined`);
        }
        if (lowerQuery.trim() === 'from') {
          errorObj.errors.push(`Query is undefined`);
        }
        if (!lowerQuery.includes('timeseries')) {
          errorObj.errors.push(`Requires TIMESERIES keyword`);
        }
        if (!accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrors.push(errorObj);
        }
      });
    }

    (eventQueries || [])
      .filter(e => e.accountId && e.query && e.name)
      .forEach((t, i) => {
        const { query, accountId, name } = t;
        const lowerQuery = (query || '').toLowerCase();
        const errorObj = { name: `Event Query ${i + 1}`, errors: [] };

        if (!name) {
          errorObj.errors.push(`Name is undefined`);
        }
        if (!lowerQuery) {
          errorObj.errors.push(`Query is undefined`);
        }
        if (lowerQuery.trim() === 'from') {
          errorObj.errors.push(`Query is undefined`);
        }
        if (lowerQuery.includes('timeseries')) {
          errorObj.errors.push(`Should NOT contain TIMESERIES keyword`);
        }
        if (!accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrors.push(errorObj);
        }
      });

    setErrors(tempErrors);

    setLoading(false);
  }, [timeQueries, eventQueries]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }
  return (
    <>
      {showDocs && <Docs />}

      <LineChart data={dataSets} fullWidth fullHeight />
    </>
  );
}

export default LineEventChart;
