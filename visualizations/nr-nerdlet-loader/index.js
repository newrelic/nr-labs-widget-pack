import React, { useEffect, useState } from 'react';
import { navigation } from 'nr1';

function NerdletLoader(props) {
  const { nerdletId, urlState } = props;
  const [error, setError] = useState(null);

  useEffect(() => {
    let json = null;
    try {
      json = JSON.parse(urlState);
      setError(null);
    } catch (e) {
      setError(e);
    }

    if (nerdletId && json && !error) {
      const nerdlet = {
        id: nerdletId,
        urlState: json
      };

      navigation.openNerdlet(nerdlet);
    }
  }, [nerdletId, urlState]);

  if (error) {
    return <div>{error}</div>;
  }

  return '';
}

export default NerdletLoader;
