import React from 'react';
import { THRESHOLD_LABELS } from '../constants';
import { HeadingText } from 'nr1';

const Billboard = ({ billboardGauge, threshold, unit }) => {
  return (
    <div className="billboard">
      <HeadingText className="gauge" type={HeadingText.TYPE.HEADING_1}>
        {billboardGauge}
        {unit}
      </HeadingText>
      <HeadingText
        className={`threshold ${threshold}`}
        type={HeadingText.TYPE.HEADING_2}
      >
        {THRESHOLD_LABELS[threshold]}
      </HeadingText>
    </div>
  );
};

export default Billboard;
