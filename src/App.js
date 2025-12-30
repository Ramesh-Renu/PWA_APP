import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Spinner from "components/spinner/spinner.component";
import "styles/index.scss";
import useAuth from "hooks/useAuth";

/** LAYOUTS */
const UserLayout = lazy(() =>
  import("components/layout/user-layout.component")
);

/** PAGES */
const Login = lazy(() => import("pages/Login/Login"));

// Order Orion Pages

const Home = lazy(() => import("pages/HomePage"));
const Dashboard = lazy(() => import("pages/Dashboard"));
const CreateHotel = lazy(() => import("pages/Hotel/CreateHotel"));
const BookTables = lazy(() => import("pages/BookTables"));
const HotelDetails = lazy(() => import("pages/TableDetails/HotelDetails"));
const NotFound = lazy(() => import("pages/NotFound/NotFound"));

const App = () => {
  const [{ data: auth }, { setAuth }] = useAuth();
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* HEADER WITH SIDE MENU LAYOUT */}
        <Route
          path="/"
          element={<UserLayout/>}
        >
          <Route path="/hotel" element={<Home />}></Route>
          {auth?.details?.role === "Admin" && (
            <>
              <Route path="/dashboard" element={<Dashboard />}></Route>
              <Route path="/create-hotel" element={<CreateHotel />} />
            </>
          )}
          <Route path="/book-table" element={<BookTables />} />
          <Route path="/hotel/details/:id" element={<HotelDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
