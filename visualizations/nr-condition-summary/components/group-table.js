import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  HeadingText,
  Icon,
  Link,
  Modal,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip
} from 'nr1';
import { formatTimestamp, getTooltip } from '../utils';

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
  unhealthyTotal: 1,
  name: 2,
  lastOccurrence: 3
};

const GroupTable = ({
  data,
  searchText,
  selectedGroupKey,
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
  const [selectedGroup, setSelectedGroup] = useState(null);

  const alertingOnly = showAlertingOnly
    ? data.filter(group => {
        return group.worstStatus > 2;
      })
    : data;

  const filteredGroups = alertingOnly.filter(g => {
    return g.groupName.toLowerCase().includes(searchText.toLowerCase());
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

  const renderModalContent = useMemo(() => {
    if (selectedGroup === null) {
      return '';
    }

    return (
      <>
        <HeadingText
          type={HeadingText.TYPE.HEADING_2}
        >{`${selectedGroupKey}: ${selectedGroup.groupName}`}</HeadingText>
        <div className="drilldown-table">
          <Table items={selectedGroup.conditions}>
            <TableHeader>
              <TableHeaderCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.LEFT}
                value={({ item }) => item.status}
                sortingOrder={DEFAULT_COLUMN_PRIORITY.status}
                sortingType={
                  column === DEFAULT_COLUMN_PRIORITY.status
                    ? sortingType
                    : TableHeaderCell.SORTING_TYPE.NONE
                }
              >
                Status
              </TableHeaderCell>
              <TableHeaderCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.LEFT}
                value={({ item }) => item.name}
              >
                Condition Name
              </TableHeaderCell>
            </TableHeader>
            {({ item }) => (
              <TableRow>
                <TableRowCell>
                  <Badge type={BADGE_TYPES[STATUS_MAP[item.status]]}>
                    {STATUS_MAP[item.status]}
                  </Badge>
                </TableRowCell>
                <TableRowCell>
                  <a
                    className="modal-condition-name"
                    href={item.permalink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.name}
                  </a>
                </TableRowCell>
              </TableRow>
            )}
          </Table>
        </div>
      </>
    );
  }, [data, selectedGroup]);

  return (
    <>
      <Modal
        hidden={selectedGroup === null}
        onClose={() => setSelectedGroup(null)}
      >
        {renderModalContent}
      </Modal>
      <div className="condition-table">
        <Table compact height="300px" items={filteredGroups}>
          <TableHeader>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              value={({ item }) => item.worstStatus}
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
              width="10%"
              value={({ item }) => item.groupName}
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
              <b>Group Name</b>
            </TableHeaderCell>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              width="5%"
              value={({ item }) => item.unhealthyTotal}
              sortable
              sortingOrder={DEFAULT_COLUMN_PRIORITY.unhealthyTotal}
              sortingType={
                column === DEFAULT_COLUMN_PRIORITY.unhealthyTotal
                  ? sortingType
                  : TableHeaderCell.SORTING_TYPE.NONE
              }
              onClick={(evt, data) =>
                _onClickHeader(DEFAULT_COLUMN_PRIORITY.unhealthyTotal, data)
              }
            >
              <b>
                <Tooltip
                  text={getTooltip('Group', 'count')}
                  placementType={Tooltip.PLACEMENT_TYPE.LEFT}
                >
                  <Icon
                    style={{ marginRight: '2px' }}
                    type={Icon.TYPE.INTERFACE__INFO__HELP}
                  />
                </Tooltip>
                Condition Status Counts
              </b>
            </TableHeaderCell>
            <TableHeaderCell
              alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              width="5%"
              value={({ item }) => item.lastOccurrence}
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
                <Badge type={BADGE_TYPES[STATUS_MAP[item.worstStatus]]}>
                  {STATUS_MAP[item.worstStatus]}
                </Badge>
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                <Link onClick={() => setSelectedGroup(item)}>
                  {item.groupName}
                </Link>
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                {Object.entries(item.groupStatusCounts)
                  .sort(([keyA], [keyB]) => Number(keyB) - Number(keyA))
                  .map(([key, value]) => (
                    <Badge
                      key={key}
                      style={{ margin: '2px' }}
                      type={BADGE_TYPES[STATUS_MAP[key]]}
                    >
                      {value}
                    </Badge>
                  ))}
              </TableRowCell>
              <TableRowCell
                alignmentType={TableHeaderCell.ALIGNMENT_TYPE.CENTER}
              >
                {item.lastOccurrence === 0
                  ? '-'
                  : formatTimestamp(item.lastOccurrence)}
              </TableRowCell>
            </TableRow>
          )}
        </Table>
      </div>
    </>
  );
};

// {item.name.length > 25 ? `${item.name.substring(0, 25)}...` : item.name}

export default GroupTable;
