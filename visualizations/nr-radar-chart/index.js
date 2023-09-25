import React, { useEffect, useState, useContext } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import {
  NrqlQuery,
  Spinner,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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

function RadarRoot(props) {
  const {
    query = '',
    accountId,
    backgroundColor,
    borderColor,
    borderWidth = 1,
    chartKey = '# Key',
    enableFilters,
    useTimeRange,
    showDocs
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const platformContext = useContext(PlatformStateContext);
  const { filters } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];
    const lowerQuery = (query || '').toLowerCase();
    const errorObj = { name: `Query`, errors: [] };

    if (!accountId) {
      errorObj.errors.push(`AccountID is undefined`);
      tempErrors.push('configure Account ID');
    }
    if (!lowerQuery) {
      errorObj.errors.push(`Query is undefined`);
      tempErrors.push('configure query');
    }
    if (!lowerQuery.includes('facet')) {
      errorObj.errors.push(`Should contain FACET keyword`);
    }

    if (errorObj.errors.length > 0) {
      tempErrors.push(errorObj);
    }

    setErrors(tempErrors);

    if (tempErrors.length === 0) {
      let finalQuery = query;
      if (useTimeRange) {
        finalQuery += ` ${timeRangeToNrql(timeRange)}`;
      }

      if (enableFilters) {
        const filterClause = filters ? `WHERE ${filters}` : '';
        finalQuery += ` ${filterClause}`;
      }

      // eslint-disable-next-line
      console.log(`NRQL Query: ${finalQuery}`);

      const queryData = await NrqlQuery.query({
        query: finalQuery,
        accountIds: [accountId]
      });
      // eslint-disable-next-line
      console.log(queryData);

      setDataSets(queryData);
    }

    setLoading(false);
  }, [
    query,
    accountId,
    filters,
    enableFilters,
    useTimeRange,
    chartKey,
    backgroundColor,
    borderColor,
    borderWidth
  ]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  const data = {
    labels: (dataSets?.data || []).map(d => d.metadata?.name),
    datasets: [
      {
        label: chartKey || '# Key',
        data: (dataSets?.data || []).map(d => d.data?.[0]?.y),
        backgroundColor: backgroundColor || 'rgba(255, 99, 132, 0.2)',
        borderColor: borderColor || 'rgba(255, 99, 132, 1)',
        borderWidth: parseInt(borderWidth)
      }
    ]
  };

  return (
    <>
      {showDocs && <Docs />}
      <Radar
        width={100}
        height={50}
        options={{ maintainAspectRatio: false }}
        data={data}
      />
    </>
  );
}

export default RadarRoot;
