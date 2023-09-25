import React, { useEffect, useState, useContext } from 'react';
import { NrqlQuery, Spinner, LineChart, NerdletStateContext } from 'nr1';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';

const nrColors = require('../../utils/nrColors.json');

function MultiLineRoot(props) {
  const {
    query = '',
    accountId,
    compareOver,
    comparePeriod,
    customSinceClause,
    showDocs
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filters } = useContext(NerdletStateContext);

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];
    const tempDataSets = [];
    const errorObj = { name: `Query`, errors: [] };

    const lowerQuery = (query || '').toLowerCase();

    if (!accountId) {
      errorObj.errors.push(`AccountID is undefined`);
    }
    if (!lowerQuery) {
      errorObj.errors.push(`Query is undefined`);
    }
    if (lowerQuery.includes('since')) {
      errorObj.errors.push(`Should NOT contain SINCE `);
    }
    if (lowerQuery.includes('until')) {
      errorObj.errors.push(`Should NOT contain UNTIL `);
    }
    if (lowerQuery.includes('compare')) {
      errorObj.errors.push(`Should NOT contain COMPARE `);
    }
    if (!compareOver || compareOver === 'select') {
      errorObj.errors.push(`Configure compare over`);
    }
    if (!comparePeriod || isNaN(comparePeriod) || parseInt(comparePeriod) < 1) {
      errorObj.errors.push(`compare period should be 1 or more`);
    }

    if (errorObj.errors.length > 0) {
      tempErrors.push(errorObj);
    }
    setErrors(tempErrors);

    if (tempErrors.length === 0) {
      /* eslint-disable */
      const baseQuery = `${query} ${!lowerQuery.includes('timeseries') ? 'TIMESERIES' : ''
        } ${customSinceClause || `SINCE 1 ${compareOver} ago`} COMPARE WITH`;
      /* eslint-enable */

      const queries = [];
      const filterClause = filters ? `WHERE ${filters}` : '';
      for (let z = 1; z < parseInt(comparePeriod) + 1; z++) {
        const newQuery = `${baseQuery} ${z} ${compareOver} ago ${filterClause}`;
        queries.push(newQuery);
      }
      // eslint-disable-next-line
      console.log(queries);

      const queryPromises = queries.map(q =>
        NrqlQuery.query({ query: q, accountIds: [accountId] })
      );
      const queryData = await Promise.all(queryPromises);
      // console.log(queryData);

      // keep the entire first data set data[0,1], then retain only the second data[1] from each subsequent
      // +manually handle colors as nrql will return default base color constantly
      queryData.forEach((d, i) => {
        if (i === 0) {
          d.data[0].metadata.name = 'Current';
          d.data[0].metadata.groups[1].displayName = 'Current';
          d.data[0].metadata.color =
            nrColors[Math.round((i + 1) % nrColors.length).toFixed(0)];
          d.data[1].metadata.name = `1 ${compareOver} ago`;
          d.data[1].metadata.groups[1].displayName = `1 ${compareOver} ago`;
          d.data[1].metadata.color =
            nrColors[Math.round((i + 2) % nrColors.length).toFixed(0)];
          tempDataSets.push(d.data[0], d.data[1]);
        } else {
          d.data[1].metadata.color =
            nrColors[Math.round((i + 3) % nrColors.length).toFixed(0)];
          d.data[1].metadata.name = `${i + 1} ${compareOver}s ago`;
          d.data[1].metadata.groups[1].displayName = `${i +
            1} ${compareOver}s ago`;
          tempDataSets.push(d.data[1]);
        }
      });

      setDataSets(tempDataSets);
    }

    setLoading(false);
  }, [
    query,
    accountId,
    compareOver,
    comparePeriod,
    customSinceClause,
    filters
  ]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  return (
    <>
      {showDocs && <Docs />}
      <LineChart
        data={dataSets}
        fullHeight
        fullWidth
        style={{ overflowX: 'hidden' }}
      />
    </>
  );
}

export default MultiLineRoot;
