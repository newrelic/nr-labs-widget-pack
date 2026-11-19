import { subVariables } from '../shared/utils';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const CLAUSE_END =
  '\\b(?:FROM|SELECT|WHERE|FACET|SINCE|UNTIL|LIMIT|TIMESERIES|COMPARE|WITH|ORDER)\\b|$';

const NONE_LABEL = '(none)';
const OTHER_LABEL = 'Other';

export const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return '';
  }

  if (timeRange.beginTime && timeRange.endTime) {
    return `SINCE ${timeRange.beginTime} UNTIL ${timeRange.endTime}`;
  } else if (timeRange.begin_time && timeRange.end_time) {
    return `SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`;
  } else if (timeRange.duration <= HOUR) {
    return `SINCE ${timeRange.duration / MINUTE} MINUTES AGO`;
  } else if (timeRange.duration <= DAY) {
    return `SINCE ${timeRange.duration / HOUR} HOURS AGO`;
  } else {
    return `SINCE ${timeRange.duration / DAY} DAYS AGO`;
  }
};

// Mask quoted strings and backticked attributes with underscores so keywords
// inside them are not matched. Length-preserving: indexes stay valid.
const stripStrings = query =>
  query.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, m => '_'.repeat(m.length));

// Mask everything nested inside parentheses so commas and WHERE inside
// function calls such as filter(count(*), WHERE x) are not seen at top level.
// Length-preserving.
const stripParens = text => {
  let depth = 0;
  return Array.from(text)
    .map(ch => {
      if (ch === '(') {
        depth++;
        return ch;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        return ch;
      }
      return depth > 0 ? '_' : ch;
    })
    .join('');
};

const clauseBody = (query, keyword) => {
  const match = new RegExp(
    `\\b${keyword}\\b([\\s\\S]*?)(?=${CLAUSE_END})`,
    'i'
  ).exec(query);
  return match ? match[1] : null;
};

