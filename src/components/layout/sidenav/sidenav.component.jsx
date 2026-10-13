import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ApartmentOutlined,
  CategoryOutlined,
  CleaningServicesOutlined,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  EventNoteOutlined,
  EventSeatOutlined,
  LocalFireDepartmentOutlined,
  LocationCityOutlined,
  PaymentsOutlined,
  LogoutRounded,
  MenuRounded,
  PlaceOutlined,
  ReceiptLongOutlined,
  RestaurantMenuOutlined,
  RoomServiceOutlined,
  SettingsOutlined,
  SoupKitchenOutlined,
  SpaceDashboardOutlined,
  StorefrontOutlined,
  TableRestaurantRounded,
  UnfoldMoreRounded,
} from "@mui/icons-material";
import LogoAvatarShowLetter from "components/common/LogoAvatarShowLetter";
import useAuth from "hooks/useAuth";
import { useGlobalContext } from "store/context/GlobalProvider";

const SIDEBAR_WIDTH = 248;
const SIDEBAR_COLLAPSED_WIDTH = 76;
const COLLAPSE_KEY = "sidebarCollapsed";

const ADMIN_LINKS = [
  { label: "Dashboard", to: "/dashboard", icon: SpaceDashboardOutlined, match: /^\/dashboard/ },
  { label: "Hotels", to: "/hotellist", icon: ApartmentOutlined, match: /^\/(hotellist|details\/)/ },
  { label: "Reservations", to: "/booked-table", icon: EventNoteOutlined, match: /^\/booked-table/ },
  { label: "Orders", to: "/orders", icon: ReceiptLongOutlined, match: /^\/orders/ },
];

// Admin master data, opened from the "Settings" item as a pop-up menu.
const SETTINGS_GROUP = {
  label: "Settings",
  to: "/settings",
  match: /^\/(settings|menu-categories)(\/|$)/,
  children: [
    { label: "Menu categories", to: "/settings/menu-categories", icon: CategoryOutlined, match: /^\/(settings\/menu-categories|menu-categories)/ },
    { label: "Cooks", to: "/settings/cooks", icon: SoupKitchenOutlined, match: /^\/settings\/cooks/ },
    { label: "Servers", to: "/settings/servers", icon: RoomServiceOutlined, match: /^\/settings\/servers/ },
    { label: "Cleaners", to: "/settings/cleaners", icon: CleaningServicesOutlined, match: /^\/settings\/cleaners/ },
    { label: "Locations", to: "/settings/masters/locations", icon: LocationCityOutlined, match: /^\/settings\/masters\/locations/ },
    { label: "Areas", to: "/settings/areas", icon: PlaceOutlined, match: /^\/settings\/areas/ },
    { label: "Spice levels", to: "/settings/masters/spice-levels", icon: LocalFireDepartmentOutlined, match: /^\/settings\/masters\/spice-levels/ },
    { label: "Dining status", to: "/settings/masters/dining-status", icon: EventNoteOutlined, match: /^\/settings\/masters\/dining-status/ },
    { label: "Order status", to: "/settings/masters/order-status", icon: ReceiptLongOutlined, match: /^\/settings\/masters\/order-status/ },
    { label: "Payment status", to: "/settings/masters/payment-status", icon: PaymentsOutlined, match: /^\/settings\/masters\/payment-status/ },
    { label: "Seat status", to: "/settings/masters/seat-status", icon: EventSeatOutlined, match: /^\/settings\/masters\/seat-status/ },
  ],
};

// Customers' sections are tabs of /book-table (see pages/BookTables).
const CUSTOMER_LINKS = [
  { label: "Book a table", to: "/book-table", icon: StorefrontOutlined, tab: null },
  { label: "Menu", to: "/book-table?tab=menu", icon: RestaurantMenuOutlined, tab: "menu" },
  { label: "My bookings", to: "/book-table?tab=reservations", icon: EventNoteOutlined, tab: "reservations" },
  { label: "My orders", to: "/book-table?tab=orders", icon: ReceiptLongOutlined, tab: "orders" },
];

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Pop-up menu shown beside a sidebar button. Rendered into <body> because the
 * mobile drawer is transformed (which would trap position: fixed). `align`
 * "top" lines its top up with the button, "bottom" its bottom.
 */
