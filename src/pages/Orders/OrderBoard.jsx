import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import KanbanBoard from "components/common/KanbanBoard";
import PopupModal from "components/common/PopupModal";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import { getAllOrders, updateOrderStatus, cancelOrder } from "services";

// Matches ORDER_STATUS in the API (utils/orderStatus.js). Used when the
// order_status_master table has not been seeded yet.
const DEFAULT_ORDER_STATUSES = [
  { status_id: 1, name: "ORDERED" },
  { status_id: 2, name: "ACCEPTED" },
  { status_id: 3, name: "PREPARING" },
  { status_id: 4, name: "READY" },
  { status_id: 5, name: "SERVED" },
  { status_id: 6, name: "COMPLETED" },
  { status_id: 7, name: "CANCELLED" },
];
const DEFAULT_COLORS = {
  1: "#6366f1",
  2: "#0ea5e9",
  3: "#f59e0b",
  4: "#14b8a6",
  5: "#8b5cf6",
  6: "#22c55e",
  7: "#ef4444",
};
const NOT_ORDERED = 0;
const COMPLETED = 6;
const CANCELLED = 7;
const PAYMENT_LABELS = { 0: "Payment pending", 1: "Paid", 2: "Refunded" };
const ORDERS_PAGE_LIMIT = 500;
const VISIBLE_ITEMS = 3;

const OrderBoard = () => {
  const { showToast } = useToast();
  const { orderStatusList, getOrderStatus } = useGlobalMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllOrders({ limit: ORDERS_PAGE_LIMIT });
      if (response.success) {
        setOrders(response.rows || []);
      } else {
        showToast({ message: response.message, variant: "danger" });
      }
    } catch (error) {
      showToast({ message: error, variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderStatusList.data.length === 0) {
      getOrderStatus().catch(() => {});
    }
    fetchOrders();
  }, []);

  const columns = useMemo(() => {
    const statuses = orderStatusList.data?.length
      ? orderStatusList.data
      : DEFAULT_ORDER_STATUSES;
    return statuses
      .filter((status) => status.status_id !== NOT_ORDERED)
      .map((status) => ({
        id: status.status_id,
        // Unseeded rows can still carry the "STATUS_<id>" placeholder name.
        name: /^STATUS_\d+$/.test(status.name)
          ? DEFAULT_ORDER_STATUSES.find(
              (fallback) => fallback.status_id === status.status_id,
            )?.name || status.name
          : status.name,
        color:
          status.color_code && status.color_code !== "#000000"
            ? status.color_code
            : DEFAULT_COLORS[status.status_id] || "#64748b",
      }));
  }, [orderStatusList.data]);

  const setLocalStatus = (orderId, statusId) =>
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, order_status: statusId } : order,
      ),
    );

  const statusName = (statusId) =>
    columns.find((column) => column.id === statusId)?.name || "this status";
  const orderLabel = (order) => order.order_number || `#${order.id}`;

  const changeStatus = async (order, statusId, request) => {
    const previousStatus = order.order_status;
    setLocalStatus(order.id, statusId);
    try {
      const response = await request();
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Order status updated successfully",
        variant: "success",
      });
    } catch (error) {
      setLocalStatus(order.id, previousStatus);
      showToast({
        title:
          statusId === CANCELLED
            ? `Couldn't cancel order ${orderLabel(order)}`
            : `Couldn't move order ${orderLabel(order)} to ${statusName(statusId)}`,
        message: error,
        variant: "danger",
      });
    }
  };

  const handleBlocked = (order, column, reason) => {
    if (reason === "outside") {
      showToast({
        title: "Order not moved",
        message: "Drop the card on a status column to change its status.",
        variant: "warning",
      });
      return;
    }
    showToast({
      title: `Can't move order ${orderLabel(order)}`,
      message: `${statusName(order.order_status)} orders are closed and can't be moved to ${column.name}.`,
      variant: "warning",
    });
  };

  const handleMove = (order, column) => {
    if (column.id === CANCELLED) {
      setPendingCancel(order);
      return;
    }
    changeStatus(order, column.id, () =>
      updateOrderStatus(order.id, { order_status: column.id }),
    );
  };

  const confirmCancel = () => {
    const order = pendingCancel;
    setPendingCancel(null);
    if (!order) return;
    // The cancel endpoint also marks every order item as cancelled.
    changeStatus(order, CANCELLED, () => cancelOrder(order.id));
  };

  const renderCard = (order) => {
    const items = order.items || [];
    return (
      <Fragment>
        <div className="kanban-card__head">
          <span className="kanban-card__title">
            {order.order_number || `Order #${order.id}`}
          </span>
          <span className="kanban-card__ref">
            Res #{order.reservation_id}
          </span>
        </div>
        <div className="kanban-card__meta">
          <span>{order.hotel?.hotel_name || "-"}</span>
          <span>{dayjs(order.createdAt).format("DD MMM, hh:mm A")}</span>
        </div>
        {items.length > 0 && (
          <ul className="kanban-card__items">
            {items.slice(0, VISIBLE_ITEMS).map((item) => (
              <li key={item.id}>
                <span>
                  {item.quantity} × {item.menu_name}
                </span>
              </li>
            ))}
            {items.length > VISIBLE_ITEMS && (
              <li className="kanban-card__more">
                +{items.length - VISIBLE_ITEMS} more
              </li>
            )}
          </ul>
        )}
        <div className="kanban-card__foot">
          <span
            className={`kanban-card__badge kanban-card__badge--payment-${order.payment_status}`}
          >
            {PAYMENT_LABELS[order.payment_status] || "-"}
          </span>
          <strong>₹{Number(order.total_amount || 0).toFixed(2)}</strong>
        </div>
      </Fragment>
    );
  };

  return (
    <Fragment>
      <section className="app-page kanban-page">
        <div className="kanban-page__header">
          <button
            type="button"
            className="kanban-page__refresh"
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <KanbanBoard
          columns={columns}
          items={orders}
          getColumnId={(order) => order.order_status}
          canMove={(order) =>
            ![COMPLETED, CANCELLED].includes(order.order_status)
          }
          onMove={handleMove}
          onBlocked={handleBlocked}
          renderCard={renderCard}
          loading={loading}
          emptyLabel="No orders"
        />
      </section>

      <PopupModal
        show={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">
            Cancel order {pendingCancel?.order_number || `#${pendingCancel?.id}`}?
          </h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button className="btn btn-0 modalDelete_btn px-3" onClick={confirmCancel}>
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => setPendingCancel(null)}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>
    </Fragment>
  );
};

export default OrderBoard;
