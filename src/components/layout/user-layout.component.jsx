import { Outlet } from "react-router-dom";
import { Fragment, useEffect, useCallback } from "react";
import SideNav from "./sidenav/sidenav.component";
import ThemeToggle from "components/common/ThemeToggle";
import { useGlobalContext } from "store/context/GlobalProvider";
import useAuth from "hooks/useAuth";
import { getRefreshTocken } from "services";

const UserLayout = () => {
  const { dispatch } = useGlobalContext(); // using context instead of redux
  const [{ data }, { getUserInfoData, logoutUser }] = useAuth();
  const token = localStorage.getItem("token");
  const refreshTokenValue = localStorage.getItem("refreshToken");

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

  const refreshToken = useCallback(() => {
    // Logic to refresh the token
    try {
      const res = getRefreshTocken({
        refreshToken: refreshTokenValue,
      });
      res.then((response) => {
        if (response?.accessToken) {
          localStorage.setItem("token", response?.accessToken);
          localStorage.setItem("refreshToken", response?.refreshToken);
          dispatch({ type: "SET_AUTH", payload: response?.accessToken });
        }
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
    // Example: Call an API to refresh the token and update localStorage and context
  }, [refreshTokenValue, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresOn = 1400000000; // Example expiry timestamp, replace with actual logic to get token expiry
      if (expiresOn) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (expiresOn - currentTime < 300) {
          // Refresh token if less than 5 minutes remaining
          refreshToken();
        }
      } else {
        logoutUser();
      }
    }, 60000); // Check every 1 minute

    return () => clearInterval(interval);
  }, [refreshToken, logoutUser]);

  return (
    <Fragment>
      {/* <Header /> */}
      <div className="layout-container app-topnav-layout">
        <SideNav />
        <div className="container layout-page">
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
          <Outlet />
        </div>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
};

export default UserLayout;
