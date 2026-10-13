import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  EventAvailableOutlined,
  LayersOutlined,
  TableRestaurantOutlined,
  EventSeatOutlined,
  ReceiptLongOutlined,
  AddRounded,
  EditRounded,
  RefreshRounded,
  RoomServiceOutlined,
  SearchRounded,
} from "@mui/icons-material";
import KanbanBoard from "components/common/KanbanBoard";
import ConfirmDialog from "components/common/ConfirmDialog";
import AssignStaffDialog from "pages/Orders/AssignStaffDialog";
import OrderDetailsDialog from "pages/Orders/OrderDetailsDialog";
import CreateOrderDialog from "pages/Orders/CreateOrderDialog";
import BookingDetailsDialog from "./BookingDetailsDialog";
import PaymentDialog, { paymentMethodLabel } from "pages/Orders/PaymentDialog";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { CLEANER_CONFIG, SERVER_CONFIG } from "pages/Settings/Staff/staffConfig";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import {
  getAllOrders,
  updateOrderPayment,
  cancelOrder,
  getReservationByUser,
  updateDiningStatus,
  deleteReservation,
} from "services";
import { notifyOrdersChanged, onOrdersChanged } from "utils/orderEvents";

// Order / order item statuses (utils/orderStatus.js, item_status comment).
const ORDER_READY = 4;
const COOKING_ORDER_STATUSES = [2, 3]; // Accepted, Preparing
const ITEM_READY = 3;
const ITEM_CANCELLED = 5;
const ORDER_CANCELLED = 7;
const PAYMENT_PENDING = 0;
const PAID = 1;
// Served, Completed, Cancelled, Delivered: the order can no longer change.
const FINISHED_ORDER_STATUSES = [5, 6, 7, 8];
// Fallback refresh; changes made on the Orders board arrive instantly
// through utils/orderEvents.
const ORDERS_POLL_MS = 15000;

// Stage label + colour for the orders listed on a booking card
// (same colours as the Orders board columns).
const ORDER_STAGES = {
  1: { name: "Ordered", color: "#6366f1" },
  2: { name: "Accepted", color: "#0ea5e9" },
  3: { name: "Preparing", color: "#f59e0b" },
  4: { name: "Food prepared", color: "#14b8a6" },
  5: { name: "Served", color: "#8b5cf6" },
  6: { name: "Completed", color: "#22c55e" },
  8: { name: "Delivered", color: "#0ea5e9" },
};

// Every (not cancelled) order of each booking, oldest first.
const ordersByReservation = (orders) => {
  const byReservation = new Map();
  orders.forEach((order) => {
    if (!order.reservation_id || order.order_status === ORDER_CANCELLED) return;
    const list = byReservation.get(order.reservation_id) || [];
    list.push(order);
    byReservation.set(order.reservation_id, list);
  });
  byReservation.forEach((list) =>
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  );
  return byReservation;
};

// Dishes waiting to be served, per booking: every dish of a Ready order, and
// the ticked (prepared) dishes of orders still cooking.
const readyDishesByReservation = (orders) => {
  const byReservation = new Map();
  orders.forEach((order) => {
    if (!order.reservation_id) return;
    const isReady = order.order_status === ORDER_READY;
    if (!isReady && !COOKING_ORDER_STATUSES.includes(order.order_status)) return;
    const dishes = (order.items || []).filter(
      (item) =>
        item.item_status !== ITEM_CANCELLED &&
        (isReady || item.item_status === ITEM_READY),
    );
    if (!dishes.length) return;
    const list = byReservation.get(order.reservation_id) || [];
    dishes.forEach((item) =>
      list.push({
        ...item,
        orderId: order.id,
        orderNumber: order.order_number || `#${order.id}`,
      }),
    );
    byReservation.set(order.reservation_id, list);
  });
  return byReservation;
};

