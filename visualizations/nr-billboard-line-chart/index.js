import React from 'react';
import { AutoSizer } from 'nr1';
import BillboardLineChart from './main';

function BillboardLinedRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <BillboardLineChart width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default BillboardLinedRoot;
