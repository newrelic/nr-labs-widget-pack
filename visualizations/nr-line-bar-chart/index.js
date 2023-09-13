import React, { useContext, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
  BlockText,
  List,
  ListItem,
  NerdletStateContext,
  PlatformStateContext
} from 'nr1';

import { useInterval } from '@mantine/hooks';
import dayjs from 'dayjs';

import Docs from './docs';

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
    lineQueries,
    barQueries,
    showDocs,
    tickFormat
  } = props;
  const [errors, setErrors] = useState([]);
  const [dataSets, setDataSets] = useState([]);
  const [barData, setBarData] = useState({});
  const [lineData, setLineData] = useState({});

  const [loading, setLoading] = useState(true);
  const platformContext = useContext(PlatformStateContext);
  const { filters } = useContext(NerdletStateContext);
  const { timeRange } = platformContext;

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];

    if ((lineQueries || []).length === 0) {
      tempErrors.push({ name: 'You need to supply at least one line query' });
    } else {
      lineQueries.forEach((t, i) => {
        const { query, accountId } = t;
        const lowerQuery = (query || '').toLowerCase();
        const errorObj = { name: `Line Query ${i + 1}`, errors: [] };

        if (!lowerQuery) {
          errorObj.errors.push(`Query is undefined`);
        } else if (lowerQuery.trim() === 'from') {
          errorObj.errors.push(`Query is undefined`);
        }
        if (!lowerQuery.includes('timeseries')) {
          errorObj.errors.push(`Requires TIMESERIES keyword`);
        }
        if (!accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrors.push(errorObj);
        }
      });
    }

    if ((barQueries || []).length === 0) {
      tempErrors.push({ name: 'You need to supply at least one bar query' });
    } else {
      (barQueries || []).forEach((t, i) => {
        const { query, accountId, name } = t;
        const lowerQuery = (query || '').toLowerCase();
        const errorObj = { name: `Bar Query ${i + 1}`, errors: [] };

        if (!name) {
          errorObj.errors.push(`Name is undefined`);
        }
        if (!lowerQuery) {
          errorObj.errors.push(`Query is undefined`);
        } else if (lowerQuery.trim() === 'from') {
          errorObj.errors.push(`Query is undefined`);
        }
        if (!lowerQuery.includes('timeseries')) {
          errorObj.errors.push(`Requires TIMESERIES keyword`);
        }
        if (!accountId) {
          errorObj.errors.push(`AccountID is undefined`);
        }

        if (errorObj.errors.length > 0) {
          tempErrors.push(errorObj);
        }
      });
    }

    setErrors(tempErrors);

    setLoading(false);
  }, [lineQueries, barQueries]);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, barQueries, lineQueries]);

  const interval = useInterval(() => {
    if (lineQueries.length > 0 && errors.length === 0) {
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

    (lineQueries || []).forEach(q => {
      const { accountId, query, enableFilters, color, name } = q;

      /* eslint-disable */
      const newQuery = `${query} ${enableFilters ? filters || '' : ''} ${enableTimePicker ? timeQuery : ''
        }`;
      /* eslint-enable */

      queries.push({ query: newQuery, accountId, type: 'line', color, name });
    });

    (barQueries || [])
      .filter(e => e.accountId && e.query && e.name)
      .forEach(q => {
        const { accountId, query, enableFilters, color, name, barSize } = q;

        /* eslint-disable */
        const newQuery = `${query} ${enableFilters ? filters || '' : ''} ${enableTimePicker ? timeQuery : ''
          }`;
        /* eslint-enable */

        queries.push({
          query: newQuery,
          accountId,
          type: 'bar',
          color,
          name,
          barSize
        });
      });

    // eslint-disable-next-line
    console.log(`fetching data ${new Date().toLocaleTimeString()}`);
    // eslint-disable-next-line
    console.log(`queries ${JSON.stringify(queries)}`);

    const nrqlData = await Promise.all(queries.map(q => doNrql(q)));

    // perform data merging
    const finalData = [];
    const lineData = {};
    const barData = {};

    (nrqlData || []).forEach(d => {
      const { data, color, name, type, barSize } = d;

      (data || []).forEach(groupData => {
        const hasFacet = groupData.metadata.groups.find(
          g => g.type === 'facet'
        );
        groupData.metadata.color =
          hasFacet || !color ? groupData.metadata.color : color;

        const dataKey = groupData.metadata.groups.find(
          g => g.type === 'function'
        )?.value;

        groupData.data.forEach(gd => {
          if (dataKey) {
            const value = gd[dataKey];

            const baseName = `${name} - ${groupData.metadata.name}`;

            const entry = {
              time: gd.begin_time,
              [`${type === 'line' ? 'L' : 'B'}:${baseName}`]: value
            };

            finalData.push(entry);

            if (type === 'line') {
              if (!lineData[`L:${baseName}`]) {
                lineData[`L:${baseName}`] = {
                  results: [entry],
                  name,
                  color: groupData.metadata.color
                };
              } else {
                lineData[`L:${baseName}`].results.push(entry);
              }
            } else if (type === 'bar') {
              if (!barData[`B:${baseName}`]) {
                barData[`B:${baseName}`] = {
                  results: [entry],
                  barSize: barSize > 0 ? barSize : 20,
                  name,
                  color: groupData.metadata.color
                };
              } else {
                barData[`B:${baseName}`].results.push(entry);
              }
            }
          }
        });
      });
    });

    setBarData(barData);
    setLineData(lineData);
    setDataSets(finalData);
  };

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return ErrorState(errors, showDocs);
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
              dataKey="time"
              domain={['auto', 'auto']}
              name="Time"
              tickFormatter={unixTime =>
                dayjs(unixTime).format(tickFormat || 'YYYY-MM-DD')
              }
              type="number"
            />
            {/* <XAxis dataKey="day" scale="band" /> */}
            <YAxis />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />

            {Object.keys(barData).map(bar => (
              <Bar
                key={bar}
                dataKey={bar}
                barSize={parseInt(barData?.[bar]?.barSize || 20)}
                fill={barData?.[bar]?.color}
              />
            ))}

            {Object.keys(lineData).map(line => (
              <Line
                yAxisId="right"
                type="monotone"
                key={line}
                dataKey={line}
                barSize={20}
                stroke={lineData?.[line]?.color}
              />
            ))}
          </ComposedChart>
        </>
      )}
    </AutoSizer>
  );
}

