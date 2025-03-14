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

export const fetchEntityCountQuery = filter => {
  return `
    {
        actor {
            entitySearch(
            query: "domain='AIOPS' and type='ISSUE'${
              filter ? ` and ${filter}` : ''
            }"
            ) {
            counts(facet: TYPE) {
                count
                facet
            }
            }
        }
    }   
    `;
};

export const generateConditionMap = conds => {
  const accountMap = new Map();
  const final = [];

  conds.forEach(c => {
    const accountId = pluckTagValue(c.tags, 'accountId');
    const conditionId = pluckTagValue(c.tags, 'id');

    if (accountId && conditionId) {
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, []);
      }
      accountMap.get(accountId).push(conditionId);
    }
  });

  accountMap.forEach((conditionIds, accountId) => {
    final.push({
      accountId: parseInt(accountId),
      conditionIds: Array.from(new Set(conditionIds))
    });
  });

  return final;
};

export const fetchTimestampsQuery = (filter, type, timeRange) => {
  let nrql = `FROM NrAiIncident SELECT count(*) where event = 'open' and conditionId in ${filter} ${timeRange ||
    'since 1 day ago'} TIMESERIES AUTO`;
  if (type) {
    nrql = `FROM NrAiIncident SELECT count(*) where event = 'open' and conditionId in ${filter} and entity.type = '${type}' ${timeRange ||
      'since 1 day ago'} TIMESERIES AUTO`;
  }

  return nrql;
};

export const determineIssueCountByEntityType = (issues, entities) => {
  const guidSet = new Set(entities.map(e => e.guid));

  const issueCount = issues.filter(i => {
    const relatedEntity = pluckTagValue(i.tags, 'relatedEntityId');
    if (relatedEntity) {
      return guidSet.has(relatedEntity);
    }
    return false;
  });

  return issueCount.length;
};

export const formatTimeseries = (timeData, chartlineColor) => {
  const timestampMap = new Map();

  const sparkLine = [
    {
      metadata: {
        id: `alert-trend`,
        name: 'Alert Trend',
        color: chartlineColor || 'red',
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: 'COUNT'
        }
      },
      data: []
    }
  ];

  Object.values(timeData).forEach(account => {
    account.forEach(timeseries => {
      const { x, y } = timeseries;
      if (timestampMap.has(x)) {
        timestampMap.set(x, timestampMap.get(x) + y);
      } else {
        timestampMap.set(x, y);
      }
    });
  });

  const final = Array.from(timestampMap.entries()).map(([x, y]) => ({ x, y }));

  sparkLine[0].data = final;

  return sparkLine;
};
