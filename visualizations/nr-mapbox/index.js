import React, { useEffect, useState, useContext } from 'react';
import {
  Card,
  CardBody,
  HeadingText,
  Spinner,
  NerdletStateContext,
  NerdGraphQuery,
  PlatformStateContext
} from 'nr1';
import Map, {
  Marker,
  GeolocateControl,
  FullscreenControl,
  NavigationControl,
  ScaleControl,
  Popup
} from 'react-map-gl';

import { evaluateMarker } from './utils';

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
      nrql(query: "${query}") {
        results
      }
    }
  }
}`;

function MapBoxRoot(props) {
  const {
    nrqlQueries,
    initialLat,
    initialLong,
    initialZoom,
    defaultMarkerColor,
    defaultMarkerImgURL,
    mapStyle,
    markerThresholds,
    mapBoxToken,
    pollInterval
  } = props;
  const [popupInfo, setPopupInfo] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [fetching, setFetching] = useState(false);
  const [mapLocations, setMapLocations] = useState([]);
  const { filters } = useContext(NerdletStateContext);
  const platformContext = useContext(PlatformStateContext);
  const { timeRange } = platformContext;
  const timeRangeStr = timeRangeToNrql(timeRange);

  useEffect(() => {
    const link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href =
      'https://api.tiles.mapbox.com/mapbox-gl-js/v2.10.0/mapbox-gl.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (pollInterval) {
      // eslint-disable-next-line
      console.log(`poll interval updated:  ${pollInterval}`);
    }

    fetchData();
    let POLL_INTERVAL =
      !pollInterval || isNaN(pollInterval) ? 60000 : pollInterval * 1000;
    if (POLL_INTERVAL < 5000) POLL_INTERVAL = 5000;

    const pollData = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL);

    return () => clearInterval(pollData);
  }, [pollInterval, nrqlQueries, markerThresholds, filters, timeRangeStr]);

  const fetchData = async () => {
    // setFetching(true);

    if (errors.length === 0) {
      // eslint-disable-next-line
      console.log(`fetching data @ ${new Date().toLocaleTimeString()}`);
      // build array of promises to fetch data
      const dataPromises = nrqlQueries.map(nrql => {
        const { query, accountId, enableFilters, enableTimePicker } = nrql;
        let newQuery = query;

        if (enableFilters && filters) {
          newQuery += ` WHERE ${filters}`;
        } else {
          newQuery = newQuery.replace(`WHERE ${filters}`, '');
        }

        if (enableTimePicker) {
          newQuery += ` ${timeRangeStr}`;
        }

        // eslint-disable-next-line
        console.log(enableFilters, newQuery);

        return NerdGraphQuery.query({
          query: gqlNrqlQuery(accountId, newQuery)
        });
      });

      const nrdbResults = await Promise.allSettled(dataPromises);

      const cleanData = nrdbResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value?.data?.actor?.account?.nrql?.results)
        .filter(a => a)
        .flat();

      const newMapLocations = cleanData.map(sample => {
        const { facet } = sample;
        let targetName = 'name';
        let targetRotate = 'rotate';

        Object.keys(sample).forEach(key => {
          if (key.startsWith('latest.')) {
            const newKey = key.replace('latest.', '');
            sample[newKey] = sample[key];
            delete sample[key];
          }

          if (key.startsWith('name:')) {
            targetName = key;
          } else if (key.startsWith('rotate:')) {
            targetRotate = key;
          }
        });

        const obj = {
          lat: facet[0],
          long: facet[1],
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

    if (!mapBoxToken) {
      tempErrors.push('Map Box Access Token required');
    }

    nrqlQueries.forEach((nrql, index) => {
      const lowerQuery = (nrql.query || '').toLowerCase();

      if (!lowerQuery) {
        tempErrors.push(`${index + 1}: Query undefined`);
      } else {
        if (!lowerQuery.includes('facet')) {
          tempErrors.push(`${index + 1}: Query should contain facet`);
        }
        if (!lowerQuery.includes('name:')) {
          tempErrors.push(
            `${index +
              1}: Query should specify a name eg. "SELECT latest(flightNo) as 'name:Flight No FROM..."' `
          );
        }
      }

      if (!nrql.accountId)
        tempErrors.push(`${index + 1}: Account ID undefined`);
    });

    setErrors(tempErrors);

    setLoading(false);
  }, [nrqlQueries, mapBoxToken]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return ErrorState(errors);
  }

  return (
    <Map
      initialViewState={{
        longitude:
          !initialLong || isNaN(initialLong)
            ? -122.3929926594833
            : parseFloat(initialLong),
        latitude:
          !initialLat || isNaN(initialLat)
            ? 37.791536840426495
            : parseFloat(initialLat),
        zoom: !initialZoom || isNaN(initialZoom) ? 2 : parseFloat(initialZoom)
      }}
      // ref={this.mapRef}
      mapboxAccessToken={mapBoxToken}
      mapStyle={mapStyle || 'mapbox://styles/mapbox/streets-v11'}
      // onViewportChange={viewport =>
      //   this.handleViewportChanged(viewport, updateMapContext)
      // }
      // onClick={this.handleMapClick}
      // onHover={map => this.handleMapClick(map, true)}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="top-left" />
      <ScaleControl />

      {mapLocations.map((mapData, mapIndex) => {
        const { data, marker, targetName, targetRotate } = mapData;

        const locName = data[`name:${targetName}`];
        const rotate = data[`rotate:${targetRotate}`];

        return (
          <Marker
            key={mapIndex}
            longitude={mapData.long}
            latitude={mapData.lat}
            color={marker?.markerColor || defaultMarkerColor}
            onClick={e => {
              // If we let the click event propagates to the map, it will immediately close the popup
              // with `closeOnClick: true`
              e.originalEvent.stopPropagation();
              setPopupInfo({
                ...data,
                locName,
                long: mapData.long,
                lat: mapData.lat
              });
            }}
          >
            {!marker?.imgUrl && defaultMarkerImgURL && (
              <img src={defaultMarkerImgURL} width={25} height={25} />
            )}
            {marker?.imgUrl && (
              <img
                src={marker?.imgUrl}
                width={marker?.imgWidth || 25}
                height={marker?.imgHeight || 25}
                style={{
                  transform: rotate ? `rotate(${rotate}deg)` : undefined
                }}
              />
            )}
          </Marker>
        );
      })}
      {popupInfo && (
        <Popup
          anchor="top"
          longitude={Number(popupInfo.long)}
          latitude={Number(popupInfo.lat)}
          onClose={() => setPopupInfo(null)}
        >
          <div>
            <span style={{ fontWeight: 'bold' }}>{popupInfo.locName}</span>
            <br />
            {Object.keys(popupInfo).map(key => {
              if (
                !key.includes('name:') &&
                !key.includes('rotate:') &&
                !key.includes('facet') &&
                !key.includes('locName') &&
                !key.includes('data')
              ) {
                return (
                  <>
                    {key}: {popupInfo[key]}
                    <br />
                  </>
                );
              } else {
                return '';
              }
            })}
          </div>
        </Popup>
      )}
    </Map>
  );
}

