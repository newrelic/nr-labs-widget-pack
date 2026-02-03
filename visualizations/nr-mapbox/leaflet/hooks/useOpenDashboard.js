import { useCallback } from 'react';
import { navigation } from 'nr1';

// Hook to open a New Relic dashboard with optional filters and variables.
export function useOpenDashboard() {
  const openDashboard = useCallback(data => {
    if (!data) return;

    const dashGuid = data.dash_guid || data.dashGuid || data.dashboard_guid;

    if (!dashGuid) {
      // eslint-disable-next-line no-console
      console.warn('No dashboard GUID provided in data');
      return;
    }

    try {
      let variables = {};
      const dashVariables =
        data.dash_variables || data.dashVariables || data.dashboard_variables;

      if (dashVariables) {
        try {
          variables =
            typeof dashVariables === 'string'
              ? JSON.parse(dashVariables)
              : dashVariables;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse dashboard variables:', e);
        }
      }

      const filter =
        data.dash_filter || data.dashFilter || data.dashboard_filter || '';

      navigation.openStackedNerdlet({
        id: 'dashboards.detail',
        urlState: {
          entityGuid: dashGuid,
          ...(filter && { filters: filter }),

          ...(Object.keys(variables).length > 0 && {
            selectedVariables: variables
          })
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to open dashboard:', e);
    }
  }, []);

  // Check if data has dashboard link fields
  const hasDashboardLink = useCallback(data => {
    if (!data) return false;
    return !!(data.dash_guid || data.dashGuid || data.dashboard_guid);
  }, []);

  return {
    openDashboard,
    hasDashboardLink
  };
}

export default useOpenDashboard;
