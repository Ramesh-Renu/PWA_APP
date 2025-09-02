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
          <Route path="/" element={<Home />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
