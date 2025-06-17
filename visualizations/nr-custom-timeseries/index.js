import React, { useState, useEffect, useContext } from 'react';
import {
  AutoSizer,
  NrqlQuery,
  Spinner,
  LineChart,
  AreaChart,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

const CustomTimeseries = props => {
  let { chartType, queries, showDocs } = props;
  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);
  const { filters } = nerdletContext;
  const { timeRange } = platformContext;
  const [errors, setErrors] = useState([]);
  const [nrqlResults, setNrqlResults] = useState(null);
  const [loading, setLoading] = useState(true);

  if (chartType == null) {
    chartType = 'line';
  }

  const formatTimeData = (data, qs) => {
    const timeData = [];

    for (let i = 0; i < data.length; i++) {
      let chartTitle = qs[i].legend;
      const chartColor = qs[i].lineColor ? qs[i].lineColor : 'green';

      if (filters) {
        chartTitle += ` WHERE ${nerdletContext.filters}`;
      }

      const aSeries = {
        metadata: {
          id: `series-${i + 1}`,
          name: chartTitle,
          color: chartColor,
          viz: 'main',
          units_data: {
            x: 'TIMESTAMP',
            y: qs[i].selectUnit
          }
        },
        data: []
      };

      for (const r of data[i].data) {
        let x = null;
        if (qs[i].timestampUnit === 'SECONDS') {
          x = Number(r.metadata.name) * 1000;
        }

        if (qs[i].timestampUnit === 'MILLISECONDS') {
          x = Number(r.metadata.name);
        }
        const y = r.data[0].y;
        // console.log({ x, y });
        if (!isNaN(x)) {
          aSeries.data.push({ x, y });
        }
      }

      const sorted = aSeries.data.sort(function(x, y) {
        return y.x - x.x;
      });

      aSeries.data = sorted;
      timeData.push(aSeries);
    }

    return timeData;
  };

  const formatBarData = (data, qs) => {
    const barData = [];

    for (let i = 0; i < data.length; i++) {
      let chartTitle = qs[i].legend;
      const chartColor = qs[i].lineColor || 'green';

      if (filters) {
        chartTitle += ` WHERE ${filters}`;
      }

      for (const r of data[i].data) {
        let x = null;
        if (qs[i].timestampUnit === 'SECONDS') {
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

  const fetchData = async () => {
    const allData = [];

    for (let c = 0; c < queries.length; c++) {
      let filteredQuery = queries[c].query;

      let since = '';

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
        filteredQuery += ` WHERE ${nerdletContext.filters} `;
      }
      const resp = await NrqlQuery.query({
        accountIds: [queries[c].accountId],
        query: filteredQuery
      });
      allData.push(resp);
    }

    return allData;
  };

  const customTimeseries = (width, height) => {
    if (nrqlResults && errors.length === 0) {
      if (chartType === 'line') {
        return <LineChart data={nrqlResults} fullHeight fullWidth />;
      }
      if (chartType === 'area') {
        return <AreaChart data={nrqlResults} fullHeight fullWidth />;
      }

      if (chartType === 'bar') {
        const uniqueKeys = new Set();
        nrqlResults.forEach(obj => {
          Object.keys(obj).forEach(key => {
            if (
              !key.includes('color') &&
              !key.includes('legend') &&
              key !== 'x'
            ) {
              uniqueKeys.add(key);
            }
          });
        });

        return (
          <BarChart
            width={width * 0.99}
            height={height * 0.99}
            data={nrqlResults}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20
            }}
          >
            <XAxis
              dataKey="x"
              tickFormatter={date => {
                const d = new Date(date);
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hour = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${mm}-${dd} ${hour}:${min}`;
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={value => {
                const date = new Date(value);
                return date.toLocaleString();
              }}
            />
            <Legend />
            {[...uniqueKeys].map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={nrqlResults
                  .map(r => r[`${key}_color`])
                  .find(color => color)}
                stackId="x"
              />
            ))}
          </BarChart>
        );
      }
    }

    return '';
  };

  useEffect(() => {
    setLoading(true);
    const tempErrs = [];
    if (queries.length === 0) {
      tempErrs.push({
        name: 'At least one query is required'
      });
    } else {
      queries.forEach((q, i) => {
        const lowerQuery = (q.query || '').toLowerCase();
        const errorObj = { name: `Query ${i + 1}`, errors: [] };

        if (!lowerQuery) {
          errorObj.errors.push(`Query is undefined`);
        }
        if (lowerQuery.includes('timeseries')) {
          errorObj.errors.push(`Query contains 'timeseries' keyword`);
        }
        if (!q.accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }
        if (!q.selectUnit) {
          errorObj.errors.push(`Value Unit undefined`);
        }
        if (!q.timestampUnit) {
          errorObj.errors.push(`Timestamp Unit undefined`);
        }
        if (!q.legend) {
          errorObj.errors.push(`Legend Title is undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrs.push(errorObj);
        }
      });
    }
    setErrors(tempErrs);
    setLoading(false);
  }, [queries]);

  useEffect(() => {
    if (errors.length === 0) {
      const loadData = async () => {
        const data = await fetchData();
        const flattened = data.flat();
        let formattedData;
        if (chartType === 'line' || chartType === 'area') {
          formattedData = await formatTimeData(flattened, queries);
        } else {
          formattedData = await formatBarData(flattened, queries);
        }
        setNrqlResults(formattedData);
        setLoading(false);
      };
      loadData();
    }
  }, [filters, timeRange, queries, chartType]);

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
          {customTimeseries(width, height)}
        </>
      )}
    </AutoSizer>
  );
};

export default CustomTimeseries;
