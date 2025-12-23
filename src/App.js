import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Spinner from "components/spinner/spinner.component";
import "styles/index.scss";

/** LAYOUTS */
const UserLayout = lazy(() =>
  import("components/layout/user-layout.component")
);

/** PAGES */
const Login = lazy(() => import("pages/Login/Login"));

// Order Orion Pages

const Home = lazy(() => import("pages/HomePage"));
const CreateHotel = lazy(() => import("pages/Hotel/CreateHotel"));
const CreateTables = lazy(() => import("pages/Tables/CreateTables"));
const NotFound = lazy(() => import("pages/NotFound/NotFound"));

const App = () => {
  const [hasOrdersAccess, setHasOrdersAccess] = useState(false);
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* HEADER WITH SIDE MENU LAYOUT */}
        <Route
          path="/"
          element={<UserLayout hasOrdersAccess={hasOrdersAccess} />}
        >
          <Route path="/dashboard" element={<Home />}></Route>
          <Route path="/create-hotel" element={<CreateHotel />} />
          <Route path="/create-table" element={<CreateTables />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
