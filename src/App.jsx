import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Spinner from "components/spinner/spinner.component";
import "styles/index.scss";
import useAuth from "hooks/useAuth";

/** LAYOUTS */
const UserLayout = lazy(
  () => import("components/layout/user-layout.component"),
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
const BookedTableDetails = lazy(
  () => import("pages/TableDetails/BookedTableDetails"),
);
const App = () => {
  const [{ data: auth }] = useAuth();
  useEffect(() => {
    console.log("AUTH:", auth);
  }, [auth]);
  const token = localStorage.getItem("token");

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route
          element={auth?.details ? <UserLayout /> : <Navigate to="/" replace />}
        >
          <Route element={<Home />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hotellist" element={<CreateHotel />} />
            <Route path="/book-table" element={<BookTables />} />
            <Route path="/book-table/details/:id" element={<HotelDetails />} />
            <Route path="/details/:id" element={<HotelDetails />} />
            <Route
              path="/booked-table"
              element={<BookedTableDetails data={auth} />}
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
