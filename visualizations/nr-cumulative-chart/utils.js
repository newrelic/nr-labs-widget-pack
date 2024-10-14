export const discoverErrors = props => {
  const { accountId, query } = props;
  const lowerQuery = (query || '').toLowerCase();

  const errors = [];

  if (!accountId) {
    errors.push('Account ID required');
  }

  if (!query) {
    errors.push('Query required');
  } else if (!lowerQuery.includes('timeseries')) {
    errors.push('TIMESERIES keyword required');
  }

  return errors;
};
