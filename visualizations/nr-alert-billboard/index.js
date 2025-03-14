import React from 'react';
import { AutoSizer } from 'nr1';
import AlertBillboard from './alert-billboard';

function AlertBillboardRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <AlertBillboard width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default AlertBillboardRoot;
