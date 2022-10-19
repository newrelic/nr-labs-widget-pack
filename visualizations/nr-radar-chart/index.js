import React, { useEffect, useState, useContext } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  NerdletStateContext
} from 'nr1';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function MultiLineRoot(props) {
  const {
    query = '',
    accountId,
    backgroundColor,
    borderColor,
    borderWidth = 1,
    chartKey = '# Key',
    enableFilters
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filters } = useContext(NerdletStateContext);

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];
    const lowerQuery = (query || '').toLowerCase();

    if (!accountId) {
      tempErrors.push('configure Account ID');
    }
    if (!lowerQuery) {
      tempErrors.push('configure query');
    }
    if (!lowerQuery.includes('facet')) {
      tempErrors.push('should contain FACET');
    }

    setErrors(tempErrors);

    if (tempErrors.length === 0) {
      const queryData = await NrqlQuery.query({
        query: `${query} ${enableFilters ? filters : ''}`,
        accountIds: [accountId]
      });
      // eslint-disable-next-line
      console.log(queryData);

      setDataSets(queryData);
    }

    setLoading(false);
  }, [
    query,
    accountId,
    filters,
    enableFilters,
    chartKey,
    backgroundColor,
    borderColor,
    borderWidth
  ]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return ErrorState(errors);
  }

  const data = {
    labels: (dataSets?.data || []).map(d => d.metadata?.name),
    datasets: [
      {
        label: chartKey,
        data: (dataSets?.data || []).map(d => d.data?.[0]?.y),
        backgroundColor: backgroundColor || 'rgba(255, 99, 132, 0.2)',
        borderColor: borderColor || 'rgba(255, 99, 132, 1)',
        borderWidth: parseInt(borderWidth)
      }
    ]
  };

  return (
    <Radar
      width={100}
      height={50}
      options={{ maintainAspectRatio: false }}
      data={data}
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
