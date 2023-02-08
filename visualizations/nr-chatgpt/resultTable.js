import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  TextField
} from 'nr1';

export function ResultTable(props) {
  const { userHistory, deleteUserResult, setState, width } = props;
  const [search, setSearch] = useState('');

  const filteredHistory = userHistory.filter(
    u =>
      u.document.r.toLowerCase().includes(search) ||
      u.document.q.toLowerCase().includes(search)
  );

  return (
    <>
      <TextField
        type={TextField.TYPE.SEARCH}
        style={{ width: width - 60, marginTop: '5px' }}
        placeholder="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <Table items={filteredHistory}>
        <TableHeader>
          <TableHeaderCell value={({ item }) => item.document.d} width="20%">
            Date
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item.document.q}>
            Question
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item.document.r}>
            Response
          </TableHeaderCell>
        </TableHeader>

        {({ item }) => (
          <TableRow
            actions={[
              {
                label: 'View',
                onClick: (evt, { item }) => {
                  setState({ selectedDocument: item });
                }
              },
              {
                label: 'Delete',
                type: TableRow.ACTION_TYPE.DESTRUCTIVE,
                onClick: (evt, { item }) => {
                  deleteUserResult(item.id);
                }
              }
            ]}
          >
            <TableRowCell>
              {new Date(item.document.d).toLocaleString()}
            </TableRowCell>
            <TableRowCell>{item.document.q}</TableRowCell>
            <TableRowCell>{item.document.r}</TableRowCell>
          </TableRow>
        )}
      </Table>
    </>
  );
}
