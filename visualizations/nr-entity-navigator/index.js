import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import async from 'async';
import Docs from './docs';
import HighDensity from './views/high-density';
import DataMode from './views/data-mode';
import ErrorState from '../shared/ErrorState';
import { EmptyState, NerdGraphQuery, Spinner } from 'nr1';
import { useInterval } from '@mantine/hooks';

const entityQuery = (cursor, includeData, entityDomain, query) => {
  return `
  {
    actor {
      entitySearch(query: "domain='${entityDomain}'${
    query ? ` and ${query}` : ''
  }", sortBy: ALERT_SEVERITY ${includeData ? `,options: {limit: 50}` : ''}) {
        results${cursor ? `(cursor: "${cursor}")` : ''} {
          entities {
            name
            guid
            alertSeverity
            permalink
            type
            account {
              id
              name
            }
            entityType
            ${
              includeData
                ? `goldenMetrics { metrics { name query title unit } }`
                : ''
            }
            reporting
          }
          nextCursor
        }
        count
      }
    }
  }
  `;
};

const goldenMetricsQuery = (queries, accountId) => {
  return `
  {
    actor {
      account(id: ${accountId}) {
        ${queries.join('\n')}
      }
    }
  }
  `;
};

const EntityNavigator = ({
  showDocs,
  includeData,
  numberOfEntitiesDisplayed,
  showAlertingOnly,
  entityDomain,
  entitySearchQuery,
  pollInterval
}) => {
  const [errors, setErrors] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [entityDisplayCount, setEntityDisplayCount] = useState(10);
  const [totalEntityCount, setTotalEntityCount] = useState(0);

  const interval = useInterval(() => {
    fetchEntities();
  }, (pollInterval || 120) * 1000);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [includeData, entityDomain, entitySearchQuery, pollInterval]);

  useEffect(() => {
    if (numberOfEntitiesDisplayed) {
      setEntityDisplayCount(numberOfEntitiesDisplayed);
    } else {
      setEntityDisplayCount(10);
    }
  }, [numberOfEntitiesDisplayed]);

  const fetchData = async () => {
    setLoading(true);
    setEntities([]);
    const tempErrors = [];

    if (!entityDomain || entityDomain === 'SELECT') {
      tempErrors.push('configure entity type');
    }

    setErrors(tempErrors);

    if (tempErrors.length === 0) {
      await fetchEntities();
    }

    setLoading(false);
    setFirstLoadComplete(true);
  };

  const fetchEntities = useCallback(async () => {
    const allEntities = [];
    let entityCount = 0;
    const q = async.queue(async (task, cb) => {
      const { data, error } = await NerdGraphQuery.query({
        query: entityQuery(
          task.cursor,
          task.includeData,
          task.entityDomain,
          task.entitySearchQuery
        )
      });

      if (error) {
        setErrors(prevErrors => [
          ...prevErrors,
          `Error fetching entities: ${error}`
        ]);
        cb(error);
        return;
      }

      entityCount = data?.actor?.entitySearch?.count;
      const results = data?.actor?.entitySearch?.results || null;

      if (results) {
        if (results.entities.length > 0) {
          allEntities.push(...results.entities);
        }

        if (
          allEntities.length >= 500 ||
          (includeData && allEntities.length >= 50)
        ) {
          q.kill();
          const finalEntities =
            includeData && allEntities.length > 0
              ? await fetchGoldenMetrics(allEntities)
              : allEntities;
          setTotalEntityCount(entityCount);
          setEntities(finalEntities);
          setLoading(false);
          cb();
          return;
        }

        if (results.nextCursor) {
          q.push({
            cursor: results.nextCursor,
            includeData,
            entityDomain,
            entitySearchQuery
          });
        }
      }

      cb();
    }, 5);

    q.push({ cursor: null, includeData, entityDomain, entitySearchQuery });

    await q.drain();

    const finalEntities =
      includeData && allEntities.length > 0
        ? await fetchGoldenMetrics(allEntities)
        : allEntities;
    setTotalEntityCount(entityCount);
    setEntities(finalEntities);
    setLoading(false);
  }, [includeData, entityDomain, entitySearchQuery]);

  const fetchGoldenMetrics = useCallback(
    async ents => {
      const updatedEntities = [...ents];
      const metricsQ = async.queue(async (task, cb) => {
        const goldenMetrics =
          task.entity.goldenMetrics?.metrics.slice(0, 3) || [];

        if (goldenMetrics.length > 0) {
          const queries = goldenMetrics.map(
            (metric, i) =>
              `gm${i + 1}: nrql(query: "${metric.query
                .replace(/\bLIMIT MAX\b|\bTIMESERIES\b/g, '')
                .replace(/\s+/g, ' ')
                .trim()}", timeout: 60) {results} `
          );
          const { data, error } = await NerdGraphQuery.query({
            query: goldenMetricsQuery(queries, task.entity.account.id)
          });

          const results = data?.actor?.account;

          if (error) {
            setErrors(prevErrors => [
              ...prevErrors,
              `Error fetching golden metrics: ${error}`
            ]);
            cb(error);
            return;
          }

          if (results) {
            task.entity.goldenMetricsData = []; // eslint-disable-line
            for (const key in results) {
              if (results.hasOwnProperty(key) && key.startsWith('gm')) { // eslint-disable-line
                const gmResults = results[key].results;
                if (gmResults && gmResults.length > 0) {
                  const index = parseInt(key.replace('gm', ''), 10) - 1;
                  const metricUnit = goldenMetrics[index]?.unit;
                  const metricTitle = goldenMetrics[index]?.title;
                  task.entity.goldenMetricsData.push({
                    ...gmResults[0],
                    unit: metricUnit,
                    title: metricTitle
                  });
                }
              }
            }
          }
        }

        cb();
      }, 25);

      updatedEntities.forEach(entity => {
        metricsQ.push({ entity });
      });

      await metricsQ.drain();

      return updatedEntities;
    },
    [includeData, entityDomain, entitySearchQuery]
  );

  if (loading && !firstLoadComplete) {
    return <Spinner />;
  }

  if (errors.length > 0 && !firstLoadComplete) {
    return <ErrorState errors={errors} />;
  }

  if (entities.length === 0 && !loading && firstLoadComplete) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="Entity domain is required and entitySearch query must be valid."
          description="Validate an entity domain is selected and entitySearch query is valid. If valid, no entities were returned."
          additionalInfoLink={{
            label: 'DOCS',
            to:
              'https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-entities-api-tutorial/#search-querybuilder'
          }}
        />
      </>
    );
  }

  return (
    <>
      {showDocs && <Docs />}
      {includeData ? (
        <DataMode
          entities={entities}
          displayCount={entityDisplayCount}
          totalCount={totalEntityCount}
          showAlertingOnly={showAlertingOnly}
        />
      ) : (
        <HighDensity
          entities={entities}
          totalCount={totalEntityCount}
          showAlertingOnly={showAlertingOnly}
        />
      )}
    </>
  );
};

EntityNavigator.propTypes = {
  includeData: PropTypes.bool,
  numberOfEntitiesDisplayed: PropTypes.string,
  showAlertingOnly: PropTypes.bool,
  entityDomain: PropTypes.string,
  entitySearchQuery: PropTypes.string
};

export default EntityNavigator;
