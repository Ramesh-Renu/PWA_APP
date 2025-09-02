import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Fragment, useState, useEffect } from "react";
// import Header from "./header/header.component";
// import SideNav from "./sidenav/sidenav.component";
// import useAuth from "hooks/useAuth";

const UserLayout = () => {
  const [collapseNav, setCollapseNav] = useState(false);
  // const [{ data }, { setAuth, getUserInfoData }] = useAuth();
  const location = useLocation();

  return (
    <Fragment>
      {/* <Header /> */}
      <div className={`layout-container ${collapseNav ? "" : "left-sidebar"}`}>
        {/* <SideNav onChange={tempChange} /> */}
        <div className="container">
          <Outlet />
        </div>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
};

export default UserLayout;
