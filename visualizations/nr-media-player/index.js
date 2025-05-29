import React from 'react';
import { AutoSizer } from 'nr1';
import MediaPlayer from './media-player';

function MediaPlayerRoot(props) {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <MediaPlayer width={width} height={height} {...props} />
      )}
    </AutoSizer>
  );
}

export default MediaPlayerRoot;