const ErrorState = (errors, showDocs) => (
  <Card className="DocState">
    <CardBody className="ErrorState-cardBody">
      <div className="ErrorState-errors">
        <HeadingText
          spacingType={[
            HeadingText.SPACING_TYPE.LARGE,
            HeadingText.SPACING_TYPE.OMIT
          ]}
          type={HeadingText.TYPE.HEADING_2}
        >
          Sorry, there was a problem!
        </HeadingText>

        <HeadingText
          type={HeadingText.TYPE.HEADING_6}
          spacingType={[
            HeadingText.SPACING_TYPE.OMIT,
            HeadingText.SPACING_TYPE.LARGE,
            HeadingText.SPACING_TYPE.LARGE,
            HeadingText.SPACING_TYPE.LARGE
          ]}
        >
          Enable the documentation toggle in the edit settings for more help.
        </HeadingText>

        {(errors || []).map((err, idx) => (
          <div key={idx} className="ErrorState-errorBody">
            <HeadingText
              spacingType={[
                HeadingText.SPACING_TYPE.OMIT,
                HeadingText.SPACING_TYPE.OMIT,
                HeadingText.SPACING_TYPE.SMALL,
                HeadingText.SPACING_TYPE.OMIT
              ]}
            >
              {err.name}
            </HeadingText>
            <BlockText>
              <List>
                {(err?.errors || []).map((err, i) => (
                  <ListItem style={{ paddingBottom: '2px' }} key={i}>
                    {err}
                  </ListItem>
                ))}
              </List>
            </BlockText>
          </div>
        ))}
      </div>
      {showDocs && <Docs />}
    </CardBody>
  </Card>
);
