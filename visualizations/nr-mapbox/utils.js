const cities = require('./cities.json');

export const excludedKeys = ['entity.guid', 'isWorkload'];

export const evaluateMarker = (sample, markerThresholds) => {
  if (sample && markerThresholds && markerThresholds.length > 0) {
    const sortedThresholds = markerThresholds.sort((a, b) => {
      const aNo = !isEmpty(a.priority) ? a.priority : 99999;
      const bNo = !isEmpty(b.priority) ? b.priority : 99999;
      return parseInt(aNo) - parseInt(bNo);
    });

    for (let z = 0; z < sortedThresholds.length; z++) {
      const {
        targetAttribute,
        regexMatch,
        valueEqual,
        valueAbove,
        valueBelow,
        nullHandling,
        zeroHandling,
        emptyHandling,
        markerColor,
        bgColor,
        fontColor,
        imgUrl,
        imgWidth,
        imgHeight
      } = sortedThresholds[z];

      const marker = {
        markerColor,
        bgColor,
        fontColor,
        imgUrl,
        imgWidth,
        imgHeight
      };

      if (targetAttribute in sample) {
        const targetValue = sample[targetAttribute];

        if (!isNaN(targetValue)) {
          if (!isEmpty(valueBelow) && !isEmpty(valueAbove)) {
            if (targetValue < valueBelow && targetValue > valueAbove) {
              return marker;
            }
          } else if (!isEmpty(valueAbove) && targetValue > valueAbove) {
            return marker;
          } else if (!isEmpty(valueBelow) && targetValue < valueBelow) {
            return marker;
            // eslint-disable-next-line
          } else if (!isEmpty(valueEqual) && targetValue == valueEqual) {
            // loose equality to support string and number
            return marker;
          }
        } else if (!isEmpty(regexMatch)) {
          const valueRegex = new RegExp(regexMatch);
          if (valueRegex.test(targetValue)) {
            return marker;
          }
        }

        if (targetValue === 0 && zeroHandling) {
          return marker;
        }

        if (targetValue === '' && emptyHandling) {
          return marker;
        }

        if (
          (targetValue === undefined || targetValue === null) &&
          nullHandling
        ) {
          return marker;
        }
      }
    }
  }

  return null;
};

/**
 * Returns true when the provided value is either null, undefined or an empty string
 *
 * @param {any} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return [null, undefined, ''].includes(value);
}

// handle deriving coordinates from various parts of the sample
export const deriveLatLng = sample => {
  const { facet, lat, lng, latitude, longitude, coordinates, city } = sample;
  //
  // check facet for coordinates first
  //
  if (facet) {
    if (facet.length > 1) {
      // check for default facet lat,lng coordinates
      const facetLat = parseFloat(facet[0]);
      const facetLng = parseFloat(facet[1]);

      if (confirmLatLng(facetLat, facetLng)) {
        return { lat: facetLat, lng: facetLng };
      }
    }

    if (facet.length > 0) {
      if (facet[0].includes(',')) {
        const { splitLat, splitLng } = coordinateSplitter(facet[0]);

        if (confirmLatLng(splitLat, splitLng)) {
          return { lat: splitLat, lng: splitLng };
        }
      }
    }
  }

  //
  // check sample for coordinates
  //

  // check sample for lat, lng
  if (lat && lng) {
    const facetLat = parseFloat(lat);
    const facetLng = parseFloat(lng);

    if (confirmLatLng(facetLat, facetLng)) {
      return { lat: facetLat, lng: facetLng };
    }
  }

  // check sample for latitude, longitude
  if (latitude && longitude) {
    const facetLat = parseFloat(latitude);
    const facetLng = parseFloat(longitude);

    if (confirmLatLng(facetLat, facetLng)) {
      return { lat: facetLat, lng: facetLng };
    }
  }

  // check sample for coordinates
  if ((coordinates || '').includes(',')) {
    const { splitLat, splitLng } = coordinateSplitter(coordinates);

    if (confirmLatLng(splitLat, splitLng)) {
      return { lat: splitLat, lng: splitLng };
    }
  }

  // check if sample contains city and attempt a reverse lookup
  if (city) {
    const lowerCity = city.toLowerCase();
    const foundCity = cities.find(c => c.name.toLowerCase() === lowerCity);
    if (foundCity) {
      return { lat: foundCity.lat, lng: foundCity.lng };
    }
  }

  // eslint-disable-next-line
  console.log('unable to derive coordinates from sample', sample);

  return null;
};

// attempt to extract the following formats
// -10,20
// 10,-20
// 30.12, -40
// -30, 44.444
// (-10,20.346)
// (10.566,-20)
// (30.23, -40.2)
// (-30.1, 44.34)
// ( -10,20.346 )
// ( 10.566,-20 )
// ( 30.23, -40.2 )
// ( -30.1, 44.34 )
export const coordinateSplitter = value => {
  const latLngSplit = value
    .replaceAll('(', '')
    .replaceAll(')', '')
    .split(',');

  const splitLat = parseFloat(latLngSplit[0].trim());
  const splitLng = parseFloat(latLngSplit[1].trim());

  return { splitLat, splitLng };
};

export const confirmLatLng = (lat, lng) => {
  if (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return true;
  }

  return false;
};

export const parseLatLngBounds = (southWestCorner, northEastCorner) => {
  try {
    // Split the input strings by comma to separate latitude and longitude
    const swCoords = southWestCorner
      .split(',')
      .map(coord => parseFloat(coord.trim()));
    const neCoords = northEastCorner
      .split(',')
      .map(coord => parseFloat(coord.trim()));

    // Check if any of the parsing failed or if we didn't get exactly two numbers for each corner
    if (
      swCoords.length !== 2 ||
      neCoords.length !== 2 ||
      swCoords.some(isNaN) ||
      neCoords.some(isNaN)
    ) {
      throw new Error(
        'Parsing error: One of the inputs is not a valid lat,lng pair.'
      );
    }

    // Return the parsed bounds
    return [swCoords, neCoords];
  } catch (error) {
    // eslint-disable-next-line
    console.log(error.message, southWestCorner, northEastCorner);
    return undefined;
  }
};

export const parseLatLngBoundsForMapbox = (
  southWestCorner,
  northEastCorner
) => {
  try {
    // Split the input strings by comma to separate latitude and longitude
    const swCoords = southWestCorner
      .split(',')
      .map(coord => parseFloat(coord.trim()));
    const neCoords = northEastCorner
      .split(',')
      .map(coord => parseFloat(coord.trim()));

    // Check if any of the parsing failed or if we didn't get exactly two numbers for each corner
    if (
      swCoords.length !== 2 ||
      neCoords.length !== 2 ||
      swCoords.some(isNaN) ||
      neCoords.some(isNaN)
    ) {
      throw new Error(
        'Parsing error: One of the inputs is not a valid lat,lng pair.'
      );
    }

    // Convert to Mapbox bounds format: [[westLng, southLat], [eastLng, northLat]]
    const mapboxBounds = [
      [swCoords[1], swCoords[0]], // Southwest corner (longitude, latitude)
      [neCoords[1], neCoords[0]] // Northeast corner (longitude, latitude)
    ];

    return mapboxBounds;
  } catch (error) {
    // eslint-disable-next-line
    console.log(error.message, southWestCorner, northEastCorner);
    return undefined;
  }
};
