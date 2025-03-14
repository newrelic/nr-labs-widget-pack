import React from 'react';
import { AutoSizer } from 'nr1';
import AlertTable from './alert-table';

function AlertTableRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <AlertTable width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default AlertTableRoot;
