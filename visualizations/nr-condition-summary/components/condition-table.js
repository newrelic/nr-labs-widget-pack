import React, { useEffect, useState } from 'react';
import {
  Badge,
  Icon,
  Link,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip
} from 'nr1';
import { formatTimestamp, getTooltip, issueFeed } from '../utils';

const BADGE_TYPES = {
  Critical: Badge.TYPE.CRITICAL,
  High: Badge.TYPE.SEVERE,
  Healthy: Badge.TYPE.SUCCESS,
  Disabled: Badge.TYPE.NORMAL
};

const STATUS_MAP = {
  4: 'Critical',
  3: 'High',
  2: 'Healthy',
  1: 'Disabled'
};

const DEFAULT_COLUMN_PRIORITY = {
  status: 0,
  issueCount: 1,
  name: 2,
  lastOccurrence: 3
};

const ConditionTable = ({
  data,
  searchText,
  showAlertingOnly,
  sortBy,
  sortOrder
}) => {
  const [column, setColumn] = useState(
    DEFAULT_COLUMN_PRIORITY[sortBy] || DEFAULT_COLUMN_PRIORITY.status
  );
  const [sortingType, setSortingType] = useState(
    TableHeaderCell.SORTING_TYPE[sortOrder] ||
      TableHeaderCell.SORTING_TYPE.DESCENDING
  );

  const alertingOnly = showAlertingOnly
    ? data.filter(c => c.issues.length > 0)
    : data;
  const filteredConditions = alertingOnly.filter(a => {
    return a.name.toLowerCase().includes(searchText.toLowerCase());
  });

  useEffect(() => {
    if (sortOrder) {
      setSortingType(TableHeaderCell.SORTING_TYPE[sortOrder]);
    }
  }, [sortOrder]);

  useEffect(() => {
    if (sortBy) {
      setColumn(DEFAULT_COLUMN_PRIORITY[sortBy]);
    }
  }, [sortBy]);

  const _onClickHeader = (nextCol, { nextSortingType }) => {
    if (nextCol === column) {
      setSortingType(nextSortingType);
    } else {
      setSortingType(nextSortingType);
      setColumn(nextCol);
    }
  };

  return (
    <>
      <div className="condition-table">
        <Table compact height="300px" items={filteredConditions}>
          <TableHeader>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              value={({ item }) => item.status}
              width="1.5%"
              sortable
              sortingOrder={DEFAULT_COLUMN_PRIORITY.status}
              sortingType={
                column === DEFAULT_COLUMN_PRIORITY.status
                  ? sortingType
                  : TableHeaderCell.SORTING_TYPE.NONE
              }
              onClick={(evt, data) =>
                _onClickHeader(DEFAULT_COLUMN_PRIORITY.status, data)
              }
            >
              <b>
                <Tooltip
                  text={getTooltip(null, 'status')}
                  placementType={Tooltip.PLACEMENT_TYPE.LEFT}
                >
                  <Icon
                    style={{ marginRight: '2px' }}
                    type={Icon.TYPE.INTERFACE__INFO__HELP}
                  />
                </Tooltip>
                Status
              </b>
            </TableHeaderCell>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              width="20%"
              value={({ item }) => item.name}
              sortable
              sortingOrder={DEFAULT_COLUMN_PRIORITY.name}
              sortingType={
                column === DEFAULT_COLUMN_PRIORITY.name
                  ? sortingType
                  : TableHeaderCell.SORTING_TYPE.NONE
              }
              onClick={(evt, data) =>
                _onClickHeader(DEFAULT_COLUMN_PRIORITY.name, data)
              }
            >
              <b>Condition Name</b>
            </TableHeaderCell>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              width="5%"
              value={({ item }) => item.issueCount}
              sortable
              sortingOrder={DEFAULT_COLUMN_PRIORITY.issueCount}
              sortingType={
                column === DEFAULT_COLUMN_PRIORITY.issueCount
                  ? sortingType
                  : TableHeaderCell.SORTING_TYPE.NONE
              }
              onClick={(evt, data) =>
                _onClickHeader(DEFAULT_COLUMN_PRIORITY.issueCount, data)
              }
            >
              <b>
                <Tooltip
                  text={getTooltip('None', 'count')}
                  placementType={Tooltip.PLACEMENT_TYPE.LEFT}
                >
                  <Icon
                    style={{ marginRight: '2px' }}
                    type={Icon.TYPE.INTERFACE__INFO__HELP}
                  />
                </Tooltip>
                Open Issues
              </b>
            </TableHeaderCell>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              width="5%"
              value={({ item }) => item.latestIssueTimestamp}
              sortable
              sortingOrder={DEFAULT_COLUMN_PRIORITY.lastOccurrence}
              sortingType={
                column === DEFAULT_COLUMN_PRIORITY.lastOccurrence
                  ? sortingType
                  : TableHeaderCell.SORTING_TYPE.NONE
              }
              onClick={(evt, data) =>
                _onClickHeader(DEFAULT_COLUMN_PRIORITY.lastOccurrence, data)
              }
            >
              <b>
                <Tooltip
                  text={getTooltip(null, 'timestamp')}
                  placementType={Tooltip.PLACEMENT_TYPE.LEFT}
                >
                  <Icon
                    style={{ marginRight: '2px' }}
                    type={Icon.TYPE.INTERFACE__INFO__HELP}
                  />
                </Tooltip>
                Last Occurrence
              </b>
            </TableHeaderCell>
          </TableHeader>
          {({ item }) => (
            <TableRow>
              <TableRowCell
                className="mini-status"
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                <Badge type={BADGE_TYPES[STATUS_MAP[item.status]]}>
                  {STATUS_MAP[item.status]}
                </Badge>
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                <a
                  className="condition-name"
                  href={item.permalink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.name}
                </a>
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                {item.issueCount > 0 ? (
                  <Link target="_blank" to={issueFeed(item)}>
                    {item.issueCount}
                  </Link>
                ) : (
                  item.issueCount
                )}
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                {item.latestIssueTimestamp === 0
                  ? '-'
                  : formatTimestamp(item.latestIssueTimestamp)}
              </TableRowCell>
            </TableRow>
          )}
        </Table>
      </div>
    </>
  );
};

// <a href={item.permalink} target="_blank">{item.name}</a>

export default ConditionTable;
