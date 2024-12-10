import React from 'react';
import { AutoSizer } from 'nr1';
import ConditionSummary from './summary-widget';

function ConditionSummaryRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <ConditionSummary width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default ConditionSummaryRoot;
