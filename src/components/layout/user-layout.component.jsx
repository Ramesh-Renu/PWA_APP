import { Outlet } from "react-router-dom";
import { Fragment, useEffect } from "react";
import SideNav from "./sidenav/sidenav.component";
import ThemeToggle from "components/common/ThemeToggle";
import { useGlobalContext } from "store/context/GlobalProvider";
import useAuth from "hooks/useAuth";

const UserLayout = () => {
  const { dispatch } = useGlobalContext(); // using context instead of redux
  const [{ data }, { getUserInfoData, logoutUser }] = useAuth();
  const token = localStorage.getItem("token");

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
