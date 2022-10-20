import React from 'react';
import { NerdletStateContext } from 'nr1';

export default class LinkWrapper extends React.Component {
  render() {
    return (
      <NerdletStateContext.Consumer>
        {nerdletState => window.location.replace(nerdletState.url)}
      </NerdletStateContext.Consumer>
    );
  }
}
