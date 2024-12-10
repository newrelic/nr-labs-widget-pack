import React from 'react';
import { HeadingText, Spinner } from 'nr1';

const Summary = ({ data }) => {
  if (data !== null) {
    return (
      <div className="summary">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={`summary-item ${key}`}>
            <HeadingText
              key={key}
              style={{ fontSize: '20px' }}
              type={HeadingText.TYPE.HEADING_3}
            >
              {key}
            </HeadingText>
            <HeadingText
              style={{ fontSize: '56px', marginTop: '8px' }}
              type={HeadingText.TYPE.HEADING_1}
            >
              {value}
            </HeadingText>
          </div>
        ))}
      </div>
    );
  }

  return <Spinner />;
};

export default Summary;
