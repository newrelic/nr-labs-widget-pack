import React, { useEffect, useState } from 'react';
import { Icon, Modal, Button } from 'nr1';
import dayjs from 'dayjs';

function setTimelineSymbol(incidentImpact) {
  switch (incidentImpact.toLowerCase()) {
    case 'unknown':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#464e4e"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__BROWSER}
        />
      );
    case 'none':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#464e4e"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_OK}
        />
      );
    case 'minor':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#9C5400"
          type={
            Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_WARNING
          }
        />
      );
    case 'major':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#BF0016"
          type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_ERROR}
        />
      );
    case 'critical':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#ffffff"
          type={
            Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_DISABLED
          }
        />
      );
    case 'scheduled':
      return (
        <Icon
          className="drilldown-item-symbol-icon"
          color="#3ca653"
          type={Icon.TYPE.DATE_AND_TIME__DATE_AND_TIME__TIME__A_REMOVE}
        />
      );
  }
}

const IncidentDrilldown = ({ open, close, index, drilldownData }) => {
  const [expandItem, setExpandItem] = useState(-1);

  useEffect(() => {
    setExpandItem(index);
  }, [index]);

  if (!drilldownData || drilldownData.length === 0) {
    return (
      <Modal hidden={open} onClose={close}>
        <h2>No Incidents</h2>
      </Modal>
    );
  }

  const buildTimelineItemDetails = incident => {
    const incident_updates = incident.incident_updates.map(
      (incident_update, index) => {
        let body = (
          <span className="value">
            {incident_update.body
              ? incident_update.body
              : incident_update.description}
          </span>
        );
        if (incident_update.link_url) {
          body = (
            <a href={incident_update.link_url} target="_blank" rel="noreferrer">
              {incident_update.body}
            </a>
          );
        }
        return (
          <li
            key={`${incident_update.created_at}-${index}`}
            className="drilldown-item-contents-item"
          >
            <span className="key">
              {dayjs(incident_update.display_at).format('h:mm a')}:
            </span>
            {body}
          </li>
        );
      }
    );

    return incident_updates;
  };

  const handleTimelineItemClick = timelineItemId => {
    if (timelineItemId === expandItem) {
      setExpandItem(null);
    } else {
      setExpandItem(timelineItemId);
    }
  };

  const items = drilldownData.map((incident, incidentId) => {
    return (
      <div
        onClick={() => {
          handleTimelineItemClick(incidentId);
        }}
        className={`drilldown-item impact-${incident.impact} ${
          expandItem === incidentId ? 'drilldown-item-expanded' : ''
        }`}
        key={`${incident.created_at}-${incidentId}`}
      >
        <div className="drilldown-item-timestamp">
          <span className="drilldown-timestamp-date">
            {dayjs(incident.created_at).format('MM/DD/YYYY')}
          </span>
          <span className="drilldown-timestamp-time">
            {dayjs(incident.created_at).format('h:mm a')}
          </span>
        </div>
        <div className="drilldown-item-dot" />
        <div className="drilldown-item-body">
          <div className="drilldown-item-body-header">
            <div
              className="drilldown-item-symbol"
              title={`Impact: ${incident.impact}`}
            >
              {setTimelineSymbol(incident.impact)}
            </div>
            <div className="drilldown-item-title">
              {incident ? incident.name : 'None'}
            </div>
            <Button
              className="drilldown-item-dropdown-arrow"
              type={Button.TYPE.PLAIN}
              iconType={
                Button.ICON_TYPE.INTERFACE__CHEVRON__CHEVRON_BOTTOM__V_ALTERNATE
              }
            />
          </div>
          {expandItem === incidentId && (
            <div className="drilldown-item-contents-container">
              <ul className="drilldown-item-contents">
                {buildTimelineItemDetails(incident)}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  });

  return (
    <Modal hidden={open} onClose={close}>
      {items}
    </Modal>
  );
};

export default IncidentDrilldown;
