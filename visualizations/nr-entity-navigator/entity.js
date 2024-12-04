import React from 'react';
import PropTypes from 'prop-types';

const STATUSES = {
  NOT_ALERTING: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
  NOT_CONFIGURED: 'unknown'
};

const UNITS = {
  PERCENTAGE: '%',
  REQUESTS_PER_MINUTE: 'rpm',
  MS: 'ms',
  SECONDS: 's',
  BYTES_PER_SECOND: 'bytes/s',
  COUNT: ''
};

const EntityWidget = ({
  status = STATUSES.NOT_CONFIGURED,
  permalink,
  entityName = '',
  goldenMetrics = [],
  dataMode = false
}) => {
  const statusClass = STATUSES[status] || STATUSES.NOT_CONFIGURED;

  if (dataMode) {
    if (permalink === 'remainderCount') {
      return (
        <div className="status-icon-large unknown">
          <p className="entity-name last">
            <b>{entityName}</b>
          </p>
        </div>
      );
    }

    return (
      <div
        className={`status-icon-large ${statusClass} clickable`}
        onClick={() => window.open(permalink, '_blank')}
      >
        <p title={entityName} className="entity-name entity">
          <b>{entityName}</b>
        </p>
        {goldenMetrics && goldenMetrics.length > 0
          ? goldenMetrics.map((m, i) => {
              const [metricKey, metricValue] =
                Object.entries(m).find(([key]) => key !== 'unit') || [];
              let parsedValue;
              if (typeof metricValue === 'object' && metricValue !== null) {
                const [key, value] = Object.entries(metricValue)[0]; // eslint-disable-line
                parsedValue = value.toFixed(2);
              } else {
                parsedValue = !metricValue ? 0 : metricValue.toFixed(2);
              }

              return (
                <div className="golden-metric" key={`${i}-${metricKey}`}>
                  <p className="golden-metric-key">{m.title}</p>
                  <p className="golden-metric-value">
                    {parsedValue} {UNITS[m.unit] || ''}
                  </p>
                </div>
              );
            })
          : ''}
      </div>
    );
  }

  return (
    <div
      className={`status-icon-small ${statusClass}`}
      onClick={() => window.open(permalink, '_blank')}
    />
  );
};

EntityWidget.propTypes = {
  status: PropTypes.oneOf(Object.values(STATUSES)),
  permalink: PropTypes.string,
  entityName: PropTypes.string,
  goldenMetrics: PropTypes.array,
  dataMode: PropTypes.bool
};

EntityWidget.STATUSES = STATUSES;

export default EntityWidget;
