import {  Outlet } from "react-router-dom";

const HomePage = () => {

  return  <>
      <Outlet />   {/* 🔥 REQUIRED */}
    </>;
};

export default HomePage;
