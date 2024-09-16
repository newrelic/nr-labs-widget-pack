import React, { useEffect, useState, useContext } from 'react';
import {
  Spinner,
  NerdletStateContext,
  NerdGraphQuery,
  PlatformStateContext
} from 'nr1';
import { useInterval } from '@mantine/hooks';

import { deriveLatLng, evaluateMarker } from './utils';
import Docs from './docs';
import ErrorState from '../../shared/ErrorState';
import MapBoxRoot from './mapbox';
import LeafletRoot from './leaflet';
import WorkloadModal from './workloadModal';

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

const gqlNrqlQuery = (accountId, query) => `{
  actor {
    account(id: ${accountId}) {
      nrql(query: "${query}", timeout: 120) {
        results
      }
    }
  }
}`;

function MapSystemRoot(props) {
  const {
    nrqlQueries,
    markerThresholds,
    mapBoxToken,
    pollInterval,
    mapSystem,
    showDocs,
    debugEnabled
  } = props;
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [fetching, setFetching] = useState(false);
  const [mapLocations, setMapLocations] = useState([]);
  const { filters } = useContext(NerdletStateContext);
  const platformContext = useContext(PlatformStateContext);
  const { timeRange } = platformContext;
  const timeRangeStr = timeRangeToNrql(timeRange);
  const [workloadStatus, setWorkloadStatus] = useState(null);

  useEffect(() => {
    if (mapSystem === 'mapbox') {
      const link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href =
        'https://api.tiles.mapbox.com/mapbox-gl-js/v2.10.0/mapbox-gl.css';
      document.head.appendChild(link);
    } else if (!mapSystem || mapSystem === 'leaflet') {
      // const link = document.createElement('link');
      // link.type = 'text/css';
      // link.rel = 'stylesheet';
      // link.href = 'http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.css';
      // document.head.appendChild(link);
    }
  }, [mapSystem]);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, nrqlQueries, markerThresholds, filters, timeRangeStr]);

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  const fetchData = async () => {
    // setFetching(true);

    if (errors.length === 0) {
      // eslint-disable-next-line
      console.log(`fetching data @ ${new Date().toLocaleTimeString()}`);
      // build array of promises to fetch data

      let outerQuery = '';
      const dataPromises = nrqlQueries.map(nrql => {
        const { query, accountId, enableFilters, enableTimePicker } = nrql;
        let newQuery = query;
        outerQuery = query;

        if (enableFilters && filters) {
          newQuery += ` WHERE ${filters}`;
        } else {
          newQuery = newQuery.replace(`WHERE ${filters}`, '');
        }

        if (enableTimePicker) {
          newQuery += ` ${timeRangeStr}`;
        }

        return NerdGraphQuery.query({
          query: gqlNrqlQuery(accountId, newQuery)
        });
      });

      const nrdbResults = await Promise.allSettled(dataPromises);

      const cleanData = nrdbResults
        .filter(result => result.status === 'fulfilled')
        .map(result => {
          // console.log(result.value?.data?.actor?.account?.nrql);
          return result.value?.data?.actor?.account?.nrql?.results;
        })
        .filter(a => a)
        .flat()
        .filter(r => {
          Object.keys(r).forEach(key => {
            if (key.startsWith('latest.')) {
              const newKey = key.replace('latest.', '');
              r[newKey] = r[key];
              delete r[key];
            }
          });

          if (r.entityGuid) {
            r['entity.guid'] = r.entityGuid;
            delete r.entityGuid;
          }

          if (outerQuery.includes('WorkloadStatus')) {
            r.isWorkload = true;
          }

          r['mapWidget.coordinates'] = deriveLatLng(r);

          if (r['mapWidget.coordinates']) {
            return true;
          }

          return false;
        });

      if (debugEnabled) {
        // eslint-disable-next-line
        console.log('processedData=>', cleanData);
      }

      const newMapLocations = cleanData.map(sample => {
        let targetName = 'name';
        let targetRotate = 'rotate';

        Object.keys(sample).forEach(key => {
          if (key.startsWith('name:')) {
            targetName = key;
          } else if (key.startsWith('rotate:')) {
            targetRotate = key;
          }
        });

        const { lat, lng } = sample['mapWidget.coordinates'];

        const obj = {
          lat,
          lng,
          data: sample,
          marker: evaluateMarker(sample, markerThresholds)
        };

        if (targetName) obj.targetName = targetName.replace('name:', '');
        if (targetRotate)
          obj.targetRotate = targetRotate.replace('rotate:', '');

        return obj;
      });

      setMapLocations(newMapLocations);
    }

    // setFetching(false);
  };

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];

    if (mapSystem === 'mapbox' && !mapBoxToken) {
      tempErrors.push({ name: 'Map Box Access Token required' });
    }

    nrqlQueries.forEach((nrql, index) => {
      const lowerQuery = (nrql.query || '').toLowerCase();
      const errorObj = { name: ` Query ${index + 1}`, errors: [] };

      if (!lowerQuery) {
        errorObj.errors.push(`Query is undefined`);
      } else {
        // if (!lowerQuery.includes('facet')) {
        //   tempErrors.push(`${index + 1}: Query should contain facet`);
        // }
        // eslint-disable-next-line
        if (!lowerQuery.includes('name:')) {
          errorObj.errors.push(
            `Query should specify a name eg. "SELECT latest(flightNo) as 'name:Flight No' FROM..."`
          );
        }
      }

      if (!nrql.accountId) errorObj.errors.push(`AccountID is undefined`);

      if (errorObj.errors.length > 0) {
        tempErrors.push(errorObj);
      }
    });

    setErrors(tempErrors);

    setLoading(false);
  }, [nrqlQueries, mapBoxToken]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    if (errors.length > 0) {
      return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
    }
  }

  const renderMapSystem = () => {
    if (!mapSystem || mapSystem === 'leaflet') {
      return (
        <LeafletRoot
          {...props}
          mapLocations={mapLocations}
          setWorkloadStatus={setWorkloadStatus}
        />
      );
    } else if (mapSystem === 'mapbox') {
      return (
        <MapBoxRoot
          {...props}
          mapLocations={mapLocations}
          setWorkloadStatus={setWorkloadStatus}
        />
      );
    }
  };

  return (
    <>
      <WorkloadModal
        workloadStatus={workloadStatus}
        setWorkloadStatus={setWorkloadStatus}
      />
      {showDocs && <Docs />}
      {renderMapSystem()}
    </>
  );
}

export default MapSystemRoot;
