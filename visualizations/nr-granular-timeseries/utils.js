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

  if (lowerQuery.includes('since') || lowerQuery.includes('until')) {
    errors.push('SINCE and UNTIL clauses should be removed from your query');
  }

  return errors;
};
