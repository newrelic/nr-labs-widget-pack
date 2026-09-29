import { googleIncidentFormatter, googleFormatter } from '../formatters/google';
import {
  statusPageIncidentFormatter,
  statusPageIoFormatter
} from '../formatters/status-page-io';
import {
  statusIoIncidentFormatter,
  statusIoFormatter
} from '../formatters/status-io';
import { nrqlFormatter, nrqlIncidentFormatter } from '../formatters/nrql';
import { rssFormatter, rssIncidentFormatter } from '../formatters/rss';
import {
  statusPalFormatter,
  statusPalIncidentFormatter
} from '../formatters/status-pal';
import {
  workloadFormatter,
  workloadIncidentFormatter
} from '../formatters/workload';
import { appleFormatter, appleIncidentFormatter } from '../formatters/apple';
import {
  awsHealthFormatter,
  awsHealthIncidentFormatter
} from '../formatters/aws-health';
import { azureFormatter, azureIncidentFormatter } from '../formatters/azure';
import { oktaFormatter, oktaIncidentFormatter } from '../formatters/okta';
import { ociFormatter, ociIncidentFormatter } from '../formatters/oci';
import { viaProxy } from './proxy';

const providers = {
  google: {
    summaryUrl: '/incidents.json',
    incidentUrl: '/incidents.json',
    impactMap: {
      low: 'minor',
      medium: 'major',
      high: 'critical'
    },
    name: 'Google Cloud',
    incidentFormatter: googleIncidentFormatter,
    summaryFormatter: googleFormatter
  },
  statusPage: {
    summaryUrl: '/api/v2/summary.json',
    incidentUrl: '/api/v2/incidents.json',
    impactMap: {
      minor: 'minor',
      major: 'major',
      critical: 'critical'
    },
    name: 'Status Page',
    summaryFormatter: statusPageIoFormatter,
    incidentFormatter: statusPageIncidentFormatter
  },
  statusIO: {
    // assumes format entered of https://hostname/pages/history/<identifier>
    // will replace "pages/history" with "1.0/status"
    summaryUrl: '1.0/status',
    incidentUrl: '1.0/status',
    impactMap: {
      minor: 'minor',
      major: 'major',
      critical: 'critical'
    },
    name: 'Status Io',
    summaryFormatter: statusIoFormatter,
    incidentFormatter: statusIoIncidentFormatter
  },
  nrql: {
    impactMap: {
      warning: 'minor',
      major: 'major',
      critical: 'critical'
    },
    name: 'NRQL',
    summaryFormatter: nrqlFormatter,
    incidentFormatter: nrqlIncidentFormatter
  },
  workload: {
    impactMap: {
      warning: 'minor',
      major: 'major',
      critical: 'critical'
    },
    name: 'Workload',
    summaryFormatter: workloadFormatter,
    incidentFormatter: workloadIncidentFormatter
  },
  rss: {
    impactMap: {
      warning: 'minor',
      major: 'major',
      critical: 'critical'
    },
    name: 'RSS Feed',
    summaryFormatter: rssFormatter,
    incidentFormatter: rssIncidentFormatter
  },
  statusPal: {
    impactMap: {
      minor: 'minor',
      major: 'major',
      maintence: 'maintence'
    },
    apiURL: viaProxy('https://statuspal.io/api/v2'),
    name: 'Statuspal',
    summaryFormatter: statusPalFormatter,
    incidentFormatter: statusPalIncidentFormatter
  },
  apple: {
    name: 'Apple System Status',
    summaryFormatter: appleFormatter,
    incidentFormatter: appleIncidentFormatter
  },
  awsHealth: {
    summaryUrl: '/public/currentevents',
    incidentUrl: '/public/currentevents',
    name: 'AWS Health',
    summaryFormatter: awsHealthFormatter,
    incidentFormatter: awsHealthIncidentFormatter
  },
  azure: {
    name: 'Azure',
    summaryFormatter: azureFormatter,
    incidentFormatter: azureIncidentFormatter
  },
  okta: {
    name: 'Okta',
    summaryFormatter: oktaFormatter,
    incidentFormatter: oktaIncidentFormatter
  },
  oci: {
    summaryUrl: '/api/v2/status.json',
    incidentUrl: '/api/v2/incident-summary.rss',
    name: 'Oracle Cloud Infrastructure',
    summaryFormatter: ociFormatter,
    incidentFormatter: ociIncidentFormatter
  }
};

const PROVIDER_KEY_ALIASES = {
  StatusIO: 'statusIO',
  statusPageIo: 'statusPage',
  statusIo: 'statusIO'
};

export const getProvider = providerKey => {
  return providers[PROVIDER_KEY_ALIASES[providerKey] || providerKey];
};
