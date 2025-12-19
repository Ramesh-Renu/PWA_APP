import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Fragment, useState, useEffect, useCallback } from "react";
import SideNav from "./sidenav/sidenav.component";
import { useGlobalContext } from "store/context/GlobalProvider";
// import useAuth from "hooks/useAuth";

const UserLayout = () => {
  const [collapseNav, setCollapseNav] = useState(false);
  const { authState, dispatch } = useGlobalContext(); // using context instead of redux
  // const [{ data }, { setAuth, getUserInfoData }] = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (token && !authState?.activeUser?.data) {
    dispatch({ type: "SET_AUTH", payload: token });
  }

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
