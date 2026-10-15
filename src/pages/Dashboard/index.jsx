import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@chartkitjs/chartlib/react";
import {
  ArrowForwardRounded,
  CancelOutlined,
  EventAvailableOutlined,
  RefreshRounded,
  RestaurantOutlined,
  TaskAltRounded,
} from "@mui/icons-material";
import CustomDatePicker from "components/common/CustomDatePicker";
import useAuth from "hooks/useAuth";
import useGlobalMaster from "hooks/useGlobalMaster";
import { getDashboardSummary } from "services";
import { getDashboardSummaryParams } from "utils/dashboard";
import { getApiErrorDetails } from "utils/apiError";
import { paymentColor, paymentLabel } from "utils/paymentStatus";

export const BOARD_FILTER_OPTIONS = [
  { label: "7 days", value: "LAST_7_DAYS" },
  { label: "30 days", value: "LAST_30_DAYS" },
  { label: "60 days", value: "LAST_60_DAYS" },
  { label: "90 days", value: "LAST_90_DAYS" },
  { label: "Custom", value: "CUSTOM_RANGE" },
];

// todayStatus keys from the API → dining status ids (utils/reservationStatus.js).
// `color` is the donut slice colour: the app's status colours, with Seated
// brightened and the slices ordered (Completed between Seated and Serving) so
// the set passes the colour-blind checks (dataviz validate_palette.js).
// `order` is the reading order in the list beside the donut.
const STATUS_ROWS = [
  { key: "pending", id: 5, label: "Pending", color: "#f59e0b", order: 0 },
  { key: "confirmed", id: 1, label: "Confirmed", color: "#3b82f6", order: 1 },
  { key: "seated", id: 2, label: "Seated", color: "#0d9488", order: 2 },
  { key: "completed", id: 3, label: "Completed", color: "#22c55e", order: 4 },
  { key: "serving", id: 7, label: "Serving", color: "#8b5cf6", order: 3 },
  { key: "cancelled", id: 4, label: "Cancelled", color: "#ef4444", order: 5 },
];

// Trend series: categorical slots 1–3 (validated light + dark). Totals are
// printed beside each swatch, so colour never carries the meaning alone.
const TREND_SERIES = [
  { key: "created", label: "Created", color: "#2a78d6" },
  { key: "cancelled", label: "Cancelled", color: "#eb6834" },
  { key: "completed", label: "Completed", color: "#1baf7a" },
];

// orders.byStatus keys from the API → ORDER_STATUS (API utils/orderStatus.js).
// Colours match the Orders board defaults; Settings → order statuses win.
// `legacy` rows (old Completed) are listed only when they have orders.
const ORDER_STATUS_ROWS = [
  { id: 1, label: "Ordered", color: "#6366f1" },
  { id: 2, label: "Accepted", color: "#0ea5e9" },
  { id: 3, label: "Preparing", color: "#f59e0b" },
  { id: 4, label: "Ready", color: "#14b8a6" },
  { id: 5, label: "Served", color: "#8b5cf6" },
  { id: 8, label: "Delivered", color: "#0ea5e9" },
  { id: 6, label: "Completed", color: "#22c55e", legacy: true },
  { id: 7, label: "Cancelled", color: "#ef4444" },
];

const rupees = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// Chart chrome in the app's font and inks.
const CHART_THEME = {
  base: "light",
  fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
  fontSize: 11,
  text: "#1f2337",
  mutedText: "#8a8fa6",
  grid: "#eef0f5",
  axis: "#e6e4f0",
};

// Whole numbers only on count axes.
const countTick = (value) => (Number.isInteger(value) ? String(value) : "");

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const tableLabels = (seatStatus) =>
  (Array.isArray(seatStatus) ? seatStatus : [])
    .map(
      (table) =>
        table.table_code ||
        (table.table_number != null ? `T${table.table_number}` : null) ||
        (table.table_id != null ? `#${table.table_id}` : null),
    )
    .filter(Boolean);

