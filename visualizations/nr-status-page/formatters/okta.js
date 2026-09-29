import { worstBy } from './impact-utils';

const isResolved = title => (title || '').toLowerCase().includes('resolved');

const mapImpact = title => {
  const t = (title || '').toLowerCase();
  if (t.includes('disruption')) return 'critical';
  return 'minor';
};

export const oktaFormatter = data => {
  const payload = data.data;
  const { title, link, items } = payload || {};
  const active = (items || []).filter(i => !isResolved(i.title));

  if (active.length === 0) {
    return {
      name: title || 'Okta',
      description: 'All Systems Operational',
      indicator: 'none',
      link
    };
  }

  const { impact: worst, entry: worstItem } = worstBy(active, item =>
    mapImpact(item.title)
  );

  return {
    name: title || 'Okta',
    description: worstItem.title,
    indicator: worst,
    link
  };
};

export const oktaIncidentFormatter = data => {
  const payload = data.data;
  const active = (payload?.items || []).filter(i => !isResolved(i.title));
  return active.map(incident => ({
    name: incident.title,
    created_at: incident.isoDate,
    impact: mapImpact(incident.title),
    incident_updates: [
      {
        created_at: incident.isoDate,
        display_at: incident.isoDate,
        body: incident.contentSnippet
      }
    ]
  }));
};
