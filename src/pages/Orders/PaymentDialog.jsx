import React, { useEffect, useState } from "react";
import {
  CreditCardOutlined,
  PaymentsOutlined,
  QrCode2Outlined,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", Icon: PaymentsOutlined },
  { value: "card", label: "Card", Icon: CreditCardOutlined },
  { value: "upi", label: "UPI", Icon: QrCode2Outlined },
];

export const paymentMethodLabel = (value) =>
  PAYMENT_METHODS.find((method) => method.value === value)?.label || "";

/**
 * Asks how an order was paid.
 * deliver = true: shown when the card is dropped on Delivered; the order is
 * delivered either way ("Pay later" keeps the payment pending).
 */
// title / laterLabel / payLabel(method) override the wording (e.g. when a
// booking is completed on the Reservations page).
const PaymentDialog = ({
  order,
  deliver = false,
  title,
  laterLabel,
  payLabel,
  onConfirm,
  onCancel,
}) => {
  const [method, setMethod] = useState("cash");

  useEffect(() => {
    if (order) setMethod(order.payment_method || "cash");
  }, [order]);

  const total = Number(order?.total_amount || 0).toFixed(2);
  const itemCount = (order?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const label = order?.order_number || `#${order?.id ?? ""}`;

  return (
    <PopupModal
      show={Boolean(order)}
      onClose={onCancel}
      header
      title={title || (deliver ? `Deliver order ${label}` : `Collect payment · ${label}`)}
      className="hotel-form__body"
      customClassName="hotel-form-dialog payment-dialog"
    >
      <div className="payment-dialog__body">
        <div className="payment-dialog__total">
          <span>
            Amount to collect
            {itemCount > 0 && ` · ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </span>
          <strong>₹{total}</strong>
        </div>

        <span className="hotel-form__label">Payment method</span>
        <div className="payment-dialog__methods" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHODS.map(({ value, label: text, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={method === value}
              className={`payment-method${method === value ? " is-active" : ""}`}
              onClick={() => setMethod(value)}
            >
              <Icon aria-hidden />
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="hotel-form__actions">
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={deliver ? () => onConfirm({ paid: false }) : onCancel}
        >
          {laterLabel || (deliver ? "Deliver · pay later" : "Cancel")}
        </button>
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--primary"
          onClick={() => onConfirm({ paid: true, method })}
        >
          {payLabel
            ? payLabel(paymentMethodLabel(method))
            : deliver
              ? `Paid by ${paymentMethodLabel(method)} & deliver`
              : `Mark paid · ${paymentMethodLabel(method)}`}
        </button>
      </div>
    </PopupModal>
  );
};

export default PaymentDialog;
