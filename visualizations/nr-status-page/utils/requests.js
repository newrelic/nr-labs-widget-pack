import { NrqlQuery } from 'nr1';
import { getProvider } from './provider-services';
import Parser from 'rss-parser';

const ERR_MSG = 'error';

const _fetchNrqlData = async (accountId, query) => {
  let resp;
  try {
    resp = await NrqlQuery.query({
      accountIds: [accountId],
      query,
      formatType: NrqlQuery.FORMAT_TYPE.RAW
    });
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp.data;
};

const _fetchWorkloadData = async (accountId, guid) => {
  const query = `SELECT EventTimeStamp, EventName, EventStatus, Workload FROM (SELECT earliest(timestamp) AS EventTimeStamp, latest(timestamp) AS EventTimeStamp, latest(statusValue) AS EventName, latest(entity.name) AS Workload FROM WorkloadStatus WHERE workloadGuid = '${guid}' FACET statusValueCode AS EventStatus, dateOf(timestamp) LIMIT 100) ORDER BY EventTimeStamp DESC SINCE 2 WEEKS AGO LIMIT 100`;
  let resp;
  try {
    resp = await NrqlQuery.query({
      accountIds: [accountId],
      query,
      formatType: NrqlQuery.FORMAT_TYPE.RAW
    });
    resp.data.workloadGuid = guid;
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp.data;
};

const _fetchRssData = async input => {
  const resp = { data: null };
  const parser = new Parser();

  try {
    resp.data = await parser.parseURL(input);
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchStatusPalData = async input => {
  const STATUSPAL_API = getProvider('statusPal').apiURL;
  const urls = [
    `/status_pages/${input}/summary`,
    `/status_pages/${input}/incidents`
  ];
  let resp = {};

  try {
    const data = await Promise.all(
      urls.map(async url => {
        const res = await fetch(STATUSPAL_API + url);

        if (!res.ok) {
          console.debug(res); // eslint-disable-line
          return ERR_MSG;
        }

        return { data: await res.json(), url };
      })
    );

    if (data.length > 1) {
      data.forEach(d => {
        if (d.url.includes('incidents')) {
          resp.incidents = d.data;
        }

        if (d.url.includes('summary')) {
          resp.summary = d.data;
        }
      });
    } else {
      resp = {
        data: data[0]
      };
    }
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchGeneralData = async (input, provider) => {
  let urls;
  let resp = {};

  if (provider.summaryUrl === provider.incidentUrl) {
    urls = [_getUrl('summaryUrl', provider, input)];
  } else {
    urls = [
      _getUrl('summaryUrl', provider, input),
      _getUrl('incidentUrl', provider, input)
    ];
  }

  try {
    const data = await Promise.all(
      urls.map(async url => {
        const res = await fetch(url);

        if (!res.ok) {
          console.debug(res); // eslint-disable-line
          return ERR_MSG;
        }

        return { data: await res.json(), url };
      })
    );

    if (data.length > 1) {
      data.forEach(d => {
        if (d.url.includes('summary.json')) {
          resp.summary = d.data;
        }

        if (d.url.includes('incidents.json')) {
          resp.incidents = d.data;
        }
      });
    } else {
      resp = {
        data: data[0]
      };
    }
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

export const fetchData = async (provider, input, accountId) => {
  const p = getProvider(provider);
  let data = null;

  switch (provider) {
    case 'nrql':
      data = _fetchNrqlData(accountId, input);
      break;
    case 'workload':
      data = _fetchWorkloadData(accountId, input);
      break;
    case 'rss':
      data = _fetchRssData(input);
      break;
    case 'statusPal':
      data = _fetchStatusPalData(input);
      break;
    default:
      data = _fetchGeneralData(input, p);
      break;
  }

  return data;
};

const _getUrl = (providerUrlProperty, provider, input) => {
  let url = '';

  switch (provider.name) {
    case 'Status Io':
      // will replace "pages/history" with "1.0/status"
      url = `${input.replace('pages/history', provider[providerUrlProperty])}`;
      break;
    default:
      url = `${input}${provider[providerUrlProperty]}`;
      break;
  }

  // console.debug('url', url);

  return url;
};
