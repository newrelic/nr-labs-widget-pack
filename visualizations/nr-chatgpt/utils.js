import React from 'react';
import { navigation, LineChart, BillboardChart } from 'nr1';

// assess the question and the response text, and decide whether or not we should generate a chart or load in chart builder
export const assessResponse = (setState, question, text) => {
  const extractedNRQL = extractNRQL(text);
  if (extractedNRQL) {
    setState({
      extractedNRQL,
      showChartBuilderButton: true,
      chartType: text.toLowerCase().includes('timeseries')
        ? 'line'
        : 'billboard'
    });
  }
};

// attempt to extract a NRQL query if available
export const extractNRQL = text => {
  const lowerText = (text || '').toLowerCase();

  if (lowerText.includes('select') && lowerText.includes('from')) {
    const selectIndex = lowerText.indexOf('select');
    const fromIndex = lowerText.indexOf('from');

    if (selectIndex < fromIndex) {
      return text.substring(selectIndex).trim();
    } else if (fromIndex < selectIndex) {
      return text.substring(fromIndex).trim();
    } else {
      return text.trim();
    }
  }
};

export const openChartBuilder = ({ query, accountId }) => {
  const nerdlet = {
    id: 'data-exploration.query-builder',
    urlState: {
      initialActiveInterface: 'nrqlEditor',
      initialAccountId: accountId,
      initialNrqlValue: query,
      isViewingQuery: true
    }
  };
  navigation.openStackedNerdlet(nerdlet);
};

export const renderChart = (
  query,
  accountId,
  chartType,
  maxHeight,
  maxWidth
) => {
  switch (chartType) {
    case 'line':
      return (
        <LineChart
          fullHeight={!maxHeight}
          height={maxHeight || undefined}
          fullWidth={!maxWidth}
          width={maxWidth || undefined}
          accountIds={[accountId]}
          query={query}
        />
      );
    case 'billboard':
      return (
        <BillboardChart
          fullHeight={!maxHeight}
          height={maxHeight || undefined}
          fullWidth={!maxWidth}
          width={maxWidth || undefined}
          accountIds={[accountId]}
          query={query}
        />
      );
    default:
      return (
        <BillboardChart
          fullHeight={!maxHeight}
          height={maxHeight || undefined}
          fullWidth={!maxWidth}
          width={maxWidth || undefined}
          accountIds={[accountId]}
          query={query}
        />
      );
  }
};
