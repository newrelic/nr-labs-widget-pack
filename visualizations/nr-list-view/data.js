import tmpl8 from './tmpl8';

export const castAccountIdsAsArray = accountIds => {
  if (Array.isArray(accountIds)) {
    return accountIds;
  }
  if (typeof accountIds === 'number') {
    return [accountIds];
  }
  return [];
};

export const processQueryResults = ({ acc, attribs }, row) => {
  const { data, metadata } = row || {};
  if (Array.isArray(data)) {
    acc = acc.concat(
      data.map(d => {
        const { groups } = metadata;
        const meta = groups.reduce((m, group) => {
          if (group.type === 'function') {
            m[group.value.split(' ').pop()] = d[group.value];
          } else if (group.type === 'facet') {
            m[group.name] = group.value;
          }
          return m;
        }, {});
        const rowData = { ...meta, ...d };
        Object.keys(rowData).forEach(attribs.add, attribs);
        return rowData;
      })
    );
  } else {
    Object.keys(data).forEach(attribs.add, attribs);
    acc.push(data);
  }
  return { acc, attribs };
};

export const generateList = ({ data, attributes, templateString }) => {
  if (!data || !attributes) return [];

  let template;
  try {
    template = tmpl8(templateString || '', attributes || []);
  } catch (e) {
    if (e.message.includes('Templating Error:')) {
      /* eslint-disable no-console */
      console.error(
        'Error processing the template string. Please check the template string.'
      );
      /* eslint-enable no-console */
      return [];
    }
  }

  return data.reduce((acc, row) => {
    const t = template(row);
    if (t) acc.push(t);
    return acc;
  }, []);
};
