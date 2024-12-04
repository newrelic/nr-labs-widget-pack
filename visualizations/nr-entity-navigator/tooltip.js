import React, { useEffect, useMemo, useState } from 'react';
import {
  HeadingText,
  NerdGraphQuery,
  Popover,
  PopoverBody,
  PopoverTrigger
} from 'nr1';

const entityStatusQuery = guid => {
  return `
  {
    actor {
      entity(guid: "${guid}") {
        account {
          name
        }
        type
        name
        guid
        alertSeverity
        recentAlertViolations {
          openedAt
          closedAt
          alertSeverity
        }
      }
    }
  }
  `;
};

const ALERT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  NOT_ALERTING: 'NOT_ALERTING',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  WARNING: 'WARNING'
};

const ToolTip = ({ entityGuid, triggerElement }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAndSetSignalData = async entityGuid => {
      const { data, error } = await NerdGraphQuery.query({
        query: entityStatusQuery(entityGuid)
      });
      if (error) {
        console.debug('Error fetching tooltip data: ', error); // eslint-disable-line
        return;
      }

      setData(data.actor?.entity);
    };

    if (entityGuid) {
      fetchAndSetSignalData(entityGuid);
    }
  }, [entityGuid]);

  const renderStatus = useMemo(() => {
    if (data) {
      if (data.alertSeverity === ALERT_SEVERITY.NOT_CONFIGURED) {
        return 'No alert conditions set up';
      }

      if (data.recentAlertViolations.length > 0) {
        const openOnlyViolations = data.recentAlertViolations.filter(
          a => a.closedAt == null
        );
        if (openOnlyViolations.length > 0) {
          return `${openOnlyViolations.length} incident(s) in progress`;
        }
      }
      return 'No alerts in progress';
    }
  }, [data]);

  return (
    <Popover openOnHover>
      <PopoverTrigger>{triggerElement}</PopoverTrigger>
      <PopoverBody>
        {data === null ? (
          ''
        ) : (
          <div className="EntityTooltip">
            <div className="EntityTooltipHeader">
              <div title={data.name} className="EntityTooltipHeader-titleBar">
                <HeadingText
                  tagType={HeadingText.TAG_TYPE.H4}
                  type={HeadingText.TYPE.HEADING_4}
                  className="EntityTooltipHeader-title"
                >
                  {data.name.length > 35
                    ? `${data.name.substring(0, 35)}...`
                    : data.name}
                </HeadingText>
              </div>
              <p className="EntityTypeAndAccountLabel">
                <span className="EntityTypeAndAccountLabel-type">
                  {data.type
                    .toLowerCase()
                    .split(/[\s_]+/)
                    .map((w, i) => {
                      if (i === 0)
                        return w.charAt(0).toUpperCase() + w.slice(1);
                      return w.charAt(0).toUpperCase() + w.slice(1);
                    })
                    .join(' ')}
                </span>
                <span className="EntityTypeAndAccountLabel-account">
                  {data.account.name}
                </span>
              </p>
            </div>
            <div className="EntityTooltipContent">{renderStatus}</div>
          </div>
        )}
      </PopoverBody>
    </Popover>
  );
};
export default ToolTip;
