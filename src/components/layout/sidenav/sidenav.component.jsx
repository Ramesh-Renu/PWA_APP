import { useEffect, useRef, useState } from "react";
import { appIcon } from "assets/images";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as menu from "assets/images";
import packageJson from "./../../../../package.json";
import LogoAvatarShowLetter from "components/common/LogoAvatarShowLetter";
import useAuth from "hooks/useAuth";
import { useGlobalContext } from "store/context/GlobalProvider";

const SideNav = ({ onChange }) => {
  const navigate = useNavigate();
  const [collaps, setCollaps] = useState(true);
  const [{ data: auth }, { setAuth }] = useAuth();
  const popupRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const { authState, dispatch } = useGlobalContext();

  /** INITIAL CALL */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        ((popupRef.current && !popupRef.current.contains(event.target)) ||
          popupRef.current == null) &&
        event.target.id !== "show_more_boards"
      ) {
        setShowInfo(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  /** HANDLE SHOW/HIDE MENU ITEM BASED ON USER CLICK */
  const handleMenuItem = (e) => {
    const showPopup = showInfo ? !showInfo : true;
    if (e.type === "click" || e.key === "Enter") {
      setShowInfo(showPopup);
    }
  };

  /** CLEARS TOKEN & LOGOUT USER */
  const userLogout = () => {
    setShowInfo(false);
    navigate("/");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    dispatch({ type: "LOGOUT" });
  };

  // const handleMouseEnter = () => {
  //   if (!collaps) {
  //     setCollaps(true);
  //     onChange(true);
  //   }
  // };

  // const handleMouseLeave = () => {
  //   if (collaps) {
  //     setCollaps(false);
  //     onChange(false);
  //   }
  // };

  const toggleDropdown = (key) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <>
      <div
        className={`sidenav-content ${collaps ? "expanded" : ""}`}
        // onMouseEnter={handleMouseEnter}
        // onMouseLeave={handleMouseLeave}
      >
        <>
          <div className="sidenav-content__headings">
            <div className={`header-content__logo ${collaps ? "collaps" : ""}`}>
              <img
                src={collaps ? appIcon : appIcon}
                alt="app-logo"
                className={!collaps ? "appLogo" : ""}
              />
            </div>

            <div
              className={
                !collaps
                  ? "sidenav-content__headings-lists collaps"
                  : "sidenav-content__headings-lists"
              }
            >
              {auth?.details?.role === "Admin" && (
                <>
                  {/* Dashboard */}
                  <h5
                    className="sidenav-content__headings-lists--title"
                    title="Dashboard"
                  >
                    <NavLink to="/dashboard" className="link-tag">
                      {({ isActive, isPending }) => (
                        <>
                          <img
                            src={
                              isActive
                                ? menu.dashboardIconActive
                                : menu.dashboardIcon
                            }
                            alt="icon"
                          />
                          {collaps && "Dashboard"}
                        </>
                      )}
                    </NavLink>
                  </h5>

                  {/* Create Hotel */}
                  <h5
                    className="sidenav-content__headings-lists--title"
                    title="Dashboard"
                  >
                    <NavLink to="/create-hotel" className="link-tag">
                      {({ isActive, isPending }) => (
                        <>
                          <img
                            src={
                              isActive
                                ? menu.hotelCreateActive
                                : menu.hotelCreate
                            }
                            alt="icon"
                          />
                          {collaps && "Hotels"}
                        </>
                      )}
                    </NavLink>
                  </h5>
                </>
              )}
              {/* Book Table */}
              <h5
                className="sidenav-content__headings-lists--title"
                title="Dashboard"
              >
                <NavLink to="/book-table" className={({ isActive }) =>
                      `link-tag ${isActive || location.pathname.includes("/hotel") ? "active" : ""}`
                    }>
                  {({ isActive, isPending }) => (
                    <>
                      <img
                        src={isActive || location.pathname.includes("/hotel") ? menu.tablesIconActive : menu.tablesIcon}
                        alt="icon"
                      />
                      {collaps && "Book Table"}
                    </>
                  )}
                </NavLink>
              </h5>
            </div>
          </div>

          <div
            className={!collaps ? "others__options collaps" : "others__options"}
          >
            <div className="header-user-info" ref={popupRef}>
              <div className="user-info" onClick={handleMenuItem}>
                {auth?.details?.name && (
                  <LogoAvatarShowLetter
                    genaralData={auth.details}
                    profilePhotoName={"photo"}
                    profileName={"name"}
                    outerClassName={"user-info__profile-pic"}
                    innerClassName={"user-icon-photo"}
                  ></LogoAvatarShowLetter>
                )}
                {collaps && (
                  <div
                    className={`user-info__details ${
                      auth.details?.name ? auth.details?.name : "none"
                    }`}
                  >
                    <p className="user-info__details-welcome-back">
                      Welcome back{" "}
                    </p>
                    <p
                      className="user-info__details-name"
                      title={auth.details?.name || "User Name"}
                    >
                      {auth.details?.name || "User Name"}
                    </p>
                    <p className="user-info__details-role" title={"Guest"}>
                      {auth.details?.role || "Gust"}
                    </p>
                  </div>
                )}
              </div>
              {showInfo && (
                <div className="user-info__popup">
                  <div className="user-info__popup-profile">
                    <p>
                      <button
                        className="user-info__popup-logout-btn"
                        onClick={userLogout}
                      >
                        {"Logout"}
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* <p className="version-info">
              {collaps ? "Version " : "v"}
              {packageJson.version}
            </p> */}
          </div>
        </>
      </div>
    </>
  );
};

export default SideNav;
