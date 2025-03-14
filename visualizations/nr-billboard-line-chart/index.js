import React, { useContext, useEffect, useState } from 'react';
import {
  AutoSizer,
  EmptyState,
  HeadingText,
  Spinner,
  SparklineChart,
  Icon,
  NerdletStateContext,
  PlatformStateContext,
  NrqlQuery
} from 'nr1';
import PropTypes from 'prop-types';
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

const getHeaderStyle = value => {
  if (Number(value) < 0) {
    return { color: '#1ce783' };
  }

  if (Number(value) > 0) {
    return { color: '#b00f0a' };
  }

  return '';
};

const getColorOverride = color => {
  return { color: color || '' };
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
    title,
    billboardAccount,
    billboardQuery,
    billboardColor,
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

    if (!billboardAccount || !timeseriesAccount) {
      tempErrors.push(
        'Account ID required for both billboard and timeseries queries'
      );
    }

    if (!billboardQuery || !timeseriesQuery) {
      tempErrors.push('Billboard and timeseries queries required');
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
    if (timeQuery && billQuery && billboardAccount && timeseriesAccount) {
      let final = null;
      const queryProms = [
        NrqlQuery.query({
          query: billQuery,
          accountIds: [parseInt(billboardAccount)],
          formatType: NrqlQuery.FORMAT_TYPE.RAW
        }),
        NrqlQuery.query({
          query: timeQuery,
          accountIds: [parseInt(timeseriesAccount)],
          formatType: NrqlQuery.FORMAT_TYPE.CHART
        })
      ];
      if (compareWithAccount && compareQuery) {
        queryProms.push(
          NrqlQuery.query({
            query: compareQuery,
            accountIds: [parseInt(compareWithAccount)],
            formatType: NrqlQuery.FORMAT_TYPE.RAW
          })
        );
      }
      const queryData = await Promise.all(queryProms);
      const billboardData = queryData[0].data;
      const timeData = queryData[1].data[0];
      const compareWithData = queryData[2]?.data || null;

      if (queryData[0].error || queryData[1].error) {
        setErrors(['Error fetching data - validate queries and accountIds']);
        console.debug(queryData); // eslint-disable-line
      }

      if (errors.length === 0) {
        if (compareWithData) {
          const currentPoint = Object.values(billboardData?.results[0])[0];
          const previousPoint = Object.values(compareWithData?.results[0])[0];
          const percentChange =
            ((currentPoint - previousPoint) / previousPoint) * 100;
          final = {
            compareWith: true,
            current: currentPoint,
            percentChange:
              percentChange === Infinity
                ? (currentPoint * 100).toFixed(0)
                : percentChange.toFixed(0),
            timeData
          };
        } else {
          const currentPoint = Object.values(billboardData?.results[0])[0];
          final = { compareWith: false, current: currentPoint, timeData };
        }
      }

      setData(final);
      setLoading(false);
    }
  };

  const renderIcon = changeValue => {
    if (Number(changeValue) === 0) {
      return '';
    }

    if (Number(changeValue) < 0) {
      return (
        <div className="compare-elements">
          <Icon color="#1ce783" type="INTERFACE__ARROW__ARROW_BOTTOM" />
        </div>
      );
    }

    if (Number(changeValue) > 0) {
      return (
        <div className="compare-elements">
          <Icon
            style={{ fontSize: '24px' }}
            color="#b00f0a"
            type="INTERFACE__ARROW__ARROW_TOP"
          />
        </div>
      );
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

  if (data === null && loading && firstLoadComplete) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="Billboard and Timeseries queries/accountIds required"
          description=""
        />
      </>
    );
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <>
          {showDocs && <Docs />}
          <div width={width} height={height} className="square-window">
            <HeadingText className="title" type={HeadingText.TYPE.HEADING_3}>
              {title || 'Untitled Widget'}
            </HeadingText>
            <div className="billboard-container">
              <HeadingText
                style={getColorOverride(billboardColor)}
                className="billboard"
                type={HeadingText.TYPE.HEADING_1}
              >
                {data.current || 0}
              </HeadingText>
            </div>
            {data.compareWith ? (
              <div className="compare">
                {renderIcon(data.percentChange)}
                <HeadingText
                  style={getHeaderStyle(data.percentChange)}
                  className="compare-elements"
                  type={HeadingText.TYPE.HEADING_4}
                >
                  {data.percentChange || 0}%
                </HeadingText>
              </div>
            ) : (
              ''
            )}
            <SparklineChart
              className="spark-line-chart"
              data={formatTimeData(data.timeData, timeseriesColor)}
            />
          </div>
        </>
      )}
    </AutoSizer>
  );
}

BillboardLineChart.propTypes = {
  showDocs: PropTypes.bool,
  pollInterval: PropTypes.number,
  enableTimePicker: PropTypes.bool,
  enableFilters: PropTypes.bool,
  title: PropTypes.string,
  billboardAccount: PropTypes.number,
  billboardQuery: PropTypes.string,
  billboardColor: PropTypes.string,
  compareWithAccount: PropTypes.number,
  compareWithQuery: PropTypes.string,
  timeseriesAccount: PropTypes.number,
  timeseriesQuery: PropTypes.string,
  timeseriesColor: PropTypes.string
};
