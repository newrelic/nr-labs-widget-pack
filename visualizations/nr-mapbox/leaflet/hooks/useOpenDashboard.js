import { useCallback } from 'react';
import { navigation } from 'nr1';

/**
 * Extract named dashboard configs from data fields using the prefix pattern:
 *   dash_guid_<name>   – dashboard entity GUID
 *   dash_filter_<name> – optional filter string
 *   dash_variables_<name> – optional JSON variables
 *   dash_tab_guid_<name> – optional default tab GUID
 *
 * Returns an array of { name, label, guid, filter, variables, defaultTab }.
 */
export function extractDashboardConfigs(data) {
  if (!data) return [];

  const configs = {};

  Object.keys(data).forEach(key => {
    if (!key.startsWith('dash_guid_')) return;

    const name = key.replace('dash_guid_', '');
    if (!name) return;

    const guid = data[key];
    if (!guid) return;

    const filterKey = `dash_filter_${name}`;
    const variablesKey = `dash_variables_${name}`;
    const defaultTabKey = `dash_tab_guid_${name}`;

    let variables = {};
    const rawVars = data[variablesKey];
    if (rawVars) {
      try {
        variables = typeof rawVars === 'string' ? JSON.parse(rawVars) : rawVars;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to parse dash_variables_${name}:`, e);
      }
    }

    configs[name] = {
      name,
      label: name,
      guid,
      filter: data[filterKey] || '',
      variables,
      defaultTab: data[defaultTabKey] || ''
    };
  });

  return Object.values(configs);
}

/**
 * Extract named link configs from data fields using the prefix pattern:
 *   link_<name> – external URL
 *
 * Returns an array of { name, label, url }.
 */
export function extractLinkConfigs(data) {
  if (!data) return [];

  const configs = [];

  Object.keys(data).forEach(key => {
    if (!key.startsWith('link_')) return;

    const name = key.replace('link_', '');
    if (!name) return;

    const url = data[key];
    if (!url) return;

    configs.push({
      name,
      label: name,
      url
    });
  });

  return configs;
}

// Hook to open a New Relic dashboard with optional filters and variables.
export function useOpenDashboard() {
  /**
   * Open a dashboard from an extracted config object.
   * Accepts { guid, filter, variables, defaultTab }.
   */
  const openDashboard = useCallback((config, openInNewTab) => {
    if (!config) return;

    const { guid, filter, variables, defaultTab } = config;

    if (!guid) {
      // eslint-disable-next-line no-console
      console.warn('No dashboard GUID provided');
      return;
    }

    try {
      if (openInNewTab) {
        navigation.openNerdlet({
          id: 'dashboards.detail',
          urlState: {
            entityGuid: guid,
            ...(filter && { filters: filter }),
            ...(variables &&
              Object.keys(variables).length > 0 && {
                selectedVariables: variables
              }),
            ...(defaultTab && { selectedPage: defaultTab })
          }
        });
      } else {
        navigation.openStackedNerdlet({
          id: 'dashboards.detail',
          urlState: {
            entityGuid: guid,
            ...(filter && { filters: filter }),
            ...(variables &&
              Object.keys(variables).length > 0 && {
                selectedVariables: variables
              }),
            ...(defaultTab && { selectedPage: defaultTab })
          }
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to open dashboard:', e);
    }
  }, []);

  return {
    openDashboard,
    extractDashboardConfigs,
    extractLinkConfigs
  };
}

export default useOpenDashboard;
