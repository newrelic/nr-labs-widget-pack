import React from 'react';
import { Card } from 'nr1';

const StatusTable = ({
  tableData,
  criticalThreshold,
  healthyThreshold,
  tableTitle,
  unit
}) => {
  return (
    <Card style={{ paddingTop: '16px' }}>
      <p className="table-title">{tableTitle}</p>
      <hr className="table-hr" />
      <div className="table-row">
        <div className="table-score">
          <p className="good-text">Good</p>
          <p>{`(<= ${healthyThreshold}${unit})`}</p>
        </div>
        <p className="percent-text">{tableData.healthy}%</p>
      </div>
      <div className="table-row">
        <div className="table-score">
          <p className="warning-text">Needs Improvement</p>
          <p>{`(${healthyThreshold}${unit} - ${criticalThreshold}${unit})`}</p>
        </div>
        <p className="percent-text">{tableData.warning}%</p>
      </div>
      <div className="table-row">
        <div className="table-score">
          <p className="critical-text">Poor</p>
          <p>{`(> ${criticalThreshold}${unit})`}</p>
        </div>
        <p className="percent-text">{tableData.critical}%</p>
      </div>
    </Card>
  );
};

export default StatusTable;
