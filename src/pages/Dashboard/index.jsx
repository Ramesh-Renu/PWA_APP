import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "services";
import useAuth from "hooks/useAuth";

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
  const [{ data: auth }] = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDashboardSummary();
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't load the dashboard right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const maxBookings = useMemo(
    () => Math.max(1, ...(data?.trend || []).map((item) => item.bookings)),
    [data]
  );

  if (loading) return <div className="dashboard-state"><span className="dashboard-loader"/><p>Preparing your dashboard…</p></div>;
  if (error) return <div className="dashboard-state dashboard-error"><h2>Dashboard unavailable</h2><p>{error}</p><button onClick={loadDashboard}>Try again</button></div>;

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
      <button className="refresh-button" onClick={loadDashboard} aria-label="Refresh dashboard">↻ <span>Refresh</span></button>
    </header>

    <section className="metric-grid" aria-label="Key metrics">
      {cards.map((card) => <article className={`metric-card ${card.tone}`} key={card.label}>
        <div className={`metric-icon ${card.tone}`}><Icon name={card.icon}/></div>
        <div><p>{card.label}</p><strong>{card.value ?? 0}</strong><small>{card.note}</small></div>
      </article>)}
    </section>

    <section className="dashboard-grid">
      <article className="dashboard-panel trend-panel">
        <div className="panel-heading"><div><h2>Booking trend</h2><p>Reservations over the last 7 days</p></div><span className="live-chip">7 DAYS</span></div>
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
      <div className="panel-heading"><div><h2>Recent reservations</h2><p>{data?.isAdmin ? "Latest activity across all hotels and dates" : "Your latest booking activity across all dates"}</p></div><span className="table-count">{data?.recent?.length || 0} records</span></div>
      {!data?.recent?.length ? <div className="empty-reservations"><Icon name="booking"/><h3>No reservations yet</h3><p>New reservations will appear here.</p></div> :
      <div className="reservation-table"><table><thead><tr><th>Reservation</th><th>Hotel</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th></tr></thead>
        <tbody>{data.recent.map((item) => { const meta = statusMeta[item.dining_status] || statusMeta[5]; const guests = (item.seat_status || []).reduce((sum, table) => sum + (table.seat_ids?.length || 0), 0); return <tr key={item.id}>
          <td><strong>#{String(item.id).padStart(4, "0")}</strong></td><td>{item.hotel?.hotel_name || "—"}</td><td>{new Date(item.dining_date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</td><td>{String(item.start_time || "—").slice(0,5)}</td><td>{guests || "—"}</td><td><span className={`status-badge ${meta.className}`}>{meta.label}</span></td>
        </tr>; })}</tbody></table></div>}
    </article>
  </main>;
};

export default Dashboard;
