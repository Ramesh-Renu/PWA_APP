import React from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { redCrossMark, warningIcon } from "assets/images";
import useToast from "hooks/useToast";
import { InfoOutlined } from "@mui/icons-material";

const ToastDialog = () => {
  const { toastState, hideToast } = useToast();
  const { title, message, hint, variant, showToast } = toastState;
  const showTime = toastState.showTime ?? 3000;
  const tone = String(variant || "info").toLowerCase();
  // Nothing to say → no toast (an empty one shows as a blank white card).
  const hasText = Boolean(title || message || hint);

  const handleClose = () => {
    hideToast();
  };

  return (
    <ToastContainer className="top-70" position="top-end">
      <Toast
        className="d-inline-block m-1"
        bg={tone}
        show={showToast && hasText}
        onClose={handleClose}
        delay={showTime}
        autohide
      >
        {hasText && (
          <Toast.Body>
            <div className="toast-body-container">
              <div className="toast-body-container-icon">
                {tone === "success" && (
                  <span
                    className={"icon-success-tick-white rounded"}
                    title="success"
                  />
                )}
                {tone === "danger" && (
                  <img src={redCrossMark} className="rounded" alt="" />
                )}
                {tone === "warning" && (
                  <img src={warningIcon} className="rounded" alt="" />
                )}
                {tone === "info" && <InfoOutlined fontSize="small" aria-hidden />}
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
