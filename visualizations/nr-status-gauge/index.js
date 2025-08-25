import React from 'react';
import { AutoSizer } from 'nr1';
import StatusBillboard from './main';

function StatusBillboardRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <StatusBillboard width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default StatusBillboardRoot;
