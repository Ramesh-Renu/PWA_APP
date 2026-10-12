import React from "react";
import { CheckRounded } from "@mui/icons-material";

// Order lifecycle (utils/orderStatus.js in the API).
// Served (table orders) / Delivered (no booking) is the last step.
const TABLE_STEPS = [
  { id: 1, label: "Ordered" },
  { id: 2, label: "Accepted" },
  { id: 3, label: "Preparing" },
  { id: 4, label: "Ready" },
  { id: 5, label: "Served" },
];
// Orders without a table booking are delivered instead of served.
const DELIVERY_STEPS = TABLE_STEPS.map((step) =>
  step.id === 5 ? { id: 8, label: "Delivered" } : step,
);

/**
 * Progress of an open order, left to right. Each reached step is drawn in
 * its own status colour (colorOf(statusId)); the current one pulses.
 */
const OrderTracker = ({ status, cookName, serverName, delivery = false, colorOf }) => {
  const steps = delivery ? DELIVERY_STEPS : TABLE_STEPS;
  const currentIndex = steps.findIndex((step) => step.id === status);
  const current = steps[currentIndex];

  return (
    <div className="order-tracker">
      <ol
        className="order-tracker__steps"
        aria-label={`Order status: ${current?.label || "in progress"}`}
      >
        {steps.map((step, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li
              key={step.id}
              className={`order-tracker__step is-${state}`}
              style={{ "--step-color": colorOf?.(step.id) || "#0f766e" }}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="order-tracker__dot" aria-hidden>
                {state === "done" && <CheckRounded />}
              </span>
              <span className="order-tracker__label">{step.label}</span>
            </li>
          );
        })}
      </ol>

      <p
        className="order-tracker__now"
        style={{ "--step-color": colorOf?.(status) || "#0f766e" }}
      >
        <strong>{current?.label || "In progress"}</strong>
        {status >= 2 && status <= 4 && cookName && ` · Cooking: ${cookName}`}
        {status === 5 && serverName && ` · Served by ${serverName}`}
        {status === 1 && " · Waiting for the kitchen to accept"}
      </p>
    </div>
  );
};

export default OrderTracker;
