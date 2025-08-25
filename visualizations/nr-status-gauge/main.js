import React, { useContext, useEffect, useState } from 'react';
import {
  EmptyState,
  NerdletStateContext,
  PlatformStateContext,
  Spinner
} from 'nr1';
import ErrorState from '../shared/errorState';
import { subVariables } from '../shared/utils';
import { determineThreshold, getData } from './utils';
import Billboard from './components/billboard';
import Bar from './components/bar';
import StatusTable from './components/status-table';
import Docs from './docs';
import { useInterval } from '@mantine/hooks';

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

export default function StatusBillboard(props) {
  const {
    showDocs,
    pollInterval,
    enableTimePicker,
    enableFilters,
    account,
    query,
    criticalThreshold,
    healthyThreshold,
    billboardUnits,
    barSize,
    showTable,
    tableTitle
  } = props;

  const platformContext = useContext(PlatformStateContext);
  const { timeRange } = platformContext;
  const nerdletContext = useContext(NerdletStateContext);
  const { filters, selectedVariables } = nerdletContext;
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalQuery, setFinalQuery] = useState(null);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [data, setData] = useState(null);
  const filterClause = filters ? `WHERE ${filters}` : '';
  const timeQuery = timeRangeToNrql(timeRange);

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    const tempErrors = [];
    const lowerQuery = (query || '').toLowerCase();

    if (!account) tempErrors.push('Account id required');
    if (!query) tempErrors.push('Query required');
    if (!criticalThreshold) tempErrors.push('Critical threshold required');
    if (!healthyThreshold) tempErrors.push('Healthy threshold required');
    if (
      billboardUnits === null ||
      billboardUnits === undefined ||
      billboardUnits === 'select'
    ) {
      tempErrors.push('Billboard Units required');
    }

    if (query) {
      let tempQ = subVariables(query, selectedVariables);
      if (enableFilters) {
        tempQ += ` ${filterClause}`;
      }

      if (enableTimePicker) {
        if (lowerQuery.includes('since') || lowerQuery.includes('until')) {
          tempErrors.push(
            'Remove any since or until clauses when time picker enabled'
          );
        } else {
          tempQ += ` ${timeQuery}`;
        }
      }
      setFinalQuery(tempQ);
    }

    if (criticalThreshold && healthyThreshold) {
      if (criticalThreshold === healthyThreshold)
        tempErrors.push('Critical and Healthy thresholds cannot match');
    }

    setErrors(tempErrors);

    if (!firstLoadComplete) {
      setFirstLoadComplete(true);
    }
  }, [
    account,
    query,
    enableFilters,
    enableTimePicker,
    filterClause,
    criticalThreshold,
    healthyThreshold,
    billboardUnits
  ]);

  useEffect(() => {
    if (errors.length === 0) {
      fetchData();
      interval.stop();
      interval.start();
      return interval.stop;
    }
  }, [
    pollInterval,
    query,
    finalQuery,
    timeQuery,
    enableFilters,
    enableTimePicker,
    filterClause,
    account,
    criticalThreshold,
    healthyThreshold
  ]);

  const fetchData = async () => {
    const final = await getData(
      account,
      finalQuery,
      query,
      filterClause,
      criticalThreshold,
      healthyThreshold,
      timeQuery
    );
    await setData(final);
    await setLoading(false);
  };

  if (loading && !firstLoadComplete) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <ErrorState errors={errors} />
      </>
    );
  }

  if (!data && !loading && firstLoadComplete) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No data returned"
          description="Validate all inputs. Check the browser console debug for any errors"
        />
      </>
    );
  }

  if (data) {
    return (
      <>
        {showDocs && <Docs />}
        <Billboard
          billboardGauge={data.billboardResult || null}
          threshold={determineThreshold(
            data.billboardResult,
            criticalThreshold,
            healthyThreshold
          )}
          unit={billboardUnits || ''}
        />
        <Bar
          billboardGauge={data.billboardResult || null}
          tableData={data.tableResult}
          unit={billboardUnits || ''}
          barSize={barSize || 'small'}
        />
        {showTable && (
          <StatusTable
            tableData={data.tableResult}
            criticalThreshold={criticalThreshold}
            healthyThreshold={healthyThreshold}
            tableTitle={tableTitle || ''}
            unit={billboardUnits || ''}
          />
        )}
      </>
    );
  }
}
