import React, { useContext, useEffect } from 'react';
import { NerdletStateContext, BlockText } from 'nr1';
import toSafeUrl from '../../shared/toSafeUrl';

export default function LinkWrapper() {
  const nerdletState = useContext(NerdletStateContext);
  const safeUrl = toSafeUrl(nerdletState?.url);

  useEffect(() => {
    if (safeUrl) {
      window.location.replace(safeUrl);
    }
  }, [safeUrl]);

  if (!safeUrl) {
    return <BlockText>Link must be an http(s) URL.</BlockText>;
  }

  return null;
}
