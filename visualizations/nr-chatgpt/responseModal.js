import React from 'react';
import { HeadingText, Button, Modal, JsonChart } from 'nr1';

export function ResponseModal(props) {
  const { json, open, setState } = props;

  return (
    <>
      <Modal
        hidden={!open}
        onClose={() => setState({ responseModalOpen: false })}
      >
        <HeadingText type={HeadingText.TYPE.HEADING_3}>
          ChatGPT Response Data
        </HeadingText>
        <br />

        <>
          <JsonChart data={json} fullWidth fullHeight />
        </>

        <br />

        <Button
          style={{ float: 'right' }}
          onClick={() => setState({ responseModalOpen: false })}
        >
          Close
        </Button>
      </Modal>
    </>
  );
}
