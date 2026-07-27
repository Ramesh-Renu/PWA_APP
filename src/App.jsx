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
const MenuCategories = lazy(
  () => import("pages/Settings/MenuCategories/MenuCategories"),
);
const App = () => {
  const [{ data: auth }, { getUserInfoData }] = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const restoreAuth = async () => {
      if (auth?.details) {
        setCheckingAuth(false);
        return;
      }

      if (token && token !== "null") {
        await getUserInfoData();
      }

      setCheckingAuth(false);
    };

    restoreAuth();
  }, [auth?.details, token, getUserInfoData]);

  const protectedElement = checkingAuth ? (
    <Spinner />
  ) : auth?.details ? (
    <UserLayout />
  ) : (
    <Navigate to="/" replace />
  );

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route element={protectedElement}>
          <Route path="/settings/menu-categories" element={<MenuCategories />} />
          <Route
            path="/menu-categories"
            element={<Navigate to="/settings/menu-categories" replace />}
          />
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
