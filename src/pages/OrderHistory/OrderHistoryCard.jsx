import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import useGlobalMaster from "hooks/useGlobalMaster";
import useToast from "hooks/useToast";
import ConfirmDialog from "components/common/ConfirmDialog";
import OrderTracker from "./OrderTracker";
import { cancelOrder } from "services";
import { getApiErrorMessage } from "utils/apiError";
import { paymentLabel } from "utils/paymentStatus";

const ORDERED = 1; // customers can cancel until the kitchen accepts

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

  const cancel = async () => {
    setCancelling(true);
    try {
      const response = await cancelOrder(order.id);
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
  const finishedAt =
    order.served_at || order.delivered_at || order.completed_at || order.updatedAt;

  const orderedAt = order.ordered_at || order.createdAt || order.booking_date;
  const items = order.items || [];
  const total = Number(
    order.total_amount ?? order.totalAmount ?? order.subtotal ?? order.total ?? 0,
  );

  return (
    // Finished orders are dimmed; orders still in progress stand out.
    <article
      className={`cx-card cx-order ${finished ? "is-finished" : "is-live"}`}
      style={{ "--status-color": statusColor }}
      aria-disabled={finished || undefined}
    >
      <div className="cx-order__head">
        <div>
          <h3>
            {order.order_number || `Order #${order.id}`}
            {!finished && (
              <span className="cx-order__live">
                <span className="cx-order__live-dot" aria-hidden /> Live
              </span>
            )}
          </h3>
          <p>
            {orderedAt && dayjs(orderedAt).format("D MMM, h:mm A")}
            {!order.reservation_id && " · No table"}
          </p>
        </div>
        <span className="cx-order__hotel" title={order.hotel?.hotel_name}>
          {order.hotel?.hotel_name || "Restaurant"}
        </span>
      </div>

      {finished ? (
        <div className="cx-order__final">
          <span
            className="ui-chip booking-status"
            style={{ "--status-color": statusColor }}
          >
            {statusName}
          </span>
          {finishedAt && <span>{dayjs(finishedAt).format("D MMM YYYY, h:mm A")}</span>}
        </div>
      ) : (
        <OrderTracker
          status={order.order_status}
          cookName={order.cook?.cook_name}
          serverName={order.server?.server_name}
          delivery={!order.reservation_id}
          colorOf={colorOf}
        />
      )}

      {items.length > 0 && (
        <ul className="cx-order__items">
          {items.slice(0, VISIBLE_ITEMS).map((item, index) => (
            <li key={item.id || index}>
              <span className="cx-order__qty">{item.quantity ?? item.qty ?? 1}×</span>
              <span className="cx-order__name">
                {item.menu_name || item.name || "Item"}
              </span>
              <span className="cx-order__price">
                ₹{Number(item.total_price ?? item.totalPrice ?? item.unit_price ?? item.price ?? 0)}
              </span>
            </li>
          ))}
          {items.length > VISIBLE_ITEMS && (
            <li className="cx-order__more">
              +{items.length - VISIBLE_ITEMS} more{" "}
              {items.length - VISIBLE_ITEMS === 1 ? "item" : "items"}
            </li>
          )}
        </ul>
      )}

      <div className="cx-order__foot">
        <span>{paymentLabel(order.payment_status, paymentStatusList?.data)}</span>
        <strong>₹{total.toFixed(2)}</strong>
      </div>

      {order.order_status === ORDERED && (
        <button
          type="button"
          className="ui-btn ui-btn--ghost ui-btn--sm cx-order__cancel"
          onClick={() => setConfirming(true)}
        >
          Cancel order
        </button>
      )}

      <ConfirmDialog
        show={confirming}
        tone="warning"
        title={`Cancel ${order.order_number ? `order ${order.order_number}` : "this order"}?`}
        message="The kitchen hasn't started it yet."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancelling}
        onConfirm={cancel}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
};

export default OrderHistoryCard;
