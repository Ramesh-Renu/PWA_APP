import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { RefreshRounded } from "@mui/icons-material";
import KanbanBoard from "components/common/KanbanBoard";
import ConfirmDialog from "components/common/ConfirmDialog";
import AssignStaffDialog from "./AssignStaffDialog";
import OrderDetailsDialog from "./OrderDetailsDialog";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { COOK_CONFIG, SERVER_CONFIG } from "pages/Settings/Staff/staffConfig";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import {
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updateOrderItems,
} from "services";

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
  { status_id: 8, name: "DELIVERED" },
];
const DEFAULT_COLORS = {
  1: "#6366f1",
  2: "#0ea5e9",
  3: "#f59e0b",
  4: "#14b8a6",
  5: "#8b5cf6",
  6: "#22c55e",
  7: "#ef4444",
  8: "#0ea5e9",
};
const NOT_ORDERED = 0;
const ACCEPTED = 2;
const PREPARING = 3;
const SERVED = 5;
// Orders without a table booking go to Delivered instead of Served.
const DELIVERED = 8;
// Finished orders (Served / Delivered / old Completed / Cancelled): can't move or be edited.
const FINISHED = [SERVED, DELIVERED, 6, 7];
// Column order on the board (Delivered sits beside Served).
// Served / Delivered are the final stages (Completed is no longer used).
const COLUMN_ORDER = [1, 2, 3, 4, 5, 8, 7];
// The cook can be changed while the food is being made; the server once it
// is served. Later columns just show who did it.
const COOK_EDITABLE = [ACCEPTED, PREPARING];
const SERVER_EDITABLE = [SERVED];
const STAFF = { cook: COOK_CONFIG, server: SERVER_CONFIG };
const COMPLETED = 6; // legacy; not shown as a column
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
  // { kind: "cook" | "server", order, status }: accept/serve, or re-assign.
  const [staffRequest, setStaffRequest] = useState(null);
  // { order, item }: choosing the cook for one dish.
  const [itemCookRequest, setItemCookRequest] = useState(null);
  // Order whose details popup is open (looked up live so edits show at once).
  const [openOrderId, setOpenOrderId] = useState(null);
  const openOrder = orders.find((order) => order.id === openOrderId) || null;

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
      .filter(
        (status) => status.status_id !== NOT_ORDERED && status.status_id !== COMPLETED,
      )
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
      }))
      .sort((a, b) => {
        const rank = (id) =>
          COLUMN_ORDER.includes(id) ? COLUMN_ORDER.indexOf(id) : COLUMN_ORDER.length + id;
        return rank(a.id) - rank(b.id);
      });
  }, [orderStatusList.data]);

  const setLocalStatus = (orderId, statusId) =>
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, order_status: statusId } : order,
      ),
    );

  const patchOrder = (orderId, patch) =>
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
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

  // Accepting (cook) or serving (server) saves the status and the person
  // together; the same call re-assigns without changing the status.
  const assignStaff = async (person) => {
    const { kind, order, status } = staffRequest;
    const config = STAFF[kind];
    const name = person[config.nameField];
    setStaffRequest(null);
    const previous = {
      order_status: order.order_status,
      [config.orderField]: order[config.orderField] ?? null,
      [config.orderRelation]: order[config.orderRelation] ?? null,
    };
    patchOrder(order.id, {
      order_status: status,
      [config.orderField]: person.id,
      [config.orderRelation]: person,
    });
    try {
      const response = await updateOrderStatus(order.id, {
        order_status: status,
        [config.orderField]: person.id,
      });
      if (!response.success) throw response.message;
      const moved = status !== order.order_status;
      showToast({
        message: moved
          ? `Order ${orderLabel(order)} ${kind === "cook" ? "accepted" : "served"} · ${name}`
          : `${name} assigned to order ${orderLabel(order)}`,
        variant: "success",
      });
    } catch (error) {
      patchOrder(order.id, previous);
      showToast({
        title: `Couldn't assign ${name} to order ${orderLabel(order)}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  // Each dish can have its own cook (same or different people). Saves the
  // whole item list with just this dish's cook changed.
  const assignItemCook = async (cook) => {
    const { order, item } = itemCookRequest;
    setItemCookRequest(null);
    const previousItems = order.items;
    patchOrder(order.id, {
      items: (order.items || []).map((line) =>
        line.id === item.id ? { ...line, cook_id: cook.id, cook } : line,
      ),
    });
    try {
      const response = await updateOrderItems(
        order.id,
        (order.items || []).map((line) => ({
          menu_id: line.menu_id,
          quantity: line.quantity,
          cook_id: line.id === item.id ? cook.id : line.cook_id ?? line.cook?.id ?? null,
        })),
      );
      if (response?.success === false) throw response.message;
      if (response?.data?.items) patchOrder(order.id, { items: response.data.items });
      showToast({
        message: `${cook.cook_name} is cooking ${item.menu_name}`,
        variant: "success",
      });
    } catch (error) {
      patchOrder(order.id, { items: previousItems });
      showToast({
        title: `Couldn't assign ${cook.cook_name} to ${item.menu_name}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  const handleItemsSaved = (updated) => {
    if (updated) {
      patchOrder(updated.id, {
        items: updated.items,
        subtotal: updated.subtotal,
        tax: updated.tax,
        total_amount: updated.total_amount,
      });
    } else {
      fetchOrders();
    }
    showToast({ message: "Order items updated", variant: "success" });
    setOpenOrderId(null);
  };

  const handleMove = (order, column) => {
    if (column.id === CANCELLED) {
      setPendingCancel(order);
      return;
    }
    // Accepting just changes the stage; cooks are chosen per dish afterwards
    // with the "+ Cook" chips on the card.
    // Table orders are served, orders without a booking are delivered.
    if (column.id === SERVED && !order.reservation_id) {
      showToast({
        title: `Order ${orderLabel(order)} has no table booking`,
        message: "Move it to Delivered instead of Served.",
        variant: "warning",
      });
      return;
    }
    if (column.id === DELIVERED && order.reservation_id) {
      showToast({
        title: `Order ${orderLabel(order)} is a table order`,
        message: "Move it to Served instead of Delivered.",
        variant: "warning",
      });
      return;
    }
    if (column.id === SERVED) {
      setStaffRequest({ kind: "server", order, status: SERVED });
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

  // Cook / server on a card: who it is, plus Change (or Assign) only in the
  // columns where that person can still be changed.
  const renderStaffRow = (order, kind, editableIn) => {
    const config = STAFF[kind];
    const person = order[config.orderRelation];
    const editable = editableIn.includes(order.order_status);
    const ask = () => setStaffRequest({ kind, order, status: order.order_status });

    if (!person) {
      return editable ? (
        <button
          type="button"
          data-no-drag
          className="kanban-card__cook-assign"
          onClick={ask}
        >
          + Assign {config.singular.toLowerCase()}
        </button>
      ) : null;
    }

    return (
      <div className={`kanban-card__cook kanban-card__cook--${kind}`}>
        <StaffAvatar
          name={person[config.nameField]}
          photo={person.photo_url}
          size={26}
          tone={kind}
        />
        <span>
          <strong>{person[config.nameField]}</strong>
          <small>
            {config.singular}
            {person[config.detailField] ? ` · ${person[config.detailField]}` : ""}
          </small>
        </span>
        {editable && (
          <button
            type="button"
            data-no-drag
            className="kanban-card__cook-change"
            onClick={ask}
          >
            Change
          </button>
        )}
      </div>
    );
  };

  // When the order reached its end stages.
  const renderEndTimes = (order) => {
    const stamps = [
      { label: "Served", at: order.served_at },
      { label: "Delivered", at: order.delivered_at },
    ].filter((stamp) => stamp.at);
    if (!stamps.length) return null;
    return (
      <ul className="kanban-card__times">
        {stamps.map((stamp) => (
          <li key={stamp.label}>
            <span>{stamp.label}</span>
            <strong>{dayjs(stamp.at).format("D MMM, h:mm A")}</strong>
          </li>
        ))}
      </ul>
    );
  };

  const renderCard = (order) => {
    const items = order.items || [];
    return (
      <Fragment>
        <div className="kanban-card__head">
          <span className="kanban-card__title">
            {order.order_number || `Order #${order.id}`}
          </span>
          <button
            type="button"
            data-no-drag
            className="kanban-card__ref kanban-card__ref--open"
            title="Open order"
            onClick={() => setOpenOrderId(order.id)}
          >
            {order.reservation_id ? `Res #${order.reservation_id}` : "No booking"}
          </button>
        </div>
        <div className="kanban-card__meta">
          <span>{order.hotel?.hotel_name || "-"}</span>
          <span>{dayjs(order.createdAt).format("DD MMM, hh:mm A")}</span>
        </div>
        {items.length > 0 && (
          <ul className="kanban-card__items">
            {items.slice(0, VISIBLE_ITEMS).map((item) => {
              // Cook per dish: changeable while the kitchen is working on it.
              const editable = COOK_EDITABLE.includes(order.order_status);
              const name = item.cook?.cook_name;
              return (
                <li key={item.id}>
                  <span>
                    {item.quantity} × {item.menu_name}
                  </span>
                  {editable ? (
                    <button
                      type="button"
                      data-no-drag
                      className={`kanban-card__item-cook kanban-card__item-cook--button${name ? "" : " is-empty"}`}
                      title={name ? `Change cook for ${item.menu_name}` : `Choose a cook for ${item.menu_name}`}
                      onClick={() => setItemCookRequest({ order, item })}
                    >
                      {name || "+ Cook"}
                    </button>
                  ) : (
                    name && (
                      <span className="kanban-card__item-cook" title={`Cook: ${name}`}>
                        {name}
                      </span>
                    )
                  )}
                </li>
              );
            })}
            {items.length > VISIBLE_ITEMS && (
              <li className="kanban-card__more">
                +{items.length - VISIBLE_ITEMS} more
              </li>
            )}
          </ul>
        )}
        {renderStaffRow(order, "server", SERVER_EDITABLE)}
        {renderEndTimes(order)}
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
      <section className="ui-page kanban-page">
        <header className="ui-header">
          <div>
            <span className="ui-kicker">Kitchen</span>
            <h1>Orders</h1>
            <p>Track food orders from the kitchen to the table.</p>
          </div>
          <div className="ui-header__actions">
            <span className="ui-toolbar__count">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={fetchOrders}
              disabled={loading}
            >
              <RefreshRounded fontSize="small" /> Refresh
            </button>
          </div>
        </header>

        <KanbanBoard
          columns={columns}
          items={orders}
          getColumnId={(order) => order.order_status}
          canMove={(order) => !FINISHED.includes(order.order_status)
          }
          onMove={handleMove}
          onBlocked={handleBlocked}
          renderCard={renderCard}
          loading={loading}
          emptyLabel="No orders"
        />
      </section>

      <AssignStaffDialog
        config={STAFF[staffRequest?.kind || "cook"]}
        order={staffRequest?.order}
        question={
          staffRequest?.kind === "server"
            ? "Who is serving this order?"
            : "Who will prepare this order?"
        }
        confirmLabel={
          staffRequest && staffRequest.status !== staffRequest.order.order_status
            ? staffRequest.kind === "server"
              ? "Mark as served"
              : "Accept order"
            : `Assign ${staffRequest?.kind || "cook"}`
        }
        onAssign={assignStaff}
        onCancel={() => setStaffRequest(null)}
      />

      <AssignStaffDialog
        config={COOK_CONFIG}
        order={
          itemCookRequest
            ? {
                ...itemCookRequest.order,
                // Preselect this dish's cook.
                cook_id: itemCookRequest.item.cook_id ?? itemCookRequest.item.cook?.id ?? null,
                cook: itemCookRequest.item.cook ?? null,
              }
            : null
        }
        question={itemCookRequest ? `Who will cook ${itemCookRequest.item.menu_name}?` : ""}
        confirmLabel="Assign cook"
        onAssign={assignItemCook}
        onCancel={() => setItemCookRequest(null)}
      />

      <OrderDetailsDialog
        order={openOrder}
        statusName={openOrder ? statusName(openOrder.order_status) : ""}
        statusColor={
          columns.find((column) => column.id === openOrder?.order_status)?.color
        }
        readOnly={FINISHED.includes(openOrder?.order_status)}
        onClose={() => setOpenOrderId(null)}
        onSaved={handleItemsSaved}
      />

      <ConfirmDialog
        show={Boolean(pendingCancel)}
        tone="warning"
        title={`Cancel order ${
          pendingCancel?.order_number || `#${pendingCancel?.id}`
        }?`}
        message="The order will be marked as cancelled."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </Fragment>
  );
};

export default OrderBoard;
