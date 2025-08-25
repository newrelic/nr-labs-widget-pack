import { NerdGraphQuery } from 'nr1';

const _parseSelectValue = query => {
  const regex = /\bselect\b\s+(?:.*\()?\s*([\w*]+)/i;
  const match = query.match(regex);
  const parsedValue = match ? match[1] : '';

  return parsedValue;
};

const _parseTable = query => {
  const regex = /\bfrom\b\s+([\w:]+)/i;
  const match = query.match(regex);
  let tableName = match ? match[1] : null;

  // If a table name was found and it contains a colon, wrap it in backticks.
  if (tableName && tableName.includes(':')) {
    tableName = `\`${tableName}\``;
  }

  return tableName;
};

const _parseFilters = query => {
  let parenDepth = 0;
  let topLevelWhereIndex = -1;
  const whereKeyword = 'where';

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      parenDepth--;
    }

    // Check for the word 'where' (case-insensitive) only when we are at the top level.
    if (
      parenDepth === 0 &&
      query
        .substring(i)
        .toLowerCase()
        .startsWith(whereKeyword)
    ) {
      const prevChar = query[i - 1] || ' ';
      if (/\s/.test(prevChar)) {
        topLevelWhereIndex = i;
      }
    }
  }

  // If no top-level 'where' was found, return
  if (topLevelWhereIndex === -1) {
    return '';
  }

  const substring = query.substring(topLevelWhereIndex);
  const regex = /^(\bwhere\b.+?)(?=\s*(?:since|limit|until|order by|from)\b|$)/i;
  const match = substring.match(regex);

  return match ? match[1].trim() : '';
};

function _addAsClause(query) {
  const selectMatch = query.match(/\bselect\b/i);
  if (!selectMatch) {
    return query;
  }

  // Get the substring AFTER 'SELECT' without trimming it to preserve indices.
  const expressionStartIndex = selectMatch.index + selectMatch[0].length;
  const restOfQuery = query.substring(expressionStartIndex);

  let parenDepth = 0;
  let endOfFunctionIndex = -1;
  let hasStartedExpression = false;

  // Find the closing parenthesis of the top-level function
  for (let i = 0; i < restOfQuery.length; i++) {
    const char = restOfQuery[i];

    // Skip leading whitespace before the function starts
    if (!hasStartedExpression && /\s/.test(char)) {
      continue;
    }
    hasStartedExpression = true;

    if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      if (parenDepth > 0) {
        parenDepth--;
        if (parenDepth === 0) {
          endOfFunctionIndex = expressionStartIndex + i;
          break;
        }
      }
    }
  }

  if (endOfFunctionIndex === -1) {
    return query; // No complete function call found
  }

  // Check if an 'as' clause already exists right after the function
  const nextSegment = query.substring(endOfFunctionIndex + 1).trim();
  if (nextSegment.toLowerCase().startsWith('as ')) {
    return query; // Avoid adding a duplicate clause
  }

  // Inject the 'as' clause at the correct index
  const newQuery = `${query.slice(
    0,
    endOfFunctionIndex + 1
  )} as 'result'${query.slice(endOfFunctionIndex + 1)}`;

  return newQuery;
}

function _formatData(billboardResult, tableResult) {
  const result = {};

  const criticalPercent = (tableResult.critical / tableResult.total) * 100 || 0;
  const warningPercent = (tableResult.warning / tableResult.total) * 100 || 0;
  const healthyPercent = (tableResult.healthy / tableResult.total) * 100 || 0;

  const formattedTableResults = {
    critical: criticalPercent.toFixed(0),
    warning: warningPercent.toFixed(0),
    healthy: healthyPercent.toFixed(0)
  };

  result.tableResult = formattedTableResults;

  if (typeof billboardResult === 'number') {
    result.billboardResult = billboardResult.toFixed(2);
  }

  if (typeof billboardResult === 'object') {
    const keys = Object.keys(billboardResult);

    if (keys.length > 0) {
      const billboardKey = keys[0];
      result.billboardResult = billboardResult[billboardKey].toFixed(2);
    }
  }

  return result;
}

export const getData = async (
  account,
  finalQuery,
  rawNrql,
  dashFilters,
  crit,
  healthy,
  sinceClause
) => {
  const selectValue = _parseSelectValue(rawNrql);
  const table = _parseTable(rawNrql);
  const filters = _parseFilters(rawNrql);

  const tableQ = `FROM ${table} SELECT count(${selectValue}) as 'total', filter(count(${selectValue}), where ${selectValue} <= ${healthy}) as 'healthy', filter(count(${selectValue}), where ${selectValue} > ${healthy} and ${selectValue} <= ${crit}) as 'warning', filter(count(${selectValue}), where ${selectValue} > ${crit}) as 'critical' ${filters} ${sinceClause} ${dashFilters}`;
  const realFinalQuery = _addAsClause(finalQuery);

  const gql = `
    {
      actor {
        billboardResult: nrql(accounts: [${account}], query: "${realFinalQuery}", timeout: 90) {results}
        tableResult: nrql(accounts: [${account}], query: "${tableQ}", timeout: 90) {results}
      }
    }
    `;

  const data = await NerdGraphQuery.query({ query: gql });
  if (data.error) {
    console.debug(data.error); // eslint-disable-line
    return null;
  }

  const results = data?.data?.actor;

  const tableResult = results?.tableResult?.results?.[0];
  const billboardResult = results?.billboardResult?.results?.[0]?.result;
  const final = _formatData(billboardResult, tableResult);

  return final;
};

export const determineThreshold = (
  value,
  criticalThreshold,
  healthyThreshold
) => {
  let threshold = 'unknown';

  if (value <= healthyThreshold) {
    threshold = 'healthy';
  }

  if (value > healthyThreshold && value <= criticalThreshold) {
    threshold = 'warning';
  }

  if (value > criticalThreshold) {
    threshold = 'critical';
  }

  return threshold;
};
