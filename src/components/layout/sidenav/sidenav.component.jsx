import { useEffect, useState } from "react";
import { appIcon } from "assets/images";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as menu from "assets/images";
import LogoAvatarShowLetter from "components/common/LogoAvatarShowLetter";
import useAuth from "hooks/useAuth";
import { useGlobalContext } from "store/context/GlobalProvider";

const SideNav = ({ onChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [{ data: auth }] = useAuth();
  const { dispatch } = useGlobalContext();
  const isAdmin = auth?.details?.role === "Admin";

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const toggleSidebar = () => {
    setExpanded((current) => {
      onChange(current);
      return !current;
    });
  };

  const userLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", to: "hotel/dashboard", icon: menu.dashboardIcon, activeIcon: menu.dashboardIconActive, match: "dashboard" },
    ...(isAdmin ? [{ label: "Hotels", to: "hotel/create", icon: menu.hotelCreate, activeIcon: menu.hotelCreateActive, match: "hotel/create|hotel/details" }] : []),
    { label: "Reservations", to: "hotel/booked-table", icon: menu.tableBookedList, activeIcon: menu.tableBookedListActive, match: "booked-table" },
    { label: "Book a table", to: "hotel/book-table", icon: menu.tablesIcon, activeIcon: menu.tablesIconActive, match: "book-table" },
  ];

  return <>
    <button className="mobile-nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
      <span/><span/><span/>
    </button>
    {mobileOpen && <button className="sidenav-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`sidenav-content modern-sidenav ${expanded ? "expanded" : "compact"} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidenav-brand">
        <div className="brand-mark"><img src={appIcon} alt="Table booking"/></div>
        {expanded && <div className="brand-copy"><strong>TableFlow</strong><span>Hotel workspace</span></div>}
      </div>

      <div className="sidenav-scroll">
        {expanded && <p className="nav-section-label">Workspace</p>}
        <nav className="modern-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const manuallyActive = new RegExp(item.match).test(location.pathname);
            return <NavLink key={item.label} to={item.to} title={!expanded ? item.label : undefined} className={() => `modern-nav-link ${manuallyActive ? "active" : ""}`}>
              <span className="nav-icon"><img src={manuallyActive ? item.activeIcon : item.icon} alt=""/></span>
              {expanded && <span className="nav-label">{item.label}</span>}
              {expanded && manuallyActive && <span className="active-dot"/>}
            </NavLink>;
          })}
        </nav>

        {expanded && <div className="sidebar-insight">
          <span className="insight-icon">✦</span>
          <div><strong>Ready for service</strong><p>Manage today’s bookings from your dashboard.</p></div>
        </div>}
      </div>

      <div className="sidenav-footer">
        {expanded && <div className="system-status"><span/> All systems operational</div>}
        <div className="sidebar-user">
          {auth?.details?.name ? <LogoAvatarShowLetter genaralData={auth.details} profilePhotoName="photo" profileName="name" outerClassName="sidebar-avatar" innerClassName="user-icon-photo"/> : <span className="sidebar-avatar fallback">U</span>}
          {expanded && <div className="sidebar-user-copy"><strong title={auth?.details?.name}>{auth?.details?.name || "User"}</strong><span>{auth?.details?.role || "Guest"}</span></div>}
          <button className="sidebar-logout" onClick={userLogout} title="Log out" aria-label="Log out">
            <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4"/></svg>
          </button>
        </div>
      </div>

      <button className="sidebar-collapse" onClick={toggleSidebar} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}>
        <svg viewBox="0 0 24 24"><path d={expanded ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}/></svg>
      </button>
    </aside>
  </>;
};

export default SideNav;
