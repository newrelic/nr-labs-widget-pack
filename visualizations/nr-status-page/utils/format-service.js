import { getProvider } from './provider-services';

export const uniformSummaryData = (provider, data) => {
  const p = getProvider(provider);
  return p.summaryFormatter(data);
};

export const uniformIncidentData = (provider, data) => {
  const p = getProvider(provider);
  return p.incidentFormatter(data);
};
