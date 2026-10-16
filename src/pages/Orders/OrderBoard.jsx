import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  AddRounded,
  CheckCircleOutlineRounded,
  EditRounded,
  EventAvailableOutlined,
  RefreshRounded,
  SearchRounded,
  TimerOutlined,
} from "@mui/icons-material";
import KanbanBoard from "components/common/KanbanBoard";
import AppSelect from "components/common/AppSelect";
import CancelOrderDialog from "components/common/CancelOrderDialog";
import AssignStaffDialog from "./AssignStaffDialog";
import OrderDetailsDialog from "./OrderDetailsDialog";
import CreateOrderDialog from "./CreateOrderDialog";
import PrepTimer, { ItemTimer, formatElapsed } from "./PrepTimer";
import { notifyOrdersChanged, onOrdersChanged } from "utils/orderEvents";
import { paymentColor, paymentLabel } from "utils/paymentStatus";
import PaymentDialog, { paymentMethodLabel } from "./PaymentDialog";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { COOK_CONFIG, SERVER_CONFIG } from "pages/Settings/Staff/staffConfig";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import ItemNote from "components/common/ItemNote";
import {
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updateOrderItems,
  updateOrderPayment,
  updateOrderItemStatus,
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
// Payment labels / colours come from Settings → Payment status (utils/paymentStatus).
const PAYMENT_PENDING = 0;
const PAID = 1;
// reservation_order_items.item_status
const ITEM_ORDERED = 1;
const ITEM_READY = 3;
// The kitchen ticks dishes as prepared while it works on the order.
const READY = 4;

// Table orders reach the kitchen (Preparing and later) only from 15 minutes
// before the booking time — same rule as the API (updateOrderStatus).
const KITCHEN_LEAD_MINUTES = 15;
const KITCHEN_STAGES = [PREPARING, READY, SERVED];
/** Booking time of a table order and when its kitchen stages open; null without a booking. */
const kitchenDue = (order) => {
  const at = order?.reservation_id ? order.reservation?.dining_date : null;
  if (!at || !dayjs(at).isValid()) return null;
  const dining = dayjs(at);
  const opens = dining.subtract(KITCHEN_LEAD_MINUTES, "minute");
  return {
    dining,
    opens,
    waiting: !KITCHEN_STAGES.includes(order.order_status) && dayjs().isBefore(opens),
  };
};
// Dishes can be ticked once cooking starts (Accepted shows them locked).
const PREPARED_EDITABLE = [PREPARING, READY];
// While some (not all) dishes are prepared, a ticket with just those dishes
// shows in Ready; the order itself moves there once every dish is done.
const TICKET_SOURCE = [ACCEPTED, PREPARING];
const isTicket = (card) => Boolean(card.ticketOf);
// Cook of one dish (cook_id, or the joined cook row).
const itemCookId = (item) => item.cook_id ?? item.cook?.id ?? null;
// When the last dish was ticked prepared (null until every dish has a time).
const preparedAt = (order) => {
  const dishes = (order.items || []).filter((item) => item.item_status !== 5);
  if (!dishes.length || dishes.some((item) => !item.ready_at)) return null;
  return dishes.reduce(
    (latest, item) => (new Date(item.ready_at) > new Date(latest) ? item.ready_at : latest),
    dishes[0].ready_at,
  );
};
const ORDERS_PAGE_LIMIT = 500;
const VISIBLE_ITEMS = 3;

// Search box: which part of an order to look in (same pattern as Reservations).
const SEARCH_FIELDS = [
  {
    value: "all",
    label: "All fields",
    placeholder: "Search order, hotel, booking, dish or staff",
  },
  { value: "order", label: "Order number", placeholder: "e.g. ORD-1791963805026" },
  { value: "hotel", label: "Hotel name", placeholder: "e.g. Sangeetha Veg" },
  { value: "booking", label: "Booking ID", placeholder: "e.g. 126" },
  { value: "dish", label: "Dish", placeholder: "e.g. Lemon Rice" },
  { value: "staff", label: "Cook / server", placeholder: "e.g. Mubarak" },
];

// "#126", "Res 126", "Booking 126" → "126".
const normalizeSearch = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^(res|booking)\s*/, "")
    .replace(/^#/, "")
    .trim();

const orderMatches = (order, field, query) => {
  if (!query) return true;
  const items = order.items || [];
  const values = {
    order: [order.order_number, order.id],
    hotel: [order.hotel?.hotel_name],
    booking: [order.reservation_id],
    dish: items.map((item) => item.menu_name),
    staff: [
      order.cook?.cook_name,
      order.server?.server_name,
      ...items.map((item) => item.cook?.cook_name),
    ],
  };
  const fields = field === "all" ? Object.keys(values) : [field];
  return fields.some((key) =>
    values[key].some((value) => value != null && String(value).toLowerCase().includes(query)),
  );
};

const OrderBoard = () => {
  const { showToast } = useToast();
  const { orderStatusList, getOrderStatus, paymentStatusList, getPaymentStatus } =
    useGlobalMaster();
  // Badge tint in the payment status's colour (Settings → Payment status).
  const paymentBadgeStyle = (statusId) => {
    const color = paymentColor(statusId, paymentStatusList?.data);
    return { background: `color-mix(in srgb, ${color} 14%, #fff)`, color };
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  // { kind: "cook" | "server", order, status }: accept/serve, or re-assign.
  const [staffRequest, setStaffRequest] = useState(null);
  // { order, item }: choosing the cook for one dish.
  const [itemCookRequest, setItemCookRequest] = useState(null);
  // Order whose details popup is open (looked up live so edits show at once).
  const [openOrderId, setOpenOrderId] = useState(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [searchField, setSearchField] = useState("all");
  const [searchText, setSearchText] = useState("");
  const searchQuery = normalizeSearch(searchText);
  const activeSearchField = SEARCH_FIELDS.find((option) => option.value === searchField);
  // { order, deliver }: payment popup (on drop to Delivered, or badge click).
  const [paymentRequest, setPaymentRequest] = useState(null);
  const openOrder = orders.find((order) => order.id === openOrderId) || null;

  // silent: background reload (no skeleton, no error toast).
  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await getAllOrders({ limit: ORDERS_PAGE_LIMIT });
      if (response.success) {
        setOrders(response.rows || []);
      } else if (!silent) {
        showToast({ message: response.message, variant: "danger" });
      }
    } catch (error) {
      if (!silent) showToast({ message: error, variant: "danger" });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderStatusList.data.length === 0) {
      getOrderStatus().catch(() => {});
    }
    if (!paymentStatusList?.data?.length) {
      getPaymentStatus().catch(() => {});
    }
    fetchOrders();
  }, []);

  // Orders changed elsewhere (e.g. cancelled from the Reservations page in
  // another tab): reload quietly so the card moves at once.
  useEffect(() => onOrdersChanged(() => fetchOrders({ silent: true })), [fetchOrders]);

  const columns = useMemo(() => {
    // DB rows win; any status missing from the master table still gets a column.
    const fromDb = orderStatusList.data || [];
    const statuses = [
      ...fromDb,
      ...DEFAULT_ORDER_STATUSES.filter(
        (fallback) => !fromDb.some((row) => row.status_id === fallback.status_id),
      ),
    ];
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
        order.id === orderId
          ? {
              ...order,
              order_status: statusId,
              // Start the Preparing timer now; the API's time replaces it.
              ...(statusId === PREPARING && !order.preparing_at
                ? { preparing_at: new Date().toISOString() }
                : {}),
            }
          : order,
      ),
    );

  const patchOrder = (orderId, patch) =>
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
    );

  const statusName = (statusId) =>
    columns.find((column) => column.id === statusId)?.name || "this status";
  const orderLabel = (order) => order.order_number || `#${order.id}`;

  // The API stamps served_at / delivered_at / completed_at when an order
  // reaches its end stage; copy them so the card shows the time at once.
  const patchStageTimes = (orderId, saved) => {
    if (!saved) return;
    const times = {};
    [
      "preparing_at",
      "served_at",
      "delivered_at",
      "completed_at",
      "cancelled_at",
      "cancelled_by_name",
      "cancel_reason",
    ].forEach((field) => {
      if (saved[field] !== undefined) times[field] = saved[field];
    });
    if (Object.keys(times).length) patchOrder(orderId, times);
  };

  const changeStatus = async (order, statusId, request) => {
    const previousStatus = order.order_status;
    setLocalStatus(order.id, statusId);
    try {
      const response = await request();
      if (!response.success) throw response.message;
      patchStageTimes(order.id, response.data);
      // The API ticks every dish as prepared when an order reaches Ready.
      if (statusId === READY) {
        setOrders((current) =>
          current.map((row) =>
            row.id === order.id
              ? {
                  ...row,
                  items: (row.items || []).map((item) =>
                    item.item_status === 5
                      ? item
                      : {
                          ...item,
                          item_status: ITEM_READY,
                          ready_at: item.ready_at || new Date().toISOString(),
                        },
                  ),
                }
              : row,
          ),
        );
      }
      notifyOrdersChanged();
      showToast({
        message:
          (response.message || "Order status updated successfully") +
          // Serving the first food moves a Seated booking to Serving.
          (response.reservation_status && order.reservation_id
            ? ` · Booking #${order.reservation_id} is now Serving`
            : ""),
        variant: "success",
      });
      return true;
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
      return false;
    }
  };

  // Payment dialog answer: deliver the order first (when it was dropped on
  // Delivered), then record the payment.
  const settlePayment = async ({ paid, method }) => {
    const { order, deliver } = paymentRequest;
    setPaymentRequest(null);

    if (deliver) {
      const moved = await changeStatus(order, DELIVERED, () =>
        updateOrderStatus(order.id, { order_status: DELIVERED }),
      );
      if (!moved || !paid) return;
    }

    const previous = {
      payment_status: order.payment_status,
      payment_method: order.payment_method ?? null,
    };
    patchOrder(order.id, { payment_status: PAID, payment_method: method });
    try {
      const response = await updateOrderPayment(order.id, {
        payment_status: PAID,
        payment_method: method,
      });
      if (!response.success) throw response.message;
      notifyOrdersChanged();
      showToast({
        message: `Order ${orderLabel(order)} paid by ${paymentMethodLabel(method)}`,
        variant: "success",
      });
    } catch (error) {
      patchOrder(order.id, previous);
      showToast({
        title: `Couldn't record payment for order ${orderLabel(order)}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  // "Prepared" tick per dish (item_status 3 = Ready, back to 1 = Ordered).
  const toggleItemPrepared = async (order, item) => {
    const nextStatus = item.item_status === ITEM_READY ? ITEM_ORDERED : ITEM_READY;
    // ready_at freezes the dish's own cooking time (cleared when un-ticked).
    const setItemStatus = (status, readyAt) =>
      setOrders((current) =>
        current.map((row) =>
          row.id === order.id
            ? {
                ...row,
                items: (row.items || []).map((line) =>
                  line.id === item.id
                    ? { ...line, item_status: status, ready_at: readyAt }
                    : line,
                ),
              }
            : row,
        ),
      );
    setItemStatus(
      nextStatus,
      nextStatus === ITEM_READY ? new Date().toISOString() : null,
    );
    try {
      const response = await updateOrderItemStatus(order.id, item.id, nextStatus);
      if (!response.success) throw response.message;
      // Use the API's time so every screen shows the same dish time.
      if (response.data) setItemStatus(nextStatus, response.data.ready_at ?? null);
      notifyOrdersChanged();
      // The API moves the order to Ready once every dish is prepared (and
      // back to Preparing when one is un-ticked).
      const movedTo = Number(response.order_status);
      if (movedTo && movedTo !== order.order_status) {
        setLocalStatus(order.id, movedTo);
        if (response.preparing_at) patchOrder(order.id, { preparing_at: response.preparing_at });
        showToast({
          message:
            movedTo === READY
              ? `Order ${orderLabel(order)} is ready · every dish is prepared`
              : `Order ${orderLabel(order)} is back in ${statusName(movedTo)}`,
          variant: "success",
        });
      }
    } catch (error) {
      setItemStatus(item.item_status, item.ready_at ?? null);
      showToast({
        title: `Couldn't update ${item.menu_name}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  const handleBlocked = (order, column, reason) => {
    if (isTicket(order)) {
      showToast({
        title: "Ready ticket",
        message:
          "This ticket lists the dishes prepared so far. The order moves to Ready when every dish is ticked.",
        variant: "info",
      });
      return;
    }
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
  // request defaults to the open picker; passed directly when no picker is
  // needed (e.g. serving with the booking's own server).
  const assignStaff = async (person, request = staffRequest) => {
    const { kind, order, status } = request;
    const config = STAFF[kind];
    const name = person[config.nameField];
    setStaffRequest(null);
    const previous = {
      order_status: order.order_status,
      [config.orderField]: order[config.orderField] ?? null,
      [config.orderRelation]: order[config.orderRelation] ?? null,
      items: order.items,
    };
    // Same rule as the API: the order's cook also takes every dish that had
    // no cook (or had the previous order cook).
    const previousCookId = order.cook_id ?? order.cook?.id ?? null;
    patchOrder(order.id, {
      order_status: status,
      ...(status === PREPARING &&
        !order.preparing_at && { preparing_at: new Date().toISOString() }),
      [config.orderField]: person.id,
      [config.orderRelation]: person,
      ...(kind === "cook" && {
        items: (order.items || []).map((item) => {
          const cookId = itemCookId(item);
          return !cookId || cookId === previousCookId
            ? { ...item, cook_id: person.id, cook: person }
            : item;
        }),
      }),
    });
    try {
      const response = await updateOrderStatus(order.id, {
        order_status: status,
        [config.orderField]: person.id,
      });
      if (!response.success) throw response.message;
      patchStageTimes(order.id, response.data);
      notifyOrdersChanged();
      const moved = status !== order.order_status;
      showToast({
        message: moved
          ? `Order ${orderLabel(order)} ${
              kind === "server" ? "served" : status === PREPARING ? "is being prepared" : "accepted"
            } · ${name}`
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
      notifyOrdersChanged();
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
    notifyOrdersChanged();
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
    // Once cooking has started, the food is either finished or dropped.
    if (order.order_status === PREPARING && column.id !== READY) {
      showToast({
        title: `Order ${orderLabel(order)} is being prepared`,
        message: "It can only move to Ready (or be cancelled).",
        variant: "warning",
      });
      return;
    }
    // Table order before its time: Preparing / Ready / Served open 15 minutes
    // before the booking (it can still be accepted or cancelled).
    const due = kitchenDue(order);
    if (KITCHEN_STAGES.includes(column.id) && due?.waiting) {
      showToast({
        title: `Booking #${order.reservation_id} isn't due yet`,
        message: `The table is booked for ${due.dining.format("D MMM, h:mm A")}. This order can move to ${column.name} from ${due.opens.format("h:mm A")} (${KITCHEN_LEAD_MINUTES} minutes before).`,
        variant: "warning",
      });
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
      // Table orders are served by the table's own server (set on the
      // Reservations page); ask only when the booking has none.
      const serveWithBookingServer = (row) => {
        const bookingServer = row?.reservation?.server;
        if (!bookingServer || bookingServer.is_active === false) return false;
        assignStaff(bookingServer, { kind: "server", order, status: SERVED });
        return true;
      };
      if (serveWithBookingServer(order)) return;
      // The board may hold data from before the server was set on the
      // Reservations page: check the latest before asking.
      getAllOrders({ reservation_id: order.reservation_id, limit: 50 })
        .then((response) => {
          const latest = (response?.rows || []).find((row) => row.id === order.id);
          if (latest?.reservation) patchOrder(order.id, { reservation: latest.reservation });
          if (!serveWithBookingServer(latest)) {
            setStaffRequest({ kind: "server", order, status: SERVED });
          }
        })
        .catch(() => setStaffRequest({ kind: "server", order, status: SERVED }));
      return;
    }
    // Starting to cook: ask for the cook while any dish has none (the chosen
    // cook takes those dishes; dishes with their own cook keep them).
    if (
      column.id === PREPARING &&
      (order.items || []).some((item) => item.item_status !== 5 && !itemCookId(item))
    ) {
      setStaffRequest({ kind: "cook", order, status: PREPARING });
      return;
    }
    // Delivering hands the food over: ask how it was paid (unless already).
    if (column.id === DELIVERED && order.payment_status !== PAID) {
      setPaymentRequest({ order, deliver: true });
      return;
    }
    changeStatus(order, column.id, () =>
      updateOrderStatus(order.id, { order_status: column.id }),
    );
  };

  const confirmCancel = (reason) => {
    const order = pendingCancel;
    setPendingCancel(null);
    if (!order) return;
    // The cancel endpoint also marks every order item as cancelled.
    changeStatus(order, CANCELLED, () => cancelOrder(order.id, reason));
  };

  // One compact panel for what happened after cooking: total prep time,
  // when it was served / delivered, and who served it (click the photo to
  // change, while that is still allowed).
  const renderSummary = (order) => {
    const done = preparedAt(order);
    const prepTime =
      order.preparing_at && done && order.order_status !== CANCELLED
        ? formatElapsed(new Date(done) - new Date(order.preparing_at))
        : null;
    const ended = order.served_at
      ? { label: "Served", at: order.served_at }
      : order.delivered_at
        ? { label: "Delivered", at: order.delivered_at }
        : null;

    // Cancelled: when and by whom ("Admin" or the customer's name).
    if (order.order_status === CANCELLED) {
      return (
        <div className="kanban-card__cancelled" role="note">
          <span className="kanban-card__cancelled-label">Cancelled</span>
          {order.cancelled_at ? (
            <span title={dayjs(order.cancelled_at).format("D MMM YYYY, h:mm A")}>
              {dayjs(order.cancelled_at).format("D MMM, h:mm A")}
              {order.cancelled_by_name && (
                <>
                  {" · by "}
                  <strong>{order.cancelled_by_name}</strong>
                </>
              )}
            </span>
          ) : (
            <span>Time not recorded</span>
          )}
          {order.cancel_reason && (
            <span className="kanban-card__cancelled-reason">“{order.cancel_reason}”</span>
          )}
        </div>
      );
    }

    const server = order.server;
    const canChangeServer = SERVER_EDITABLE.includes(order.order_status);
    const askServer = () =>
      setStaffRequest({ kind: "server", order, status: order.order_status });

    if (!prepTime && !ended && !server && !canChangeServer) return null;

    return (
      <div className="kanban-card__summary">
        {(prepTime || ended) && (
          <div className="kanban-card__summary-stats">
            {prepTime && (
              <span title="Time from start of cooking to the last dish ready">
                <TimerOutlined aria-hidden />
                <small>Prepared in</small>
                <strong>{prepTime}</strong>
              </span>
            )}
            {ended && (
              <span title={dayjs(ended.at).format("D MMM YYYY, h:mm A")}>
                <CheckCircleOutlineRounded aria-hidden />
                <small>{ended.label}</small>
                <strong>{dayjs(ended.at).format("h:mm A")}</strong>
              </span>
            )}
          </div>
        )}
        {server ? (
          <div className="kanban-card__summary-staff">
            {canChangeServer ? (
              <button
                type="button"
                data-no-drag
                className="kanban-card__staff-avatar"
                title="Change server"
                aria-label={`Change server (${server.server_name})`}
                onClick={askServer}
              >
                <StaffAvatar name={server.server_name} photo={server.photo_url} size={28} tone="server" />
                <EditRounded className="kanban-card__staff-edit" aria-hidden />
              </button>
            ) : (
              <StaffAvatar name={server.server_name} photo={server.photo_url} size={28} tone="server" />
            )}
            {/* Hover shows the full name (it is cut short on the card). */}
            <span title={`${server.server_name} · Server${server.section ? ` · ${server.section}` : ""}`}>
              <strong>{server.server_name}</strong>
              <small>Server{server.section ? ` · ${server.section}` : ""}</small>
            </span>
          </div>
        ) : (
          canChangeServer && (
            <button
              type="button"
              data-no-drag
              className="kanban-card__cook-assign"
              onClick={askServer}
            >
              + Assign server
            </button>
          )
        )}
      </div>
    );
  };


  // Orders, plus a Ready ticket for each order still cooking that has some
  // (not all) dishes prepared.
  // Orders matching the search box (a Ready ticket follows its order).
  const visibleOrders = useMemo(
    () => orders.filter((order) => orderMatches(order, searchField, searchQuery)),
    [orders, searchField, searchQuery],
  );

  const boardCards = useMemo(() => {
    const tickets = visibleOrders
      .filter((order) => TICKET_SOURCE.includes(order.order_status))
      .map((order) => {
        const dishes = (order.items || []).filter((item) => item.item_status !== 5);
        const ready = dishes.filter((item) => item.item_status === ITEM_READY);
        if (!ready.length || ready.length === dishes.length) return null;
        return {
          ...order,
          id: `ticket-${order.id}`,
          ticketOf: order.id,
          order_status: READY,
          items: ready,
          dishCount: dishes.length,
        };
      })
      .filter(Boolean);
    return [...visibleOrders, ...tickets];
  }, [visibleOrders]);

  const renderTicket = (ticket) => (
    <div className="kanban-ticket">
      <div className="kanban-card__head">
        {/* The order number opens the order; the booking tag is just a label. */}
        <button
          type="button"
          data-no-drag
          className="kanban-card__title kanban-card__title--link"
          title="Open order"
          onClick={() => setOpenOrderId(ticket.ticketOf)}
        >
          {ticket.order_number || `Order #${ticket.ticketOf}`}
        </button>
        <span className="kanban-card__ref kanban-card__ref--tag">
          {ticket.reservation_id ? `Res #${ticket.reservation_id}` : "No booking"}
        </span>
      </div>
      <div className="kanban-card__meta">
        <span>{ticket.hotel?.hotel_name || "-"}</span>
      </div>
      <span className="kanban-ticket__tag">
        Partly ready · {ticket.items.length} of {ticket.dishCount} dishes
      </span>
      <ul className="kanban-card__items">
        {ticket.items.map((item) => (
          <li key={item.id} className="is-ready">
            <span className="kanban-card__item-name">
              {item.quantity} × {item.menu_name}
              <ItemNote text={item.notes} title={item.menu_name} />
            </span>
            {item.cook?.cook_name && (
              <span className="kanban-card__item-cook" title={`Cook: ${item.cook.cook_name}`}>
                <StaffAvatar name={item.cook.cook_name} photo={item.cook.photo_url} size={18} tone="cook" />{" "}
                {item.cook.cook_name}
              </span>
            )}
            {/* How long this dish took (frozen when it was ticked). */}
            <ItemTimer since={ticket.preparing_at} readyAt={item.ready_at} />
            {/* Prepared dishes live only on the ticket: untick here to undo. */}
            <label
              data-no-drag
              className="kanban-card__prepared"
              title="Prepared — click to undo"
            >
              <input
                type="checkbox"
                checked
                onChange={() => {
                  const source = orders.find((order) => order.id === ticket.ticketOf);
                  if (source) toggleItemPrepared(source, item);
                }}
                aria-label={`${item.menu_name} prepared`}
              />
            </label>
          </li>
        ))}
      </ul>
      {/* Whole order's cooking time, still running for the other dishes. */}
      {ticket.preparing_at && <PrepTimer since={ticket.preparing_at} />}
      <p className="kanban-ticket__note">
        {ticket.dishCount - ticket.items.length} more still in{" "}
        {statusName(orders.find((order) => order.id === ticket.ticketOf)?.order_status)}
      </p>
    </div>
  );

  const renderCard = (order) => {
    if (isTicket(order)) return renderTicket(order);
    // While cooking, prepared dishes move to the Ready ticket.
    const items = TICKET_SOURCE.includes(order.order_status)
      ? (order.items || []).filter((item) => item.item_status !== ITEM_READY)
      : order.items || [];
    return (
      <Fragment>
        <div className="kanban-card__head">
          {/* The order number opens the order; the booking tag is just a label. */}
          <button
            type="button"
            data-no-drag
            className="kanban-card__title kanban-card__title--link"
            title="Open order"
            onClick={() => setOpenOrderId(order.id)}
          >
            {order.order_number || `Order #${order.id}`}
          </button>
          <span className="kanban-card__ref kanban-card__ref--tag">
            {order.reservation_id ? `Res #${order.reservation_id}` : "No booking"}
          </span>
        </div>
        <div className="kanban-card__meta kanban-card__meta--split">
          <span>{order.hotel?.hotel_name || "-"}</span>
          <span title="Ordered at">{dayjs(order.createdAt).format("DD MMM, hh:mm A")}</span>
        </div>
        {/* Table order: the booking time, and when the kitchen may start. */}
        {(() => {
          const due = kitchenDue(order);
          if (!due) return null;
          return (
            <div
              className={`kanban-card__booking-time${due.waiting ? " is-waiting" : ""}`}
              title={`Can move to Preparing from ${due.opens.format("h:mm A")} (${KITCHEN_LEAD_MINUTES} min before the booking)`}
            >
              <EventAvailableOutlined fontSize="inherit" aria-hidden />
              <span>
                Booking <strong>{due.dining.format("DD MMM, hh:mm A")}</strong>
              </span>
              {due.waiting && (
                <small>Kitchen from {due.opens.format("h:mm A")}</small>
              )}
            </div>
          );
        })()}
        {items.length > 0 && (
          <ul className="kanban-card__items">
            {items.slice(0, VISIBLE_ITEMS).map((item) => {
              // Cook per dish: changeable while the kitchen is working on it.
              const editable = COOK_EDITABLE.includes(order.order_status);
              const name = item.cook?.cook_name;
              const prepared = item.item_status === ITEM_READY;
              const canTick = PREPARED_EDITABLE.includes(order.order_status);
              return (
                <li key={item.id} className={prepared ? "is-prepared" : ""}>
                  <span className="kanban-card__item-name">
                    {item.quantity} × {item.menu_name}
                    <ItemNote text={item.notes} title={item.menu_name} />
                  </span>
                  {editable ? (
                    <button
                      type="button"
                      data-no-drag
                      className={`kanban-card__item-cook kanban-card__item-cook--button${name ? "" : " is-empty"}`}
                      title={name ? `Change cook for ${item.menu_name}` : `Choose a cook for ${item.menu_name}`}
                      onClick={() => setItemCookRequest({ order, item })}
                    >
                      {name ? (
                        <>
                          <StaffAvatar name={name} photo={item.cook?.photo_url} size={18} tone="cook" /> {name}
                        </>
                      ) : (
                        "+ Cook"
                      )}
                    </button>
                  ) : (
                    name && (
                      <span className="kanban-card__item-cook" title={`Cook: ${name}`}>
                        <StaffAvatar name={name} photo={item.cook?.photo_url} size={18} tone="cook" /> {name}
                      </span>
                    )
                  )}
                  {/* Dish time: ticking while cooking, frozen once prepared. */}
                  {order.preparing_at &&
                    item.item_status !== 5 &&
                    (order.order_status === PREPARING || item.ready_at) && (
                      <ItemTimer since={order.preparing_at} readyAt={item.ready_at} />
                    )}
                  {/* Accepted: shown but locked until the kitchen starts. */}
                  {(canTick || order.order_status === ACCEPTED) && (
                    <label
                      data-no-drag
                      className={`kanban-card__prepared${canTick ? "" : " is-locked"}`}
                      title={
                        !canTick
                          ? "Move the order to Preparing to tick dishes"
                          : prepared
                            ? "Prepared — click to undo"
                            : "Mark as prepared"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={prepared}
                        disabled={!canTick}
                        onChange={() => toggleItemPrepared(order, item)}
                        aria-label={`${item.menu_name} prepared`}
                      />
                    </label>
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
        {/* Live cooking timer while in Preparing; afterwards the total time
            moves into the compact summary below. */}
        {order.order_status === PREPARING && (
          <PrepTimer since={order.preparing_at || order.updatedAt} />
        )}
        {renderSummary(order)}
        <div className="kanban-card__foot">
          {/* Collect from the card while the order is open or delivered;
              table orders (Served) are paid when the booking completes. */}
          {order.payment_status === PAYMENT_PENDING &&
          ![CANCELLED, SERVED].includes(order.order_status) ? (
            <button
              type="button"
              data-no-drag
              className="kanban-card__badge kanban-card__badge--payment-0 kanban-card__badge--button"
              style={paymentBadgeStyle(PAYMENT_PENDING)}
              title="Collect payment"
              onClick={() => setPaymentRequest({ order, deliver: false })}
            >
              {paymentLabel(PAYMENT_PENDING, paymentStatusList.data)}
            </button>
          ) : (
            <span
              className={`kanban-card__badge kanban-card__badge--payment-${order.payment_status}`}
              style={paymentBadgeStyle(order.payment_status)}
            >
              {paymentLabel(order.payment_status, paymentStatusList.data)}
              {order.payment_status === PAID && order.payment_method
                ? ` · ${paymentMethodLabel(order.payment_method)}`
                : ""}
            </span>
          )}
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
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => fetchOrders()}
              disabled={loading}
            >
              <RefreshRounded fontSize="small" /> Refresh
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={() => setCreateOrderOpen(true)}
            >
              <AddRounded fontSize="small" /> New order
            </button>
          </div>
        </header>

        <div className="ui-toolbar" role="search">
          <label className="ui-search">
            <SearchRounded fontSize="small" aria-hidden />
            <AppSelect
              variant="compact"
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              aria-label="Search in"
              searchable={false}
              options={SEARCH_FIELDS.map(({ value, label }) => ({ value, label }))}
            />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={activeSearchField?.placeholder}
              aria-label={`Search by ${activeSearchField?.label}`}
            />
          </label>
          <span className="ui-toolbar__count">
            {searchQuery
              ? `${visibleOrders.length} of ${orders.length} orders`
              : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
            {searchQuery && (
              <button type="button" onClick={() => setSearchText("")}>
                Clear
              </button>
            )}
          </span>
        </div>

        <KanbanBoard
          columns={columns}
          items={boardCards}
          getColumnId={(order) => order.order_status}
          canMove={(order) => !isTicket(order) && !FINISHED.includes(order.order_status)}
          onMove={handleMove}
          onBlocked={handleBlocked}
          renderCard={renderCard}
          // Cancelled orders step back so live ones stand out.
          getCardClassName={(order) => (order.order_status === CANCELLED ? "is-cancelled" : "")}
          loading={loading}
          emptyLabel="No orders"
        />
      </section>

      <PaymentDialog
        order={paymentRequest?.order ?? null}
        deliver={Boolean(paymentRequest?.deliver)}
        onConfirm={settlePayment}
        onCancel={() => setPaymentRequest(null)}
      />

      <CreateOrderDialog
        show={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onCreated={() => fetchOrders()}
      />

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
              : staffRequest.status === PREPARING
                ? "Start preparing"
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

      <CancelOrderDialog
        show={Boolean(pendingCancel)}
        title={`Cancel order ${
          pendingCancel?.order_number || `#${pendingCancel?.id}`
        }?`}
        message="The order will be marked as cancelled. The customer sees the reason."
        audience="staff"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </Fragment>
  );
};

export default OrderBoard;
