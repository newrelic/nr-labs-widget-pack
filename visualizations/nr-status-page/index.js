import React from 'react';
import { AutoSizer } from 'nr1';
import StatusPage from './status-page';

function StatusPageRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <StatusPage width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default StatusPageRoot;
