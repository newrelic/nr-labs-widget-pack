import React from 'react';
import { HeadingText, Icon } from 'nr1';

const Bar = ({ billboardGauge, tableData, unit }) => {
  const offsets = {
    offset1: Number(tableData.healthy) / 100,
    offset2: Number(tableData.warning) / 100,
    offset3: Number(tableData.critical) / 100
  };

  return (
    <div className="status-bar">
      <div className="status-bar-value">
        <HeadingText
          className="status-bar-gauge"
          type={HeadingText.TYPE.HEADING_4}
        >
          {billboardGauge}
          {unit}
        </HeadingText>
        <Icon
          type={Icon.TYPE.INTERFACE__CARET__CARET_BOTTOM__WEIGHT_BOLD__SIZE_8}
        />
      </div>
      <div className="status-bar-lines">
        <span style={{ flexGrow: `${offsets.offset1}` }}>
          <div className="good-line" />
        </span>
        <span style={{ flexGrow: `${offsets.offset2}` }}>
          <div className="warning-line" />
        </span>
        <span style={{ flexGrow: `${offsets.offset3}` }}>
          <div className="critical-line" />
        </span>
      </div>
    </div>
  );
};

export default Bar;
