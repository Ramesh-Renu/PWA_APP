import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { NotificationsOutlined, HourglassEmptyOutlined } from "@mui/icons-material";
import { getNotificationHistory } from "utils/reminders";

const NotificationsPage = () => {
  const notifications = useMemo(() => getNotificationHistory(), []);

  return (
    <section className="ui-page">
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Updates</span>
          <h1>Notifications</h1>
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="ui-empty">
          <NotificationsOutlined fontSize="large" />
          <h3>No notifications yet</h3>
          <p>Booking reminders and reservation alerts will appear here.</p>
          <Link to="/book-table?tab=reservations" className="ui-btn ui-btn--primary ui-btn--sm">
            View bookings
          </Link>
        </div>
      ) : (
        <div className="cx-section" style={{ gap: 12 }}>
          {notifications.map((item) => (
            <article key={item.id} className="cx-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    className="ui-guest-profile__avatar"
                    style={{ width: 32, height: 32, fontSize: 12 }}
                    aria-hidden
                  >
                    {item.title?.charAt(0)?.toUpperCase() || "N"}
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: 16 }}>{item.title}</strong>
                    <small style={{ color: "#5b6078" }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
                <span className="ui-kicker" style={{ color: item.variant === "danger" ? "#dc2626" : "#0f766e" }}>
                  {item.variant || "info"}
                </span>
              </div>

              <p style={{ margin: 0, color: "#5b6078", lineHeight: 1.6 }}>{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationsPage;
