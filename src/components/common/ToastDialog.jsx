import React from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { redCrossMark, warningIcon } from "assets/images";
import useToast from "hooks/useToast";

const ToastDialog = () => {
  const { toastState, hideToast } = useToast();
  const { title, message, hint, variant, showToast } = toastState;
  const showTime = toastState.showTime ?? 3000;

  const handleClose = () => {
    hideToast();
  };

  return (
    <ToastContainer className="top-70" position="top-end">
      <Toast
        className="d-inline-block m-1"
        bg={variant.toLowerCase()}
        show={showToast}
        onClose={handleClose}
        delay={showTime}
        autohide
      >
        {variant !== "info" && (
          <Toast.Body
            className={
              variant === "success" ||
              variant === "danger" ||
              variant === "warning"
            }
          >
            <div className="toast-body-container">
              <div className="toast-body-container-icon">
                {variant.toLowerCase() === "success" && (
                  <span
                    className={"icon-success-tick-white rounded"}
                    title="success"
                  />
                )}
                {variant.toLowerCase() === "danger" && (
                  <img src={redCrossMark} className="rounded" alt="" />
                )}
                {variant.toLowerCase() === "warning" && (
                  <img src={warningIcon} className="rounded" alt="" />
                )}
              </div>
              <div className="toast-body-container-content">
                <p>{title}</p>
                <span>{message}</span>
                {hint && (
                  <span className="hint">
                    <label>Note:</label> {hint}
                  </span>
                )}
              </div>
            </div>
          </Toast.Body>
        )}
      </Toast>
    </ToastContainer>
  );
};

export default ToastDialog;
