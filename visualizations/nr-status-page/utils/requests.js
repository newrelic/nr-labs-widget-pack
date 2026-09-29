import { NrqlQuery } from 'nr1';
import { getProvider } from './provider-services';
import { parseRSSFeed } from './rss-feed';
import {
  viaProxy,
  joinUrl,
  isProxyableUrl,
  proxyFetchOptions,
  normalizeStatusPageHost,
  PROXY_REQUIRED_PROVIDERS
} from './proxy';

const ERR_MSG = 'error';

const APPLE_ALLOWED_HOSTNAME = 'www.apple.com';
const APPLE_ALLOWED_PATH_PREFIX = '/support/systemstatus/data/';

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
  const query = `SELECT EventTimeStamp, EventName, EventStatus, Workload FROM (SELECT earliest(timestamp) AS EventTimeStamp, latest(timestamp) AS EventTimeStamp, latest(statusValue) AS EventName, latest(entity.name) AS Workload FROM WorkloadStatus WHERE workloadGuid = '${guid}' FACET statusValueCode AS EventStatus, dateOf(timestamp) LIMIT 100) ORDER BY EventTimeStamp DESC SINCE 4 WEEKS AGO LIMIT 100`;
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

// Shared RSS fetch: fetches `url` directly (rather than letting rss-parser
// perform its own request via parseURL) so proxied requests can carry the
// X-Proxy-Key header.
const _fetchRssFeed = async url => {
  const res = await fetch(url, proxyFetchOptions(url));

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return parseRSSFeed(await res.text());
};

const _fetchRssData = async input => {
  const resp = { data: null };

  try {
    resp.data = await _fetchRssFeed(input);
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _isAllowedAppleUrl = rawUrl => {
  try {
    const parsed = new URL(rawUrl);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === APPLE_ALLOWED_HOSTNAME &&
      parsed.pathname.startsWith(APPLE_ALLOWED_PATH_PREFIX)
    );
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return false;
  }
};

// Apple's status feed is only ever served from a single allowlisted host and
// only ever reachable through the Worker proxy (it has no permissive CORS
// headers), so this bypasses the generic corsProxy override entirely.
const _fetchAppleData = async input => {
  if (!_isAllowedAppleUrl(input)) {
    console.debug('Disallowed Apple status URL'); // eslint-disable-line
    return ERR_MSG;
  }

  const proxiedUrl = viaProxy(input);
  let resp = { data: null };

  try {
    const res = await fetch(proxiedUrl, proxyFetchOptions(proxiedUrl));

    if (!res.ok) {
      console.debug(res); // eslint-disable-line
      return ERR_MSG;
    }

    const text = await res.text();
    // Apple returns JSONP: jsonCallback({...}) — strip the wrapper
    const json = text.replace(/^[^(]+\(/, '').replace(/\)\s*;?\s*$/, '');
    resp = { data: JSON.parse(json) };
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchAwsHealthData = async (input, provider) => {
  // summaryUrl and incidentUrl are identical for AWS Health, so one request
  // serves both formatters.
  const url = joinUrl(input, provider.summaryUrl);
  let resp = { data: null };

  try {
    const res = await fetch(url, proxyFetchOptions(url));

    if (!res.ok) {
      console.debug(res); // eslint-disable-line
      return ERR_MSG;
    }

    resp = { data: await res.json() };
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchAzureData = async input => {
  const resp = { data: null };

  try {
    resp.data = await _fetchRssFeed(input);
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchOktaData = async input => {
  const resp = { data: null };

  try {
    resp.data = await _fetchRssFeed(input);
  } catch (err) {
    console.debug(err); // eslint-disable-line
    return ERR_MSG;
  }

  return resp;
};

const _fetchOciData = async (input, provider) => {
  const statusUrl = joinUrl(input, provider.summaryUrl);
  const incidentUrl = joinUrl(input, provider.incidentUrl);
  let resp = { data: null };

  try {
    const [statusRes, feed] = await Promise.all([
      fetch(statusUrl, proxyFetchOptions(statusUrl)),
      _fetchRssFeed(incidentUrl)
    ]);

    if (!statusRes.ok) {
      console.debug(statusRes); // eslint-disable-line
      return ERR_MSG;
    }

    const status = await statusRes.json();
    resp = { data: { status, feed } };
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
        const finalUrl = STATUSPAL_API + url;
        const res = await fetch(finalUrl, proxyFetchOptions(finalUrl));

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
        const res = await fetch(url, proxyFetchOptions(url));

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

// Resolves the final request target for HTTP-backed providers:
// - nrql/workload never touch HTTP, so the input passes through untouched.
// - A configured corsProxy always wins as a user override.
// - Otherwise the providers that need CORS relaying are routed through the
//   built-in Worker proxy automatically.
// StatusPal is deliberately never routed through this helper — its input is
// a bare subdomain, not a URL, and its proxying is baked into
// `provider.apiURL` instead.
const _resolveInput = (providerKey, input, corsProxy) => {
  if (providerKey === 'nrql' || providerKey === 'workload') return input;
  if (corsProxy) return corsProxy.replace('{url}', input);
  if (PROXY_REQUIRED_PROVIDERS.includes(providerKey) && isProxyableUrl(input)) {
    return viaProxy(input);
  }
  return input;
};

export const fetchData = async (provider, input, accountId, corsProxy) => {
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
      data = _fetchRssData(_resolveInput(provider, input, corsProxy));
      break;
    case 'statusPal':
      data = _fetchStatusPalData(input);
      break;
    case 'apple':
      data = _fetchAppleData(input);
      break;
    case 'awsHealth':
      data = _fetchAwsHealthData(_resolveInput(provider, input, corsProxy), p);
      break;
    case 'azure':
      data = _fetchAzureData(_resolveInput(provider, input, corsProxy));
      break;
    case 'okta':
      data = _fetchOktaData(_resolveInput(provider, input, corsProxy));
      break;
    case 'oci':
      data = _fetchOciData(_resolveInput(provider, input, corsProxy), p);
      break;
    default:
      data = _fetchGeneralData(_resolveInput(provider, input, corsProxy), p);
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
    case 'Status Page':
      url = joinUrl(
        normalizeStatusPageHost(input),
        provider[providerUrlProperty]
      );
      break;
    default:
      url = joinUrl(input, provider[providerUrlProperty]);
      break;
  }

  // console.debug('url', url);

  return url;
};