const Dashboard = () => {
  const navigate = useNavigate();
  const [{ data: auth }] = useAuth();
  const {
    diningStatusList,
    getDiningStatus,
    orderStatusList,
    getOrderStatus,
    paymentStatusList,
    getPaymentStatus,
  } = useGlobalMaster();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState(BOARD_FILTER_OPTIONS[0].value);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (diningStatusList.data.length === 0) getDiningStatus();
    if (orderStatusList.data.length === 0) getOrderStatus();
    if (paymentStatusList.data.length === 0) getPaymentStatus();
  }, []);

  const loadDashboard = useCallback(async (params) => {
    if (!params) return;
    setLoading(true);
    setError("");
    try {
      const response = await getDashboardSummary(params);
      setData(response.data || null);
    } catch (err) {
      const details = getApiErrorDetails(err);
      setError(`${details.title}: ${details.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const currentParams = () =>
    filterType === "CUSTOM_RANGE"
      ? getDashboardSummaryParams("CUSTOM_RANGE", {
          start_date: customRange.start,
          end_date: customRange.end,
        })
      : getDashboardSummaryParams(filterType);

  useEffect(() => {
    if (filterType !== "CUSTOM_RANGE") {
      loadDashboard(getDashboardSummaryParams(filterType));
    }
  }, [filterType, loadDashboard]);

  const selectRange = (value) => {
    if (value === "CUSTOM_RANGE") {
      setShowCalendar(true);
      return;
    }
    setShowCalendar(false);
    setFilterType(value);
  };

  const applyCustomRange = (range) => {
    if (!range?.start || !range?.end) return;
    setShowCalendar(false);
    setCustomRange({ start: range.start, end: range.end });
    setFilterType("CUSTOM_RANGE");
    loadDashboard(
      getDashboardSummaryParams("CUSTOM_RANGE", {
        start_date: range.start,
        end_date: range.end,
      }),
    );
  };

  // Status chips in the table use the app-wide colours (Settings → statuses).
  const masterColor = (id, fallback) => {
    const master = diningStatusList.data.find((status) => status.status_id === id);
    return master?.color_code && master.color_code !== "#000000" ? master.color_code : fallback;
  };

  const counts = data?.todayStatus || {};
  const statusRows = useMemo(
    () => STATUS_ROWS.map((row) => ({ ...row, count: Number(counts[row.key]) || 0 })),
    [data],
  );
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0);
  const statusSlices = statusRows.filter((row) => row.count > 0);

  const totals = data?.totals || {};
  const trendPoints = data?.trend?.points || [];
  const trendTotals = TREND_SERIES.reduce(
    (sums, series) => ({
      ...sums,
      [series.key]: trendPoints.reduce((sum, point) => sum + (Number(point[series.key]) || 0), 0),
    }),
    {},
  );
  const recent = data?.recent || [];
  const firstName = auth?.details?.name?.split(" ")[0];
  const bookings = totals.todayBookings ?? 0;
  const activeNow = (Number(counts.seated) || 0) + (Number(counts.serving) || 0);
  const rangeLabel =
    filterType === "CUSTOM_RANGE" && customRange.start
      ? `${dayjs(customRange.start).format("D MMM")} – ${dayjs(customRange.end).format("D MMM YYYY")}`
      : `last ${BOARD_FILTER_OPTIONS.find((o) => o.value === filterType)?.label}`;

  const kpis = [
    {
      key: "bookings",
      label: data?.isAdmin === false ? "My bookings" : "Bookings",
      value: bookings,
      note: `${counts.pending || 0} awaiting confirmation`,
      icon: EventAvailableOutlined,
      tone: "blue",
      spark: true,
    },
    {
      key: "completed",
      label: "Completed",
      value: counts.completed || 0,
      note: `${percent(counts.completed || 0, bookings)}% completion rate`,
      icon: TaskAltRounded,
      tone: "green",
    },
    {
      key: "active",
      label: "Dining now",
      value: activeNow,
      note: `${counts.seated || 0} seated · ${counts.serving || 0} being served`,
      icon: RestaurantOutlined,
      tone: "violet",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: counts.cancelled || 0,
      note: `${percent(counts.cancelled || 0, bookings)}% of bookings`,
      icon: CancelOutlined,
      tone: "red",
    },
  ];

  const occupancy = [
    { label: "Seats in use", value: totals.occupiedSeats || 0, of: totals.seats || 0 },
    { label: "Tables booked", value: totals.tablesBooked || 0, of: totals.tables || 0 },
    { label: "Hotels with bookings", value: totals.hotelsWithBookings || 0, of: totals.hotels || 0 },
  ];

  const orders = data?.orders || {};
  const orderCounts = orders.byStatus || {};
  const orderTotal = Number(orders.total) || 0;
  const recentOrders = orders.recent || [];
  const orderStatusRows = ORDER_STATUS_ROWS.map((row) => ({
    ...row,
    count: Number(orderCounts[row.id]) || 0,
  })).filter((row) => !row.legacy || row.count > 0);
  // Order status names / colours from Settings, else the defaults above.
  const orderStatusOf = (id) => {
    const fallback = ORDER_STATUS_ROWS.find((row) => row.id === id);
    const master = orderStatusList.data.find((status) => Number(status.status_id) === id);
    const name = String(master?.name || "").trim();
    return {
      label:
        name && !/^STATUS_\d+$/.test(name)
          ? name.charAt(0) + name.slice(1).toLowerCase().replace(/_/g, " ")
          : fallback?.label || "—",
      color:
        master?.color_code && master.color_code !== "#000000"
          ? master.color_code
          : fallback?.color || "#64748b",
    };
  };

  const openReservation = (reservation) => {
    const hotelId = reservation.hotel_id || reservation.hotel?.id;
    if (!hotelId) return;
    navigate(`/book-table/details/${hotelId}`, {
      state: {
        hotelData: reservation.hotel || { id: hotelId },
        isBooking: true,
        reservationId: reservation.id,
        from: { label: "Dashboard", path: "/dashboard" },
      },
    });
  };

  const firstLoad = loading && !data;
  // Guests see their own bookings; restaurant-wide occupancy is for staff.
  const isGuest = data?.isAdmin === false;
  // Staff → Orders board; guests → their "My orders" tab.
  const ordersPath = isGuest ? "/book-table?tab=orders" : "/orders";

  return (
    <section className={`ui-page dash${firstLoad ? " is-loading" : ""}`}>
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Overview</span>
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p>
            {data?.isAdmin === false
              ? "Your booking activity"
              : "What's happening across your restaurants"}{" "}
            · {rangeLabel}
          </p>
        </div>
        <div className="ui-header__actions dash__range">
          <div className="ui-segment" role="radiogroup" aria-label="Date range">
            {BOARD_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={filterType === option.value}
                className={filterType === option.value ? "is-active" : ""}
                onClick={() => selectRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ui-icon-btn dash__refresh"
            onClick={() => loadDashboard(currentParams())}
            disabled={loading}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <RefreshRounded className={loading ? "is-spinning" : ""} />
          </button>
          {showCalendar && (
            <div className="dashboard-page__custom-month dash__calendar">
              <CustomDatePicker
                defaultDate={[customRange.start, customRange.end]}
                onSelect={applyCustomRange}
                oncancel={() => setShowCalendar(false)}
                isOrderDate={true}
                isDueDate={false}
                isRangeSelect={true}
                twoSide={true}
              />
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="ui-alert ui-alert--danger" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Retry" onClick={() => loadDashboard(currentParams())}>
            ↻
          </button>
        </div>
      )}

      {/* ---------- KPI tiles ---------- */}
      <div className="dash__kpis">
        {kpis.map(({ key, label, value, note, icon: Icon, tone, spark }) => (
          <article key={key} className={`dash-kpi dash-kpi--${tone}`}>
            <div className="dash-kpi__top">
              <span className="dash-kpi__label">{label}</span>
              <span className="dash-kpi__icon" aria-hidden>
                <Icon fontSize="small" />
              </span>
            </div>
            <strong className="dash-kpi__value">{value}</strong>
            <span className="dash-kpi__note">{note}</span>
            {/* Bookings tile: the trend in miniature. */}
            {spark && trendPoints.length > 1 && (
              <div className="dash-kpi__spark">
                <AreaChart
                  data={trendPoints}
                  height={44}
                  margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  theme={CHART_THEME}
                  aria-label={`Bookings created per period, ${rangeLabel}`}
                >
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Bookings"
                    stroke="#2a78d6"
                    fill="#2a78d6"
                    fillOpacity={0.14}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* ---------- Trend + status ---------- */}
      <div className="dash__grid">
        <article className="dash-card dash-card--wide">
          <header className="dash-card__head">
            <div>
              <h2>Bookings over time</h2>
              <p>Created, cancelled and completed · {rangeLabel}</p>
            </div>
            {/* Legend with totals: identity never by colour alone. */}
            <ul className="dash-legend">
              {TREND_SERIES.map((series) => (
                <li key={series.key}>
                  <span className="dash-legend__swatch" style={{ background: series.color }} />
                  {series.label}
                  <strong>{trendTotals[series.key] || 0}</strong>
                </li>
              ))}
            </ul>
          </header>
          {trendPoints.length === 0 ? (
            <p className="dash-card__empty">
              {firstLoad ? "Loading…" : "No bookings in this range."}
            </p>
          ) : (
            <div className="dash-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendPoints}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  theme={CHART_THEME}
                  desc={`Bookings created, cancelled and completed, ${rangeLabel}.`}
                  aria-label="Bookings over time"
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis width={32} tickFormatter={countTick} />
                  <Tooltip />
                  {TREND_SERIES.map((series) => (
                    <Area
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.color}
                      fill={series.color}
                      fillOpacity={series.key === "created" ? 0.14 : 0.06}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="dash-card">
          <header className="dash-card__head">
            <div>
              <h2>Reservation status</h2>
              <p>Where this range's bookings are now</p>
            </div>
          </header>
          {statusTotal === 0 ? (
            <p className="dash-card__empty">{firstLoad ? "Loading…" : "No reservations yet."}</p>
          ) : (
            <div className="dash-status">
              <div className="dash-donut">
                <PieChart
                  data={statusSlices}
                  height={200}
                  theme={CHART_THEME}
                  aria-label="Reservations by status"
                >
                  <Pie
                    data={statusSlices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="64%"
                    outerRadius="92%"
                    paddingAngle={2}
                    activeShape
                    activeOffset={5}
                  >
                    {statusSlices.map((row) => (
                      <Cell key={row.key} fill={row.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="dash-donut__center" aria-hidden>
                  <strong>{statusTotal}</strong>
                  <span>bookings</span>
                </div>
              </div>
              {/* The legend: every status with its count and share. */}
              <ul className="dash-status__list">
                {[...statusRows]
                  .sort((a, b) => a.order - b.order)
                  .map((row) => (
                    <li key={row.key} className={row.count ? "" : "is-zero"}>
                      <span className="dash-status__dot" style={{ background: row.color }} />
                      <span className="dash-status__label">{row.label}</span>
                      <strong>{row.count}</strong>
                      <small>{percent(row.count, statusTotal)}%</small>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </article>
      </div>

      {/* ---------- Occupancy (staff) + recent ---------- */}
      <div className={`dash__grid dash__grid--flip${isGuest ? " dash__grid--single" : ""}`}>
        {!isGuest && (
        <article className="dash-card">
          <header className="dash-card__head">
            <div>
              <h2>Seat occupancy</h2>
              <p>Seats booked, seated or being cleaned right now</p>
            </div>
          </header>
          <div className="dash-occupancy">
            <div
              className="dash-occupancy__ring"
              style={{ "--value": `${totals.occupancyRate || 0}%` }}
              role="img"
              aria-label={`${totals.occupancyRate || 0}% of seats occupied`}
            >
              <div>
                <strong>{totals.occupancyRate || 0}%</strong>
                <span>occupied</span>
              </div>
            </div>
            <ul className="dash-occupancy__facts">
              {occupancy.map((fact) => (
                <li key={fact.label}>
                  <div>
                    <span>{fact.label}</span>
                    <strong>
                      {fact.value}
                      <small> / {fact.of}</small>
                    </strong>
                  </div>
                  <span
                    className="dash-occupancy__meter"
                    style={{ "--fill": `${percent(fact.value, fact.of)}%` }}
                    aria-hidden
                  />
                </li>
              ))}
            </ul>
          </div>
        </article>
        )}

        <article className="dash-card dash-card--wide dash-card--table">
          <header className="dash-card__head">
            <div>
              <h2>{isGuest ? "My recent bookings" : "Recent reservations"}</h2>
              <p>Latest bookings in this range</p>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--sm"
              onClick={() => navigate(isGuest ? "/book-table?tab=reservations" : "/booked-table")}
            >
              View all <ArrowForwardRounded fontSize="small" />
            </button>
          </header>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Hotel</th>
                  <th>Date</th>
                  <th>Tables</th>
                  <th className="is-center">Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {firstLoad ? (
                  <tr className="ui-table__state">
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : recent.length === 0 ? (
                  <tr className="ui-table__state">
                    <td colSpan={6}>No reservations in this range.</td>
                  </tr>
                ) : (
                  recent.map((reservation) => {
                    const seats = (reservation.seat_status || []).reduce(
                      (sum, table) => sum + (table.seat_ids?.length || 0),
                      0,
                    );
                    const tables = tableLabels(reservation.seat_status);
                    const status = STATUS_ROWS.find((row) => row.id === reservation.dining_status);
                    const master = diningStatusList.data.find(
                      (item) => item.status_id === reservation.dining_status,
                    );
                    return (
                      <tr
                        key={reservation.id}
                        className="dash-row"
                        tabIndex={0}
                        onClick={() => openReservation(reservation)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") openReservation(reservation);
                        }}
                      >
                        <td className="is-strong">#{String(reservation.id).padStart(4, "0")}</td>
                        <td>{reservation.hotel?.hotel_name || "—"}</td>
                        <td className="dash-row__date">
                          {reservation.dining_date
                            ? dayjs(reservation.dining_date).format("D MMM YYYY")
                            : "—"}
                          {reservation.start_time && (
                            <small className="dash-row__time">
                              {dayjs(`2000-01-01T${reservation.start_time}`).format("h:mm A")}
                            </small>
                          )}
                        </td>
                        <td>
                          {tables.length ? (
                            <span className="dash-row__tables" title={tables.join(", ")}>
                              {tables.slice(0, 2).join(", ")}
                              {tables.length > 2 && ` +${tables.length - 2}`}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="is-center">{seats || "—"}</td>
                        <td>
                          <span
                            className="ui-chip booking-status"
                            style={{
                              "--status-color": masterColor(
                                reservation.dining_status,
                                status?.color || "#64748b",
                              ),
                            }}
                          >
                            {master?.name || status?.label || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {/* ---------- Orders (staff: all orders; guests: their own) ---------- */}
      <div className="dash__grid dash__grid--flip">
        <article className="dash-card">
          <header className="dash-card__head">
            <div>
              <h2>{isGuest ? "My orders" : "Orders"}</h2>
              <p>
                {isGuest ? "Food you ordered" : "Food orders placed"} · {rangeLabel}
              </p>
            </div>
          </header>
          <div className="dash-orders__totals">
            <div>
              <span>Orders</span>
              <strong>{orderTotal}</strong>
            </div>
            <div>
              <span>{isGuest ? "Spent" : "Revenue"}</span>
              <strong>{rupees(orders.revenue)}</strong>
              <small>{rupees(orders.paidRevenue)} paid</small>
            </div>
            <div>
              <span>{isGuest ? "To pay" : "Unpaid"}</span>
              <strong>{rupees(orders.unpaidAmount)}</strong>
              <small>
                {orders.unpaidCount || 0} {orders.unpaidCount === 1 ? "order" : "orders"}
              </small>
            </div>
          </div>
          {orderTotal === 0 ? (
            <p className="dash-card__empty">{firstLoad ? "Loading…" : "No orders in this range."}</p>
          ) : (
            <ul className="dash-occupancy__facts dash-orders__status">
              {orderStatusRows.map((row) => {
                const { label, color } = orderStatusOf(row.id);
                return (
                  <li key={row.id} className={row.count ? "" : "is-zero"}>
                    <div>
                      <span>{label}</span>
                      <strong>
                        {row.count}
                        <small> · {percent(row.count, orderTotal)}%</small>
                      </strong>
                    </div>
                    <span
                      className="dash-occupancy__meter"
                      style={{
                        "--fill": `${percent(row.count, orderTotal)}%`,
                        "--meter": color,
                      }}
                      aria-hidden
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="dash-card dash-card--wide dash-card--table">
          <header className="dash-card__head">
            <div>
              <h2>{isGuest ? "My recent orders" : "Recent orders"}</h2>
              <p>Latest orders in this range</p>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--sm"
              onClick={() => navigate(ordersPath)}
            >
              View all <ArrowForwardRounded fontSize="small" />
            </button>
          </header>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Hotel</th>
                  <th>Placed</th>
                  <th className="is-center">Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {firstLoad ? (
                  <tr className="ui-table__state">
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr className="ui-table__state">
                    <td colSpan={6}>No orders in this range.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const status = orderStatusOf(order.order_status);
                    return (
                      <tr
                        key={order.id}
                        className="dash-row"
                        tabIndex={0}
                        onClick={() => navigate(ordersPath)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") navigate(ordersPath);
                        }}
                      >
                        <td className="is-strong">
                          {order.order_number || `#${String(order.id).padStart(4, "0")}`}
                          <small className="dash-row__time">
                            {order.reservation_id ? "Table order" : "No booking"}
                          </small>
                        </td>
                        <td>{order.hotel?.hotel_name || "—"}</td>
                        <td className="dash-row__date">
                          {order.ordered_at ? dayjs(order.ordered_at).format("D MMM YYYY") : "—"}
                          {order.ordered_at && (
                            <small className="dash-row__time">
                              {dayjs(order.ordered_at).format("h:mm A")}
                            </small>
                          )}
                        </td>
                        <td className="is-center">{rupees(order.total_amount)}</td>
                        <td>
                          <span
                            className="ui-chip booking-status"
                            style={{
                              "--status-color": paymentColor(
                                order.payment_status,
                                paymentStatusList.data,
                              ),
                            }}
                          >
                            {paymentLabel(order.payment_status, paymentStatusList.data)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="ui-chip booking-status"
                            style={{ "--status-color": status.color }}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
