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
const BookedTableDetails = lazy(()=> import("pages/TableDetails/BookedTableDetails") );
const App = () => {
  const [{ data: auth }] = useAuth();

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Layout */}
        <Route element={<UserLayout />}>
          
          {/* Hotel */}
          <Route path="hotel" element={<Home />}>
            
            {/* Default redirect */}
            <Route
              index
              element={
                auth?.details?.role === "Admin"
                  ? <Navigate to="dashboard" replace />
                  : <Navigate to="book-table" replace />
              }
            />

            {/* Routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateHotel />} />
            {auth?.details &&
            <Route path="booked-table" element={<BookedTableDetails data={auth}/>} />
            }
            <Route path="book-table" element={<BookTables />} />
            <Route path="book-table/details/:id" element={<HotelDetails />} />
            <Route path="details/:id" element={<HotelDetails />} />
          </Route>

          {/* Global fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


export default App;
