// components/CommonModal.js

import React from "react";
import { Modal, Button } from "react-bootstrap";

const PopupModal = ({
  show,
  onClose,
  title = "",
  children,
  footerButtons,
  size = "md",
  backdrop = false,
  centered = true,
  header = false,
  className,
  customClassName
}) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      size={size}
      backdrop={"static"}
      centered={centered}
      dialogClassName={customClassName}
    >
      {header && (
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}

      <Modal.Body className={className || ""}>{children}</Modal.Body>

      {footerButtons && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default PopupModal;