// A constant aliased as prefix or suffix, e.g. '$' as 'prefix'. It configures
// the labels and is removed from the query before it runs.
const AFFIX_ITEM = /^(['"])([\s\S]*)\1\s+as\s+(['"`]?)(prefix|suffix)\3$/i;

// Split the top-level SELECT into aggregates and prefix/suffix constants.
// Returns null without a SELECT. start/end delimit the SELECT body in query.
const parseSelect = query => {
  const masked = stripParens(stripStrings(query));
  const match = new RegExp(
    `\\bSELECT\\b([\\s\\S]*?)(?=${CLAUSE_END})`,
    'i'
  ).exec(masked);
  if (!match) {
    return null;
  }
  const end = match.index + match[0].length;
  const start = end - match[1].length;
  const aggregates = [];
  const affixes = {};
  let itemStart = start;
  const flush = itemEnd => {
    const text = query.slice(itemStart, itemEnd).trim();
    if (!text) {
      return;
    }
    const affix = AFFIX_ITEM.exec(text);
    if (affix) {
      affixes[affix[4].toLowerCase()] = affix[2];
    } else {
      aggregates.push(text);
    }
  };
  for (let i = start; i < end; i++) {
    if (masked[i] === ',') {
      flush(i);
      itemStart = i + 1;
    }
  }
  flush(end);
  return { start, end, aggregates, affixes };
};

export const parseAffixes = query => {
  const parsed = query ? parseSelect(query) : null;
  return parsed ? parsed.affixes : {};
};

const stripAffixes = query => {
  const parsed = parseSelect(query);
  if (!parsed || Object.keys(parsed.affixes).length === 0) {
    return query;
  }
  return `${query.slice(0, parsed.start)} ${parsed.aggregates.join(
    ', '
  )} ${query.slice(parsed.end)}`;
};

const splitTopLevel = text =>
  stripParens(text)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export const validateQuery = (query, { accountId, enableTimePicker }) => {
  const errors = [];

  if (!accountId) {
    errors.push('Account ID required');
  }

  if (!query || !query.trim()) {
    errors.push('NRQL query required');
    return errors;
  }

  const clean = stripParens(stripStrings(query));

  const facetBody = clauseBody(clean, 'FACET');
  if (facetBody === null) {
    errors.push('Query requires a FACET clause with two attributes');
  } else {
    const facets = splitTopLevel(facetBody);
    if (/^cases\s*\(/i.test(facetBody.trim())) {
      errors.push('FACET CASES is not supported. Use two FACET attributes');
    } else if (facets.length !== 2) {
      errors.push(
        `Exactly two FACET attributes required (source, target). Found ${facets.length}`
      );
    }
  }

  const select = parseSelect(query);
  if (!select) {
    errors.push('Query requires a SELECT clause');
  } else if (select.aggregates.length !== 1) {
    errors.push(
      `Exactly one aggregate required in SELECT (prefix and suffix constants excluded). Found ${select.aggregates.length}`
    );
  }

  if (/\bTIMESERIES\b/i.test(clean)) {
    errors.push('TIMESERIES is not supported');
  }

  if (enableTimePicker && /\bSINCE\b/i.test(clean)) {
    errors.push(
      'Query contains a SINCE clause while the time picker is enabled. Two SINCE clauses is a syntax error. Remove SINCE from the query or disable the time picker'
    );
  }

  return errors;
};

// Dashboard filters are merged just before FACET. An existing top-level WHERE
// body is parenthesised so a user OR cannot escape the filter:
// `WHERE (user) AND (filters)`, else `WHERE filters`. The WHERE body ends at
// the next clause keyword, so SINCE, LIMIT etc. before FACET stay outside it.
const WHERE_BODY_END = /\b(?:FROM|SELECT|FACET|SINCE|UNTIL|LIMIT|TIMESERIES|COMPARE|WITH|ORDER)\b/i;

const mergeFilters = (query, filters) => {
  const masked = stripParens(stripStrings(query));
  const facetMatch = /\bFACET\b/i.exec(masked);
  const splitAt = facetMatch ? facetMatch.index : query.length;
  const whereMatch = /\bWHERE\b/i.exec(masked.slice(0, splitAt));

  if (!whereMatch) {
    const merged = `${query.slice(0, splitAt).trimEnd()} WHERE ${filters}`;
    const after = query.slice(splitAt);
    return after ? `${merged} ${after}` : merged;
  }

  const bodyStart = whereMatch.index + whereMatch[0].length;
  const endMatch = WHERE_BODY_END.exec(masked.slice(bodyStart, splitAt));
  const bodyEnd = endMatch ? bodyStart + endMatch.index : splitAt;
  const userBody = query.slice(bodyStart, bodyEnd).trim();
  const merged = `${query.slice(0, bodyStart)} (${userBody}) AND (${filters})`;
  const after = query.slice(bodyEnd).trim();
  return after ? `${merged} ${after}` : merged;
};

export const buildQuery = (
  query,
  { timeRange, filters, enableTimePicker, enableFilters, selectedVariables }
) => {
  let built = stripAffixes(subVariables(query, selectedVariables));

  if (enableFilters && filters) {
    built = mergeFilters(built, filters);
  }

  if (enableTimePicker) {
    const since = timeRangeToNrql(timeRange);
    if (since) {
      built += ` ${since}`;
    }
  }

  return built;
};

// FACET a, b: each series carries metadata.groups: two entries of
// type 'facet' (in FACET order) and one of type 'function'.
export const extractRows = result => {
  const series = (result && result.data) || [];
  return series
    .map(s => {
      const groups = (s.metadata && s.metadata.groups) || [];
      const facets = groups.filter(g => g.type === 'facet');
      const fn = groups.find(g => g.type === 'function');
      const point = (s.data && s.data[0]) || {};
      const raw = point.y !== undefined ? point.y : point[fn && fn.value];
      return {
        source: facets[0] ? facets[0].value : undefined,
        target: facets[1] ? facets[1].value : undefined,
        value: Number(raw)
      };
    })
    .filter(row => Number.isFinite(row.value));
};

const toName = v =>
  v === null || v === undefined || v === '' ? NONE_LABEL : String(v);

export const rowsToSankey = rows => {
  const indexByName = new Map();
  const nodes = [];
  const linkByKey = new Map();
  const links = [];

  const nodeIndex = name => {
    if (!indexByName.has(name)) {
      indexByName.set(name, nodes.length);
      nodes.push({ name });
    }
    return indexByName.get(name);
  };

  rows.forEach(row => {
    if (!(row.value > 0)) {
      return;
    }
    const sourceName = toName(row.source);
    const targetName = toName(row.target);
    // NRQL groups facet values beyond LIMIT as "Other" in each column
    if (sourceName === OTHER_LABEL && targetName === OTHER_LABEL) {
      return;
    }
    const source = nodeIndex(sourceName);
    const target = nodeIndex(targetName);
    const key = `${source}->${target}`;
    if (linkByKey.has(key)) {
      linkByKey.get(key).value += row.value;
    } else {
      const link = { source, target, value: row.value };
      linkByKey.set(key, link);
      links.push(link);
    }
  });

  return { nodes, links };
};

// DFS with white/grey/black colouring. Returns node names along the first
// cycle found (first name repeated at the end), or null.
export const findCycle = (links, nodes) => {
  const adjacency = nodes.map(() => []);
  links.forEach(l => adjacency[l.source].push(l.target));

  const state = nodes.map(() => 0); // 0 unvisited, 1 on path, 2 done
  const path = [];

  const visit = i => {
    state[i] = 1;
    path.push(i);
    for (const next of adjacency[i]) {
      if (state[next] === 1) {
        const start = path.indexOf(next);
        return [...path.slice(start), next];
      }
      if (state[next] === 0) {
        const found = visit(next);
        if (found) {
          return found;
        }
      }
    }
    path.pop();
    state[i] = 2;
    return null;
  };

  for (let i = 0; i < nodes.length; i++) {
    if (state[i] === 0) {
      const found = visit(i);
      if (found) {
        return found.map(idx => nodes[idx].name);
      }
    }
  }
  return null;
};

const compareKeys = (a, b) => {
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
};

// Orders nodes for display. recharts keeps input order within a column when
// iterations is 0, so the order produced here is the one drawn, top to
// bottom. Expects an acyclic graph.
//   source*: first-level nodes by flow value, later nodes grouped under their
//            source with the largest link first
//   target*: last-level nodes by flow value, earlier nodes grouped by target
//   alpha*:  all nodes by name
// Desc puts the largest (or Z) first.
export const sortSankey = ({ nodes, links }, order) => {
  const dir = /Asc$/.test(order) ? 1 : -1;
  const byName = (a, b) => nodes[a].name.localeCompare(nodes[b].name);
  const indexes = nodes.map((_, i) => i);
  let ranked;
  order == null && (order = 'sourceDesc');

  if (order.startsWith('alpha')) {
    ranked = [...indexes].sort((a, b) => dir * byName(a, b));
  } else {
    const fromSource = order.startsWith('source');
    // links joining a node to the anchor side, and the node at their far end
    const anchorEnd = fromSource ? 'source' : 'target';
    const nodeEnd = fromSource ? 'target' : 'source';
    const upLinks = indexes.map(() => []);
    const downLinks = indexes.map(() => []);
    const flow = indexes.map(() => 0);
    links.forEach(l => {
      upLinks[l[nodeEnd]].push(l);
      downLinks[l[anchorEnd]].push(l);
      flow[l[anchorEnd]] += l.value;
    });
    const anchors = indexes
      .filter(i => upLinks[i].length === 0)
      .sort((a, b) => dir * (flow[a] - flow[b]) || byName(a, b));

    const keys = new Map();
    anchors.forEach((i, rank) => keys.set(i, [rank]));

    const keyOf = i => {
      if (keys.has(i)) {
        return keys.get(i);
      }
      let best = null;
      upLinks[i].forEach(l => {
        const parent = l[anchorEnd];
        const siblings = [...downLinks[parent]].sort(
          (a, b) => dir * (a.value - b.value) || byName(a[nodeEnd], b[nodeEnd])
        );
        const key = [...keyOf(parent), siblings.indexOf(l)];
        if (!best || compareKeys(key, best) < 0) {
          best = key;
        }
      });
      keys.set(i, best);
      return best;
    };

    ranked = [...indexes].sort((a, b) => compareKeys(keyOf(a), keyOf(b)));
  }

  const newIndex = new Map(ranked.map((old, i) => [old, i]));
  return {
    nodes: ranked.map(i => nodes[i]),
    links: links.map(l => ({
      ...l,
      source: newIndex.get(l.source),
      target: newIndex.get(l.target)
    }))
  };
};
