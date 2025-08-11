export const rssFormatter = data => {
  const statusCode = 'Unknown';

  return {
    name: data.data.title,
    description: data.data.description,
    indicator: statusCode,
    link: data.data.link
  };
};

export const rssIncidentFormatter = data => {
  return data.data.items.map(incident => {
    const incident_updates = [];

    incident_updates.push({
      created_at: incident.isoDate,
      body: `Link: ${incident.link}`
    });

    incident_updates.push({
      created_at: incident.isoDate,
      body: `Description: ${incident.contentSnippet}`
    });

    return {
      name: incident.title,
      created_at: incident.isoDate,
      impact: 'unknown',
      incident_updates
    };
  });
};
