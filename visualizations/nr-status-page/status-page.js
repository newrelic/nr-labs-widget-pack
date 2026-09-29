import React, { useEffect, useState } from 'react';
import ErrorState from '../shared/errorState';
import Header from './components/header';
import Summary from './components/summary';
import Incidents from './components/incidents';
import IncidentDrilldown from './components/incident-drilldown';
import { fetchData } from './utils/requests';
import { isProxyableUrl } from './utils/proxy';
import { EmptyState, Spinner } from 'nr1';
import { useInterval } from '@mantine/hooks';
import {
  uniformIncidentData,
  uniformSummaryData
} from './utils/format-service';
import Docs from './docs';

const NON_URL_PROVIDERS = ['nrql', 'workload', 'statusPal'];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// AWS Health and Azure only ever expose currently-active events, so a date
// filter on those two can empty an otherwise-valid widget.
const PROVIDERS_WITHOUT_HISTORY = ['awsHealth', 'azure'];

const withinRollingWindow = (incidents, providerKey) => {
  if (!Array.isArray(incidents)) return incidents;
  if (PROVIDERS_WITHOUT_HISTORY.includes(providerKey)) return incidents;
  const boundary = Date.now() - THIRTY_DAYS_MS;
  return incidents.filter(incident => {
    const created = new Date(incident?.created_at).getTime();
    return Number.isNaN(created) ? true : created >= boundary;
  });
};

const StatusPage = ({
  showDocs,
  provider,
  serviceTitle,
  statusInput,
  accountId,
  corsProxy,
  statusPalPageLink,
  pollInterval
}) => {
  const [inputErrors, setInputErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [incidentsData, setIncidentsData] = useState(null);
  const [hidden, setHidden] = useState(true);
  const [incidentIndex, setIncidentIndex] = useState(-1);

  const interval = useInterval(() => {
    getData();
  }, (pollInterval || 60) * 1000);

  const drilldownClose = () => {
    setIncidentIndex(-1);
    setHidden(true);
  };

  const drilldownOpen = i => {
    setIncidentIndex(i);
    setHidden(false);
  };

  useEffect(() => {
    const errors = [];

    if (!provider || provider === 'select') {
      errors.push('Status Provider required');
    }

    if (!serviceTitle) {
      errors.push('Service Title/Image required');
    }

    if (!statusInput) {
      errors.push('Status Input required');
    }

    if (corsProxy) {
      if (!corsProxy.includes('{url}')) {
        errors.push(
          'CORS Proxy must end with string `/{url}` in order to properly form final URL'
        );
      } else if (!isProxyableUrl(corsProxy.split('{url}')[0])) {
        errors.push('CORS Proxy must use https://');
      }
    }

    if (provider && statusInput) {
      if (provider === 'nrql') {
        if (!accountId) {
          errors.push('AccountId required when NRQL provider is selected');
        }
        const lowerInput = statusInput.toLowerCase();
        if (!lowerInput.includes('select') || !lowerInput.includes('from')) {
          errors.push(
            'Status input must be a valid nrql query when provider is NRQL'
          );
        }
      }

      if (provider === 'workload') {
        if (!accountId) {
          errors.push('AccountId required when Workload provider selected');
        }
      }

      if (
        !NON_URL_PROVIDERS.includes(provider) &&
        !isProxyableUrl(statusInput)
      ) {
        errors.push('Status page URL must use https://');
      }
    }

    setInputErrors(errors);
  }, [provider, statusInput, serviceTitle, accountId, corsProxy]);

  const getData = async () => {
    const results = await fetchData(
      provider,
      statusInput,
      accountId,
      corsProxy
    );
    if (typeof results === 'string') {
      setSummaryData(null);
      setIncidentsData(null);
      return;
    }

    if (results.summary) {
      setSummaryData(uniformSummaryData(provider, results.summary));
    }
    if (results.incidents) {
      setIncidentsData(
        withinRollingWindow(
          uniformIncidentData(provider, results.incidents),
          provider
        )
      );
    }

    if (results.all) {
      setSummaryData(uniformSummaryData(provider, results.all));
      setIncidentsData(
        withinRollingWindow(
          uniformIncidentData(provider, results.all),
          provider
        )
      );
    }

    if (!results.summary && !results.incidents) {
      setSummaryData(uniformSummaryData(provider, results));
      setIncidentsData(
        withinRollingWindow(uniformIncidentData(provider, results), provider)
      );
    }

    if (loading) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inputErrors.length === 0) {
      getData();
      interval.stop();
      interval.start();
      return interval.stop;
    }
  }, [provider, statusInput, accountId, corsProxy, pollInterval]);

  if (inputErrors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <ErrorState errors={inputErrors} showDocs={showDocs} Docs={Docs} />
      </>
    );
  }

  if (loading) return <Spinner />;

  if (!loading && !summaryData && !incidentsData) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="No data returned"
          description="Validate inputs or check browser console debug log for any errors."
        />
      </>
    );
  }

  return (
    <>
      {showDocs && <Docs />}
      <Header
        title={serviceTitle}
        provider={provider}
        statusInput={statusInput}
        statusPalPageLink={statusPalPageLink}
        accountId={accountId}
      />
      <Summary openDrilldown={drilldownOpen} summaryData={summaryData} />
      <Incidents
        openDrilldown={drilldownOpen}
        incidentData={incidentsData}
        statusInput={statusInput}
      />
      <IncidentDrilldown
        open={hidden}
        close={drilldownClose}
        index={incidentIndex}
        drilldownData={incidentsData}
      />
    </>
  );
};

export default StatusPage;
