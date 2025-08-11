import React from 'react';
import { Icon, Link } from 'nr1';

const Summary = ({ openDrilldown, summaryData }) => {
  return (
    <div className="current-status">
      {summaryData.link ? (
        <h5 className="current-status-heading">
          <Link to={summaryData.link}>See status page</Link>
        </h5>
      ) : (
        <h5
          onClick={() => openDrilldown(-1)}
          className={`current-status-heading status-${summaryData.indicator}`}
        >
          {summaryData.indicator?.toLowerCase() === 'unknown' && (
            <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
          )}
          {summaryData.indicator?.toLowerCase() === 'none' && (
            <Icon type={Icon.TYPE.INTERFACE__SIGN__CHECKMARK} />
          )}
          {summaryData.indicator?.toLowerCase() === 'minor' && (
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0)">
                <path
                  d="M8.14625 3.05583L1.44083 14.25C1.30258 14.4894 1.22943 14.7609 1.22866 15.0373C1.22789 15.3138 1.29951 15.5856 1.43642 15.8258C1.57333 16.066 1.77074 16.2662 2.00902 16.4064C2.2473 16.5466 2.51813 16.622 2.79458 16.625H16.2054C16.4819 16.622 16.7527 16.5466 16.991 16.4064C17.2293 16.2662 17.4267 16.066 17.5636 15.8258C17.7005 15.5856 17.7721 15.3138 17.7713 15.0373C17.7706 14.7609 17.6974 14.4894 17.5592 14.25L10.8538 3.05583C10.7126 2.82316 10.5139 2.6308 10.2768 2.49729C10.0397 2.36379 9.77213 2.29366 9.5 2.29366C9.22788 2.29366 8.96035 2.36379 8.72322 2.49729C8.4861 2.6308 8.28738 2.82316 8.14625 3.05583V3.05583Z"
                  stroke="#733E00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 7.125V10.2917"
                  stroke="#733E00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 13.4583V13.7083"
                  stroke="#733E00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0">
                  <rect width="19" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          )}
          {summaryData.indicator?.toLowerCase() === 'major' && (
            <Icon type={Icon.TYPE.INTERFACE__SIGN__CLOSE} />
          )}
          {summaryData.indicator?.toLowerCase() === 'critical' && (
            <Icon type={Icon.TYPE.INTERFACE__SIGN__CLOSE} />
          )}
          {summaryData.description}
        </h5>
      )}
    </div>
  );
};

export default Summary;
