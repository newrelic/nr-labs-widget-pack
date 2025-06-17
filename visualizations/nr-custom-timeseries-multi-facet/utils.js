import { NrqlQuery } from 'nr1';

export const facetHasMoreThanOneValue = q => {
  const facetRegex = /facet\s+([\w,]+)/i;
  const match = q.match(facetRegex);

  if (match) {
    const facets = match[1].split(',').map(facet => facet.trim());
    if (facets.length === 1) {
      return false;
    }
  }

  return true;
};

function replaceValues(q, newFacet, newLimit, seriesTitle) {
  const facetRegex = /facet\s+\S+/i;
  const limitRegex = /limit\s+\S+/i;
  const selectFunctionRegex = /SELECT\s+(\w+\(.*?\))/i;

  let updatedQuery = q.replace(facetRegex, `facet ${newFacet}`);
  updatedQuery = updatedQuery.replace(limitRegex, `limit ${newLimit || 2000}`);
  updatedQuery = updatedQuery.replace(selectFunctionRegex, (match, p1) => {
    return `SELECT ${p1} as '${seriesTitle}'`;
  });

  return updatedQuery;
}

export const fetchData = async (filters, timeRange, queries) => {
  const allData = [];

  for (let c = 0; c < queries.length; c++) {
    let filteredQuery = queries[c].query;

    let since = '';
    let facetKey = null;

    if (timeRange) {
      if (timeRange.duration) {
        since = ` since ${timeRange.duration / 60 / 1000} MINUTES AGO`;
      } else if (timeRange.begin_time && timeRange.end_time) {
        since = ` since ${timeRange.begin_time} until ${timeRange.end_time}`;
      }
    }

    if (since !== '') {
      filteredQuery += since;
    }

    if (filters) {
      filteredQuery += ` where ${filters} `;
    }

    if (filteredQuery.includes('facet') || filteredQuery.includes('FACET')) {
      const facetRegex = /facet\s+([\w,]+)/i;
      const facetMatch = filteredQuery.match(facetRegex);

      if (facetMatch) {
        const facets = facetMatch[1].split(',').map(facet => facet.trim());
        facetKey = facets[0];
      }
    } else {
      filteredQuery += ` facet ${queries[c].customTimestamp}`; // add input prop as facet since there is no need to multi-facet
      filteredQuery += ` limit ${parseInt(queries[c].limit) || 2000}`;
    }

    const resp = await NrqlQuery.query({
      accountIds: [queries[c].accountId],
      query: filteredQuery
    });

    if (resp.error) {
      console.debug(`${resp.error}`); // eslint-disable-line
      return allData;
    }
    if (facetKey) {
      const data = resp.data;
      if (data.length > 0) {
        const qProms = data.map(d => { // eslint-disable-line
          const facetValue = d.metadata.name;
          if (facetValue !== 'Other') {
            const filter = ` where ${facetKey} = ${
              typeof facetValue === 'string' ? `'${facetValue}'` : facetValue
            }`;
            let finalQuery = replaceValues(
              filteredQuery,
              queries[c].customTimestamp,
              queries[c].limit,
              facetValue
            );
            if (!finalQuery.includes('limit')) {
              finalQuery += ` limit ${queries[c].limit || 2000}`;
            }
            finalQuery += filter;
            return NrqlQuery.query({
              accountIds: [queries[c].accountId],
              query: finalQuery
            });
          }
        });

        let qData = await Promise.all(qProms);
        qData = qData.filter(d => {
          return d !== undefined;
        });
        allData.push(qData);
      } else {
        console.debug('No data found'); // eslint-disable-line
        return allData;
      }
    } else {
      // just push the single result to allData for processing (no facet)
      allData.push(resp);
    }
  }

  return allData;
};

function generateRandomHexColor() {
  const letters = '0123456789ABCDEF';
  let hex = '#';

  for (let i = 0; i < 6; i++) {
    hex += letters[Math.floor(Math.random() * 16)];
  }

  return hex;
}

export const formatTimeData = (filters, data) => {
  const timeData = [];

  for (let i = 0; i < data.length; i++) {
    let chartTitle = data[i].data[0].metadata.groups[0].displayName;
    const y_units = data[i].data[0].metadata.units_data.y;
    const chartColor = generateRandomHexColor();

    if (filters) {
      chartTitle += ` WHERE ${filters}`;
    }

    const aSeries = {
      metadata: {
        id: `series-${i + 1}`,
        name: chartTitle,
        color: chartColor,
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: y_units
        }
      },
      data: []
    };

    for (const r of data[i].data) {
      let x = null;
      if (r.metadata.name.length >= 13) {
        x = Number(r.metadata.name); // Milliseconds
      } else {
        x = Number(r.metadata.name) * 1000; // Seconds
      }
      const y = r.data[0].y;
      // console.log({ x, y });
      if (!isNaN(x)) {
        aSeries.data.push({ x, y });
      }
    }

    const sorted = aSeries.data.sort(function(x, y) {
      return x.x - y.x;
    });

    aSeries.data = sorted;
    timeData.push(aSeries);
  }

  return timeData;
};

export const formatBarData = (filters, data) => {
  const barData = [];

  for (let i = 0; i < data.length; i++) {
    let chartTitle = data[i].data[0].metadata.groups[0].displayName;
    const chartColor = generateRandomHexColor();

    if (filters) {
      chartTitle += ` WHERE ${filters}`;
    }

    for (const r of data[i].data) {
      let x = null;
      if (r.metadata.name.length >= 13) {
        x = Number(r.metadata.name); // Milliseconds
      } else {
        x = Number(r.metadata.name) * 1000; // Seconds
      }
      const y = r.data[0].y;
      // console.log({ x, y });
      if (!isNaN(x)) {
        barData.push({
          x,
          [chartTitle]: y,
          color: chartColor,
          legend: chartTitle
        });
      }
    }
  }

  let combinedData = barData.reduce((acc, obj) => {
    const existing = acc.find(item => item.x === obj.x);
    if (existing) {
      Object.keys(obj).forEach(key => {
        if (key !== 'x' && key !== 'color' && key !== 'legend') {
          existing[key] = obj[key];
          existing[`${key}_color`] = obj.color;
          existing[`${key}_legend`] = obj.legend;
        }
      });
    } else {
      const newObj = { x: obj.x };
      Object.keys(obj).forEach(key => {
        if (key !== 'x' && key !== 'color' && key !== 'legend') {
          newObj[key] = obj[key];
          newObj[`${key}_color`] = obj.color;
          newObj[`${key}_legend`] = obj.legend;
        }
      });
      acc.push(newObj);
    }
    return acc;
  }, []);

  const sorted = combinedData.sort((x, y) => x.x - y.x);

  combinedData = sorted;

  return combinedData;
};
