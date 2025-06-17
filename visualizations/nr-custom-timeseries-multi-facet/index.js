import React, { useState, useEffect, useContext } from 'react';
import {
  AutoSizer,
  LineChart,
  AreaChart,
  NerdletStateContext,
  PlatformStateContext,
  Spinner
} from 'nr1';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';
import {
  facetHasMoreThanOneValue,
  fetchData,
  formatBarData,
  formatTimeData
} from './utils';

const CustomTimeseriesMultiFacet = props => {
  let { chartType, queries, showDocs } = props;
  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);
  const { filters } = nerdletContext;
  const { timeRange } = platformContext;
  const [errors, setErrors] = useState([]);
  const [nrqlResults, setNrqlResults] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!chartType) {
    chartType = 'line';
  }

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

        if (lowerQuery.includes('facet')) {
          if (facetHasMoreThanOneValue(lowerQuery)) {
            errorObj.errors.push(
              `Query contains multiple facets. Only a single facet is allowed`
            );
          }
        }

        if (lowerQuery.includes('since')) {
          errorObj.errors.push(`Query contains 'since' keyword`);
        }

        if (!q.accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }

        if (!q.customTimestamp) {
          errorObj.errors.push(`Custom timestamp undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrs.push(errorObj);
        }
      });
    }
    setErrors(tempErrs);
  }, [queries, chartType]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData(filters, timeRange, queries);
      const flattened = data.flat();
      let formattedData;
      if (chartType === 'line' || chartType === 'area') {
        formattedData = await formatTimeData(filters, flattened);
      } else {
        formattedData = await formatBarData(filters, flattened);
      }
      setNrqlResults(formattedData);
      setLoading(false);
    };
    if (errors.length === 0) {
      loadData();
    }
  }, [filters, timeRange, queries, chartType]);

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    // <h1>text</h1>
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

export default CustomTimeseriesMultiFacet;
