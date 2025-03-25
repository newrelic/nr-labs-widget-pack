import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import async from 'async';
import ErrorState from '../shared/errorState';
import { useInterval } from '@mantine/hooks';
import {
  EmptyState,
  HeadingText,
  NerdGraphQuery,
  NrqlQuery,
  PlatformStateContext,
  Spinner,
  SparklineChart
} from 'nr1';
import {
  determineIssueCountByEntityType,
  fetchEntityCountQuery,
  fetchEntityQuery,
  fetchTimestampsQuery,
  formatTimeseries,
  generateConditionMap,
  pluckTagValue
} from './utils';
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

const AlertBillboard = ({
  showDocs,
  conditionFilter,
  entityType,
  enableTimePicker,
  widgetColor,
  pollInterval
}) => {
  const platformContext = useContext(PlatformStateContext);
  const { timeRange } = platformContext;
  const [inputErrors, setInputErrors] = useState([]);
  const [dataFetchErrors, setDataFetchErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    if (!conditionFilter) {
      setInputErrors(['specify a valid condition filter']);
      return;
    }

    setInputErrors([]);
  }, [conditionFilter, entityType]);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, conditionFilter, entityType, enableTimePicker, timeRange]);

  const fetchData = useCallback(async () => {
    if (inputErrors.length === 0) {
      setInputErrors([]);
      const conditions = await fetchEntities('CONDITION', conditionFilter);
      if (conditions && conditions.length > 0) {
        setDataFetchErrors([]);
        const conditionMap = generateConditionMap(conditions);

        const ids = conditions
          .map(c => {
            return pluckTagValue(c.tags, 'id');
          })
          .filter(id => id !== null);

        const idFilter = `tags.conditionId in (${ids
          .map(id => `'${id}'`)
          .join(',')})`;

        if (entityType !== null && entityType !== '') {
          const issues = await fetchEntities('ISSUE', idFilter);
          const relatedEntities = issues.map(i => {
            return pluckTagValue(i.tags, 'relatedEntityId');
          });
          const entityFilter = `tags.guid in (${relatedEntities
            .map(id => `'${id}'`)
            .join(',')})`;

          const allData = await Promise.all([
            fetchEntities(entityType, entityFilter),
            fetchTimeData(conditionMap, entityType)
          ]);

          const activeIssueCount = determineIssueCountByEntityType(
            issues,
            allData[0]
          );

          setData({
            activeIssueCount: activeIssueCount,
            issueTimeseries: allData[1]
          });
        } else {
          const allData = await Promise.all([
            fetchIssueCount(idFilter),
            fetchTimeData(conditionMap, null)
          ]);

          setData({
            activeIssueCount: allData[0],
            issueTimeseries: allData[1]
          });
        }
      } else {
        setData({});
      }
    }

    setLoading(false);
  }, [conditionFilter, entityType, enableTimePicker, timeRange]);

  const fetchEntities = useCallback(
    async (type, filter) => {
      const allEntities = [];

      if (filter) {
        const entityQ = async.queue(async (task, cb) => {
          const { data, errors } = await NerdGraphQuery.query({
            query: fetchEntityQuery(task.cursor, task.type, task.filter)
          });
          const results = data?.actor?.entitySearch?.results || null;

          if (errors) {
            console.debug(errors); // eslint-disable-line
            setDataFetchErrors([
              `Error fetching entity type: ${entityType} | Errors: ${errors.toString()}`
            ]);
            return;
          }

          if (results) {
            if (results.entities.length > 0) {
              allEntities.push(...results.entities);
            }

            if (results.nextCursor) {
              entityQ.push({
                cursor: results.nextCursor,
                type: type,
                filter
              });
            }
          }

          cb();
        }, 5);

        entityQ.push({ cursor: null, type: type, filter });

        await entityQ.drain();
      }

      if (dataFetchErrors) {
        setDataFetchErrors([]);
      }
      return allEntities;
    },
    [conditionFilter, entityType]
  );

  const fetchIssueCount = useCallback(
    async filter => {
      const { data, errors } = await NerdGraphQuery.query({
        query: fetchEntityCountQuery(filter)
      });
      const issueCount = data?.actor?.entitySearch?.counts[0]?.count || null;

      if (errors) {
        console.debug(errors); // eslint-disable-line
        setDataFetchErrors([`Error Fetching Issues: ${errors.toString()}`]);
        return;
      }

      if (dataFetchErrors) {
        setDataFetchErrors([]);
      }
      return issueCount;
    },
    [conditionFilter, entityType]
  );

  const fetchTimeData = useCallback(
    async (condMap, type) => {
      const allTimestamps = {};

      const timestampQ = async.queue(async (task, cb) => {
        const { data, error } = await NrqlQuery.query({
          query: fetchTimestampsQuery(task.filter, task.type, task.timeString),
          accountIds: [task.accountId],
          formatType: NrqlQuery.FORMAT_TYPE.CHART
        });

        if (error) {
          console.debug(error); // eslint-disable-line
          setDataFetchErrors([error]);
          return;
        }

        if (data) {
          if (data[0]?.data?.length > 0) {
            allTimestamps[`${task.accountId}`] = data[0].data;
          }
        }

        cb();
      }, 10);

      const timeString = enableTimePicker
        ? timeRangeToNrql(timeRange)
        : `since 1 day ago`;
      condMap.forEach(c => {
        const filter = `(${c.conditionIds.map(id => `${id}`).join(',')})`;
        const accountId = c.accountId;
        timestampQ.push({ accountId, filter, type, timeString });
      });

      await timestampQ.drain();

      if (dataFetchErrors) {
        setDataFetchErrors([]);
      }
      return allTimestamps;
    },
    [fetchData]
  );

  if (inputErrors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="Specify a condition filter to get started. Enable documentation for more detail."
          additionalInfoLink={{
            label: 'DOCS',
            to:
              'https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-entities-api-tutorial/#search-querybuilder'
          }}
        />
      </>
    );
  }

  if (dataFetchErrors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <ErrorState errors={dataFetchErrors} />
      </>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  if (
    !loading &&
    inputErrors.length === 0 &&
    dataFetchErrors.length === 0 &&
    JSON.stringify(data) !== '{}'
  ) {
    return (
      <>
        {showDocs && <Docs />}
        <div className="alert-square-window">
          <div className="alert-billboard-container">
            <HeadingText
              style={{ color: widgetColor || 'red' }}
              className="alert-billboard"
              type={HeadingText.TYPE.HEADING_1}
            >
              {data.activeIssueCount || 0}
            </HeadingText>
          </div>
          <SparklineChart
            className="spark-line-chart-alert-bb"
            data={formatTimeseries(data.issueTimeseries, widgetColor)}
          />
        </div>
      </>
    );
  }

  if (!loading && JSON.stringify(data) === '{}') {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No conditions returned"
          description="Validate condition filter is correct."
          additionalInfoLink={{
            label: 'DOCS',
            to:
              'https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-entities-api-tutorial/#search-querybuilder'
          }}
        />
      </>
    );
  }

  return <Spinner />;
};

AlertBillboard.propTypes = {
  showDocs: PropTypes.bool,
  conditionFilter: PropTypes.string,
  widgetColor: PropTypes.string
};

export default AlertBillboard;
