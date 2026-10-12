import React from "react";

const OrderSummary = ({ totalItems = 0, totalAmount = 0, onSkip, onPlaceOrder }) => {
  return (
    <div className="hotel-form__actions order-summary">
      <div className="order-summary__total">
        <span>
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
        <strong>₹{Number(totalAmount).toFixed(2)}</strong>
      </div>

      <button
        type="button"
        className="hotel-form__btn hotel-form__btn--ghost"
        onClick={onSkip}
      >
        Skip
      </button>
      <button
        type="button"
        className="hotel-form__btn hotel-form__btn--primary"
        onClick={onPlaceOrder}
        disabled={totalItems === 0}
      >
        Place order
      </button>
    </div>
  );
};

export default OrderSummary;
