import React, { useEffect, useRef } from "react";
import dayjs from "dayjs";
import PopupModal from "components/common/PopupModal";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { groupDishes, stageBreakdown } from "./bookingDishes";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
// Table orders are served; orders without a booking are delivered.
const servedAt = (order) => order.served_at || order.delivered_at || null;

/**
 * Every dish of a booking with each order it came in: order number, quantity,
 * status, cook, notes, time and amount. Opened from a dish on the booking
 * card; that dish is highlighted and scrolled into view.
 */
const BookingFoodDialog = ({ booking, orders = [], stages = {}, focusKey, onOpenOrder, onClose }) => {
  const focusRef = useRef(null);
  // Latest first: each dish's newest order line on top, and the dish ordered
  // most recently first.
  const orderedAt = (line) => new Date(line.order.createdAt).getTime() || 0;
  const dishes = groupDishes(orders)
    .map((dish) => ({
      ...dish,
      lines: [...dish.lines].sort((a, b) => orderedAt(b) - orderedAt(a) || b.item.id - a.item.id),
    }))
    .sort((a, b) => orderedAt(b.lines[0]) - orderedAt(a.lines[0]));
  const total = dishes.reduce(
    (sum, dish) => sum + dish.lines.reduce((s, { item }) => s + Number(item.total_price || 0), 0),
    0,
  );

  useEffect(() => {
    if (!booking) return undefined;
    // Wait for the dialog to open before scrolling.
    const timer = setTimeout(() => focusRef.current?.scrollIntoView({ block: "center" }), 150);
    return () => clearTimeout(timer);
  }, [booking, focusKey]);

  if (!booking) return null;

  const stageOf = (stageId) => stages[stageId] || { name: "—", color: "#64748b" };

  return (
    <PopupModal
      show={Boolean(booking)}
      onClose={onClose}
      header
      title={`Food · Booking #${booking.id}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog order-dialog booking-food-dialog"
    >
      <div className="hotel-form booking-food">
        <p className="booking-food__summary">
          {dishes.length} {dishes.length === 1 ? "dish" : "dishes"} from {orders.length}{" "}
          {orders.length === 1 ? "order" : "orders"} · {booking.hotel?.hotel_name || "—"}
        </p>

        {dishes.length === 0 && <p className="booking-details__none">No food ordered yet.</p>}

        {dishes.map((dish) => {
          const stage = stageOf(dish.stageId);
          const mixed = new Set(dish.lines.map((line) => line.stageId)).size > 1;
          const focused = dish.key === focusKey;
          return (
            <section
              key={dish.key}
              ref={focused ? focusRef : undefined}
              className={`booking-food__dish${focused ? " is-focused" : ""}`}
            >
              <header>
                <strong>
                  {dish.quantity} × {dish.name}
                </strong>
                {mixed ? (
                  // Portions at different stages: one readable breakdown chip.
                  <span className="booking-food__mixed" title="Portions are at different stages">
                    {stageBreakdown(dish, stages)}
                  </span>
                ) : (
                  <span className="kanban-card__order-stage" style={{ "--stage-color": stage.color }}>
                    {stage.name}
                  </span>
                )}
              </header>

              <table className="booking-details__dishes">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th className="is-right">Qty</th>
                    <th>Status</th>
                    <th>Cook</th>
                    <th>Ordered</th>
                    <th>Served</th>
                    <th className="is-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dish.lines.map(({ order, item, stageId }) => {
                    const lineStage = stageOf(stageId);
                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="booking-details__order-no"
                              title="Open this order"
                              onClick={() => onOpenOrder?.(order)}
                            >
                              {order.order_number || `#${order.id}`}
                            </button>
                          </td>
                          <td className="is-right">{item.quantity}</td>
                          <td>
                            <span
                              className="kanban-card__order-stage"
                              style={{ "--stage-color": lineStage.color }}
                            >
                              {lineStage.name}
                            </span>
                          </td>
                          <td>
                            {item.cook?.cook_name ? (
                              <span className="booking-details__cook">
                                <StaffAvatar
                                  name={item.cook.cook_name}
                                  photo={item.cook.photo_url}
                                  size={20}
                                  tone="cook"
                                />
                                {item.cook.cook_name}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{dayjs(order.createdAt).format("D MMM, h:mm A")}</td>
                          <td>
                            {/* Served with its order; before that, when the dish was ready. */}
                            {servedAt(order) ? (
                              <span title={dayjs(servedAt(order)).format("D MMM YYYY, h:mm A")}>
                                {dayjs(servedAt(order)).format("D MMM, h:mm A")}
                              </span>
                            ) : item.ready_at ? (
                              <span className="booking-food__pending">
                                Ready {dayjs(item.ready_at).format("h:mm A")}
                              </span>
                            ) : (
                              <span className="booking-food__pending">—</span>
                            )}
                          </td>
                          <td className="is-right">{money(item.total_price)}</td>
                        </tr>
                        {item.notes && (
                          <tr className="booking-food__note-row">
                            <td colSpan={7}>
                              <span className="item-note">{item.notes}</span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}

        {dishes.length > 0 && (
          <dl className="order-totals">
            <div className="order-totals__grand">
              <dt>Food total (before tax)</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="hotel-form__actions">
        <button type="button" className="hotel-form__btn hotel-form__btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </PopupModal>
  );
};

export default BookingFoodDialog;
