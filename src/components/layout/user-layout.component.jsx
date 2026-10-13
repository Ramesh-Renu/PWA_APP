import { Outlet, useLocation } from "react-router-dom";
import { Fragment, useEffect } from "react";
import SideNav from "./sidenav/sidenav.component";
import ThemeToggle from "components/common/ThemeToggle";
import { useGlobalContext } from "store/context/GlobalProvider";
import useAuth from "hooks/useAuth";
import InstallAppBanner from "components/common/InstallApp";
import AppInstallsBadge from "components/common/AppInstallsBadge";
import { reportInstalledDevice } from "utils/pwaInstall";

const UserLayout = () => {
  const { dispatch } = useGlobalContext(); // using context instead of redux
  const [{ data }, { getUserInfoData, logoutUser }] = useAuth();
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Count this device for the admin install total whenever the installed
  // app opens (any page; at most once a day).
  useEffect(() => {
    if (token && token !== "null") reportInstalledDevice();
  }, [token]);

  useEffect(() => {
    if (token && token !== "null" && !data?.accessToken) {
      dispatch({ type: "SET_AUTH", payload: token });
    }
  }, [token, data?.accessToken, dispatch]);
  
  useEffect(() => {
    if (token && token !== "null") {
      getUserInfoData();
    } else {  
      dispatch({ type: "SET_AUTH", payload: null });
      localStorage.setItem("token", null);
      localStorage.setItem("userInfo", null);
    }
  }, [token, getUserInfoData, dispatch]);

  return (
    <Fragment>
      {/* <Header /> */}
      <div className="app-shell">
        <SideNav />
        <main className="app-shell__main">
          {/* <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "1rem 0",
            }}
          >
            <ThemeToggle />
          </div> */}
          {/* Admins: how many users installed the app, at the top of every page. */}
          {data?.details?.role === "Admin" && (
            <div className="admin-installs-bar">
              <AppInstallsBadge />
            </div>
          )}
          {/* Install hint only on the home page (Dashboard for admins, Book a
              table for customers); hidden once installed. */}
          {location.pathname === (data?.details?.role === "Admin" ? "/dashboard" : "/book-table") && (
            <InstallAppBanner />
          )}
          <Outlet />
        </main>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
};

export default UserLayout;
