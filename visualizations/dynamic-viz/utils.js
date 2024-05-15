/* eslint-disable */

export const assessValue = (value, config) => {
  const {
    targetAttribute,
    regexMatch,
    valueEqual,
    valueAbove,
    valueBelow,
    bgColor,
    fontColor,
    nullHandling,
    zeroHandling,
    emptyHandling
  } = config;
  const result = {};

  if (!isNaN(value)) {
    if (!isEmpty(valueBelow) && !isEmpty(valueAbove)) {
      if (value < valueBelow && value > valueAbove) {
        result.check = 'valueBetween';
      }
    } else if (!isEmpty(valueAbove) && Number(value) > Number(valueAbove)) {
      result.check = 'valueAbove';
    } else if (!isEmpty(valueBelow) && Number(value) < Number(valueBelow)) {
      result.check = 'valueBelow';
    } else if (!isEmpty(valueEqual) && value == valueEqual) {
      result.check = 'valueEqual';
    }
  } else if (!isEmpty(regexMatch)) {
    const valueRegex = new RegExp(regexMatch);
    if (valueRegex.test(value)) {
      result.check = 'regexMatch';
    }
  }

  if (value === 0 && zeroHandling) {
    result.check = 'isZero';
  }

  if (value === '' && emptyHandling) {
    result.check = 'isEmpty';
  }

  if ((value === undefined || value === null) && nullHandling) {
    result.check = 'isNullOrUndefined';
  }

  if (result.check) {
    result.bgColor = bgColor;
    result.fontColor = fontColor;
    result.targetAttribute = targetAttribute;
    result.value = value;

    // massage status levels and colors
    if (bgColor === 'healthy' || bgColor === 'green') {
      result.bgColor = '#3a845e';
      result.fontColor = 'white';
    }

    if (fontColor === 'healthy' || fontColor === 'green') {
      result.fontColor = '#3a845e';
    }

    if (bgColor === 'critical' || bgColor === 'red') {
      result.bgColor = '#a1251a';
      result.fontColor = 'white';
    }

    if (fontColor === 'critical' || fontColor === 'red') {
      result.fontColor = '#a1251a';
    }

    if (bgColor === 'warning' || bgColor === 'orange') {
      result.bgColor = '#f8d45c';
      result.fontColor = 'black';
    }

    if (fontColor === 'warning' || fontColor === 'orange') {
      result.fontColor = '#f8d45c';
    }

    if (bgColor === 'unknown' || bgColor === 'grey') {
      result.bgColor = '#9fa5a5';
    }

    if (fontColor === 'unknown' || fontColor === 'grey') {
      result.fontColor = '#9fa5a5';
    }
  }

  return result;
};

/**
 * Returns true when the provided value is either null, undefined or an empty string
 *
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  return [null, undefined, ''].includes(value);
}

export function parseFiltersToJSON(criteria) {
  if (!criteria || typeof criteria !== 'string') {
    console.log('Invalid or no filters set', criteria);
    return {};
  }

  const operatorsRegex = /\s*=\s*|\s*!=\s*|\s*>\s*|\s*<\s*|\s*"NOT LIKE"\s*|\s*"LIKE"\s*|\s*"IN"\s*|\s*"NOT IN"\s*/;
  let jsonResult = {};

  criteria.split('AND').forEach(part => {
    part = part.trim().replace(/^\(|\)$/g, '');
    let operatorMatch = part.match(operatorsRegex);
    if (!operatorMatch) {
      console.error(`No valid operator found in part: "${part}".`);
      return;
    }
    let operatorx = operatorMatch[0];
    let [key, value] = part
      .split(operatorx)
      .map(s => s.trim().replace(/['"]/g, ''));

    if (!key || !value) {
      console.error(`Invalid key or value in part: "${part}".`);
      return;
    }

    if (operatorx.includes('IN') || operatorx.includes('NOT IN')) {
      jsonResult[key] = value
        .split(',')
        .map(val => val.trim().replace(/^\(|\)$/g, ''));
    } else {
      jsonResult[key] = value;
    }
  });

  return JSON.parse(JSON.stringify(jsonResult));
}

export function performFilterSubstitutions(template, variables) {
  return (template || '').replace(/\$\{(\w+)\}/g, (match, key) => {
    if (variables.hasOwnProperty(key)) {
      return variables[key];
    }
    return match;
  });
}
