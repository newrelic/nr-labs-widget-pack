export const pluckTagValue = (tags, keyToPluck) => {
  const result = tags.find(t => t.key === keyToPluck);
  return result ? result.values[0] : null;
};

export const fetchEntityQuery = (cursor, type, filter) => {
  return `
      {
          actor {
          entitySearch(query: "(type='${type}')${
    filter ? ` and ${filter}` : ''
  }") {
              results${cursor ? `(cursor: "${cursor}")` : ''} {
              entities {
                  permalink
                  name
                  guid
                  type
                  tags {
                  key
                  values
                  }
              }
              nextCursor
              }
          }
          }
      }
      `;
};

const determineMttd = (startTime, ackTime) => {
  let mttd = (Date.now() - startTime) / 60000;

  if (!Number.isNaN(ackTime)) {
    mttd = (ackTime - startTime) / 60000;
  }

  return parseInt(mttd.toFixed(0));
};

export const constructTable = issues => {
  const table = [];

  issues.forEach(i => {
    const issueId = pluckTagValue(i.tags, 'issueId');
    const accountId = pluckTagValue(i.tags, 'accountId');
    const relatedEntityName = pluckTagValue(i.tags, 'relatedEntityName');
    const conditionName = pluckTagValue(i.tags, 'conditionName');
    const conditionId = pluckTagValue(i.tags, 'conditionId');
    const activatedAt = parseInt(pluckTagValue(i.tags, 'activatedAt'));
    const acknowledgedAtEvent = parseInt(
      pluckTagValue(i.tags, 'acknowledgedAt')
    );
    const issueMttd = determineMttd(activatedAt, acknowledgedAtEvent);

    const acknowledged = Number.isNaN(acknowledgedAtEvent) ? 'false' : 'true';

    table.push({
      issueId,
      accountId,
      relatedEntityName,
      conditionName,
      conditionId,
      activatedAt,
      acknowledged,
      issueMttd
    });
  });

  return table;
};
