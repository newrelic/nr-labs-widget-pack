import { NrqlQuery } from 'nr1';
import async from 'async';

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

const generateAckMap = issues => {
  const ackMap = new Map();
  const final = [];

  issues.forEach(issue => {
    const accountId = pluckTagValue(issue.tags, 'accountId');
    const issueId = pluckTagValue(issue.tags, 'issueId');

    if (accountId && issueId) {
      if (!ackMap.has(accountId)) {
        ackMap.set(accountId, []);
      }
      ackMap.get(accountId).push(issueId);
    }
  });

  ackMap.forEach((issueIds, accountId) => {
    final.push({
      accountId: parseInt(accountId),
      issueIds: Array.from(new Set(issueIds))
    });
  });

  return final;
};

export const fetchAckEvents = async issues => {
  const acks = [];

  const issuesWithNoAckEvent = issues.filter(i => {
    const ackValue = pluckTagValue(i.tags, 'acknowledgedAt');
    return ackValue === null;
  });

  if (issuesWithNoAckEvent.length > 0) {
    const ackQ = async.queue(async (task, cb) => {
      const { data, error } = await NrqlQuery.query({
        query: `FROM NrAiIssue SELECT latest(acknowledgeTime) as 'ackTime' where event = 'acknowledge' and issueId in ${task.filter} facet issueId since 1 week ago LIMIT MAX`,
        accountIds: [task.account],
        formatType: NrqlQuery.FORMAT_TYPE.RAW
      });

      if (error) {
        console.debug(error); // eslint-disable-line
      }

      if (data) {
        if (data.facets.length > 0) {
          data.facets.forEach(f => {
            acks.push({
              issueId: f.name,
              acknowledgedAt: f.results[0]?.latest
            });
          });
        }
      }

      cb();
    }, 25);

    const acknowledgeMap = await generateAckMap(issuesWithNoAckEvent);
    acknowledgeMap.forEach(obj => {
      const filter = `(${obj.issueIds.map(id => `'${id}'`).join(',')})`;
      const account = obj.accountId;
      ackQ.push({ account, filter });
    });

    await ackQ.drain();
  }

  return acks;
};

const determineMttd = (startTime, ackTime) => {
  let mttd = (Date.now() - startTime) / 60000;

  if (ackTime) {
    mttd = (ackTime - startTime) / 60000;
  }

  return parseInt(mttd.toFixed(0));
};

export const constructTable = (issues, ackData) => {
  const table = [];
  const idSet = new Set(ackData.map(a => a.issueId));
  const ackMap = ackData.reduce((map, ack) => {
    map[ack.issueId] = ack.acknowledgedAt;
    return map;
  }, {});

  issues.forEach(i => {
    const issueId = pluckTagValue(i.tags, 'issueId');
    const accountId = pluckTagValue(i.tags, 'accountId');
    const relatedEntityName = pluckTagValue(i.tags, 'relatedEntityName');
    const conditionName = pluckTagValue(i.tags, 'conditionName');
    const conditionId = pluckTagValue(i.tags, 'conditionId');
    const activatedAt = parseInt(pluckTagValue(i.tags, 'activatedAt'));
    const acknowledgedAt = idSet.has(issueId) ? ackMap[issueId] : null;
    const issueMttd = determineMttd(activatedAt, acknowledgedAt);

    table.push({
      issueId,
      accountId,
      relatedEntityName,
      conditionName,
      conditionId,
      activatedAt,
      acknowledgedAt,
      issueMttd
    });
  });

  return table;
};
