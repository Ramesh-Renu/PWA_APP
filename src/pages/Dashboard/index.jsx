import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "services";
import useAuth from "hooks/useAuth";
import { useNavigate } from "react-router-dom";

const statusMeta = {
  1: { label: "Confirmed", className: "confirmed" },
  2: { label: "Seated", className: "seated" },
  3: { label: "Completed", className: "completed" },
  4: { label: "Cancelled", className: "cancelled" },
  5: { label: "Pending", className: "pending" },
  6: { label: "Cleaning", className: "cleaning" },
};

const Icon = ({ name }) => {
  const paths = {
    booking: <><path d="M7 3v3M17 3v3M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="3"/><path d="m9 15 2 2 4-5"/></>,
    hotel: <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M9 7h3M9 11h3M9 15h3M17 9h3v12M2 21h20"/></>,
    table: <><path d="M4 10h16M6 10V7h12v3M7 10l-2 11M17 10l2 11M8 16h8"/></>,
    seat: <><path d="M7 12V6a3 3 0 0 1 6 0v6M5 10a2 2 0 0 0-2 2v4h18v-4a2 2 0 0 0-2-2M5 16v5M19 16v5"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [{ data: auth }] = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("last7");
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const buildFilterParams = () => {
    const now = new Date();
    if (filterType === "last7") {
      const end = new Date(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
    }
    if (filterType === "last30") {
      const end = new Date(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 29);
      return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
    }
    if (filterType === "last60") {
      const end = new Date(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 59);
      return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
    }
    if (filterType === "last90") {
      const end = new Date(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 89);
      return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
    }
    if (filterType === "date" && selectedDate) {
      return { start_date: selectedDate, end_date: selectedDate };
    }
    if (filterType === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      return {
        start_date: `${year}-${month}-01`,
        end_date: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    if (filterType === "year" && selectedYear) {
      return {
        start_date: `${selectedYear}-01-01`,
        end_date: `${selectedYear}-12-31`,
      };
    }
    if (filterType === "range" && rangeStart && rangeEnd) {
      return { start_date: rangeStart, end_date: rangeEnd };
    }
    return {};
  };

  const loadDashboard = useCallback(async (params = {}, options = { full: false }) => {
    if (options.full) setLoading(true);
    setError("");
    try {
      const response = await getDashboardSummary(params);
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't load the dashboard right now.");
    } finally {
      if (options.full) setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    const params = buildFilterParams();
    if (filterType === "range" && !(rangeStart && rangeEnd)) {
      return;
    }
    loadDashboard(params, { full: initialLoad });
  }, [filterType, selectedDate, selectedMonth, selectedYear, rangeStart, rangeEnd, loadDashboard, initialLoad]);

  const trendSubtitle = useMemo(() => {
    if (filterType === "last7") {
      return "Reservations over the last 7 days";
    }
    if (filterType === "last30") {
      return "Reservations over the last 30 days";
    }
    if (filterType === "last60") {
      return "Reservations over the last 60 days";
    }
    if (filterType === "last90") {
      return "Reservations over the last 90 days";
    }
    if (filterType === "date" && selectedDate) {
      return `Reservations for ${new Date(selectedDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`;
    }
    if (filterType === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      return `Reservations for ${new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
    }
    if (filterType === "year" && selectedYear) {
      return `Reservations for ${selectedYear}`;
    }
    if (filterType === "range" && rangeStart && rangeEnd) {
      const start = new Date(rangeStart).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
      const end = new Date(rangeEnd).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
      return `Reservations from ${start} to ${end}`;
    }
    return "Reservations over the last 7 days";
  }, [filterType, selectedDate, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const getRangeDays = useMemo(() => {
    if (filterType === "last7") return 7;
    if (filterType === "last30") return 30;
    if (filterType === "last60") return 60;
    if (filterType === "last90") return 90;
    if (filterType === "date") return 1;
    if (filterType === "month") {
      const [year, month] = selectedMonth.split("-");
      return new Date(Number(year), Number(month), 0).getDate();
    }
    if (filterType === "year") return 365;
    if (filterType === "range" && rangeStart && rangeEnd) {
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  }, [filterType, selectedMonth, rangeStart, rangeEnd]);

  const aggregationMode = useMemo(() => {
    if (filterType === "last60" || filterType === "last90") return "weekly";
    if (filterType === "range" && getRangeDays > 30) return "weekly";
    return "daily";
  }, [filterType, getRangeDays]);

  const aggregatedTrend = useMemo(() => {
    const raw = data?.trend || [];
    if (!raw.length) return [];
    if (aggregationMode === "daily") {
      return raw.map((item) => ({
        label: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        bookings: item.bookings,
      }));
    }

    const startDate = new Date(raw[0].date);
    startDate.setHours(0, 0, 0, 0);
    const buckets = [];
    raw.forEach((item) => {
      const current = new Date(item.date);
      current.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((current - startDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (!buckets[weekIndex]) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + weekIndex * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        buckets[weekIndex] = {
          periodStart: weekStart,
          periodEnd: weekEnd,
          bookings: 0,
        };
      }
      buckets[weekIndex].bookings += item.bookings;
    });

    return buckets.map((bucket) => {
      const lastTrendDate = new Date(data?.trend?.slice(-1)[0]?.date || bucket.periodStart);
      const labelEnd = bucket.periodEnd.getTime() > lastTrendDate.getTime() ? lastTrendDate : bucket.periodEnd;
      const labelStartText = bucket.periodStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const labelEndText = labelEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return {
        label: `${labelStartText} - ${labelEndText}`,
        bookings: bucket.bookings,
      };
    });
  }, [data, aggregationMode]);

  const maxBookings = useMemo(
    () => Math.max(1, ...(aggregatedTrend || []).map((item) => item.bookings)),
    [aggregatedTrend]
  );

  const handleViewReservationDetails = (reservation) => {
    const hotelId = reservation.hotel_id || reservation.hotel?.id;
    if (!hotelId) return;

    navigate(`/hotel/book-table/details/${hotelId}`, {
      state: {
        hotelData: reservation.hotel || { id: hotelId },
        isBooking: true,
        fromDashboard: true,
        reservationId: reservation.id,
      },
    });
  };

  if (loading) return <div className="dashboard-state"><span className="dashboard-loader"/><p>Preparing your dashboard…</p></div>;
  if (error) return <div className="dashboard-state dashboard-error"><h2>Dashboard unavailable</h2><p>{error}</p><button onClick={() => loadDashboard(buildFilterParams(), { full: true })}>Try again</button></div>;

  const totals = data?.totals || {};
  const cards = [
    { label: data?.isAdmin ? "Today's bookings" : "My bookings today", value: totals.todayBookings, icon: "booking", tone: "coral", note: `${data?.todayStatus?.pending || 0} awaiting confirmation` },
    { label: "Hotels", value: totals.hotels, icon: "hotel", tone: "purple", note: "Properties in your network" },
    { label: "Dining tables", value: totals.tables, icon: "table", tone: "blue", note: `${totals.seats || 0} seats in total` },
    { label: "Seat occupancy", value: `${totals.occupancyRate || 0}%`, icon: "seat", tone: "green", note: `${totals.occupiedSeats || 0} seats currently in use` },
  ];

  return <main className="dashboard-page">
    <header className="dashboard-header">
      <div><p className="eyebrow">OVERVIEW</p><h1>Good day, {auth?.details?.name?.split(" ")[0] || "Guest"}</h1><p>{data?.isAdmin ? "Here’s what’s happening across your restaurants today." : "Here’s a quick look at your booking activity."}</p></div>
      <button className="refresh-button" onClick={() => loadDashboard(buildFilterParams(), { full: true })} aria-label="Refresh dashboard">↻ <span>Refresh</span></button>
    </header>

    <section className="dashboard-filters">
      <div className="filter-row filter-action-row">
        <label htmlFor="filterType">Filter by</label>
        <select id="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last60">Last 60 days</option>
          <option value="last90">Last 90 days</option>
          <option value="date">Specific date</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="range">Date range</option>
        </select>
        <button
          className="filter-apply-button"
          type="button"
          onClick={() => loadDashboard(buildFilterParams())}
          disabled={
            filterType === "range"
              ? !(rangeStart && rangeEnd)
              : ["last7", "last30", "last60", "last90"].includes(filterType)
              ? false
              : (filterType === "date" && !selectedDate) || (filterType === "month" && !selectedMonth) || (filterType === "year" && !selectedYear)
          }
        >
          Apply
        </button>
      </div>

      <div className="filter-row filter-inputs">
        {filterType === "date" && (
          <label>
            Date
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </label>
        )}
        {filterType === "month" && (
          <label>
            Month
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </label>
        )}
        {filterType === "year" && (
          <label>
            Year
            <input type="number" min="2000" max="2100" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
          </label>
        )}
        {filterType === "range" && (
          <>
            <label>
              From
              <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
            </label>
          </>
        )}
      </div>
    </section>

    <section className="metric-grid" aria-label="Key metrics">
      {cards.map((card) => <article className={`metric-card ${card.tone}`} key={card.label}>
        <div className={`metric-icon ${card.tone}`}><Icon name={card.icon}/></div>
        <div><p>{card.label}</p><strong>{card.value ?? 0}</strong><small>{card.note}</small></div>
      </article>)}
    </section>

    <section className="dashboard-grid">
      <article className="dashboard-panel trend-panel">
        <div className="panel-heading"><div><h2>Booking trend</h2><p>{trendSubtitle}</p></div><span className="live-chip">{aggregationMode === "weekly" ? "WEEKLY" : "DAILY"}</span></div>
        <div className="bar-chart">
          {aggregatedTrend.map((item, index) => <div className="bar-column" key={`${item.label}-${index}`}>
            <span className="bar-value">{item.bookings}</span>
            <div className="bar-track"><div className="bar-fill" style={{height: `${Math.max(5, (item.bookings / maxBookings) * 100)}%`}}/></div>
            <span>{item.label}</span>
          </div>)}
        </div>
      </article>

      <article className="dashboard-panel status-panel">
        <div className="panel-heading"><div><h2>Today’s flow</h2><p>Reservation status at a glance</p></div></div>
        <div className="occupancy-chart-container">
          <div className="occupancy-ring" style={{"--progress": `${totals.occupancyRate || 0}%`}}><div><strong>{totals.occupancyRate || 0}%</strong><span>occupied</span></div></div>
          <div className="status-values-display">
            {Object.entries(data?.todayStatus || {}).map(([key, value]) => {
              return (
                <div key={key} className={`status-value-box ${key}`}>
                  <div className="status-dot-inline"></div>
                  <div className="status-info">
                    <span className="status-label">{key}</span>
                    <span className="status-count">{value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </section>

    <article className="dashboard-panel recent-panel">
      <div className="panel-heading"><div><h2>Recent reservations</h2><p>{data?.isAdmin ? "Latest activity across all hotels and dates" : "Your latest booking activity across all dates"}</p></div><div className="recent-heading-actions"><span className="table-count">{data?.recent?.length || 0} recent</span><button className="view-all-reservations" onClick={() => navigate("/hotel/booked-table")}>View all history <span>→</span></button></div></div>
      {!data?.recent?.length ? <div className="empty-reservations"><Icon name="booking"/><h3>No reservations yet</h3><p>New reservations will appear here.</p></div> :
      <div className="reservation-table"><table><thead><tr><th>Reservation</th><th>Hotel</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{data.recent.map((item) => { const meta = statusMeta[item.dining_status] || statusMeta[5]; const guests = (item.seat_status || []).reduce((sum, table) => sum + (table.seat_ids?.length || 0), 0); return <tr key={item.id}>
          <td><strong>#{String(item.id).padStart(4, "0")}</strong></td><td>{item.hotel?.hotel_name || "—"}</td><td>{new Date(item.dining_date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</td><td>{String(item.start_time || "—").slice(0,5)}</td><td>{guests || "—"}</td><td><span className={`status-badge ${meta.className}`}>{meta.label}</span></td><td><button className="view-detail-button" onClick={() => handleViewReservationDetails(item)}>View details</button></td>
        </tr>; })}</tbody></table></div>}
    </article>
  </main>;
};

export default Dashboard;
