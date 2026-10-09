import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import LogoAvatarShowLetter from "components/common/LogoAvatarShowLetter";
import useAuth from "hooks/useAuth";
import { useGlobalContext } from "store/context/GlobalProvider";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { FiChevronDown, FiLogOut } from "react-icons/fi";

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [{ data: auth }] = useAuth();
  const { dispatch } = useGlobalContext();
  const isAdmin = auth?.details?.role === "Admin";
  const hideNavItems = location.pathname.startsWith("/book-table");

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const userName = auth?.details?.name || "User";
  const userSubtitle = [auth?.details?.role, auth?.details?.mobilenumber]
    .filter(Boolean)
    .join(" · ");

  const userLogout = () => {
    console.log("logout");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    dispatch({ type: "LOGOUT" });
    navigate("/", { replace: true });
  };

  const navItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      match: "dashboard",
    },
    ...(isAdmin
      ? [
          {
            label: "Hotels",
            to: "/hotellist",
            match: "hotel/create|hotel/details",
          },
          {
            label: "Menu Categories",
            to: "/settings/menu-categories",
            match: "settings|menu-categories",
          },
        ]
      : []),

    {
      label: "Reservations",
      to: "/booked-table",
      match: "booked-table",
    },
    ...(isAdmin
      ? [
          {
            label: "Orders",
            to: "/orders",
            match: "^/orders",
          },
        ]
      : []),

  ];

  return (
    <header className="app-topnav">
      <button
        type="button"
        className="app-topnav__menu-button"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
      </button>

      <NavLink to="/dashboard" className="app-topnav__brand">
        Table Booking
      </NavLink>

      {isAdmin && (
        <nav className={`app-topnav__links ${mobileOpen ? "is-open" : ""}`}>
          {navItems.map((item) => {
            const manuallyActive = new RegExp(item.match).test(location.pathname);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={() =>
                  `app-topnav__link ${manuallyActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      )}

      <div className="app-topnav__actions">
        <div className="app-topnav__account" ref={userMenuRef}>
          <button
            type="button"
            className="app-topnav__user"
            onClick={() => setUserMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label={`Account menu for ${userName}`}
            title={userName}
          >
            {auth?.details?.name ? (
              <LogoAvatarShowLetter
                genaralData={auth.details}
                profilePhotoName="photo"
                profileName="name"
                outerClassName="app-topnav__avatar"
                innerClassName="user-icon-photo"
              />
            ) : (
              <span className="app-topnav__avatar fallback">U</span>
            )}
            <span className="app-topnav__user-copy">{userName}</span>
            <FiChevronDown className="app-topnav__caret" aria-hidden />
          </button>

          {userMenuOpen && (
            <div className="app-topnav__dropdown" role="menu">
              <div className="app-topnav__dropdown-head">
                <strong>{userName}</strong>
                {userSubtitle && <span>{userSubtitle}</span>}
              </div>
              <button
                type="button"
                role="menuitem"
                className="app-topnav__dropdown-item is-danger"
                onClick={userLogout}
              >
                <FiLogOut aria-hidden /> Logout
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="app-topnav__logout"
          onClick={userLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default SideNav;