// Matches RESERVATION_STATUS in the API (utils/reservationStatus.js).
const STATUS = {
  CONFIRMED: 1,
  SEATED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  PENDING: 5,
  CLEANING: 6,
  SERVING: 7,
};
const FLOW_ORDER = [
  STATUS.PENDING,
  STATUS.CONFIRMED,
  STATUS.SEATED,
  STATUS.SERVING,
  STATUS.CLEANING,
  STATUS.COMPLETED,
  STATUS.CANCELLED,
];
const LOCKED_STATUSES = [STATUS.COMPLETED, STATUS.CANCELLED];
// Columns whose cards are listed by dining time (earliest first).
const TIME_SORTED_STATUSES = [
  STATUS.CONFIRMED,
  STATUS.SEATED,
  STATUS.SERVING,
  STATUS.CLEANING,
];
// Food is ordered only while guests are at the table: not before they arrive
// (Pending, Confirmed), nor once they have left (Cleaning, Completed, Cancelled).
const NO_ORDER_STATUSES = [
  STATUS.PENDING,
  STATUS.CONFIRMED,
  STATUS.CLEANING,
  STATUS.COMPLETED,
  STATUS.CANCELLED,
];
// Guests can only be seated / served once their booking time has come
// (up to 15 minutes early). The API applies the same rule.
const ARRIVAL_STATUSES = [STATUS.SEATED, STATUS.SERVING];
const EARLY_ARRIVAL_MINUTES = 15;
// The server is chosen when a booking is confirmed and can be changed while
// the guests are at the table; the cleaner is chosen when the table goes to
// Cleaning. Later columns just show who it was.
const STAFF = {
  server: {
    config: SERVER_CONFIG,
    editableIn: [STATUS.CONFIRMED, STATUS.SEATED, STATUS.SERVING],
    question: "Who will serve this table?",
    moveLabel: "Confirm booking",
    movedVerb: "confirmed",
  },
  cleaner: {
    config: CLEANER_CONFIG,
    editableIn: [STATUS.CLEANING],
    question: "Who will clean this table?",
    moveLabel: "Start cleaning",
    movedVerb: "moved to Cleaning",
  },
};

const countSeats = (seatStatus) =>
  Array.isArray(seatStatus)
    ? seatStatus.reduce((sum, table) => sum + (table.seat_ids?.length || 0), 0)
    : 0;

const getTableIds = (seatStatus) =>
  Array.isArray(seatStatus)
    ? [...new Set(seatStatus.map((table) => table.table_id).filter(Boolean))]
    : [];

// Table codes (e.g. "SACT0001"); older rows without a code fall back to T<n>.
const getTableLabels = (seatStatus) =>
  Array.isArray(seatStatus)
    ? [
        ...new Set(
          seatStatus
            .map(
              (table) =>
                table.table_code ||
                (table.table_number != null ? `T${table.table_number}` : null) ||
                (table.table_id != null ? `#${table.table_id}` : null),
            )
            .filter(Boolean),
        ),
      ]
    : [];

const SEARCH_FIELDS = [
  {
    value: "all",
    label: "All fields",
    placeholder: "Search hotel, booking, floor or table",
  },
  { value: "hotel", label: "Hotel name", placeholder: "e.g. Sangeetha Veg" },
  { value: "booking", label: "Booking ID", placeholder: "e.g. 110" },
  { value: "floor", label: "Floor", placeholder: "e.g. 2" },
  { value: "table", label: "Table code", placeholder: "e.g. SACT0001" },
];

