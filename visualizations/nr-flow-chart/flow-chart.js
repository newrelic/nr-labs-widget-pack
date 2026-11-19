import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Sankey, Tooltip } from 'recharts';
import {
  EmptyState,
  NerdletStateContext,
  NrqlQuery,
  PlatformStateContext,
  Spinner
} from 'nr1';
import { useInterval } from '@mantine/hooks';
import ErrorState from '../../shared/ErrorState';
import Docs from './docs';
import {
  buildQuery,
  extractRows,
  parseAffixes,
  findCycle,
  rowsToSankey,
  sortSankey,
  validateQuery
} from './utils';

const PALETTE = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#17becf',
  '#bcbd22',
  '#7f7f7f'
];
const LABEL_MAX_CHARS = 28;
const LABEL_MARGIN = 170;
const NODE_PADDING = 16;
// vertical room a two-line label (name + detail) needs
const DETAIL_MIN_SLOT = 30;
// minimum chart height per node in the busiest column
const MIN_ROW_PX = NODE_PADDING + 6;
const CHART_V_MARGIN = 10;
const SCROLLBAR_PX = 16;

const truncate = text =>
  text.length > LABEL_MAX_CHARS
    ? `${text.slice(0, LABEL_MAX_CHARS - 1)}…`
    : text;

const DIM_OPACITY = 0.2;

const formatValue = (value, { prefix = '', suffix = '' }) =>
  `${prefix}${value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}${suffix}`;

const formatPercent = (value, total) =>
  total > 0 ? `${Number(((value / total) * 100).toFixed(1))}%` : '';

// second label line, per the labelContent config
const detailText = (labelContent, value, total, affixes) => {
  const parts = [];
  if (['nameValue', 'all'].includes(labelContent)) {
    parts.push(formatValue(value, affixes));
  }
  if (['namePercent', 'all'].includes(labelContent)) {
    parts.push(formatPercent(value, total));
  }
  return parts.filter(Boolean).join(' · ');
};

// stable per name, so colours do not swap when a refresh reorders nodes
const colorFor = name => {
  let hash = 0;
  Array.from(name).forEach(ch => {
    hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  });
  return PALETTE[hash % PALETTE.length];
};

const SankeyNode = ({
  x,
  y,
  width,
  height,
  payload,
  containerWidth,
  labelMargin,
  litNames,
  labelContent,
  total,
  affixes
}) => {
  const onLeft = x < containerWidth / 2;
  const dimmed = litNames && !litNames.has(payload.name);
  // the last column puts labels in the right margin, outside the ribbons
  const isLast = x + width >= containerWidth - labelMargin - 1;
  const labelOnRight = isLast || onLeft;
  const labelX = labelOnRight ? x + width + 6 : x - 6;
  const textAnchor = labelOnRight ? 'start' : 'end';
  const detail = detailText(labelContent, payload.value, total, affixes);
  // small nodes have no room for a second line, the tooltip carries it instead
  const showDetail =
    Boolean(detail) && height + NODE_PADDING >= DETAIL_MIN_SLOT;
  return (
    <g
      style={{ cursor: 'pointer' }}
      opacity={dimmed ? DIM_OPACITY : 1}
      data-node="true"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={colorFor(payload.name)}
      />
      <text
        x={labelX}
        y={showDetail ? y + height / 2 - 7 : y + height / 2}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={12}
        fill="currentColor"
      >
        {truncate(payload.name)}
      </text>
      {showDetail && (
        <text
          x={labelX}
          y={y + height / 2 + 8}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize={11}
          fill="currentColor"
          fillOpacity={0.65}
        >
          {detail}
        </text>
      )}
    </g>
  );
};

SankeyNode.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  payload: PropTypes.object,
  containerWidth: PropTypes.number,
  labelMargin: PropTypes.number,
  litNames: PropTypes.instanceOf(Set),
  labelContent: PropTypes.string,
  total: PropTypes.number,
  affixes: PropTypes.object
};

// focus is { type: 'node', name } or { type: 'link', source, target }
const isLinkFocused = (focus, { source, target }) => {
  if (!focus) {
    return false;
  }
  if (focus.type === 'link') {
    return source.name === focus.source && target.name === focus.target;
  }
  return source.name === focus.name || target.name === focus.name;
};

