import React from 'react';
import { AutoSizer } from 'nr1';
import DashboardAudit from './dash-audit';

function DashboardAuditRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <DashboardAudit width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default DashboardAuditRoot;
