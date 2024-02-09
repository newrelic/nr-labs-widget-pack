import React, { useState } from 'react';
import Map, {
  Marker,
  GeolocateControl,
  FullscreenControl,
  NavigationControl,
  ScaleControl,
  Popup
} from 'react-map-gl';
import { parseLatLngBoundsForMapbox } from '../utils';

function MapBoxRoot(props) {
  const {
    initialLat,
    initialLong,
    initialZoom,
    defaultMarkerColor,
    defaultMarkerImgURL,
    defaultImgWidth,
    defaultImgHeight,
    mapStyle,
    mapBoxToken,
    mapLocations,
    maxBoundsSouthWest,
    maxBoundsNorthEast
  } = props;
  const [popupInfo, setPopupInfo] = useState(null);

  return (
    <>
      <Map
        maxBounds={parseLatLngBoundsForMapbox(
          maxBoundsSouthWest,
          maxBoundsNorthEast
        )}
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
          const { lat, lng } = data['mapWidget.coordinates'];

          return (
            <Marker
              key={mapIndex}
              longitude={lng}
              latitude={lat}
              color={marker?.markerColor || defaultMarkerColor}
              onClick={e => {
                // If we let the click event propagates to the map, it will immediately close the popup
                // with `closeOnClick: true`
                e.originalEvent.stopPropagation();
                setPopupInfo({
                  ...data,
                  locName,
                  lng,
                  lat
                });
              }}
            >
              {!marker?.imgUrl && defaultMarkerImgURL && (
                <img
                  src={defaultMarkerImgURL}
                  width={marker?.imgWidth || defaultImgWidth || 25}
                  height={marker?.imgHeight || defaultImgHeight || 25}
                  style={{
                    transform: rotate ? `rotate(${rotate}deg)` : undefined
                  }}
                />
              )}
              {marker?.imgUrl && (
                <img
                  src={marker?.imgUrl}
                  width={marker?.imgWidth || defaultImgWidth || 25}
                  height={marker?.imgHeight || defaultImgHeight || 25}
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
            longitude={Number(popupInfo.lng)}
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
                  !key.includes('data') &&
                  !key.includes('mapWidget.coordinates')
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
    </>
  );
}

export default MapBoxRoot;
