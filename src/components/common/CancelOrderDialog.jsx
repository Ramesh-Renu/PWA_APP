import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorOutlineRounded } from "@mui/icons-material";

// Quick picks; "Other" opens a text box. Staff and customers cancel for
// different reasons.
const REASONS = {
  staff: [
    "Customer asked to cancel",
    "Item not available",
    "Kitchen too busy",
    "Duplicate order",
    "Wrong order entered",
  ],
  customer: [
    "Ordered by mistake",
    "Want to change my order",
    "Taking too long",
    "Changed my mind",
  ],
};
const OTHER = "Other";
export const CANCEL_REASON_MAX = 200;

/**
 * "Cancel order?" with a reason (required). onConfirm(reason) gets the chosen
 * reason, or the typed text for "Other". Looks like ConfirmDialog.
 */
const CancelOrderDialog = ({
  show,
  title = "Cancel this order?",
  message,
  audience = "staff",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (show) {
      setChoice("");
      setText("");
      setTouched(false);
    }
  }, [show]);

  const reason = (choice === OTHER ? text : choice).trim();
  const confirm = () => {
    setTouched(true);
    if (reason) onConfirm?.(reason.slice(0, CANCEL_REASON_MAX));
  };

  return (
    <Modal
      show={show}
      onHide={() => !loading && onCancel?.()}
      centered
      backdrop="static"
      dialogClassName="confirm-dialog cancel-order-dialog"
      aria-labelledby="cancel-order-title"
    >
      <Modal.Body>
        <div className="confirm-dialog__icon confirm-dialog__icon--warning" aria-hidden>
          <ErrorOutlineRounded />
        </div>
        <h2 id="cancel-order-title" className="confirm-dialog__title">
          {title}
        </h2>
        {message && <p className="confirm-dialog__message">{message}</p>}

        <fieldset className="cancel-order__reasons">
          <legend>Reason for cancelling</legend>
          <div className="cancel-order__chips" role="radiogroup" aria-label="Reason">
            {[...(REASONS[audience] || REASONS.staff), OTHER].map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={choice === option}
                className={`dish-prefs__chip${choice === option ? " is-selected" : ""}`}
                onClick={() => setChoice(option)}
                disabled={loading}
              >
                {option}
              </button>
            ))}
          </div>
          {choice === OTHER && (
            <textarea
              rows={2}
              maxLength={CANCEL_REASON_MAX}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Tell us why"
              autoFocus
              disabled={loading}
            />
          )}
          {touched && !reason && (
            <small className="cancel-order__error">
              {choice === OTHER ? "Type the reason." : "Choose a reason."}
            </small>
          )}
        </fieldset>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Keep order
          </button>
          <button
            type="button"
            className="hotel-form__btn confirm-dialog__confirm confirm-dialog__confirm--warning"
            onClick={confirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : "Cancel order"}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CancelOrderDialog;
