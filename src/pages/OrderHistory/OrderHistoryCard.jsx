import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  CancelRounded,
  CheckCircleRounded,
  LocationOnOutlined,
  TableRestaurantOutlined,
} from "@mui/icons-material";
import useGlobalMaster from "hooks/useGlobalMaster";
import useToast from "hooks/useToast";
import CancelOrderDialog from "components/common/CancelOrderDialog";
import OrderTracker from "./OrderTracker";
import { cancelOrder } from "services";
import { getApiErrorMessage } from "utils/apiError";
import { paymentLabel } from "utils/paymentStatus";

const ORDERED = 1; // customers can cancel until the kitchen accepts
const CANCELLED = 7;

// Same fallbacks as the admin Orders board (pages/Orders/OrderBoard.jsx),
// used until order_status_master has loaded.
const STATUS_NAMES = {
  1: "Ordered",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Served",
  6: "Completed",
  7: "Cancelled",
  8: "Delivered",
};
const STATUS_COLORS = {
  1: "#6366f1",
  2: "#0ea5e9",
  3: "#f59e0b",
  4: "#14b8a6",
  5: "#8b5cf6",
  6: "#22c55e",
  7: "#ef4444",
  8: "#0ea5e9",
};
// Payment wording comes from Settings → Payment status (utils/paymentStatus).
const VISIBLE_ITEMS = 4;

