export const PROXY_BASE = 'https://nr1-status-page-proxy.nr-labs.workers.dev/';

export const viaProxy = url => `${PROXY_BASE}${url}`;

export const PROXY_APP_KEY_HEADER = 'X-Proxy-Key';
// Must match the proxy's PROXY_SHARED_KEY secret in nr1-status-page-proxy
const PROXY_APP_KEY = '-NyQaPzZmJKsRs_9h4UxQE_mtw1HJNHX';
export const PROXY_HEADERS = Object.freeze({
  [PROXY_APP_KEY_HEADER]: PROXY_APP_KEY
});

// Joins a base status-page URL with a provider-relative path, normalizing the
// single '/' between them regardless of whether either side already has one.
export const joinUrl = (base, path) => {
  if (!base) return path || '';
  if (!path) return base;
  const trimmedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}`;
};

// Shared allowlist check for URLs handed to the CORS proxy: only well-formed
// https URLs may be proxied.
export const isProxyableUrl = rawUrl => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

// statuspage.io hosts (e.g. githubstatus.com) 301-redirect a bare apex domain
// to the bare www root, dropping the request path and landing on a page with
// no CORS headers. Prepend 'www.' when the configured host has no subdomain
// so the request goes straight to the real, CORS-enabled host.
export const normalizeStatusPageHost = rawUrl => {
  try {
    const parsed = new URL(rawUrl);
    const isBareApex = parsed.hostname.split('.').length === 2;

    if (parsed.protocol === 'https:' && isBareApex) {
      parsed.hostname = `www.${parsed.hostname}`;
      return parsed.toString();
    }
  } catch (err) {
    // fall through and return the original string unchanged
  }

  return rawUrl;
};

// Providers whose upstream host does not serve permissive CORS headers, so
// their requests must be relayed through the Worker proxy.
export const PROXY_REQUIRED_PROVIDERS = [
  'apple',
  'awsHealth',
  'azure',
  'okta',
  'rss',
  'statusPal'
];

export const isProxied = url =>
  typeof url === 'string' && url.startsWith(PROXY_BASE);

export const proxyFetchOptions = url =>
  isProxied(url) ? { headers: PROXY_HEADERS } : {};
