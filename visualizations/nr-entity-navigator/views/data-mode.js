import React from 'react';
import EntityWidget from '../entity';

const DataMode = ({ entities, displayCount, totalCount, showAlertingOnly }) => {
  const MAX_ENTITIES = displayCount || 10;
  const alertingOnlyEntities = showAlertingOnly
    ? entities.filter(
        e => e.alertSeverity === 'CRITICAL' || e.alertSeverity === 'WARNING'
      )
    : entities;
  const displayedEntities = alertingOnlyEntities.slice(0, MAX_ENTITIES);
  const remainingCount = showAlertingOnly
    ? totalCount - displayedEntities.length
    : totalCount - MAX_ENTITIES;

  return (
    <div className="large-container">
      {displayedEntities.map((e, i) => (
        <EntityWidget
          key={i}
          status={e.alertSeverity}
          permalink={e.permalink}
          entityName={e.name}
          goldenMetrics={e.goldenMetricsData}
          dataMode
        />
      ))}
      {remainingCount <= 0 ? (
        ''
      ) : (
        <EntityWidget
          key="last"
          status="unknown"
          permalink="remainderCount"
          entityName={`${remainingCount} more`}
          dataMode
        />
      )}
    </div>
  );
};

export default DataMode;
