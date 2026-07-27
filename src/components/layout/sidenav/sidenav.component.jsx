import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import LogoAvatarShowLetter from "components/common/LogoAvatarShowLetter";
import useAuth from "hooks/useAuth";
import { useGlobalContext } from "store/context/GlobalProvider";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [{ data: auth }] = useAuth();
  const { dispatch } = useGlobalContext();
  const isAdmin = auth?.details?.role === "Admin";

  useEffect(() => setMobileOpen(false), [location.pathname]);

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
    {
      label: "Book a table",
      to: "/book-table",
      match: "book-table",
    },
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
        Table Bokking
      </NavLink>

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

      <div className="app-topnav__actions">
        <div className="app-topnav__user">
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
          <span className="app-topnav__user-copy">
            {auth?.details?.name || "User"}
          </span>
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
