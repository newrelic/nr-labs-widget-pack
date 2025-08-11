import React from 'react';
import { Button, Icon } from 'nr1';
import dayjs from 'dayjs';

function setTimelineSymbol(incidentImpact) {
  switch (incidentImpact.toLowerCase()) {
    case 'unknown':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#464e4e"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__BROWSER}
        />
      );
    case 'none':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#464e4e"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_OK}
        />
      );
    case 'minor':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#9C5400"
          type={
            Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_WARNING
          }
        />
      );
    case 'major':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#BF0016"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_ERROR}
        />
      );
    case 'critical':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#ffffff"
          type={
            Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_DISABLED
          }
        />
      );
    case 'scheduled':
      return (
        <Icon
          className="timeline-item-symbol-icon"
          color="#3ca653"
          type={Icon.TYPE.DATE_AND_TIME__DATE_AND_TIME__TIME__A_REMOVE}
        />
      );
  }
}

const Incidents = ({ openDrilldown, incidentData, statusInput }) => {
  if (!incidentData || incidentData.length === 0) {
    return (
      <div className="no-incidents">
        <h4 className="no-incidents-header">No incident history</h4>
        <Button
          className="no-incidents-btn"
          iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__EXTERNAL_LINK}
          sizeType={Button.SIZE_TYPE.SMALL}
          to={statusInput}
          onClick={e => e.stopPropagation()}
        >
          Go to status page
        </Button>
      </div>
    );
  }

  const handleTileClick = i => {
    openDrilldown(i);
  };

  const first5Incidents = incidentData.slice(0, 5);
  const first5Items = first5Incidents.map((inc, i) => {
    return (
      <div
        className={`timeline-item impact-${inc.impact}`}
        key={`${inc.created_at}-${i}`}
        onClick={e => {
          handleTileClick(i);
          e.stopPropagation();
        }}
      >
        <div className="timeline-item-timestamp">
          <span className="timeline-timestamp-date">
            {dayjs(inc.created_at).format('MM/DD/YYYY')}
          </span>
          <span className="timeline-timestamp-time">
            {dayjs(inc.created_at).format('h:mm a')}
          </span>
        </div>
        <div className="timeline-item-dot" />
        <div className="timeline-item-body">
          <div className="timeline-item-body-header">
            <div
              className="timeline-item-symbol"
              title={`Impact: ${inc.impact}`}
            >
              {setTimelineSymbol(inc.impact)}
            </div>
            <div className="timeline-item-title">{inc ? inc.name : 'None'}</div>
          </div>
        </div>
      </div>
    );
  });

  return <div className="incident-timeline mini-timeline">{first5Items}</div>;
};

export default Incidents;
