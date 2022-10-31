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
          } else if (!isEmpty(valueEqual) && targetValue === valueEqual) {
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
