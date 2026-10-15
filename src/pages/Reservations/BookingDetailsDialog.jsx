import React from "react";
import dayjs from "dayjs";
import PopupModal from "components/common/PopupModal";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { formatDuration } from "pages/Orders/PrepTimer";
import { paymentMethodLabel } from "pages/Orders/PaymentDialog";
import BookingStageTracker from "./BookingStageTracker";

const ITEM_CANCELLED = 5;
const ORDER_CANCELLED = 7;
const PAID = 1;

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const when = (value) => (value ? dayjs(value).format("D MMM YYYY, h:mm A") : "—");

// "19:00:00" on the dining day → "7:00 PM".
const diningTime = (row) => {
  if (!row?.dining_date) return "—";
  const day = dayjs(row.dining_date);
  if (!row.start_time) return day.format("ddd, D MMM YYYY · h:mm A");
  const start = dayjs(`${day.format("YYYY-MM-DD")}T${String(row.start_time).slice(0, 5)}`);
  return `${day.format("ddd, D MMM YYYY")} · ${start.format("h:mm A")}`;
};

// Time a dish took: from the order's start of cooking to its tick.
const dishTime = (order, item) =>
  order.preparing_at && item.ready_at
    ? formatDuration(new Date(item.ready_at) - new Date(order.preparing_at))
    : null;

// Whole order: start of cooking to the last dish ticked.
const orderPrepTime = (order) => {
  const dishes = (order.items || []).filter((item) => item.item_status !== ITEM_CANCELLED);
  if (!order.preparing_at || !dishes.length || dishes.some((item) => !item.ready_at)) {
    return null;
  }
  const last = Math.max(...dishes.map((item) => new Date(item.ready_at).getTime()));
  return formatDuration(last - new Date(order.preparing_at).getTime());
};

const Person = ({ name, photo, tone, role, detail }) => (
  <div className={`booking-details__person booking-details__person--${tone}`}>
    <StaffAvatar name={name} photo={photo} size={32} tone={tone} />
    <span>
      <strong>{name}</strong>
      <small>
        {role}
        {detail ? ` · ${detail}` : ""}
      </small>
    </span>
  </div>
);

/**
 * Everything about one booking: who booked it, when and where, the staff on
 * it, and every food order with each dish's cook and cooking time.
 */
