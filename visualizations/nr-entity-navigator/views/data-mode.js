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

  const domainGoldenSignalLength =
    displayedEntities[0]?.goldenMetricsData?.length || 0;

  return (
    <div className="status-icons-wrapper">
      <div className="status-icons-container-large">
        {displayedEntities.map((e, i) => (
          <EntityWidget
            key={i}
            status={e.alertSeverity}
            permalink={e.permalink}
            entityName={e.name}
            goldenMetrics={e.goldenMetricsData}
            goldenMetricLength={e.goldenMetricsData?.length || 0}
            dataMode
          />
        ))}
        {remainingCount <= 0 ? (
          ''
        ) : (
          <EntityWidget
            key="last"
            status="NOT_CONFIGURED"
            permalink="remainderCount"
            entityName={`${remainingCount} more`}
            goldenMetricLength={domainGoldenSignalLength}
            dataMode
          />
        )}
      </div>
    </div>
  );
};

export default DataMode;
