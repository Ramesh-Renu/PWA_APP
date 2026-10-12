import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ApartmentOutlined,
  ArrowForwardRounded,
  EventAvailableOutlined,
  EventSeatOutlined,
  RefreshRounded,
  TableRestaurantOutlined,
} from "@mui/icons-material";
import CustomDatePicker from "components/common/CustomDatePicker";
import useAuth from "hooks/useAuth";
import useGlobalMaster from "hooks/useGlobalMaster";
import { getDashboardSummary } from "services";
import { getDashboardSummaryParams } from "utils/dashboard";
import { getApiErrorDetails } from "utils/apiError";

export const BOARD_FILTER_OPTIONS = [
  { label: "7 days", value: "LAST_7_DAYS" },
  { label: "30 days", value: "LAST_30_DAYS" },
  { label: "60 days", value: "LAST_60_DAYS" },
  { label: "90 days", value: "LAST_90_DAYS" },
  { label: "Custom", value: "CUSTOM_RANGE" },
];

// todayStatus keys from the API → dining status ids (utils/reservationStatus.js)
// with fallback colours for when the status master hasn't loaded.
const STATUS_ROWS = [
  { key: "pending", id: 5, label: "Pending", color: "#f59e0b" },
  { key: "confirmed", id: 1, label: "Confirmed", color: "#3b82f6" },
  { key: "seated", id: 2, label: "Seated", color: "#0f766e" },
  { key: "serving", id: 7, label: "Serving", color: "#8b5cf6" },
  { key: "completed", id: 3, label: "Completed", color: "#22c55e" },
  { key: "cancelled", id: 4, label: "Cancelled", color: "#ef4444" },
];

