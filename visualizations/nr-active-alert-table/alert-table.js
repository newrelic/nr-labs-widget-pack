import React, { useCallback, useEffect, useState } from 'react';
import {
  EmptyState,
  HeadingText,
  Link,
  NerdGraphQuery,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  TextField
} from 'nr1';
import {
  fetchEntityQuery,
  fetchAckEvents,
  pluckTagValue,
  constructTable
} from './utils';
import async from 'async';
import { useInterval } from '@mantine/hooks';
import ErrorState from '../shared/errorState';
import Docs from './docs';

const AlertTable = ({ showDocs, conditionFilter, title, pollInterval }) => {
  const [inputErrors, setInputErrors] = useState([]);
  const [dataFetchErrors, setDataFetchErrors] = useState([]);
  const [data, setData] = useState([]);
  const [column, setColumn] = useState(0);
  const [sortingType, setSortingType] = useState(
    TableHeaderCell.SORTING_TYPE.NONE
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    if (!conditionFilter) {
      setInputErrors(['specify a valid condition filter']);
      return;
    }

    setInputErrors([]);
  }, [conditionFilter]);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, conditionFilter]);

  const fetchData = useCallback(async () => {
    if (inputErrors.length === 0) {
      const conditions = await fetchConditions();
      if (conditions && conditions.length > 0) {
        const ids = conditions
          .map(c => {
            return pluckTagValue(c.tags, 'id');
          })
          .filter(id => id !== null);

        const idFilter = `tags.conditionId in (${ids
          .map(id => `'${id}'`)
          .join(',')})`;
        const associatedIssues = await fetchIssues(idFilter);
        const ackEvents = await fetchAckEvents(associatedIssues); // temporary until product fixes stamping tags
        const final = constructTable(associatedIssues, ackEvents);
        const sortedFinal = final.sort((a, b) => {
          if (a.acknowledgedAt === null && b.acknowledgedAt !== null) {
            return -1;
          }
          if (a.acknowledgedAt !== null && b.acknowledgedAt === null) {
            return 1;
          }
          return a.issueMttd - b.issueMttd;
        });

        setData(sortedFinal);
      } else {
        setData({});
      }
    }
    setLoading(false);
  }, [conditionFilter, pollInterval]);

  const fetchConditions = useCallback(async () => {
    const allConditions = [];
    let conditionErrors = [];

    if (conditionFilter) {
      const conditionQ = async.queue(async (task, cb) => {
        const { data, errors } = await NerdGraphQuery.query({
          query: fetchEntityQuery(task.cursor, task.type, task.conditionFilter)
        });
        const results = data?.actor?.entitySearch?.results || null;

        if (errors) {
          conditionErrors = errors.length > 0 ? errors[0].message : [];
          setDataFetchErrors([conditionErrors]);
        } else {
          setDataFetchErrors([]);
        }

        if (results) {
          if (results.entities.length > 0) {
            allConditions.push(...results.entities);
          }

          if (results.nextCursor) {
            conditionQ.push({
              cursor: results.nextCursor,
              type: 'CONDITION',
              conditionFilter
            });
          }
        }

        cb();
      }, 5);

      conditionQ.push({ cursor: null, type: 'CONDITION', conditionFilter });

      await conditionQ.drain();
    }

    return allConditions;
  }, [conditionFilter]);

  const fetchIssues = useCallback(
    async filter => {
      const allIssues = [];

      const issueQ = async.queue(async (task, cb) => {
        const { data, errors } = await NerdGraphQuery.query({
          query: fetchEntityQuery(task.cursor, task.type, task.filter)
        });

        const results = data?.actor?.entitySearch?.results || null;
        if (errors) {
          const issueErrors = errors.length > 0 ? errors[0].message : [];
          setDataFetchErrors([issueErrors]);
        } else {
          setDataFetchErrors([]);
        }

        if (results) {
          if (results.entities.length > 0) {
            allIssues.push(...results.entities);
          }

          if (results.nextCursor) {
            issueQ.push({ cursor: results.nextCursor, type: 'ISSUE', filter });
          }
        }

        cb();
      }, 5);

      issueQ.push({ cursor: null, type: 'ISSUE', filter });

      await issueQ.drain();

      return allIssues;
    },
    [fetchConditions]
  );

  const _onClickHeader = (nextCol, { nextSortingType }) => {
    if (nextCol === column) {
      setSortingType(nextSortingType);
    } else {
      setSortingType(nextSortingType);
      setColumn(nextCol);
    }
  };

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

  if (!loading && data.length === 0) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No data returned"
          description="Validate filter inputs are correct"
          additionalInfoLink={{
            label: 'DOCS',
            to:
              'https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-entities-api-tutorial/#search-querybuilder'
          }}
        />
      </>
    );
  }

  if (
    !loading &&
    inputErrors.length === 0 &&
    dataFetchErrors.length === 0 &&
    data.length > 0
  ) {
    const filteredIssues = data.filter(i => {
      return (
        i.conditionName.toLowerCase().includes(search.toLowerCase()) ||
        i.relatedEntityName.toLowerCase().includes(search.toLowerCase())
      );
    });
    return (
      <>
        {showDocs && <Docs />}
        <HeadingText
          className="alert-table-title"
          type={HeadingText.TYPE.HEADING_3}
        >
          {title || 'Untitled Widget'}
        </HeadingText>
        <TextField
          placeholder="Search issues.."
          value={search || ''}
          type={TextField.TYPE.SEARCH}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="alert-table">
          <Table items={filteredIssues}>
            <TableHeader>
              <TableHeaderCell value={({ item }) => item.issueId}>
                <b>ID</b>
              </TableHeaderCell>
              <TableHeaderCell
                value={({ item }) => item.issueMttd}
                sortable
                sortingOrder={1}
                sortingType={
                  column === 1 ? sortingType : TableHeaderCell.SORTING_TYPE.NONE
                }
                onClick={(evt, data) => _onClickHeader(1, data)}
              >
                <b>MTTD (min)</b>
              </TableHeaderCell>
              <TableHeaderCell
                value={({ item }) => item.acknowledgedAt}
                sortable
                sortingOrder={0}
                sortingType={
                  column === 0 ? sortingType : TableHeaderCell.SORTING_TYPE.NONE
                }
                onClick={(evt, data) => _onClickHeader(0, data)}
              >
                <b>Acknowledged</b>
              </TableHeaderCell>
              <TableHeaderCell
                value={({ item }) => item.relatedEntityName}
                sortable
                sortingOrder={2}
                sortingType={
                  column === 2 ? sortingType : TableHeaderCell.SORTING_TYPE.NONE
                }
                onClick={(evt, data) => _onClickHeader(2, data)}
              >
                <b>Entity</b>
              </TableHeaderCell>
              <TableHeaderCell
                value={({ item }) => item.conditionName}
                sortable
                sortingOrder={3}
                sortingType={
                  column === 3 ? sortingType : TableHeaderCell.SORTING_TYPE.NONE
                }
                onClick={(evt, data) => _onClickHeader(3, data)}
              >
                <b>Condition</b>
              </TableHeaderCell>
            </TableHeader>
            {({ item }) => (
              <TableRow>
                <TableRowCell>
                  <Link
                    to={`https://radar-api.service.newrelic.com/accounts/${item.accountId.toString()}/issues/${
                      item.issueId
                    }?notifier=&action=`}
                  >
                    {item.issueId.substring(0, 8)}
                  </Link>
                </TableRowCell>
                <TableRowCell>{item.issueMttd}</TableRowCell>
                <TableRowCell
                  style={{
                    color: item.acknowledgedAt === null ? '#df2d24' : '#1ce783'
                  }}
                >
                  {item.acknowledgedAt === null ? 'false' : 'true'}
                </TableRowCell>
                <TableRowCell>{item.relatedEntityName || 'n/a'}</TableRowCell>
                <TableRowCell>{item.conditionName}</TableRowCell>
              </TableRow>
            )}
          </Table>
        </div>
      </>
    );
  }

  return '';
};

export default AlertTable;
