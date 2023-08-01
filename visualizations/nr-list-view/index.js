import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { AutoSizer, EmptyState } from 'nr1';
import useQueryData from './use-query-data';
import { castAccountIdsAsArray, generateList } from './data';

const ListViewVisualization = ({ accountId, query, templateString }) => {
  const [list, setList] = useState([]);
  const [filterText, setFilterText] = useState('');
  const { data, attributes } = useQueryData({
    query,
    accountIds: castAccountIdsAsArray(accountId)
  });

  useEffect(() => setList(generateList({ data, attributes, templateString })), [
    data,
    attributes,
    templateString
  ]);

  const displayList = useMemo(() => {
    if (!filterText) return list;

    const regexSafePattern = filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(regexSafePattern, 'i');
    return list.filter(item => regex.test(item));
  }, [filterText, list]);

  const filterTextChangeHandler = useCallback(
    ({ target: { value = '' } = {} } = {}) => setFilterText(value),
    []
  );

  if (!list?.length)
    return (
      <EmptyState
        fullHeight
        fullWidth
        iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
        title="Account, NRQL query and template string are required"
        description="Pick an account and enter a NRQL query and template string to get started. Template strings **need** to be regular-expression-safe. For more information, including details on how to format the template string, view the README."
        additionalInfoLink={{
          label: 'README',
          to:
            'https://github.com/newrelic/nr-labs-widget-pack/blob/main/README.md#list-view'
        }}
      />
    );

  return (
    <AutoSizer>
      {({ width, height }) => (
        <div className="list-container" style={{ width, height }}>
          <div className="filter">
            <input
              type="search"
              placeholder="filter..."
              className="u-unstyledInput filter-field"
              value={filterText}
              onChange={filterTextChangeHandler}
            />
          </div>
          <ul className="list-view">
            {displayList.map((item, i) => (
              <li className="list-item" key={i}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AutoSizer>
  );
};

ListViewVisualization.propTypes = {
  accountId: PropTypes.number,
  query: PropTypes.string,
  templateString: PropTypes.string
};

export default ListViewVisualization;