const BookingDetailsDialog = ({
  reservation,
  orders = [],
  statusName,
  statusColor,
  tables = [],
  seats = 0,
  orderStages = {},
  // Booking stage names / colours for the tracker: [{ id, name, color }].
  stageColumns = [],
  onOpenOrder,
  onClose,
}) => {
  if (!reservation) return null;

  const user = reservation.user;
  const byAdmin = String(user?.role || "").toLowerCase() === "admin";
  // Reservations name their created time booking_date (see the model).
  const bookedAt = reservation.booking_date || reservation.createdAt;
  const liveOrders = orders.filter((order) => order.order_status !== ORDER_CANCELLED);
  const billTotal = liveOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const paidTotal = liveOrders
    .filter((order) => order.payment_status === PAID)
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return (
    <PopupModal
      show={Boolean(reservation)}
      onClose={onClose}
      header
      title={`Booking #${reservation.id}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog order-dialog booking-details-dialog"
    >
      <div className="hotel-form booking-details">
        <div className="order-details__meta">
          <span
            className="ui-chip booking-status"
            style={{ "--status-color": statusColor || "#64748b" }}
          >
            {statusName || "—"}
          </span>
          <span>{reservation.hotel?.hotel_name || "—"}</span>
          <span>Booked {when(bookedAt)}</span>
        </div>

        {/* ---------- Stages: when each started, time in each, total ---------- */}
        <BookingStageTracker reservation={reservation} columns={stageColumns} />

        {/* ---------- Who & when ---------- */}
        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">Booking</h3>
          <dl className="booking-details__facts">
            <div>
              <dt>Booked by</dt>
              <dd>
                {user?.name || `Customer #${reservation.user_id}`}
                {/* Staff bookings just say Admin; customer bookings show contact details. */}
                {byAdmin ? (
                  <span className="booking-details__admin-tag">Admin</span>
                ) : (
                  <>
                    {user?.mobilenumber && <small>{user.mobilenumber}</small>}
                    {user?.email && <small>{user.email}</small>}
                  </>
                )}
              </dd>
            </div>
            {/* Staff booking for a phone / walk-in guest. */}
            {byAdmin && reservation.customer_name && (
              <div>
                <dt>Guest</dt>
                <dd>
                  {reservation.customer_name}
                  {reservation.customer_mobile && <small>{reservation.customer_mobile}</small>}
                </dd>
              </div>
            )}
            <div>
              <dt>Dining</dt>
              <dd>{diningTime(reservation)}</dd>
            </div>
            <div>
              <dt>Floor</dt>
              <dd>Floor {reservation.floor?.floor_number ?? "—"}</dd>
            </div>
            <div>
              <dt>Tables</dt>
              <dd>{tables.length ? tables.join(", ") : "No table"}</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>
                {seats}
                {reservation.guest_count ? ` · ${reservation.guest_count} guests` : ""}
              </dd>
            </div>
            <div>
              <dt>Booked on</dt>
              <dd>{when(bookedAt)}</dd>
            </div>
          </dl>
        </section>

        {/* ---------- Staff ---------- */}
        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">Staff</h3>
          <div className="booking-details__people">
            {reservation.server ? (
              <Person
                name={reservation.server.server_name}
                photo={reservation.server.photo_url}
                tone="server"
                role="Server"
                detail={reservation.server.section}
              />
            ) : (
              <p className="booking-details__none">No server assigned</p>
            )}
            {reservation.cleaner ? (
              <Person
                name={reservation.cleaner.cleaner_name}
                photo={reservation.cleaner.photo_url}
                tone="cleaner"
                role="Cleaner"
                detail={reservation.cleaner.shift}
              />
            ) : (
              <p className="booking-details__none">No cleaner assigned</p>
            )}
          </div>
        </section>

        {/* ---------- Food ---------- */}
        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">
            Food orders <span className="order-details__count">{orders.length}</span>
          </h3>
          {orders.length === 0 ? (
            <p className="booking-details__none">No food ordered for this booking.</p>
          ) : (
            // Latest order first (last in, first out); cancelled ones go
            // last and faded, also latest first.
            [...orders]
              .sort(
                (a, b) =>
                  (a.order_status === ORDER_CANCELLED) - (b.order_status === ORDER_CANCELLED) ||
                  new Date(b.ordered_at || b.createdAt) - new Date(a.ordered_at || a.createdAt),
              )
              .map((order) => {
              const isCancelled = order.order_status === ORDER_CANCELLED;
              const stage = isCancelled
                ? { name: "Cancelled", color: "#ef4444" }
                : orderStages[order.order_status] || { name: "—", color: "#64748b" };
              const prepTime = orderPrepTime(order);
              const finishedAt = order.served_at || order.delivered_at;
              return (
                <article
                  key={order.id}
                  className={`booking-details__order ${isCancelled ? "is-cancelled" : "is-active"}`}
                >
                  <header>
                    <button
                      type="button"
                      className="booking-details__order-no"
                      onClick={() => onOpenOrder?.(order)}
                      title="Open this order"
                    >
                      {order.order_number || `#${order.id}`}
                    </button>
                    <span
                      className="kanban-card__order-stage"
                      style={{ "--stage-color": stage.color }}
                    >
                      {stage.name}
                    </span>
                  </header>
                  <p className="booking-details__order-meta">
                    <span>Ordered {when(order.createdAt)}</span>
                    {prepTime && <span>Prepared in {prepTime}</span>}
                    {finishedAt && (
                      <span>
                        {order.served_at ? "Served" : "Delivered"} {when(finishedAt)}
                      </span>
                    )}
                    {order.server?.server_name && <span>Server: {order.server.server_name}</span>}
                    {isCancelled && order.cancelled_at && (
                      <span className="booking-details__cancelled-by">
                        Cancelled {when(order.cancelled_at)}
                        {order.cancelled_by_name && ` by ${order.cancelled_by_name}`}
                        {order.cancel_reason && ` · “${order.cancel_reason}”`}
                      </span>
                    )}
                  </p>

                  <table className="booking-details__dishes">
                    <thead>
                      <tr>
                        <th>Dish</th>
                        <th>Cook</th>
                        <th className="is-right">Time taken</th>
                        <th className="is-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item) => {
                        const cancelled = item.item_status === ITEM_CANCELLED;
                        return (
                          <tr key={item.id} className={cancelled ? "is-cancelled" : ""}>
                            <td>
                              {item.quantity} × {item.menu_name}
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
                            <td className="is-right">
                              {cancelled ? "Cancelled" : dishTime(order, item) || "—"}
                            </td>
                            <td className="is-right">{money(item.total_price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <footer>
                    <span
                      className={`kanban-card__badge kanban-card__badge--payment-${order.payment_status}`}
                    >
                      {order.order_status === ORDER_CANCELLED
                        ? "Cancelled"
                        : order.payment_status === PAID
                          ? `Paid${order.payment_method ? ` · ${paymentMethodLabel(order.payment_method)}` : ""}`
                          : "Payment pending"}
                    </span>
                    <strong>{money(order.total_amount)}</strong>
                  </footer>
                </article>
              );
            })
          )}
        </section>

        {liveOrders.length > 0 && (
          <dl className="order-totals">
            <div>
              <dt>Paid</dt>
              <dd>{money(paidTotal)}</dd>
            </div>
            <div>
              <dt>Pending</dt>
              <dd>{money(billTotal - paidTotal)}</dd>
            </div>
            <div className="order-totals__grand">
              <dt>Booking total</dt>
              <dd>{money(billTotal)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="hotel-form__actions">
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </PopupModal>
  );
};

export default BookingDetailsDialog;