const SankeyLink = ({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  payload,
  focus
}) => {
  const active = isLinkFocused(focus, payload);
  let opacity = 0.3;
  if (focus) {
    opacity = active ? 0.75 : 0.05;
  }
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={active ? '#1f77b4' : '#888'}
      strokeWidth={linkWidth}
      strokeOpacity={opacity}
      style={{ cursor: 'pointer' }}
      data-link="true"
    />
  );
};

SankeyLink.propTypes = {
  sourceX: PropTypes.number,
  sourceY: PropTypes.number,
  sourceControlX: PropTypes.number,
  targetX: PropTypes.number,
  targetY: PropTypes.number,
  targetControlX: PropTypes.number,
  linkWidth: PropTypes.number,
  payload: PropTypes.object,
  focus: PropTypes.object
};

const toErrorList = error => {
  if (Array.isArray(error)) {
    return error.map(e => (e && e.message) || String(e));
  }
  return [(error && error.message) || String(error)];
};

const FlowChart = ({
  width,
  height,
  showDocs,
  pollInterval,
  enableTimePicker,
  enableFilters,
  accountId,
  query,
  labelContent,
  sortOrder
}) => {
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [fetchErrors, setFetchErrors] = useState([]);
  const [sankeyData, setSankeyData] = useState({ nodes: [], links: [] });
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const requestId = useRef(0);
  const { timeRange } = useContext(PlatformStateContext);
  const { filters, selectedVariables } = useContext(NerdletStateContext);

  const inputErrors = useMemo(
    () => validateQuery(query, { accountId, enableTimePicker }),
    [query, accountId, enableTimePicker]
  );

  const finalQuery = useMemo(
    () =>
      inputErrors.length === 0
        ? buildQuery(query, {
            timeRange,
            filters,
            enableTimePicker,
            enableFilters,
            selectedVariables
          })
        : null,
    [
      inputErrors,
      query,
      timeRange,
      filters,
      enableTimePicker,
      enableFilters,
      selectedVariables
    ]
  );

  const fetchData = async () => {
    if (!finalQuery) {
      return;
    }
    const thisRequest = ++requestId.current;
    let resp;
    try {
      resp = await NrqlQuery.query({
        query: finalQuery,
        accountIds: [parseInt(accountId)],
        formatType: NrqlQuery.FORMAT_TYPE.CHART
      });
    } catch (e) {
      resp = { error: e };
    }

    // a newer query started while this one was in flight
    if (thisRequest !== requestId.current) {
      return;
    }

    if (resp.error) {
      setFetchErrors([
        { name: 'Data Fetch Errors', errors: toErrorList(resp.error) }
      ]);
    } else {
      setFetchErrors([]);
      setSankeyData(rowsToSankey(extractRows(resp)));
    }
    setFirstLoadComplete(true);
  };

  const interval = useInterval(fetchData, (pollInterval || 60) * 1000);

  useEffect(() => {
    setFetchErrors([]);
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [accountId, finalQuery, pollInterval]);

  const cycle = useMemo(() => findCycle(sankeyData.links, sankeyData.nodes), [
    sankeyData
  ]);

  const orderedData = useMemo(
    () => (cycle ? sankeyData : sortSankey(sankeyData, sortOrder)),
    [sankeyData, sortOrder, cycle]
  );

  // a pinned item wins over hover. Names are unique, they are deduplicated.
  // Focus on a node that a refresh removed is ignored, else all would dim
  const focus = useMemo(() => {
    const names = new Set(orderedData.nodes.map(n => n.name));
    const isValid = f =>
      f &&
      (f.type === 'link'
        ? names.has(f.source) && names.has(f.target)
        : names.has(f.name));
    return [pinned, hovered].find(isValid) || null;
  }, [pinned, hovered, orderedData]);
  // nodes drawn at full strength: the focused node and its direct neighbours,
  // or both ends of a focused link
  const litNames = useMemo(() => {
    if (!focus) {
      return null;
    }
    if (focus.type === 'link') {
      return new Set([focus.source, focus.target]);
    }
    const lit = new Set([focus.name]);
    const { nodes, links } = orderedData;
    links.forEach(l => {
      const source = nodes[l.source].name;
      const target = nodes[l.target].name;
      if (source === focus.name) {
        lit.add(target);
      } else if (target === focus.name) {
        lit.add(source);
      }
    });
    return lit;
  }, [focus, orderedData]);

  const affixes = useMemo(() => parseAffixes(query), [query]);

  // percent base: total flow leaving the nodes that nothing flows into
  const total = useMemo(() => {
    const { links } = sankeyData;
    const hasIncoming = new Set(links.map(l => l.target));
    return links
      .filter(l => !hasIncoming.has(l.source))
      .reduce((sum, l) => sum + l.value, 0);
  }, [sankeyData]);

  // node count of the busiest column, to size the chart so labels fit
  const maxColumnNodes = useMemo(() => {
    const { links } = orderedData;
    return Math.max(
      new Set(links.map(l => l.source)).size,
      new Set(links.map(l => l.target)).size
    );
  }, [orderedData]);

  const toFocus = (item, type) => {
    const payload = item && item.payload;
    if (!payload) {
      return null;
    }
    if (type === 'node') {
      return { type, name: payload.name };
    }
    return payload.source && payload.target
      ? { type, source: payload.source.name, target: payload.target.name }
      : null;
  };
  const sameFocus = (a, b) => a && b && JSON.stringify(a) === JSON.stringify(b);

  let errors = [];
  if (inputErrors.length > 0) {
    errors = [{ name: 'Input Errors', errors: inputErrors }];
  } else if (fetchErrors.length > 0) {
    errors = fetchErrors;
  } else if (cycle) {
    errors = [{ name: 'Cycle Detected', errors: [cycle.join(' -> ')] }];
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  if (!firstLoadComplete) {
    return <Spinner />;
  }

  if (sankeyData.links.length === 0) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No data returned"
          description="The query returned no rows."
        />
      </>
    );
  }

  // grow past the widget height when nodes would be too cramped; wrapper scrolls
  const chartHeight = Math.max(
    height,
    maxColumnNodes * MIN_ROW_PX + CHART_V_MARGIN * 2
  );
  // leave room for the vertical scrollbar so no horizontal one appears
  const chartWidth = chartHeight > height ? width - SCROLLBAR_PX : width;
  const labelMargin = Math.min(LABEL_MARGIN, Math.floor(chartWidth * 0.2));

  return (
    <div
      style={{ width, height, overflow: 'auto' }}
      onClick={e => {
        // click on empty chart area clears the pinned item
        if (!e.target.closest('[data-node],[data-link]')) {
          setPinned(null);
        }
      }}
    >
      {showDocs && <Docs />}
      <Sankey
        width={chartWidth}
        height={chartHeight}
        data={orderedData}
        iterations={0}
        node={
          <SankeyNode
            containerWidth={chartWidth}
            labelMargin={labelMargin}
            litNames={litNames}
            labelContent={labelContent}
            total={total}
            affixes={affixes}
          />
        }
        onMouseEnter={(item, type) => setHovered(toFocus(item, type))}
        onMouseLeave={() => setHovered(null)}
        onClick={(item, type) => {
          const next = toFocus(item, type);
          setPinned(current => (sameFocus(current, next) ? null : next));
        }}
        nodePadding={NODE_PADDING}
        nodeWidth={12}
        margin={{
          top: CHART_V_MARGIN,
          right: labelMargin,
          bottom: CHART_V_MARGIN,
          left: labelMargin
        }}
        link={<SankeyLink focus={focus} />}
      >
        <Tooltip
          formatter={value => detailText('all', value, total, affixes)}
        />
      </Sankey>
    </div>
  );
};

FlowChart.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  showDocs: PropTypes.bool,
  pollInterval: PropTypes.number,
  enableTimePicker: PropTypes.bool,
  enableFilters: PropTypes.bool,
  accountId: PropTypes.number,
  query: PropTypes.string,
  labelContent: PropTypes.string,
  sortOrder: PropTypes.string
};

export default FlowChart;
