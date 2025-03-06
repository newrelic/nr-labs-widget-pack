import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import async from 'async';
import ErrorState from '../shared/errorState';
import {
  Dropdown,
  DropdownItem,
  EmptyState,
  NerdGraphQuery,
  Spinner,
  TextField
} from 'nr1';
import {
  determineGroupOptions,
  groupConditions,
  fetchEntityQuery,
  mergeData,
  pluckTagValue
} from './utils';
import Docs from './docs';
import Summary from './components/summary';
import ConditionTable from './components/condition-table';
import GroupTable from './components/group-table';

const ConditionSummary = ({
  showDocs,
  conditionFilter,
  showAlertingOnly,
  sortBy,
  sortOrder
}) => {
  const [inputErrors, setInputErrors] = useState([]);
  const [dataFetchErrors, setDataFetchErrors] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [groupOptions, setGroupOptions] = useState(['None']);
  const [selectedGroup, setSelectedGroup] = useState('None');
  const [groupedData, setGroupedData] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!conditionFilter) {
      setInputErrors(['specify a valid condition filter']);
      return;
    }

    setInputErrors([]);
    fetchData();
  }, [conditionFilter]);

  useEffect(() => {
    if (data.conditions && data.conditions.length > 0) {
      const fetchedOptions = determineGroupOptions(data.conditions);
      setGroupOptions(fetchedOptions);
    }
  }, [data]);

  useEffect(() => {
    if (selectedGroup === 'None') {
      setGroupedData(null);
      return;
    }

    const groupTable = groupConditions(selectedGroup, data.conditions);
    setGroupedData(groupTable);
  }, [selectedGroup]);

  const fetchData = useCallback(async () => {
    if (inputErrors.length === 0) {
      setInputErrors([]);
      setLoading(true);
      const conditions = await fetchConditions();
      if (conditions && conditions.length > 0) {
        setDataFetchErrors([]);
        const ids = conditions
          .map(c => {
            return pluckTagValue(c.tags, 'id');
          })
          .filter(id => id !== null);

        const idFilter = `tags.conditionId in (${ids
          .map(id => `'${id}'`)
          .join(',')})`;
        const associatedIssues = await fetchIssues(idFilter);
        const finalData = await mergeData(conditions, associatedIssues);
        setData(finalData);
      } else {
        setData({});
      }
    }
    setLoading(false);
  }, [conditionFilter, inputErrors]);

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
        <Summary data={data.summary} />
        <Dropdown
          style={{ paddingLeft: '6vh' }}
          title={selectedGroup}
          label="Group By"
          items={groupOptions}
          labelInline
        >
          {groupOptions.map((g, i) => (
            <DropdownItem key={i} onClick={() => setSelectedGroup(g)}>
              {g}
            </DropdownItem>
          ))}
        </Dropdown>
        <TextField
          style={{ marginLeft: '20px', width: '14vw' }}
          label="Filter"
          labelInline
          placeholder="Search by name.."
          value={searchText || ''}
          type={TextField.TYPE.SEARCH}
          onChange={e => setSearchText(e.target.value)}
        />
        {selectedGroup === 'None' ? ( // eslint-disable-line
          <ConditionTable
            data={data.conditions}
            searchText={searchText}
            showAlertingOnly={showAlertingOnly}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ) : groupedData !== null ? (
          <GroupTable
            data={groupedData}
            selectedGroupKey={selectedGroup}
            searchText={searchText}
            showAlertingOnly={showAlertingOnly}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ) : (
          <Spinner />
        )}
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
};

ConditionSummary.propTypes = {
  showDocs: PropTypes.bool,
  conditionFilter: PropTypes.string,
  showAlertingOnly: PropTypes.bool,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string
};

export default ConditionSummary;
