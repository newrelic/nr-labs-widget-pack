import { navigation } from 'nr1';

export const pluckTagValue = (tags, keyToPluck) => {
  const result = tags.find(t => t.key === keyToPluck);
  return result ? result.values[0] : null;
};

export const formatTimestamp = timestamp => {
  const date = new Date(timestamp);

  const options = {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  return date.toLocaleString('en-US', options);
};

export const issueFeed = condition => {
  const thirtyDaysAgo = Date.now() - 2592000000;
  const conditionId = pluckTagValue(condition.tags, 'id');
  const accountId = pluckTagValue(condition.tags, 'accountId');

  const issueLauncher = navigation.getOpenLauncherLocation({
    id: 'alerts-ai.launcher',
    nerdlet: {
      id: 'alerts-ai.feed',
      urlState: {
        accountId: Number(accountId),
        filters: {
          condition: conditionId,
          startDate: thirtyDaysAgo,
          state: ['active']
        },
        nav: 'AI feed/internal issues'
      }
    }
  });

  return issueLauncher;
};

export const getTooltip = (mode, header) => {
  let text = '';
  switch (header) {
    case 'status':
      text = 'The worst status of a condition or group';
      break;
    case 'count':
      if (mode === 'None') {
        text = 'The count of active issues for the condition (since 30 days ago)';
      } else {
        text = 'The total number of conditions under each status';
      }
      break;
    case 'timestamp':
      text =
        'The last timestamp when an issue was opened for the condition or group';
      break;
  }
  return text;
};

export const determineGroupOptions = conditions => {
  const EXCLUDED_KEYS = ['trustedAccountId', 'id', 'nr.slAlert'];

  const uniqueGroups = Array.from(
    new Set(conditions.flatMap(c => c.tags.map(tag => tag.key)))
  ).filter(key => !EXCLUDED_KEYS.includes(key));
  uniqueGroups.unshift('None');

  return uniqueGroups;
};

export const groupConditions = (groupAttribute, conditions) => {
  const groupedEntities = {};

  conditions.forEach(cond => {
    let tagValue = pluckTagValue(cond.tags, groupAttribute);

    if (!tagValue) {
      tagValue = 'uncategorized';
    }

    if (!groupedEntities[tagValue]) {
      groupedEntities[tagValue] = {
        groupName: tagValue,
        conditions: [],
        worstStatus: 0,
        lastOccurrence: 0,
        groupStatusCounts: {}
      };
    }

    const group = groupedEntities[tagValue];
    group.conditions.push(cond);

    if (cond.status > group.worstStatus) {
      group.worstStatus = cond.status;
    }

    if (cond.latestIssueTimestamp > group.lastOccurrence) {
      group.lastOccurrence = cond.latestIssueTimestamp;
    }

    if (!group.groupStatusCounts[cond.status]) {
      group.groupStatusCounts[cond.status] = 0;
    }

    group.groupStatusCounts[cond.status]++;

    group.unhealthyTotal = Object.entries(group.groupStatusCounts)
      // eslint-disable-next-line
      .filter(([key, val]) => key === '3' || key === '4')
      // eslint-disable-next-line
      .reduce((sum, [key, val]) => sum + val, 0);
  });

  return Object.values(groupedEntities);
};

export const fetchEntityQuery = (cursor, type, filter) => {
  return `
      {
        actor {
          entitySearch(query: "(domain='AIOPS' and type='${type}')${
    filter ? ` and ${filter}` : ''
  }") {
            results${cursor ? `(cursor: "${cursor}")` : ''} {
              entities {
                permalink
                name
                guid
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

export const mergeData = (conditions, issues) => {
  const STATUS_PRIORITY = {
    Critical: 4,
    High: 3,
    Healthy: 2,
    Disabled: 1
  };

  const conditionCopy = [...conditions];
  const summaryCounts = { Critical: 0, High: 0, Healthy: 0, Disabled: 0 };

  for (const c of conditionCopy) {
    const conditionId = pluckTagValue(c.tags, 'id');
    const conditionEnabled = pluckTagValue(c.tags, 'enabled');

    const associatedIssues = issues.filter(i => {
      const issueCondId = pluckTagValue(i.tags, 'conditionId');
      return issueCondId === conditionId;
    });

    if (associatedIssues.length === 0) {
      if (conditionEnabled === 'true') {
        c.status = STATUS_PRIORITY.Healthy;
        summaryCounts.Healthy += 1;
      } else {
        c.status = STATUS_PRIORITY.Disabled;
        summaryCounts.Disabled += 1;
      }
    }

    if (associatedIssues.length > 0) {
      const criticalCount = associatedIssues.filter(i => {
        return pluckTagValue(i.tags, 'priority') === 'CRITICAL';
      }).length;
      const highCount = associatedIssues.filter(i => {
        return pluckTagValue(i.tags, 'priority') === 'HIGH';
      }).length;

      const timestamps = associatedIssues.map(i => {
        return pluckTagValue(i.tags, 'activatedAt');
      });

      c.latestIssueTimestamp = Math.max(...timestamps.map(Number));

      if (highCount > 0) {
        summaryCounts.High += 1;
        c.status = STATUS_PRIORITY.High;
      }

      if (criticalCount > 0) {
        summaryCounts.Critical += 1;
        c.status = STATUS_PRIORITY.Critical;
      }
    } else {
      c.latestIssueTimestamp = 0;
    }

    c.issues = associatedIssues;
    c.issueCount = associatedIssues.length;
  }
  return { summary: summaryCounts, conditions: conditionCopy };
};