const SidebarFlyout = ({ anchorRef, open, onClose, align = "top", label, children }) => {
  const panelRef = useRef(null);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const width = panel.offsetWidth;
      const left = Math.max(8, Math.min(anchor.right + 8, window.innerWidth - width - 8));
      setStyle(
        align === "bottom"
          ? { left, bottom: Math.max(8, window.innerHeight - anchor.bottom) }
          : { left, top: Math.max(8, Math.min(anchor.top, window.innerHeight - panel.offsetHeight - 8)) },
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (
        !panelRef.current?.contains(event.target) &&
        !anchorRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={panelRef}
      className="app-flyout"
      role="menu"
      aria-label={label}
      // Hidden until measured, so it never flashes in the wrong place.
      style={style || { visibility: "hidden", left: 0, top: 0 }}
    >
      {children}
    </div>,
    document.body,
  );
};

/**
 * App navigation. Desktop: fixed left sidebar (collapsible to an icon rail).
 * Below 1024px: a slim top bar whose menu button opens the sidebar as a
 * drawer. Publishes --app-sidebar-width and --app-topnav-height so pages can
 * size fixed/sticky elements around it.
 */
const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [{ data: auth }] = useAuth();
  const { dispatch } = useGlobalContext();
  const isAdmin = auth?.details?.role === "Admin";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const topbarRef = useRef(null);
  const settingsRef = useRef(null);
  const accountRef = useRef(null);
  const inSettings = SETTINGS_GROUP.match.test(location.pathname);

  const userName = auth?.details?.name || "User";
  const userRole = auth?.details?.role;
  const userPhone = auth?.details?.mobilenumber;

  // Sidebar width for the main column and centred fixed elements.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--app-sidebar-width",
      `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
    );
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage unavailable (private mode); the choice just isn't remembered.
    }
  }, [collapsed]);

  // Height of the mobile top bar (0 on desktop, where it is hidden) so sticky
  // page toolbars sit right below it.
  useEffect(() => {
    const bar = topbarRef.current;
    if (!bar || typeof ResizeObserver === "undefined") return undefined;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--app-topnav-height", `${bar.offsetHeight}px`);
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--app-topnav-height");
    };
  }, []);

  // Close the drawer and pop-ups on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setSettingsMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !settingsMenuOpen && !accountMenuOpen) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("app-drawer-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("app-drawer-open");
    };
  }, [drawerOpen, settingsMenuOpen, accountMenuOpen]);

  const userLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    dispatch({ type: "LOGOUT" });
    navigate("/", { replace: true });
  };

  // On a hotel page the active section is the one it was opened from.
  const fromSearch = location.state?.from?.path?.split("?")[1] || "";
  const currentTab =
    new URLSearchParams(location.search).get("tab") ||
    new URLSearchParams(fromSearch).get("tab");
  const isActive = (link) =>
    isAdmin
      ? link.match.test(location.pathname)
      : location.pathname.startsWith("/book-table") &&
        (link.tab ? currentTab === link.tab : !currentTab);

  const links = isAdmin ? ADMIN_LINKS : CUSTOMER_LINKS;
  const homePath = isAdmin ? "/dashboard" : "/book-table";

  const renderAvatar = () =>
    auth?.details?.name ? (
      <LogoAvatarShowLetter
        genaralData={auth.details}
        profilePhotoName="photo"
        profileName="name"
        outerClassName="app-sidebar__avatar"
        innerClassName="user-icon-photo"
      />
    ) : (
      <span className="app-sidebar__avatar">U</span>
    );

  return (
    <>
      {/* Mobile / tablet top bar */}
      <header className="app-topbar" ref={topbarRef}>
        <button
          type="button"
          className="app-topbar__menu"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
        >
          <MenuRounded />
        </button>
        <NavLink to={homePath} className="app-brand">
          <span className="app-brand__mark" aria-hidden>
            <TableRestaurantRounded fontSize="small" />
          </span>
          <span className="app-brand__name">Table Booking</span>
        </NavLink>
        <span className="app-topbar__avatar" title={userName}>
          {renderAvatar()}
        </span>
      </header>

      {drawerOpen && (
        <div
          className="app-sidebar__backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      <aside
        id="app-sidebar"
        className={`app-sidebar${collapsed ? " is-collapsed" : ""}${drawerOpen ? " is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="app-sidebar__head">
          <NavLink to={homePath} className="app-brand" title="Table Booking">
            <span className="app-brand__mark" aria-hidden>
              <TableRestaurantRounded fontSize="small" />
            </span>
            <span className="app-brand__name">Table Booking</span>
          </NavLink>
          <button
            type="button"
            className="app-sidebar__close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <CloseRounded />
          </button>
        </div>

        <nav className="app-sidebar__nav">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link);
            return (
              <NavLink
                key={link.label}
                to={link.to}
                className={() => `app-sidebar__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={collapsed ? link.label : undefined}
              >
                <Icon aria-hidden />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <button
              ref={settingsRef}
              type="button"
              className={`app-sidebar__link${inSettings || settingsMenuOpen ? " is-active" : ""}`}
              onClick={() => setSettingsMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={settingsMenuOpen}
              title={collapsed ? SETTINGS_GROUP.label : undefined}
            >
              <SettingsOutlined aria-hidden />
              <span>{SETTINGS_GROUP.label}</span>
              <ChevronRightRounded className="app-sidebar__link-more" aria-hidden />
            </button>
          )}
        </nav>

        <div className="app-sidebar__foot">
          <button
            ref={accountRef}
            type="button"
            className={`app-sidebar__user${accountMenuOpen ? " is-open" : ""}`}
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            title={collapsed ? userName : undefined}
          >
            {renderAvatar()}
            <span className="app-sidebar__user-copy">
              <strong>{userName}</strong>
              {userRole && <small>{userRole}</small>}
            </span>
            <UnfoldMoreRounded className="app-sidebar__user-more" aria-hidden />
          </button>
          <button
            type="button"
            className="app-sidebar__collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeftRounded aria-hidden />
          </button>
        </div>
      </aside>

      {isAdmin && (
        <SidebarFlyout
          anchorRef={settingsRef}
          open={settingsMenuOpen}
          onClose={() => setSettingsMenuOpen(false)}
          label="Settings"
        >
          <div className="app-flyout__head">
            <strong>Settings</strong>
            <small>Master data</small>
          </div>
          {SETTINGS_GROUP.children.map((link) => {
            const Icon = link.icon;
            const active = link.match.test(location.pathname);
            return (
              <NavLink
                key={link.label}
                to={link.to}
                role="menuitem"
                className={() => `app-flyout__item${active ? " is-active" : ""}`}
              >
                <Icon aria-hidden />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
          <div className="app-flyout__divider" />
          <NavLink
            to={SETTINGS_GROUP.to}
            role="menuitem"
            end
            className={() =>
              `app-flyout__item app-flyout__item--muted${location.pathname === "/settings" ? " is-active" : ""}`
            }
          >
            <SettingsOutlined aria-hidden />
            <span>All settings</span>
          </NavLink>
        </SidebarFlyout>
      )}

      <SidebarFlyout
        anchorRef={accountRef}
        open={accountMenuOpen}
        onClose={() => setAccountMenuOpen(false)}
        align="bottom"
        label="Account"
      >
        <div className="app-flyout__account">
          {renderAvatar()}
          <div>
            <strong>{userName}</strong>
            {userRole && <small>{userRole}</small>}
            {userPhone && <small>{userPhone}</small>}
          </div>
        </div>
        <div className="app-flyout__divider" />
        <button
          type="button"
          role="menuitem"
          className="app-flyout__item app-flyout__item--danger"
          onClick={userLogout}
        >
          <LogoutRounded aria-hidden />
          <span>Logout</span>
        </button>
      </SidebarFlyout>
    </>
  );
};

export default SideNav;
