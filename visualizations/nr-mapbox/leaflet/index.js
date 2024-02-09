import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet-color-markers';

import 'leaflet/dist/leaflet.css';
import { parseLatLngBounds } from '../utils';

const availableMarkerColors = [
  'blue',
  'gold',
  'red',
  'green',
  'orange',
  'yellow',
  'violet',
  'grey',
  'black'
];

function LeafletRoot(props) {
  const {
    initialLat,
    initialLong,
    initialZoom,
    defaultMarkerColor,
    defaultMarkerImgURL,
    defaultImgWidth,
    defaultImgHeight,
    mapLocations,
    maxBoundsSouthWest,
    maxBoundsNorthEast
  } = props;
  //   const [popupInfo, setPopupInfo] = useState(null);

  const position = [
    !initialLat || isNaN(initialLat)
      ? 37.791536840426495
      : parseFloat(initialLat),

    !initialLong || isNaN(initialLong)
      ? -122.3929926594833
      : parseFloat(initialLong)
  ];

  const maxBounds = parseLatLngBounds(maxBoundsSouthWest, maxBoundsNorthEast);

  return (
    <>
      <MapContainer
        style={{ height: '100vh', width: '100wh' }}
        center={position}
        zoom={!initialZoom || isNaN(initialZoom) ? 7 : parseFloat(initialZoom)}
        maxBounds={maxBounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapLocations.map((mapData, mapIndex) => {
          const { data, marker, targetName, targetRotate } = mapData;

          const locName = data[`name:${targetName}`];
          const rotate = data[`rotate:${targetRotate}`];
          const { lat, lng } = data['mapWidget.coordinates'];
          const popupData = { ...data, locName, lng, lat };

          //   const customIcon = marker?.imgUrl
          //     ? new L.Icon({
          //         iconUrl: marker?.imgUrl,
          //         iconSize: [
          //           marker?.imgWidth || defaultImgWidth || 25,
          //           marker?.imgHeight || defaultImgHeight || 25
          //         ] // Set the size of your custom marker image
          //         // iconAnchor: [anchorX, anchorY], // Set the anchor point of your custom marker image
          //         // popupAnchor: [popupAnchorX, popupAnchorY], // Set the popup anchor point of your custom marker image
          //       })
          //     : undefined;

          let iconUrl = marker?.imgUrl || defaultMarkerImgURL;

          if (
            availableMarkerColors.includes(
              marker?.markerColor || defaultMarkerColor
            )
          ) {
            iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${marker?.markerColor ||
              defaultMarkerColor}.png`;
          } else if (!iconUrl) {
            iconUrl =
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
          }

          const customIcon = new Icon({
            iconColor: marker?.markerColor || defaultMarkerColor,
            iconUrl,
            iconSize: [
              marker?.imgWidth || defaultImgWidth || 25,
              marker?.imgHeight || defaultImgHeight || 41
            ] // size of the icon
            // iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
            // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
          });

          return (
            <Marker
              icon={customIcon}
              key={mapIndex}
              style={{
                transform: rotate ? `rotate(${rotate}deg)` : undefined,
                color: marker?.markerColor || defaultMarkerColor
              }}
              position={[lat, lng]}
              //   onClick={e => {
              //     // If we let the click event propagates to the map, it will immediately close the popup
              //     // with `closeOnClick: true`
              //     e.originalEvent.stopPropagation();
              //     setPopupInfo(popupData);
              //   }}
            >
              {/* {!marker?.imgUrl && defaultMarkerImgURL && (
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
              )} */}

              <Popup position={[lat, lng]}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>
                    {popupData.locName}
                  </span>
                  <br />
                  {Object.keys(popupData).map(key => {
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
                          {key}: {popupData[key]}
                          <br />
                        </>
                      );
                    } else {
                      return '';
                    }
                  })}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}

export default LeafletRoot;