// "#110", "Booking 110", "Floor 2", "Table #12" → just the useful part.
const normalizeSearch = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^(booking|floor|table)\s*/, "")
    .replace(/^#/, "")
    .trim();

const matchesSearch = (row, field, query) => {
  if (!query) return true;
  const values = {
    hotel: [row.hotel?.hotel_name],
    booking: [row.id],
    floor: [row.floor?.floor_number],
    table: [...getTableLabels(row.seat_status), ...getTableIds(row.seat_status)],
  };
  const fields = field === "all" ? Object.keys(values) : [field];
  return fields.some((key) =>
    values[key].some(
      (value) => value != null && String(value).toLowerCase().includes(query),
    ),
  );
};

const ReservationBoard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  // { kind: "server" | "cleaner", reservation, status } while picking staff.
  const [staffRequest, setStaffRequest] = useState(null);
  const [searchField, setSearchField] = useState("all");
  const [searchText, setSearchText] = useState("");

  const searchQuery = normalizeSearch(searchText);
  const visibleReservations = useMemo(() => {
    const matching = reservations.filter((row) =>
      matchesSearch(row, searchField, searchQuery),
    );
    // Active columns run by dining time: the next table due is on top.
    // Other columns keep the API's order.
    const byDiningTime = (a, b) =>
      new Date(a.dining_date || 0) - new Date(b.dining_date || 0) || a.id - b.id;
    return [
      ...matching
        .filter((row) => TIME_SORTED_STATUSES.includes(row.dining_status))
        .sort(byDiningTime),
      ...matching.filter((row) => !TIME_SORTED_STATUSES.includes(row.dining_status)),
    ];
  }, [reservations, searchField, searchQuery]);
  const activeSearchField = SEARCH_FIELDS.find(
    (option) => option.value === searchField,
  );

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getReservationByUser();
      if (response.success) {
        setReservations(response.data || []);
      } else {
        showToast({ message: response.message, variant: "danger" });
      }
    } catch (error) {
      showToast({ message: error, variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Open orders, only to show which bookings have food ready to serve.
  const [orders, setOrders] = useState([]);
  const fetchOrders = useCallback(async () => {
    try {
      const response = await getAllOrders({ limit: 500 });
      if (response.success) setOrders(response.rows || []);
    } catch {
      // The board still works without the indicator.
    }
  }, []);
  const readyDishes = useMemo(() => readyDishesByReservation(orders), [orders]);
  const bookingOrders = useMemo(() => ordersByReservation(orders), [orders]);
  // Order shown in the details popup (looked up live so refreshes show).
  const [openOrderId, setOpenOrderId] = useState(null);
  // Booking a new order (or extra dishes) is being placed for.
  const [newOrderFor, setNewOrderFor] = useState(null);
  // Booking whose full details popup is open (looked up live).
  const [detailsId, setDetailsId] = useState(null);
  // Order waiting for "Cancel order?" confirmation.
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const confirmCancelOrder = async () => {
    const order = orderToCancel;
    if (!order) return;
    setCancellingOrder(true);
    try {
      const response = await cancelOrder(order.id);
      if (response?.success === false) throw response.message;
      setOrderToCancel(null);
      setOpenOrderId(null);
      // The Orders board (other tabs) moves it to Cancelled right away.
      notifyOrdersChanged();
      fetchOrders();
      showToast({
        message: `Order ${order.order_number || `#${order.id}`} cancelled`,
        variant: "success",
      });
    } catch (error) {
      setOrderToCancel(null);
      showToast({
        title: `Couldn't cancel order ${order.order_number || `#${order.id}`}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    } finally {
      setCancellingOrder(false);
    }
  };
  // { reservation, unpaid, bill }: payment asked before completing a booking.
  const [completeRequest, setCompleteRequest] = useState(null);
  const openOrder = orders.find((order) => order.id === openOrderId) || null;

  useEffect(() => {
    if (diningStatusList.data.length === 0) {
      getDiningStatus();
    }
    fetchReservations();
    fetchOrders();
  }, []);

  // Keep order info current: instantly when the Orders board (another tab)
  // changes something, when this tab comes back into view, and on a timer.
  useEffect(() => {
    const unsubscribe = onOrdersChanged(fetchOrders);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    const timer = setInterval(onVisible, ORDERS_POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [fetchOrders]);

  const columns = useMemo(() => {
    const rank = (id) => {
      const index = FLOW_ORDER.indexOf(id);
      return index === -1 ? FLOW_ORDER.length + id : index;
    };
    return [...(diningStatusList.data || [])]
      .sort((a, b) => rank(a.status_id) - rank(b.status_id))
      .map((status) => ({
        id: status.status_id,
        name: status.name,
        color: status.color_code || "#64748b",
      }));
  }, [diningStatusList.data]);

  const setLocalStatus = (reservationId, statusId) =>
    setReservations((current) =>
      current.map((row) =>
        row.id === reservationId ? { ...row, dining_status: statusId } : row,
      ),
    );

  const statusName = (statusId) =>
    columns.find((column) => column.id === statusId)?.name || "this status";

  const changeStatus = async (reservation, statusId) => {
    const previousStatus = reservation.dining_status;
    setLocalStatus(reservation.id, statusId);
    try {
      const response = await updateDiningStatus(reservation.id, {
        dining_status: statusId,
      });
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Reservation status updated successfully",
        variant: "success",
      });
    } catch (error) {
      setLocalStatus(reservation.id, previousStatus);
      showToast({
        title: `Couldn't move reservation #${reservation.id} to ${statusName(statusId)}`,
        message: error,
        variant: "danger",
      });
    }
  };

  const confirmCancel = async () => {
    const reservation = pendingCancel;
    setPendingCancel(null);
    if (!reservation) return;

    const previousStatus = reservation.dining_status;
    setLocalStatus(reservation.id, STATUS.CANCELLED);
    try {
      // The cancel endpoint releases seats and stores a cancellation snapshot.
      const response = await deleteReservation({
        reservation_id: reservation.id,
      });
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Reservation cancelled successfully",
        variant: "success",
      });
    } catch (error) {
      setLocalStatus(reservation.id, previousStatus);
      showToast({
        title: `Couldn't cancel reservation #${reservation.id}`,
        message: error,
        variant: "danger",
      });
    }
  };

  const handleBlocked = (reservation, column, reason) => {
    if (reason === "outside") {
      showToast({
        title: "Reservation not moved",
        message: "Drop the card on a status column to change its status.",
        variant: "warning",
      });
      return;
    }
    showToast({
      title: `Can't move reservation #${reservation.id}`,
      message: `${statusName(reservation.dining_status)} reservations are closed and can't be moved to ${column.name}.`,
      variant: "warning",
    });
  };

  // Moving to Confirmed / Cleaning (or changing the person) saves the status
  // and the server / cleaner together.
  const assignStaff = async (person) => {
    const { kind, reservation, status } = staffRequest;
    const { config, movedVerb } = STAFF[kind];
    const name = person[config.nameField];
    setStaffRequest(null);
    const previous = {
      dining_status: reservation.dining_status,
      [config.orderField]: reservation[config.orderField] ?? null,
      [config.orderRelation]: reservation[config.orderRelation] ?? null,
    };
    const patch = (values) =>
      setReservations((current) =>
        current.map((row) => (row.id === reservation.id ? { ...row, ...values } : row)),
      );
    patch({
      dining_status: status,
      [config.orderField]: person.id,
      [config.orderRelation]: person,
    });
    try {
      const response = await updateDiningStatus(reservation.id, {
        dining_status: status,
        [config.orderField]: person.id,
      });
      if (!response.success) throw response.message;
      showToast({
        message:
          status === reservation.dining_status
            ? `${name} assigned to booking #${reservation.id}`
            : `Booking #${reservation.id} ${movedVerb} · ${name}`,
        variant: "success",
      });
    } catch (error) {
      patch(previous);
      showToast({
        title: `Couldn't assign ${name} to booking #${reservation.id}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  const handleMove = (reservation, column) => {
    if (ARRIVAL_STATUSES.includes(column.id) && reservation.dining_date) {
      const bookedFor = dayjs(reservation.dining_date);
      const openFrom = bookedFor.subtract(EARLY_ARRIVAL_MINUTES, "minute");
      if (dayjs().isBefore(openFrom)) {
        showToast({
          title: `Booking #${reservation.id} isn't due yet`,
          message: `It is for ${bookedFor.format("D MMM YYYY, h:mm A")}. It can move to ${column.name} from ${openFrom.format("D MMM, h:mm A")}.`,
          variant: "warning",
        });
        return;
      }
    }
    if (column.id === STATUS.CANCELLED) {
      setPendingCancel(reservation);
      return;
    }
    if (column.id === STATUS.CONFIRMED) {
      setStaffRequest({ kind: "server", reservation, status: STATUS.CONFIRMED });
      return;
    }
    if (column.id === STATUS.CLEANING) {
      // Ask for a cleaner only when none is assigned yet; an assigned one can
      // still be changed with "Change" on the card.
      if (reservation.cleaner_id || reservation.cleaner) {
        changeStatus(reservation, STATUS.CLEANING);
        return;
      }
      setStaffRequest({ kind: "cleaner", reservation, status: STATUS.CLEANING });
      return;
    }
    // Completing the booking: collect payment for its unpaid orders first.
    if (column.id === STATUS.COMPLETED) {
      // Every order must be served (or cancelled) before the booking ends.
      const open = (bookingOrders.get(reservation.id) || []).filter(
        (order) => !FINISHED_ORDER_STATUSES.includes(order.order_status),
      );
      if (open.length) {
        showToast({
          title: `Booking #${reservation.id} still has food in progress`,
          message: `${open
            .map(
              (order) =>
                `${order.order_number || `#${order.id}`} (${
                  ORDER_STAGES[order.order_status]?.name || "open"
                })`,
            )
            .join(", ")} — serve or cancel ${
            open.length === 1 ? "it" : "them"
          } first. Only bookings whose orders are all Served can be completed.`,
          variant: "warning",
        });
        return;
      }
      const request = paymentRequestFor(reservation, true);
      if (request) {
        setCompleteRequest(request);
        return;
      }
    }
    changeStatus(reservation, column.id);
  };

  // One bill for a booking's unpaid orders, or null when nothing is owed.
  // complete = true: asked while moving to Completed (also moves the card);
  // false: collecting later from a Completed card.
  const paymentRequestFor = (reservation, complete) => {
    const unpaid = (bookingOrders.get(reservation.id) || []).filter(
      (order) => order.payment_status === PAYMENT_PENDING,
    );
    if (!unpaid.length) return null;
    return {
      reservation,
      unpaid,
      complete,
      bill: {
        id: reservation.id,
        order_number: `Booking #${reservation.id}`,
        total_amount: unpaid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        items: unpaid.flatMap((order) =>
          (order.items || []).filter((item) => item.item_status !== ITEM_CANCELLED),
        ),
      },
    };
  };

  const settleAndComplete = async ({ paid, method }) => {
    const { reservation, unpaid, complete } = completeRequest;
    setCompleteRequest(null);
    // "Cancel" while only collecting: nothing to do.
    if (!complete && !paid) return;
    if (paid) {
      try {
        const results = await Promise.all(
          unpaid.map((order) =>
            updateOrderPayment(order.id, {
              payment_status: PAID,
              payment_method: method,
            }),
          ),
        );
        const failed = results.find((response) => !response?.success);
        if (failed) throw failed.message;
        setOrders((current) =>
          current.map((order) =>
            unpaid.some((row) => row.id === order.id)
              ? { ...order, payment_status: PAID, payment_method: method }
              : order,
          ),
        );
        notifyOrdersChanged();
        showToast({
          message: `Booking #${reservation.id} paid by ${paymentMethodLabel(method)}`,
          variant: "success",
        });
      } catch (error) {
        fetchOrders();
        showToast({
          title: `Couldn't record payment for booking #${reservation.id}`,
          message: error?.response?.data?.message || error,
          variant: "danger",
        });
        return; // stay open so payment can be retried
      }
    }
    if (complete) changeStatus(reservation, STATUS.COMPLETED);
  };

  // Server / cleaner on a card, with Add / Change only in the columns where
  // that person can still be changed.
  const renderStaff = (row, kind) => {
    const { config, editableIn } = STAFF[kind];
    const person = row[config.orderRelation];
    const editable = editableIn.includes(row.dining_status);
    const ask = () => setStaffRequest({ kind, reservation: row, status: row.dining_status });

    if (!person) {
      return editable ? (
        <button
          type="button"
          data-no-drag
          className="kanban-card__cook-assign"
          onClick={ask}
        >
          + Add {config.singular.toLowerCase()}
        </button>
      ) : null;
    }

    const avatar = (
      <StaffAvatar
        name={person[config.nameField]}
        photo={person.photo_url}
        size={26}
        tone={kind}
      />
    );
    return (
      <div className={`kanban-card__cook kanban-card__cook--${kind} kanban-card__staff-person`}>
        {/* Click the photo to change the person (where it can still change). */}
        {editable ? (
          <button
            type="button"
            data-no-drag
            className="kanban-card__staff-avatar"
            title={`Change ${config.singular.toLowerCase()}`}
            aria-label={`Change ${config.singular.toLowerCase()} (${person[config.nameField]})`}
            onClick={ask}
          >
            {avatar}
            <EditRounded className="kanban-card__staff-edit" aria-hidden />
          </button>
        ) : (
          avatar
        )}
        <span>
          <strong>{person[config.nameField]}</strong>
          <small>{config.singular}</small>
        </span>
      </div>
    );
  };

  const renderCard = (row) => (
    <Fragment>
      <div className="kanban-card__head">
        {/* Opens the full booking details. */}
        <button
          type="button"
          data-no-drag
          className="kanban-card__title kanban-card__title--link"
          title="View booking details"
          onClick={() => setDetailsId(row.id)}
        >
          Booking #{row.id}
        </button>
        <button
          type="button"
          className="kanban-card__ref kanban-card__ref--link"
          title={row.hotel?.hotel_name || "Unnamed Hotel"}
          onClick={() =>
            navigate("/book-table/details/" + row.hotel_id, {
              state: {
                hotel_id: row.hotel_id,
                from: { label: "Reservations", path: "/booked-table" },
              },
            })
          }
        >
          {row.hotel?.hotel_name || "Unnamed Hotel"}
        </button>
      </div>
      <div className="kanban-card__meta">
        <span>
          <EventAvailableOutlined sx={{ fontSize: 16, color: "#10b981" }} />
          {dayjs(row.dining_date).format("DD MMM YYYY, hh:mm A")}
        </span>
        <span>
          <LayersOutlined sx={{ fontSize: 16, color: "#8b5cf6" }} />
          Floor {row.floor?.floor_number ?? "-"}
        </span>
        {/* Several tables: the row spans the card and the codes wrap. */}
        <span
          className={`kanban-card__tables${
            getTableLabels(row.seat_status).length > 1 ? " is-many" : ""
          }`}
        >
          <TableRestaurantOutlined sx={{ fontSize: 16, color: "#f59e0b" }} />
          {/* Table codes stand out so staff can find the table quickly. */}
          {(() => {
            const labels = getTableLabels(row.seat_status);
            if (!labels.length) return "No table";
            return labels.map((label) => (
              <span key={label} className="kanban-card__table">
                {label}
              </span>
            ));
          })()}
        </span>
        <span>
          <EventSeatOutlined sx={{ fontSize: 16, color: "#06b6d4" }} />
          {countSeats(row.seat_status)} Seats
        </span>
      </div>
      {renderReady(row)}
      {renderOrders(row)}
      {row.dining_status === STATUS.COMPLETED && renderPayment(row)}
      {/* Server and cleaner side by side. */}
      <div className="kanban-card__staff">
        {renderStaff(row, "server")}
        {renderStaff(row, "cleaner")}
      </div>
    </Fragment>
  );

  // Completed booking: what was paid, and a way to collect what is still due.
  const renderPayment = (row) => {
    const live = bookingOrders.get(row.id) || [];
    if (!live.length) return null;
    const total = live.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const pending = live
      .filter((order) => order.payment_status === PAYMENT_PENDING)
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const methods = [
      ...new Set(
        live
          .filter((order) => order.payment_status === PAID && order.payment_method)
          .map((order) => paymentMethodLabel(order.payment_method)),
      ),
    ];

    if (pending <= 0) {
      return (
        <div className="kanban-card__payment is-paid">
          <span>
            Paid{methods.length ? ` · ${methods.join(", ")}` : ""}
          </span>
          <strong>₹{total.toFixed(2)}</strong>
        </div>
      );
    }
    return (
      <div className="kanban-card__payment is-pending">
        <span>
          Payment pending
          <small>
            ₹{pending.toFixed(2)} of ₹{total.toFixed(2)}
          </small>
        </span>
        <button
          type="button"
          data-no-drag
          className="kanban-card__payment-btn"
          onClick={() => setCompleteRequest(paymentRequestFor(row, false))}
        >
          Collect
        </button>
      </div>
    );
  };

  // The booking's food orders and where each one is.
  const renderOrders = (row) => {
    const list = bookingOrders.get(row.id) || [];
    const canOrder = !NO_ORDER_STATUSES.includes(row.dining_status);
    if (!list.length) {
      return canOrder ? (
        <button
          type="button"
          data-no-drag
          className="kanban-card__new-order"
          onClick={() => setNewOrderFor(row)}
        >
          <AddRounded fontSize="small" /> Create order
        </button>
      ) : null;
    }
    return (
      <div className="kanban-card__orders">
        <span className="kanban-card__orders-title">
          <ReceiptLongOutlined sx={{ fontSize: 15 }} aria-hidden />
          Orders ({list.length})
          {canOrder && (
            <button
              type="button"
              data-no-drag
              className="kanban-card__orders-add"
              onClick={() => setNewOrderFor(row)}
            >
              <AddRounded sx={{ fontSize: 14 }} />
            </button>
          )}
        </span>
        <ul>
          {list.map((order) => {
            const stage = ORDER_STAGES[order.order_status] || {
              name: "-",
              color: "#64748b",
            };
            const dishCount = (order.items || [])
              .filter((item) => item.item_status !== ITEM_CANCELLED)
              .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            return (
              <li key={order.id}>
                <button
                  type="button"
                  data-no-drag
                  className="kanban-card__order"
                  title={`View ${order.order_number || `order #${order.id}`}`}
                  onClick={() => setOpenOrderId(order.id)}
                >
                  <span className="kanban-card__order-no">
                    {order.order_number || `#${order.id}`}
                  </span>
                  <span
                    className="kanban-card__order-stage"
                    style={{ "--stage-color": stage.color }}
                  >
                    {stage.name}
                  </span>
                  <span className="kanban-card__order-sum">
                    {dishCount} {dishCount === 1 ? "item" : "items"} · ₹
                    {Number(order.total_amount || 0).toFixed(0)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Highlight for the server: food for this table is ready at the pass.
  const renderReady = (row) => {
    const dishes = readyDishes.get(row.id);
    if (!dishes?.length) return null;
    const count = dishes.reduce((sum, dish) => sum + Number(dish.quantity || 0), 0);
    return (
      <div className="kanban-card__ready" role="status">
        <div className="kanban-card__ready-head">
          <span className="kanban-card__ready-dot" aria-hidden />
          <RoomServiceOutlined className="kanban-card__ready-bell" sx={{ fontSize: 16 }} aria-hidden />
          <strong>Ready to serve</strong>
          <span className="kanban-card__ready-count">
            {count} {count === 1 ? "dish" : "dishes"}
          </span>
        </div>
        <ul>
          {dishes.map((dish) => (
            <li key={dish.id}>
              <span>
                {dish.quantity} × {dish.menu_name}
              </span>
              <button
                type="button"
                data-no-drag
                className="kanban-card__ready-order"
                title={`View ${dish.orderNumber}`}
                onClick={() => setOpenOrderId(dish.orderId)}
              >
                {dish.orderNumber}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Fragment>
      <section className="ui-page kanban-page">
        <header className="ui-header">
          <div>
            <span className="ui-kicker">Front desk</span>
            <h1>Reservations</h1>
            <p>Drag a booking to a new column to update its status.</p>
          </div>
          <div className="ui-header__actions">
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => {
                fetchReservations();
                fetchOrders();
              }}
              disabled={loading}
            >
              <RefreshRounded fontSize="small" /> Refresh
            </button>
          </div>
        </header>

        <div className="ui-toolbar" role="search">
          <label className="ui-search">
            <SearchRounded fontSize="small" aria-hidden />
            <select
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              aria-label="Search in"
            >
              {SEARCH_FIELDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              ? `${visibleReservations.length} of ${reservations.length} reservations`
              : `${reservations.length} reservations`}
            {searchQuery && (
              <button type="button" onClick={() => setSearchText("")}>
                Clear
              </button>
            )}
          </span>
        </div>

        <KanbanBoard
          columns={columns}
          items={visibleReservations}
          getColumnId={(row) => row.dining_status}
          canMove={(row) => !LOCKED_STATUSES.includes(row.dining_status)}
          onMove={handleMove}
          onBlocked={handleBlocked}
          renderCard={renderCard}
          loading={loading || diningStatusList.loading}
          emptyLabel="No reservations"
        />
      </section>

      <AssignStaffDialog
        config={STAFF[staffRequest?.kind || "server"].config}
        order={staffRequest?.reservation}
        question={STAFF[staffRequest?.kind || "server"].question}
        confirmLabel={
          staffRequest &&
          staffRequest.status !== staffRequest.reservation.dining_status
            ? STAFF[staffRequest.kind].moveLabel
            : `Assign ${staffRequest?.kind || "server"}`
        }
        onAssign={assignStaff}
        onCancel={() => setStaffRequest(null)}
      />

      {(() => {
        const booking = reservations.find((row) => row.id === detailsId) || null;
        return (
          <BookingDetailsDialog
            reservation={booking}
            // Every order of the booking, cancelled ones too, oldest first.
            orders={orders
              .filter((order) => order.reservation_id === detailsId)
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))}
            statusName={booking ? statusName(booking.dining_status) : ""}
            statusColor={columns.find((column) => column.id === booking?.dining_status)?.color}
            tables={booking ? getTableLabels(booking.seat_status) : []}
            seats={booking ? countSeats(booking.seat_status) : 0}
            orderStages={ORDER_STAGES}
            onOpenOrder={(order) => {
              setDetailsId(null);
              setOpenOrderId(order.id);
            }}
            onClose={() => setDetailsId(null)}
          />
        );
      })()}

      <OrderDetailsDialog
        order={openOrder}
        statusName={ORDER_STAGES[openOrder?.order_status]?.name || ""}
        statusColor={ORDER_STAGES[openOrder?.order_status]?.color}
        // Front desk: dishes can be reduced / removed or the order cancelled
        // until it is served; extra dishes go to the kitchen as a new order
        // ticket (only the new dishes).
        readOnly={FINISHED_ORDER_STATUSES.includes(openOrder?.order_status)}
        reduceOnly
        onClose={() => setOpenOrderId(null)}
        onSaved={() => {
          setOpenOrderId(null);
          notifyOrdersChanged();
          fetchOrders();
          showToast({ message: "Order updated", variant: "success" });
        }}
        onCancelOrder={
          FINISHED_ORDER_STATUSES.includes(openOrder?.order_status)
            ? undefined
            : (order) => setOrderToCancel(order)
        }
        onAddItems={
          NO_ORDER_STATUSES.includes(
            reservations.find((row) => row.id === openOrder?.reservation_id)
              ?.dining_status,
          )
            ? undefined
            : (order) => {
                setOpenOrderId(null);
                setNewOrderFor(
                  reservations.find((row) => row.id === order.reservation_id) || {
                    id: order.reservation_id,
                    hotel_id: order.hotel_id,
                  },
                );
              }
        }
      />

      <ConfirmDialog
        show={Boolean(orderToCancel)}
        tone="warning"
        title={`Cancel order ${orderToCancel?.order_number || ""}?`}
        message="The kitchen stops this order and it moves to Cancelled on the Orders board."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancellingOrder}
        onConfirm={confirmCancelOrder}
        onCancel={() => setOrderToCancel(null)}
      />

      <CreateOrderDialog
        show={Boolean(newOrderFor)}
        hotelId={newOrderFor?.hotel_id ?? ""}
        hotelName={newOrderFor?.hotel?.hotel_name ?? ""}
        reservationId={newOrderFor?.id ?? null}
        onClose={() => setNewOrderFor(null)}
        onCreated={fetchOrders}
      />

      <PaymentDialog
        order={completeRequest?.bill ?? null}
        // deliver = the left button answers "pay later" instead of cancelling.
        deliver={Boolean(completeRequest?.complete)}
        title={
          completeRequest?.complete
            ? `Complete booking #${completeRequest?.reservation.id ?? ""}`
            : `Collect payment · Booking #${completeRequest?.reservation.id ?? ""}`
        }
        laterLabel={completeRequest?.complete ? "Complete · pay later" : "Cancel"}
        payLabel={(method) =>
          completeRequest?.complete ? `Paid by ${method} & complete` : `Mark paid · ${method}`
        }
        onConfirm={settleAndComplete}
        onCancel={() => setCompleteRequest(null)}
      />

      <ConfirmDialog
        show={Boolean(pendingCancel)}
        tone="warning"
        title={`Cancel reservation #${pendingCancel?.id}?`}
        message="Its seats will be released for new bookings."
        confirmLabel="Cancel reservation"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </Fragment>
  );
};

export default ReservationBoard;
