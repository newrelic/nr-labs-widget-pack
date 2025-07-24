import React, { useContext, useCallback, useEffect, useState } from 'react';
import {
  EmptyState,
  NerdGraphQuery,
  NerdletStateContext,
  PlatformStateContext,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell
} from 'nr1';
import ErrorState from '../shared/errorState';
import Docs from './docs';
import {
  dashQuery,
  dashEntityQuery,
  determineDashboardKeyIndex,
  mergeData
} from './utils';

const DashboardAudit = ({
  showDocs,
  accountId,
  query,
  dashboardKey,
  enableTimePicker
}) => {
  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);
  const { timeRange } = platformContext;
  const { filters } = nerdletContext;
  const [inputErrors, setInputErrors] = useState([]);
  const [dataFetchErrors, setDataFetchErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(-1);
  const [column, setColumn] = useState(0);
  const [sortingType, setSortingType] = useState(
    TableHeaderCell.SORTING_TYPE.NONE
  );
  const filterClause = filters ? `WHERE ${filters}` : '';
  const headers = data
    ? Array.from(
        data.reduce((acc, item) => {
          Object.keys(item).forEach(key => acc.add(key));
          return acc;
        }, new Set())
      )
    : [];

  useEffect(() => {
    const lowerQuery = (query || '').toLowerCase();
    const errors = [];

    if (!lowerQuery) {
      errors.push(`Query is undefined`);
    }

    if (!dashboardKey) {
      errors.push(`Dashboard identifier is undefined`);
    }

    if (!accountId) {
      errors.push(`Account ID is undefined`);
    }

    if (lowerQuery) {
      if (lowerQuery.includes('timeseries')) {
        errors.push(
          `Timeseries unsupported. Table is the only widget type currently supported`
        );
      }

      if (lowerQuery.includes('facet') && dashboardKey) {
        if (!query.includes(dashboardKey)) {
          errors.push(
            `Dashboard identifier must be included as a facet in query`
          );
        }
      }

      if (enableTimePicker) {
        if (lowerQuery.includes('since') || lowerQuery.includes('until')) {
          errors.push(
            `Remove any since or until clause when time picker enabled`
          );
        }
      }
    }

    if (errors.length > 0) {
      setInputErrors(errors);
    } else {
      setInputErrors([]);
    }
  }, [accountId, query, dashboardKey, enableTimePicker]);

  useEffect(() => {
    if (inputErrors.length === 0) {
      fetchData();
    }
  }, [inputErrors, fetchData]);

  const _onClickHeader = (nextCol, { nextSortingType }) => {
    if (nextCol === column) {
      setSortingType(nextSortingType);
    } else {
      setSortingType(nextSortingType);
      setColumn(nextCol);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const nrqlResults = await fetchNrqlData();
    if (nrqlResults) {
      let index = -1;
      if (query.includes('facet')) {
        index = determineDashboardKeyIndex(query, dashboardKey);
      }
      const cursor = null;
      const all = [];
      const dashboardEntities = await fetchDashboardEntities(cursor, all);
      if (dashboardEntities) {
        const merged = mergeData(
          index,
          dashboardKey,
          query,
          nrqlResults,
          dashboardEntities
        );
        setData(merged);
      }
    }
    setIndex(index);
    setLoading(false);
  }, [fetchNrqlData, fetchDashboardEntities, query, dashboardKey, accountId]);

  const fetchNrqlData = useCallback(async () => {
    let since = '';
    let finalQuery = query;

    if (enableTimePicker) {
      if (timeRange) {
        if (timeRange.duration) {
          since = ` since ${timeRange.duration / 60 / 1000} MINUTES AGO`;
        } else if (timeRange.begin_time && timeRange.end_time) {
          since = ` since ${timeRange.begin_time} until ${timeRange.end_time}`;
        }
      }
    }

    if (since !== '') {
      finalQuery += since;
    }

    if (filterClause !== '') {
      finalQuery += ` ${filterClause}`;
    }

    const { data, errors } = await NerdGraphQuery.query({
      query: dashQuery(Number(accountId), finalQuery)
    });
    const results = data?.actor?.account?.nrql?.results || null;

    if (errors) {
        console.debug(errors); // eslint-disable-line
      setDataFetchErrors([
        `Error fetching nrql data | Errors: ${errors.toString()}`
      ]);
      return;
    }

    if (dataFetchErrors.length > 0) {
      setDataFetchErrors([]);
    }

    return results;
  }, [query, accountId, filterClause, enableTimePicker]);

  const fetchDashboardEntities = useCallback(
    async (cursor, allEntities) => {
      const { data, errors } = await NerdGraphQuery.query({
        query: dashEntityQuery(Number(accountId), cursor)
      });
      const results = data?.actor?.entitySearch?.results || null;

      if (errors) {
        console.debug(errors); // eslint-disable-line
        setDataFetchErrors([
          `Error fetching nrql data | Errors: ${errors.toString()}`
        ]);
        return allEntities;
      }

      if (results) {
        if (results.entities.length > 0) {
          allEntities.push(...results.entities);
        }

        if (results.nextCursor) {
          return fetchDashboardEntities(results.nextCursor, allEntities);
        }
      }

      if (dataFetchErrors.length > 0) {
        setDataFetchErrors([]);
      }

      return allEntities;
    },
    [accountId]
  );

  if (inputErrors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <ErrorState errors={inputErrors} showDocs={showDocs} Docs={Docs} />
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

  if (loading) return <Spinner />;

  if (!loading && data.length === 0) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No data returned"
          description="Validate inputs or check browser console debug log for more information."
        />
      </>
    );
  }

  return (
    <>
      {showDocs && <Docs />}
      <div className="table">
        <Table compact items={data}>
          <TableHeader>
            {headers.map((key, i) => (
              <TableHeaderCell
                sortable
                sortingOrder={i}
                sortingType={
                  column === i ? sortingType : TableHeaderCell.SORTING_TYPE.NONE
                }
                key={i}
                value={({ item }) => item[key]}
                onClick={(evt, data) => _onClickHeader(i, data)}
              >
                {key}
              </TableHeaderCell>
            ))}
          </TableHeader>
          {({ item }) => (
            <TableRow>
              {headers.map((headerKey, index) => (
                <TableRowCell key={index}>
                  {item[headerKey] !== undefined ? item[headerKey] : 'n/a'}
                </TableRowCell>
              ))}
            </TableRow>
          )}
        </Table>
      </div>
    </>
  );
};

export default DashboardAudit;
