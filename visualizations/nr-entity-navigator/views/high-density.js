import React from 'react';
import EntityWidget from '../entity';
import ToolTip from '../tooltip';

const HighDensity = ({ entities, totalCount, showAlertingOnly }) => {
  const MAX_ENTITIES = 500;
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
    <div className="small-container">
      {displayedEntities.map((e, i) => (
        <ToolTip
          key={i}
          entityGuid={e.guid}
          triggerElement={
            <EntityWidget
              key={i}
              status={e.alertSeverity}
              permalink={e.permalink}
              entityName={e.name}
              dataMode={false}
            />
          }
        />
      ))}
      {remainingCount <= 0 ? (
        ''
      ) : (
        <p className="small-remaining-entities">{remainingCount} more</p>
      )}
    </div>
  );
};

export default HighDensity;