const TREND_SERIES = [
  { key: "created", label: "Created", color: "#0f766e" },
  { key: "completed", label: "Completed", color: "#22c55e" },
  { key: "cancelled", label: "Cancelled", color: "#ef4444" },
];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

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
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState(BOARD_FILTER_OPTIONS[0].value);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (diningStatusList.data.length === 0) getDiningStatus();
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

  const statusColor = (id, fallback) => {
    const master = diningStatusList.data.find((status) => status.status_id === id);
    return master?.color_code && master.color_code !== "#000000"
      ? master.color_code
      : fallback;
  };

  const statusRows = useMemo(
    () =>
      STATUS_ROWS.map((row) => ({
        ...row,
        color: statusColor(row.id, row.color),
        count: Number(data?.todayStatus?.[row.key]) || 0,
      })),
    [data, diningStatusList.data],
  );
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0);

  const totals = data?.totals || {};
  const trendPoints = data?.trend?.points || [];
  const recent = data?.recent || [];
  const firstName = auth?.details?.name?.split(" ")[0];
  const rangeLabel =
    filterType === "CUSTOM_RANGE" && customRange.start
      ? `${dayjs(customRange.start).format("D MMM")} – ${dayjs(customRange.end).format("D MMM YYYY")}`
      : `last ${BOARD_FILTER_OPTIONS.find((o) => o.value === filterType)?.label}`;

  const kpis = [
    {
      label: data?.isAdmin === false ? "My bookings" : "Bookings",
      value: totals.todayBookings ?? 0,
      note: `${data?.todayStatus?.pending || 0} awaiting confirmation`,
      icon: EventAvailableOutlined,
      tone: "teal",
    },
    {
      label: "Hotels",
      value: totals.hotels ?? 0,
      note: `${totals.hotelsWithBookings || 0} with bookings`,
      icon: ApartmentOutlined,
      tone: "violet",
    },
    {
      label: "Tables",
      value: totals.tables ?? 0,
      note: `${totals.tablesBooked || 0} booked in range`,
      icon: TableRestaurantOutlined,
      tone: "blue",
    },
    {
      label: "Seat occupancy",
      value: `${totals.occupancyRate || 0}%`,
      note: `${totals.occupiedSeats || 0} of ${totals.seats || 0} seats in use`,
      icon: EventSeatOutlined,
      tone: "amber",
    },
  ];

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

  return (
    <section className="ui-page dash">
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
          <button
            type="button"
            aria-label="Retry"
            onClick={() => loadDashboard(currentParams())}
          >
            ↻
          </button>
        </div>
      )}

      <div className={`dash__kpis${loading && !data ? " is-loading" : ""}`}>
        {kpis.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className={`dash-kpi dash-kpi--${tone}`}>
            <span className="dash-kpi__icon" aria-hidden>
              <Icon />
            </span>
            <div>
              <span className="dash-kpi__label">{label}</span>
              <strong className="dash-kpi__value">{value}</strong>
              <span className="dash-kpi__note">{note}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="dash__row">
        <article className="ui-panel dash-card dash-card--trend">
          <header className="dash-card__head">
            <div>
              <h2>Bookings over time</h2>
              <p>Created, completed and cancelled</p>
            </div>
            <ul className="dash-legend">
              {TREND_SERIES.map((series) => (
                <li key={series.key}>
                  <span style={{ background: series.color }} />
                  {series.label}
                </li>
              ))}
            </ul>
          </header>
          {trendPoints.length === 0 ? (
            <p className="dash-card__empty">No bookings in this range.</p>
          ) : (
            <div className="dash-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendPoints}
                  barGap={2}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#eef0f5" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#8a8fa6" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#8a8fa6" }}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(15, 118, 110, 0.06)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e6e4f0",
                      fontSize: 12,
                    }}
                  />
                  {TREND_SERIES.map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      fill={series.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="ui-panel dash-card">
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
            <dl className="dash-occupancy__facts">
              <div>
                <dt>Seats in use</dt>
                <dd>
                  {totals.occupiedSeats || 0}
                  <small> / {totals.seats || 0}</small>
                </dd>
              </div>
              <div>
                <dt>Tables booked</dt>
                <dd>
                  {totals.tablesBooked || 0}
                  <small> / {totals.tables || 0}</small>
                </dd>
              </div>
              <div>
                <dt>Hotels with bookings</dt>
                <dd>
                  {totals.hotelsWithBookings || 0}
                  <small> / {totals.hotels || 0}</small>
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </div>

      <article className="ui-panel dash-card">
        <header className="dash-card__head">
          <div>
            <h2>Reservation status</h2>
            <p>
              {statusTotal} {statusTotal === 1 ? "reservation" : "reservations"} in
              this range
            </p>
          </div>
        </header>
        <div
          className="dash-status__bar"
          role="img"
          aria-label={statusRows.map((row) => `${row.label} ${row.count}`).join(", ")}
        >
          {statusTotal === 0 ? (
            <span className="dash-status__empty" />
          ) : (
            statusRows
              .filter((row) => row.count > 0)
              .map((row) => (
                <span
                  key={row.key}
                  style={{ flexGrow: row.count, background: row.color }}
                  title={`${row.label}: ${row.count}`}
                />
              ))
          )}
        </div>
        <ul className="dash-status__list">
          {statusRows.map((row) => (
            <li key={row.key}>
              <span className="dash-status__dot" style={{ background: row.color }} />
              <span className="dash-status__label">{row.label}</span>
              <strong>{row.count}</strong>
              <small>
                {statusTotal ? Math.round((row.count / statusTotal) * 100) : 0}%
              </small>
            </li>
          ))}
        </ul>
      </article>

      <article className="ui-panel dash-card dash-card--table">
        <header className="dash-card__head">
          <div>
            <h2>Recent reservations</h2>
            <p>Latest bookings in this range</p>
          </div>
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm"
            onClick={() => navigate("/booked-table")}
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
              {loading && !data ? (
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
                  const status = STATUS_ROWS.find(
                    (row) => row.id === reservation.dining_status,
                  );
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
                      <td className="is-strong">
                        #{String(reservation.id).padStart(4, "0")}
                      </td>
                      <td>{reservation.hotel?.hotel_name || "—"}</td>
                      <td>
                        {reservation.dining_date
                          ? dayjs(reservation.dining_date).format("D MMM YYYY")
                          : "—"}
                        {reservation.start_time && (
                          <small className="dash-row__time">
                            {reservation.start_time}
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
                            "--status-color": statusColor(
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
    </section>
  );
};

export default Dashboard;
