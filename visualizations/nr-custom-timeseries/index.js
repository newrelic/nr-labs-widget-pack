import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  NrqlQuery,
  Spinner,
  LineChart,
  AreaChart,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

const CustomTimeseries = props => {
  let { chartType, queries, showDocs } = props;
  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);
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

      if (nerdletContext) {
        if (nerdletContext.filters) {
          chartTitle += ` WHERE ${nerdletContext.filters}`;
        }
      }

      const aSeries = {
        metadata: {
          id: `series-${i + 1}`,
          name: chartTitle,
          color: qs[i].lineColor ? qs[i].lineColor : 'green',
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
          aSeries.data.push({ x: x, y: y });
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

  const fetchData = async () => {
    const allData = [];

    for (let c = 0; c < queries.length; c++) {
      let filteredQuery = queries[c].query;

      let since = '';

      if (platformContext && platformContext.timeRange) {
        if (platformContext.timeRange.duration) {
          since = ` since ${platformContext.timeRange.duration /
            60 /
            1000} MINUTES AGO`;
        } else if (
          platformContext.timeRange.begin_time &&
          platformContext.timeRange.end_time
        ) {
          since = ` since ${platformContext.timeRange.begin_time} until ${platformContext.timeRange.end_time}`;
        }
      }

      if (since !== '') {
        filteredQuery += since;
      }

      if (nerdletContext) {
        if (nerdletContext.filters) {
          filteredQuery += ` WHERE ${nerdletContext.filters} `;
        }
      }
      const resp = await NrqlQuery.query({
        accountIds: [queries[c].accountId],
        query: filteredQuery
      });
      allData.push(resp);
    }

    return allData;
  };

  const customTimeseries = useMemo(() => {
    if (nrqlResults && errors.length === 0 && !loading) {
      if (chartType === 'line') {
        return <LineChart data={nrqlResults} fullHeight fullWidth />;
      }
      if (chartType === 'area') {
        return <AreaChart data={nrqlResults} fullHeight fullWidth />;
      }
    }

    return '';
  }, [nrqlResults, errors, loading]);

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
        setLoading(true);
        const data = await fetchData();
        const formattedData = await formatTimeData(data, queries);
        setNrqlResults(formattedData);
        setLoading(false);
      };
      loadData();
    }
  }, [platformContext, nerdletContext, queries]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <>
      {showDocs && <Docs />}
      {customTimeseries}
    </>
  );
};

export default CustomTimeseries;