const ErrorState = errors => (
  <Card className="ErrorState">
    <CardBody
      className="ErrorState-cardBody"
      style={{ marginTop: 0, marginBottom: 0 }}
    >
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_1}
      >
        Setup Guide
      </HeadingText>
      <span
        className="ErrorState-headingText"
        onClick={() => window.open('https://account.mapbox.com/auth/signup/')}
        style={{ cursor: 'pointer', fontSize: '16px', color: 'blue' }}
      >
        Go to https://account.mapbox.com/auth/signup/ to sign up and get a Map
        Box Access Token.
      </span>
      <br />
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_4}
      >
        Your query must contain:
      </HeadingText>
      <span>
        - One alias with 'name:SOME_VALUE' which will be used as the marker name
      </span>
      <br />
      <span>
        - Have a FACET for latitude and longitude, use precision to ensure the
        FACET does not round the number eg.
      </span>
      <br />
      <span>
        FACET string(lat, precision: 5) as 'lat', string(lng, precision: 5) as
        'lng'
      </span>
      <br />
      <span>
        Rotation can optionally be set using the following alias with
        'rotate:SOME_VALUE'
      </span>
      <br />
      <span>
        - Example Query:{' '}
        <b>
          FROM FlightData SELECT latest(flightNo) as 'name:Flight No',
          latest(track) as 'rotate:track', latest(departure),
          latest(destination) FACET string(lat, precision: 5) as 'lat',
          string(lng, precision: 5) as 'lng' SINCE 60 seconds ago LIMIT MAX
        </b>
      </span>
      <br />
      <br />
      <hr />
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_1}
      >
        Hey! you need to do a few more things to get started!
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

export default MapBoxRoot;
