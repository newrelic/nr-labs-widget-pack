import React from 'react';
import { HeadingText, Button, Modal, BlockText } from 'nr1';

export function ErrorModal(props) {
  const { open, title, error, setState } = props;

  return (
    <>
      <Modal hidden={!open} onClose={() => setState({ errorModalOpen: false })}>
        <HeadingText type={HeadingText.TYPE.HEADING_3}>
          An error occurred - {title}
        </HeadingText>
        <br />

        <BlockText type={BlockText.TYPE.PARAGRAPH}>{error}</BlockText>

        <br />

        <Button
          style={{ float: 'right' }}
          onClick={() => setState({ errorModalOpen: false })}
        >
          Close
        </Button>
      </Modal>
    </>
  );
}
