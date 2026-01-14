import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import { EmptyState } from 'nr1';

import Docs from './docs';

const MediaPlayer = ({ showDocs, videoUrl, loopVideo, enableDebugMode }) => {
  const [inputErrors, setInputErrors] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!videoUrl) {
      setInputErrors(['specify a valid video url']);
      return;
    }
    setInputErrors([]);
    setLogs([]);
  }, [videoUrl]);

  const logEvent = message => {
    const ts = new Date()
      .toLocaleString('en-CA', { hour12: false })
      .replace(',', '');

    setLogs(prevLogs => [...prevLogs, `[${ts}] ${message}`]);
  };

  // player event handlers to log
  const handleReady = () => logEvent('onReady: player is ready');
  const handleStart = () => logEvent('onStart: playback started');
  const handleBuffer = () => logEvent('onBuffer: video buffering...');
  const handleError = e => {
    console.debug(e); // eslint-disable-line
    logEvent(`onError: ${JSON.stringify(e, null, 2)}`);
  };

  if (inputErrors.length > 0) {
    return (
      <>
        {showDocs && <Docs />}
        <EmptyState
          fullHeight
          fullWidth
          iconType={EmptyState.ICON_TYPE.INTERFACE__INFO__INFO}
          title="Specify a video url to get started. Enable documentation for more detail."
          additionalInfoLink={{
            label: 'DOCS',
            to:
              'https://github.com/cookpete/react-player?tab=readme-ov-file#supported-media'
          }}
        />
      </>
    );
  }

  return (
    <>
      {showDocs && <Docs />}
      <ReactPlayer
        className="disable-dark-mode"
        url={videoUrl}
        playing={!!videoUrl}
        width="100%"
        height="100%"
        controls
        volume={0}
        muted
        loop={loopVideo}
        onReady={handleReady}
        onStart={handleStart}
        onBuffer={handleBuffer}
        onError={handleError}
      />
      {enableDebugMode && (
        <div className="debug-window">
          <ul className="log-list">
            {logs.map((msg, i) => {
              return <li key={i}>{msg}</li>;
            })}
          </ul>
        </div>
      )}
    </>
  );
};

MediaPlayer.propTypes = {
  showDocs: PropTypes.bool,
  videoUrl: PropTypes.string,
  enableDebugMode: PropTypes.bool,
  loopVideo: PropTypes.bool
};

export default MediaPlayer;
