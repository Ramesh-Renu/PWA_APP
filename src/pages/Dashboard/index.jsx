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

  const maxBookings = useMemo(
    () => Math.max(1, ...(data?.trend || []).map((item) => item.bookings)),
    [data]
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
          <option value="date">Specific date</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="range">Date range</option>
        </select>
        <button
          className="filter-apply-button"
          type="button"
          onClick={() => loadDashboard(buildFilterParams())}
          disabled={filterType === "range" ? !(rangeStart && rangeEnd) : filterType !== "last7" && !((filterType === "date" && selectedDate) || (filterType === "month" && selectedMonth) || (filterType === "year" && selectedYear))}
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
        <div className="panel-heading"><div><h2>Booking trend</h2><p>{trendSubtitle}</p></div><span className="live-chip">{filterType === "last7" ? "7 DAYS" : "FILTERED"}</span></div>
        <div className="bar-chart">
          {(data?.trend || []).map((item) => <div className="bar-column" key={item.date}>
            <span className="bar-value">{item.bookings}</span>
            <div className="bar-track"><div className="bar-fill" style={{height: `${Math.max(5, (item.bookings / maxBookings) * 100)}%`}}/></div>
            <span>{new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
          </div>)}
        </div>
      </article>

      <article className="dashboard-panel status-panel">
        <div className="panel-heading"><div><h2>Today’s flow</h2><p>Reservation status at a glance</p></div></div>
        <div className="occupancy-ring" style={{"--progress": `${totals.occupancyRate || 0}%`}}><div><strong>{totals.occupancyRate || 0}%</strong><span>occupied</span></div></div>
        <div className="status-list">
          {Object.entries(data?.todayStatus || {}).map(([key, value]) => <div key={key}><span className={`status-dot ${key}`}/><span>{key}</span><strong>{value}</strong></div>)}
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
