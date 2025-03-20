import React, { useContext, useEffect, useState } from 'react';
import {
  EmptyState,
  HeadingText,
  Spinner,
  SparklineChart,
  Icon,
  NerdletStateContext,
  PlatformStateContext,
  NrqlQuery
} from 'nr1';
import { useInterval } from '@mantine/hooks';
import ErrorState from '../shared/errorState';
import { subVariables } from '../shared/utils';
import Docs from './docs';

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

const operators = {
  above: (a, b) => a > b,
  below: (a, b) => a < b,
  equal: (a, b) => a === b
};

const getElementStyle = (
  value,
  criticalDirection,
  criticalThreshold,
  criticalColor,
  warningDirection,
  warningThreshold,
  warningColor
) => {
  const finalStyle = {};
  const critThreshold = criticalThreshold || null;
  const warnThreshold = warningThreshold || null;
  const critOperator = criticalDirection || 'above';
  const warnOperator = warningDirection || 'above';
  const critColor = criticalColor || 'red';
  const warnColor = warningColor || 'orange';

  if (warnThreshold) {
    if (operators[warnOperator](Number(value) || 0, Number(warnThreshold))) {
      finalStyle.color = warnColor;
    }
  }

  if (critThreshold) {
    if (operators[critOperator](Number(value) || 0, Number(critThreshold))) {
      finalStyle.color = critColor;
    }
  }

  return finalStyle;
};

const getIconType = changeValue => {
  if (
    Number(changeValue) === 0 ||
    Number(changeValue) === Infinity ||
    isNaN(Number(changeValue))
  ) {
    return 'INTERFACE__ARROW__SORT';
  }

  if (Number(changeValue) < 0) {
    return 'INTERFACE__ARROW__ARROW_BOTTOM';
  }

  if (Number(changeValue) > 0) {
    return 'INTERFACE__ARROW__ARROW_TOP';
  }
};

const getDefaultColor = (changeValue, type) => {
  if (
    Number(changeValue) === 0 ||
    Number(changeValue) === Infinity ||
    isNaN(Number(changeValue))
  ) {
    if (type === 'icon') {
      return '';
    }
    return {};
  }

  if (Number(changeValue) < 0) {
    if (type === 'icon') {
      return '#1ce783';
    }
    return { color: '#1ce783' };
  }

  if (Number(changeValue) > 0) {
    if (type === 'icon') {
      return '#b00f0a';
    }
    return { color: '#b00f0a' };
  }
};

const getBillboardClass = data => {
  if (data.compareWith && !data.timeData) {
    return 'billboard-compare';
  }

  if ((!data.compare && data.timeData) || (data.compare && data.timeData)) {
    return 'billboard-all';
  }

  return 'billboard-standalone';
};

const formatTimeData = (data, color) => {
  const td = [
    {
      metadata: {
        id: 'spark-line',
        name: data.metadata.name || 'timeseries',
        color: color || '#a35ebf',
        viz: 'main',
        units_data: {
          x: data.metadata.units_data.x,
          y: data.metadata.units_data.y
        }
      },
      data: data.data
    }
  ];

  return td;
};

