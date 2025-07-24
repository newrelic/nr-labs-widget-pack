export const dashQuery = (accountId, nrql) => {
  return `
    {
        actor {
            account(id: ${accountId}) {
            nrql(
                query: "${nrql}"
                timeout: 120
            ) {
                results
            }
            }
        }
    }
    `;
};

export const dashEntityQuery = (accountId, cursor) => {
  return `
        {
        actor {
        entitySearch(query: "type='DASHBOARD' and tags.accountId='${accountId}'") {
            count
            query
            results${cursor ? `(cursor: "${cursor}")` : ''} {
            entities {
                ... on DashboardEntityOutline {
                guid
                name
                accountId
                }
            }
            nextCursor
            }
        }
        }
    }
    `;
};

export const determineDashboardKeyIndex = (q, dashboardKey) => {
  let targetIndex = -1;

  if (q.includes('facet')) {
    const regex = /facet\s+(.*?)(?:\s+LIMIT|\s+SINCE|\s+UNTIL|$)/i;
    const match = q.match(regex);
    if (match && match[1]) {
      const facetValuesString = match[1];
      const facetValuesArray = facetValuesString.split(',');

      targetIndex = facetValuesArray.map(v => v.trim()).indexOf(dashboardKey);
    }

    return targetIndex;
  }
};

export const mergeData = (
  index,
  dashKey,
  query,
  nrqlResults,
  entityResults
) => {
  let final = [];
  const entityLookup = new Map(entityResults.map(e => [e.guid, e.name]));
  if (index === -1) {
    final = mergeNonFacetedData(nrqlResults, entityLookup, dashKey);
  } else {
    const facetMerged = mergeFacetedData(nrqlResults, entityLookup, index);
    final = formatFacetData(facetMerged, query);
  }

  return final;
};

const formatFacetData = (facetData, query) => {
  const regex = /facet\s+(.*?)(?:\s+LIMIT|\s+SINCE|\s+UNTIL|$)/i;
  const match = query.match(regex);

  if (match && match[1]) {
    const facetValuesString = match[1];
    const facetValuesArray = facetValuesString.split(',');

    const trimmedKeys = facetValuesArray.map(k => k.trim());

    return facetData.map(d => {
      const { facet, ...rest } = d;
      const newObj = { ...rest };

      if (Array.isArray(facet)) {
        for (let i = 0; i < trimmedKeys.length; i++) {
          newObj[trimmedKeys[i]] = facet[i];
        }
        newObj.name = facet[facet.length - 1];
      } else if (trimmedKeys.length > 0) {
        newObj[trimmedKeys[0]] = facet;
      }
      return newObj;
    });
  }

  return [];
};

const mergeFacetedData = (nrqlResults, lookup, index) => {
  let guidToMatch;
  for (const item of nrqlResults) {
    if (Array.isArray(item.facet)) {
      guidToMatch = item.facet[index];
    } else {
      guidToMatch = item.facet;
    }

    if (guidToMatch && lookup.has(guidToMatch)) {
      const name = lookup.get(guidToMatch);
      if (Array.isArray(item.facet)) {
        if (!item.facet.includes(name)) {
          item.facet.push(name);
        }
      } else {
        item.name = name;
      }
    }
  }

  return nrqlResults;
};

const mergeNonFacetedData = (nrqlResults, lookup, dashKey) => {
  for (const item of nrqlResults) {
    if (lookup.has(item[dashKey])) {
      item.name = lookup.get(item[dashKey]);
    }
  }

  return nrqlResults;
};
