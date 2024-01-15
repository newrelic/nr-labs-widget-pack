import React, { useContext } from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import Widget from './widget';

function GranularTimeseriesWidgetRoot(props) {
  const platformContext = useContext(PlatformStateContext);

  return (
    <div style={{ height: '100%', overflowX: 'hidden' }}>
      <AutoSizer>
        {({ width, height }) => (
          <Widget
            platformContext={platformContext}
            width={width}
            height={height}
            {...props}
          />
        )}
      </AutoSizer>
    </div>
  );
}

export default GranularTimeseriesWidgetRoot;