export default function BillboardLineChart(props) {
  const {
    showDocs,
    pollInterval,
    enableTimePicker,
    enableFilters,
    billboardAccount,
    billboardQuery,
    billboardCriticalThresholdDirection,
    billboardCriticalThreshold,
    billboardCriticalThresholdColor,
    billboardWarningThresholdDirection,
    billboardWarningThreshold,
    billboardWarningThresholdColor,
    compareWithCriticalThresholdDirection,
    compareWithCriticalThreshold,
    compareWithCriticalColor,
    compareWithWarningThresholdDirection,
    compareWithWarningThreshold,
    compareWithWarningColor,
    compareWithAccount,
    compareWithQuery,
    timeseriesAccount,
    timeseriesQuery,
    timeseriesColor
  } = props;
  const platformContext = useContext(PlatformStateContext);
  const { timeRange } = platformContext;
  const nerdletContext = useContext(NerdletStateContext);
  const { filters, selectedVariables } = nerdletContext;
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [data, setData] = useState(null);
  const [billQuery, setBillQuery] = useState(null);
  const [timeQuery, setTimeQuery] = useState(null);
  const [compareQuery, setCompareQuery] = useState(null);
  const filterClause = filters ? `WHERE ${filters}` : '';

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    const tempErrors = [];
    const lowerBillboardQuery = (billboardQuery || '').toLowerCase();
    const lowerTimeQuery = (timeseriesQuery || '').toLowerCase();
    const timeQuery = timeRangeToNrql(timeRange);

    if (!billboardAccount) {
      tempErrors.push('Billboard account id required');
    }

    if (!billboardQuery) {
      tempErrors.push('Billboard query required');
    }

    if (billboardQuery) {
      let tempBillboardQ = subVariables(billboardQuery, selectedVariables);
      if (enableFilters) {
        tempBillboardQ += ` ${filterClause}`;
      }

      if (enableTimePicker) {
        if (
          lowerBillboardQuery.includes('since') ||
          lowerBillboardQuery.includes('until')
        ) {
          tempErrors.push(
            'Remove any since or until clauses when time picker enabled'
          );
        } else {
          tempBillboardQ += ` ${timeQuery}`;
        }
      }
      setBillQuery(tempBillboardQ);
    }

    if (timeseriesQuery) {
      let tempTimeQuery = subVariables(timeseriesQuery, selectedVariables);
      if (enableFilters) {
        tempTimeQuery += ` ${filterClause}`;
      }

      if (!lowerTimeQuery.includes('timeseries')) {
        tempErrors.push(
          '`timeseries` keyword required for timeseries chart to populate'
        );
      }

      if (enableTimePicker) {
        if (
          lowerTimeQuery.includes('since') ||
          lowerTimeQuery.includes('until')
        ) {
          tempErrors.push(
            'Remove any since or until clauses when time picker enabled'
          );
        } else {
          tempTimeQuery += ` ${timeQuery}`;
        }
      }
      setTimeQuery(tempTimeQuery);
    }

    if (compareWithQuery) {
      const lowerCompareQuery = compareWithQuery.toLowerCase();

      if (lowerCompareQuery.includes('timeseries')) {
        tempErrors.push(
          'compare with query must return a single value - remove timeseries keyword'
        );
      }

      setCompareQuery(compareWithQuery);
    }

    if (billboardQuery && compareWithQuery) {
      if (
        billboardQuery.toLowerCase().includes('compare with') &&
        compareWithQuery
      ) {
        tempErrors.push(
          'cannot specify a separate compare with query when `compare with` used in billboard nrql clause'
        );
      }
    }

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
    } else {
      setErrors([]);
    }

    setFirstLoadComplete(true);
  }, [
    billboardAccount,
    billboardQuery,
    timeseriesAccount,
    timeseriesQuery,
    compareWithAccount,
    compareWithQuery,
    enableTimePicker,
    enableFilters,
    timeRange,
    filterClause
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
    billQuery,
    timeQuery,
    compareQuery,
    billboardAccount,
    compareWithAccount,
    timeseriesAccount
  ]);

  const fetchData = async () => {
    if (billQuery && billboardAccount && errors.length === 0) {
      const final = {};
      let compareWithData = null;
      let timeData = null;
      const billboardData = await NrqlQuery.query({
        query: billQuery,
        accountIds: [parseInt(billboardAccount)],
        formatType: NrqlQuery.FORMAT_TYPE.RAW
      });

      if (timeseriesAccount && timeQuery) {
        timeData = await NrqlQuery.query({
          query: timeQuery,
          accountIds: [parseInt(timeseriesAccount)],
          formatType: NrqlQuery.FORMAT_TYPE.CHART
        });
      }

      if (compareWithAccount && compareQuery) {
        compareWithData = await NrqlQuery.query({
          query: compareQuery,
          accountIds: [parseInt(compareWithAccount)],
          formatType: NrqlQuery.FORMAT_TYPE.RAW
        });
      }

      if (billboardData?.error || compareWithData?.error || timeData?.error) {
        setErrors(['Error fetching data - validate queries and accountIds']);
      }

      if (errors.length === 0) {
        if (compareWithData) {
          const currentPoint = Object.values(
            billboardData?.data?.results[0]
          )[0];
          const previousPoint = Object.values(
            compareWithData?.data?.results[0]
          )[0];
          const percentChange =
            ((currentPoint - previousPoint) / previousPoint) * 100;
          final.compareWith = true;
          final.current = currentPoint;
          final.percentChange =
            percentChange === Infinity
              ? (currentPoint * 100).toFixed(0)
              : percentChange.toFixed(0);
        } else if (billboardData?.data.previous) {
          const currentPoint = Object.values(
            billboardData?.data?.current?.results[0]
          )[0];
          const previousPoint = Object.values(
            billboardData?.data?.previous?.results[0]
          )[0];
          const percentChange =
            ((currentPoint - previousPoint) / previousPoint) * 100;
          final.compareWith = true;
          final.current = currentPoint;
          final.percentChange =
            percentChange === Infinity
              ? (currentPoint * 100).toFixed(0)
              : percentChange.toFixed(0);
        } else {
          const currentPoint = Object.values(
            billboardData?.data?.results[0]
          )[0];
          final.compareWith = false;
          final.current = currentPoint;
        }

        if (timeData) {
          final.timeData = timeData?.data[0];
        }
      }

      setData(final);
      setLoading(false);
    }
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

  if (data === null && !loading && firstLoadComplete) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="Billboard query/accountId required"
          description=""
        />
      </>
    );
  }

  if (data && !loading && firstLoadComplete) {
    const compareStyle = getElementStyle(
      data.percentChange,
      compareWithCriticalThresholdDirection,
      compareWithCriticalThreshold,
      compareWithCriticalColor,
      compareWithWarningThresholdDirection,
      compareWithWarningThreshold,
      compareWithWarningColor
    );
    const billboardStyle = getElementStyle(
      data.current,
      billboardCriticalThresholdDirection,
      billboardCriticalThreshold,
      billboardCriticalThresholdColor,
      billboardWarningThresholdDirection,
      billboardWarningThreshold,
      billboardWarningThresholdColor
    );

    return (
      <>
        {showDocs && <Docs />}
        <div className="square-window">
          <div className="billboard-container">
            <HeadingText
              style={billboardStyle}
              className={getBillboardClass(data)}
              type={HeadingText.TYPE.HEADING_1}
            >
              {data.current || 0}
            </HeadingText>
          </div>
          {data.compareWith ? (
            <div className="compare">
              <Icon
                className="compare-icon"
                color={
                  compareStyle?.color ||
                  getDefaultColor(data.percentChange, 'icon')
                }
                type={getIconType(data.percentChange)}
              />
              <HeadingText
                style={
                  compareStyle?.color
                    ? compareStyle
                    : getDefaultColor(data.percentChange, 'header')
                }
                className="compare-elements"
                type={HeadingText.TYPE.HEADING_4}
              >
                {Math.abs(data.percentChange) || 0}%
              </HeadingText>
            </div>
          ) : (
            ''
          )}
          {data.timeData ? (
            <SparklineChart
              className="spark-line-chart"
              data={formatTimeData(data.timeData, timeseriesColor)}
            />
          ) : (
            ''
          )}
        </div>
      </>
    );
  }

  return <Spinner />;
}
