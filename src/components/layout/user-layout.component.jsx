import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Fragment, useState, useEffect, useCallback } from "react";
import SideNav from "./sidenav/sidenav.component";
import { useGlobalContext } from "store/context/GlobalProvider";
import useAuth from "hooks/useAuth";

const UserLayout = () => {
  const [collapseNav, setCollapseNav] = useState(false);
  const { authState, dispatch } = useGlobalContext(); // using context instead of redux
  const [{ data }, { setAuth, getUserInfoData, logoutUser }] = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (token && !authState?.activeUser?.data) {
    dispatch({ type: "SET_AUTH", payload: token });
  }
  useEffect(() => {
    if (token !== "null" || token !== null) {
      getUserInfoData();
    } else {
      dispatch({ type: "SET_AUTH", payload: null });
      localStorage.setItem("token" , null);
      localStorage.setItem("userInfo" , null); 
    console.log("token",token);
    }
  }, [token, getUserInfoData, setAuth]);
  
  const refreshToken = useCallback(() => {
    // Logic to refresh the token
    console.log("Refreshing token...");
    // Example: Call an API to refresh the token and update localStorage and context
  }, []);

   useEffect(() => {
    const interval = setInterval(() => {
      const expiresOn = 1500000000; // Example expiry timestamp, replace with actual logic to get token expiry
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
  }, []);

  const tempChange = (status) => {
    setCollapseNav(status);
    return;
  };

  return (
    <Fragment>
      {/* <Header /> */}
      <div className={`layout-container ${collapseNav ? "" : "left-sidebar"}`}>
        <SideNav onChange={tempChange} />
        <div className="container">
          <Outlet />
        </div>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
};

export default UserLayout;
