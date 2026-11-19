import React from 'react';
import { AutoSizer } from 'nr1';
import FlowChart from './flow-chart';

function FlowChartRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <FlowChart width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default FlowChartRoot;
