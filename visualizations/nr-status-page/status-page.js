import React, { useEffect, useState } from 'react';
import ErrorState from '../shared/errorState';
import Header from './components/header';
import Summary from './components/summary';
import Incidents from './components/incidents';
import IncidentDrilldown from './components/incident-drilldown';
import { fetchData } from './utils/requests';
import { EmptyState, Spinner } from 'nr1';
import { useInterval } from '@mantine/hooks';
import {
  uniformIncidentData,
  uniformSummaryData
} from './utils/format-service';
import Docs from './docs';

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
    }

    setInputErrors(errors);
  }, [provider, statusInput, serviceTitle, accountId]);

  const getData = async () => {
    let finalStatusInput = statusInput;

    if (corsProxy) {
      finalStatusInput = corsProxy.replace('{url}', statusInput);
    }

    const results = await fetchData(provider, finalStatusInput, accountId);
    if (typeof results === 'string') {
      setSummaryData(null);
      setIncidentsData(null);
      return;
    }

    if (results.summary) {
      setSummaryData(uniformSummaryData(provider, results.summary));
    }
    if (results.incidents) {
      setIncidentsData(uniformIncidentData(provider, results.incidents));
    }

    if (results.all) {
      setSummaryData(uniformSummaryData(provider, results.all));
      setIncidentsData(uniformIncidentData(provider, results.all));
    }

    if (!results.summary && !results.incidents) {
      setSummaryData(uniformSummaryData(provider, results));
      setIncidentsData(uniformIncidentData(provider, results));
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
