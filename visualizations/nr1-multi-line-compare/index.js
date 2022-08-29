import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  LineChart
} from 'nr1';

const nrColors = require('../../utils/nrColors.json');

function MultiLineRoot(props) {
  const {
    query = '',
    accountId,
    compareOver,
    comparePeriod,
    customSinceClause
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];
    const tempDataSets = [];

    const lowerQuery = (query || '').toLowerCase();

    if (!accountId) {
      tempErrors.push('configure Account ID');
    }
    if (!lowerQuery) {
      tempErrors.push('configure query');
    }
    if (lowerQuery.includes('since')) {
      tempErrors.push('should not contain SINCE');
    }
    if (lowerQuery.includes('until')) {
      tempErrors.push('should not contain UNTIL');
    }
    if (lowerQuery.includes('compare')) {
      tempErrors.push('should not contain COMPARE');
    }
    if (!compareOver || compareOver === 'select') {
      tempErrors.push('configure compare over');
    }
    if (!comparePeriod || isNaN(comparePeriod) || parseInt(comparePeriod) < 1) {
      tempErrors.push('compare period should be 1 or more');
    }
    setErrors(tempErrors);

    if (tempErrors.length === 0) {
      const baseQuery = `${query} ${
        !lowerQuery.includes('timeseries') ? 'TIMESERIES' : ''
      } ${customSinceClause || `SINCE 1 ${compareOver} ago`} COMPARE WITH`;

      const queries = [];
      for (let z = 1; z < parseInt(comparePeriod) + 1; z++) {
        const newQuery = `${baseQuery} ${z} ${compareOver} ago`;
        queries.push(newQuery);
      }
      // eslint-disable-next-line
      console.log(queries);

      const queryPromises = queries.map(q =>
        NrqlQuery.query({ query: q, accountId })
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
  }, [query, accountId, compareOver, comparePeriod, customSinceClause]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return ErrorState(errors);
  }

  return (
    <LineChart
      data={dataSets}
      fullHeight
      fullWidth
      style={{ overflowX: 'hidden' }}
    />
  );
}

const ErrorState = errors => (
  <Card className="ErrorState">
    <CardBody className="ErrorState-cardBody">
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Oops! Something went wrong.
      </HeadingText>

      {errors.map(err => (
        <>
          {err}
          <br />
        </>
      ))}
    </CardBody>
  </Card>
);

export default MultiLineRoot;