const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const OrderHistoryCard = ({ order, onChanged }) => {
  const { orderStatusList, getOrderStatus, paymentStatusList, getPaymentStatus } =
    useGlobalMaster();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancel = async (reason) => {
    setCancelling(true);
    try {
      const response = await cancelOrder(order.id, reason);
      if (response?.success === false) throw new Error(response.message);
      showToast({ message: "Order cancelled", variant: "success" });
      setConfirming(false);
      onChanged?.();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || error?.message || "Unable to cancel the order.",
        variant: "danger",
      });
      setConfirming(false);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!orderStatusList?.data?.length && !orderStatusList?.loading) {
      getOrderStatus();
    }
    if (!paymentStatusList?.data?.length && !paymentStatusList?.loading) {
      getPaymentStatus().catch(() => {});
    }
  }, []);

  const master = orderStatusList?.data?.find(
    (status) => status.status_id === order.order_status,
  );
  const statusName = master?.name
    ? titleCase(master.name)
    : STATUS_NAMES[order.order_status] || "—";
  // Colour of any status: the master table's colour, else the default.
  const colorOf = (statusId) => {
    const row = orderStatusList?.data?.find((item) => item.status_id === statusId);
    return (
      (row?.color_code && row.color_code !== "#000000"
        ? row.color_code
        : STATUS_COLORS[statusId]) || "#64748b"
    );
  };
  const statusColor = colorOf(order.order_status);
  // Completed / cancelled orders show just their status and when it ended.
  // Served / Delivered finish an order (6 = old "Completed", 7 = Cancelled).
  const finished = [5, 6, 7, 8].includes(order.order_status);
  const cancelled = order.order_status === CANCELLED;
  const finishedAt =
    (cancelled && order.cancelled_at) ||
    order.served_at ||
    order.delivered_at ||
    order.completed_at ||
    order.updatedAt;

  const orderedAt = order.ordered_at || order.createdAt || order.booking_date;
  const items = order.items || [];
  const total = Number(
    order.total_amount ?? order.totalAmount ?? order.subtotal ?? order.total ?? 0,
  );
  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
  // Bill lines shown above the total (only the ones that apply).
  const billLines = [
    ["Subtotal", Number(order.subtotal || 0)],
    ["Tax", Number(order.tax || 0)],
    ["Service charge", Number(order.service_charge || 0)],
    ["Discount", -Number(order.discount || 0)],
  ].filter(([label, value]) => label === "Subtotal" || value !== 0);

  const hotel = order.hotel || {};
  const place = [hotel.area?.name, hotel.location?.name].filter(Boolean).join(", ");

  return (
    // A ticket: status strip, restaurant + order details, tear line, the
    // items and bill, tear line, payment + total. Finished orders are quieter.
    <article
      className={`cx-ticket ${finished ? "is-finished" : "is-live"}${cancelled ? " is-cancelled" : ""}`}
      style={{ "--status-color": statusColor }}
      aria-disabled={finished || undefined}
    >
      <div className="cx-ticket__status">
        <span className="cx-ticket__status-name">
          {finished ? (
            cancelled ? (
              <CancelRounded fontSize="inherit" aria-hidden />
            ) : (
              <CheckCircleRounded fontSize="inherit" aria-hidden />
            )
          ) : (
            <span className="cx-order__live-dot" aria-hidden />
          )}
          {finished ? statusName : `Live · ${statusName}`}
        </span>
        {finished && finishedAt && (
          <span className="cx-ticket__status-time">
            {dayjs(finishedAt).format("D MMM YYYY, h:mm A")}
          </span>
        )}
      </div>

      <div className="cx-ticket__body">
        <h3 className="cx-ticket__hotel">{hotel.hotel_name || "Restaurant"}</h3>
        {place && (
          <p className="cx-ticket__place">
            <LocationOnOutlined fontSize="inherit" aria-hidden />
            {place}
          </p>
        )}
        {hotel.address && <p className="cx-ticket__address">{hotel.address}</p>}

        <div className="cx-ticket__meta">
          <span className="cx-ticket__number">{order.order_number || `Order #${order.id}`}</span>
          <span>
            {orderedAt && `Ordered ${dayjs(orderedAt).format("D MMM, h:mm A")}`}
            {" · "}
            <TableRestaurantOutlined fontSize="inherit" aria-hidden />{" "}
            {order.reservation_id ? "Table booking" : "No table"}
          </span>
        </div>

        {!finished && (
          <OrderTracker
            status={order.order_status}
            cookName={order.cook?.cook_name}
            serverName={order.server?.server_name}
            delivery={!order.reservation_id}
            colorOf={colorOf}
          />
        )}

        {/* Who cancelled ("Admin" = the restaurant, or the customer) and why. */}
        {cancelled && (order.cancelled_by_name || order.cancel_reason) && (
          <div className="cx-order__cancel-info">
            {order.cancelled_by_name && (
              <span>
                Cancelled by{" "}
                <strong>{order.cancelled_by_name}</strong>
              </span>
            )}
            {order.cancel_reason && (
              <span className="cx-order__cancel-reason">Reason: {order.cancel_reason}</span>
            )}
          </div>
        )}
      </div>

      <div className="cx-ticket__tear" aria-hidden />

      <div className="cx-ticket__body">
        {items.length > 0 && (
          <ul className="cx-ticket__items">
            {items.slice(0, VISIBLE_ITEMS).map((item, index) => (
              <li key={item.id || index}>
                <span className="cx-ticket__qty">{item.quantity ?? item.qty ?? 1}×</span>
                <span className="cx-ticket__name">
                  {item.menu_name || item.name || "Item"}
                  {item.notes && <small className="item-note">{item.notes}</small>}
                </span>
                <span className="cx-ticket__price">
                  {money(item.total_price ?? item.totalPrice ?? item.unit_price ?? item.price)}
                </span>
              </li>
            ))}
            {items.length > VISIBLE_ITEMS && (
              <li className="cx-ticket__more">
                +{items.length - VISIBLE_ITEMS} more{" "}
                {items.length - VISIBLE_ITEMS === 1 ? "item" : "items"}
              </li>
            )}
          </ul>
        )}

        {billLines.length > 1 && (
          <dl className="cx-ticket__bill">
            {billLines.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value < 0 ? `− ${money(-value)}` : money(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="cx-ticket__tear" aria-hidden />

      <div className="cx-ticket__foot">
        <span className="cx-ticket__payment">
          {paymentLabel(order.payment_status, paymentStatusList?.data)}
        </span>
        <span className="cx-ticket__total">
          <small>Total</small>
          <strong>{money(total)}</strong>
        </span>
      </div>

      {order.order_status === ORDERED && (
        <button
          type="button"
          className="ui-btn ui-btn--ghost ui-btn--sm cx-order__cancel cx-ticket__cancel"
          onClick={() => setConfirming(true)}
        >
          Cancel order
        </button>
      )}

      <CancelOrderDialog
        show={confirming}
        title={`Cancel ${order.order_number ? `order ${order.order_number}` : "this order"}?`}
        message="The kitchen hasn't started it yet."
        audience="customer"
        loading={cancelling}
        onConfirm={cancel}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
};

export default OrderHistoryCard;
