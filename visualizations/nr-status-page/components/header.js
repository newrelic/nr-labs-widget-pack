import React from 'react';
import { navigation, Toast } from 'nr1';

const Header = ({
  title,
  provider,
  statusInput,
  statusPalPageLink,
  accountId
}) => {
  const commonProviders = [
    'statusPage',
    'google',
    'statusIO',
    'rss',
    'azure',
    'okta',
    'oci'
  ];

  const handleHeaderClick = () => {
    if (provider === 'nrql') {
      const qBuilder = {
        id: 'data-exploration.query-builder',
        urlState: {
          initialActiveInterface: 'nrqlEditor',
          initialAccountId: accountId,
          initialNrqlValue: statusInput,
          initialWidget: {
            visualization: {
              id: 'viz.table'
            }
          },
          isViewingQuery: true
        }
      };

      navigation.openStackedNerdlet(qBuilder);
    }

    if (provider === 'workload') {
      window
        .open(
          `https://one.newrelic.com/redirect/entity/${statusInput}`,
          '_blank'
        )
        .focus();
    }

    if (provider === 'statusPal') {
      if (statusPalPageLink) {
        window.open(statusPalPageLink, '_blank').focus();
      } else {
        Toast.showToast({
          title: 'No Status Pal link configured',
          description: 'Configure Status Pal link',
          type: Toast.TYPE.CRITICAL
        });
      }
    }

    if (provider === 'apple') {
      window
        .open('https://www.apple.com/support/systemstatus/', '_blank')
        .focus();
    }

    if (provider === 'awsHealth') {
      window
        .open('https://health.aws.amazon.com/health/status', '_blank')
        .focus();
    }

    if (provider === 'azure') {
      window
        .open('https://azure.status.microsoft/en-us/status', '_blank')
        .focus();
    }

    if (provider === 'okta') {
      window.open('https://status.okta.com/', '_blank').focus();
    }

    if (commonProviders.includes(provider)) {
      window.open(statusInput, '_blank').focus();
    }
  };

  return (
    <div onClick={() => handleHeaderClick()} className="status-header">
      {title.includes('http') ? (
        <img src={title} className="image-title" alt={provider} />
      ) : (
        <h2 className="plain-title">{title}</h2>
      )}
    </div>
  );
};

export default Header;
