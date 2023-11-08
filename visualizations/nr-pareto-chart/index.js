import React, { useContext, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
  Cell
} from 'recharts';

import {
  NrqlQuery,
  Spinner,
  AutoSizer,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';

import { useInterval } from '@mantine/hooks';

import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return 'SINCE 30 minutes ago';
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

export default function LineBarChart(props) {
  const {
    pollInterval,
    enableTimePicker,
    showDocs,
    yLabelRight,
    xLabel,
    accountId,
    query,
    enableFilters,
    barSize,
    ignoreOther
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [barAttribute, setBarAttribute] = useState(null);
  const [lineAttribute, setLineAttribute] = useState(null);

  const [loading, setLoading] = useState(true);
  const platformContext = useContext(PlatformStateContext);
  const { filters } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];

    const lowerQuery = (query || '').toLowerCase();
    const errorObj = { name: `Query`, errors: [] };

    if (!lowerQuery) {
      errorObj.errors.push(`Query is undefined`);
    } else if (lowerQuery.trim() === 'from') {
      errorObj.errors.push(`Query is undefined`);
    }
    if (!lowerQuery.includes('facet')) {
      errorObj.errors.push(`Requires FACET keyword`);
    }
    if (!accountId) {
      errorObj.errors.push(`AccountID is undefined`);
    }

    if (errorObj.errors.length > 0) {
      tempErrors.push(errorObj);
    }
    setErrors(tempErrors);

    setLoading(false);
  }, [query, barSize, enableFilters, accountId, ignoreOther]);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, query, enableFilters, accountId, ignoreOther]);

  const interval = useInterval(() => {
    if (query && accountId) {
      fetchData();
    }
  }, (pollInterval || 60) * 1000);

  const doNrql = data => {
    return new Promise(resolve => {
      const { query, accountId, name, color, type, barSize } = data;
      NrqlQuery.query({ query, accountIds: [accountId] }).then(value => {
        resolve({ ...value, name, color, type, barSize });
      });
    });
  };

  const fetchData = async () => {
    const queries = [];
    const timeQuery = timeRangeToNrql(timeRange);

    /* eslint-disable */
    const newQuery = `${query} ${enableFilters ? filters || '' : ''} ${enableTimePicker ? timeQuery : ''
      }`;
    /* eslint-enable */

    queries.push({
      query: newQuery,
      accountId,
      type: 'chart',
      barSize
    });

    //
    // eslint-disable-next-line
    console.log(`fetching data ${new Date().toLocaleTimeString()}`);
    // eslint-disable-next-line
    console.log(`queries ${JSON.stringify(queries)}`);

    const nrqlData = await Promise.all(queries.map(q => doNrql(q)));

    // perform data merging
    const facetGroups = {};
    let tempBarAttribute = null;
    let tempLineAttribute = null;

    (nrqlData || []).forEach(d => {
      const { data, color, barSize } = d;

      (data || []).forEach((groupData, index) => {
        const hasFacet = groupData.metadata.groups.find(
          g => g.type === 'facet'
        );

        groupData.metadata.color =
          hasFacet || !color ? groupData.metadata.color : color;

        const dataKey = groupData.metadata.groups.find(
          g => g.type === 'function'
        );

        if (index === 0) {
          tempBarAttribute = dataKey?.value;
        } else if (dataKey?.value !== tempBarAttribute) {
          tempLineAttribute = dataKey?.value;
        }

        groupData.data.forEach(gd => {
          if (dataKey) {
            const value = gd[dataKey?.value];

            const group = hasFacet?.label || hasFacet?.value;
            if (!facetGroups[group]) {
              facetGroups[group] = {
                group,
                [dataKey?.value]: value,
                color: groupData.metadata.color,
                barSize
              };
            } else {
              facetGroups[group][dataKey?.value] = value;
            }
          }
        });
      });
    });

    setBarAttribute(tempBarAttribute);
    setLineAttribute(tempLineAttribute);

    setDataSets(
      Object.keys(facetGroups)
        .map(fg => facetGroups[fg])
        .filter(g => (ignoreOther ? g.group !== "'Other'" : true))
        .sort((a, b) => b[tempBarAttribute] - a[tempBarAttribute])
    );
  };

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <>
          {showDocs && <Docs />}
          <ComposedChart
            width={width * 0.99}
            height={height * 0.99}
            data={dataSets}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20
            }}
          >
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis
              dataKey="group"
              domain={['auto', 'auto']}
              name="Group"
              type="category"
            >
              {xLabel && (
                <Label value={xLabel} offset={0} position="insideBottom" />
              )}
            </XAxis>
            <YAxis />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={
                yLabelRight
                  ? { value: yLabelRight, angle: -90, position: 'right' }
                  : undefined
              }
            />
            <Tooltip />
            <Legend />

            <Bar dataKey={barAttribute} barSize={parseInt(barSize || 20)}>
              {dataSets.map((entry, index) => (
                <Cell
                  // cursor="pointer"
                  fill={entry?.color}
                  key={`cell-${index}`}
                />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey={lineAttribute} />
          </ComposedChart>
        </>
      )}
    </AutoSizer>
  );
}
