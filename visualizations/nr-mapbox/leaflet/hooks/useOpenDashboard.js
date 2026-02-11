import { useCallback } from 'react';
import { navigation } from 'nr1';
import { sentenceCase } from '../tooltipUtils';

/**
 * Extract named dashboard configs from data fields using the prefix pattern:
 *   dash_guid_<name>   – dashboard entity GUID
 *   dash_filter_<name> – optional filter string
 *   dash_variables_<name> – optional JSON variables
 *
 * Returns an array of { name, label, guid, filter, variables }.
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
      label: sentenceCase(name),
      guid,
      filter: data[filterKey] || '',
      variables
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
      label: sentenceCase(name),
      url
    });
  });

  return configs;
}

// Hook to open a New Relic dashboard with optional filters and variables.
export function useOpenDashboard() {
  /**
   * Open a dashboard from an extracted config object.
   * Accepts { guid, filter, variables }.
   */
  const openDashboard = useCallback(config => {
    if (!config) return;

    const { guid, filter, variables } = config;

    if (!guid) {
      // eslint-disable-next-line no-console
      console.warn('No dashboard GUID provided');
      return;
    }

    try {
      navigation.openStackedNerdlet({
        id: 'dashboards.detail',
        urlState: {
          entityGuid: guid,
          ...(filter && { filters: filter }),
          ...(variables &&
            Object.keys(variables).length > 0 && {
              selectedVariables: variables
            })
        }
      });
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
