import { useEffect, useState } from 'react';

import { useNrqlQuery } from 'nr1';
import { processQueryResults } from './data';

const useQueryData = ({ query, accountIds }) => {
  const [results, setResults] = useState({
    data: [],
    error: null,
    loading: true,
    attributes: []
  });
  const { data: resp, error, loading } = useNrqlQuery({
    query,
    accountIds,
    skip: !query || !accountIds
  });

  useEffect(() => setResults(res => ({ ...res, error, loading })), [
    error,
    loading
  ]);

  useEffect(() => {
    if (!resp) return;

    const postProcess = resp.reduce(processQueryResults, {
      acc: [],
      attribs: new Set()
    });
    setResults(res => ({
      ...res,
      data: postProcess.acc,
      attributes: [...postProcess.attribs]
    }));
  }, [resp]);

  return results;
};

export default useQueryData;
