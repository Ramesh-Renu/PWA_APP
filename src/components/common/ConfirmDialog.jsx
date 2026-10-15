import { Modal } from "react-bootstrap";
import {
  DeleteOutlineRounded,
  ErrorOutlineRounded,
  HelpOutlineRounded,
} from "@mui/icons-material";

const TONE_ICON = {
  danger: DeleteOutlineRounded,
  warning: ErrorOutlineRounded,
  default: HelpOutlineRounded,
};

/**
 * Small "are you sure?" popup used across the app.
 *
 *   <ConfirmDialog
 *     show={open}
 *     title="Delete Grand Palace?"
 *     message="Its floors, tables and seats are removed too."
 *     confirmLabel="Delete"
 *     onConfirm={remove}
 *     onCancel={() => setOpen(false)}
 *   />
 */
const ConfirmDialog = ({
  show,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const Icon = TONE_ICON[tone] || TONE_ICON.default;

  return (
    <Modal
      show={show}
      onHide={() => !loading && onCancel?.()}
      centered
      backdrop="static"
      dialogClassName="confirm-dialog"
      className="confirm-dialog-modal"
      backdropClassName="confirm-dialog-backdrop"
      aria-labelledby="confirm-dialog-title"
    >
      <Modal.Body>
        <div className={`confirm-dialog__icon confirm-dialog__icon--${tone}`} aria-hidden>
          <Icon />
        </div>
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {title}
        </h2>
        {message && <p className="confirm-dialog__message">{message}</p>}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`hotel-form__btn confirm-dialog__confirm confirm-dialog__confirm--${tone}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDialog;
