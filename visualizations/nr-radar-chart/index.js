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
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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

function RadarRoot(props) {
  const {
    query = '',
    accountId,
    backgroundColor,
    borderColor,
    borderWidth = 1,
    chartKey = '# Key',
    enableFilters,
    useTimeRange
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const platformContext = useContext(PlatformStateContext);
  const { filters } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;

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
      let finalQuery = query;
      if (useTimeRange) {
        finalQuery += ` ${timeRangeToNrql(timeRange)}`;
      }

      if (enableFilters) {
        const filterClause = filters ? `WHERE ${filters}` : '';
        finalQuery += ` ${filterClause}`;
      }

      // eslint-disable-next-line
      console.log(`NRQL Query: ${finalQuery}`);

      const queryData = await NrqlQuery.query({
        query: finalQuery,
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
    useTimeRange,
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

export default RadarRoot;
