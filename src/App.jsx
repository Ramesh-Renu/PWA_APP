import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppErrorBoundary from "components/common/AppErrorBoundary";
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
const ReservationBoard = lazy(() => import("pages/Reservations/ReservationBoard"));
const OrderBoard = lazy(() => import("pages/Orders/OrderBoard"));
const Cooks = lazy(() => import("pages/Settings/Cooks/Cooks"));
const Servers = lazy(() => import("pages/Settings/Servers/Servers"));
const Cleaners = lazy(() => import("pages/Settings/Cleaners/Cleaners"));
const SettingsHome = lazy(() => import("pages/Settings/SettingsHome"));
const MenuCategories = lazy(
  () => import("pages/Settings/MenuCategories/MenuCategories"),
);
const App = () => {
  const [{ data: auth }, { getUserInfoData }] = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setisAdmin] = useState(null);
  const token = localStorage.getItem("token");
  const isAdminUser = auth?.details?.role === "Admin";

  useEffect(() => {
    const restoreAuth = async () => {
      if (auth?.details) {
        setCheckingAuth(false);
        setisAdmin(auth?.details?.role === "Admin");
        return;
      }

      if (token && token !== "null") {
        await getUserInfoData();
      }
      setisAdmin(null);
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
    <AppErrorBoundary resetKey={location.pathname}>
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route element={protectedElement}>
          <Route
            path="/settings/menu-categories"
            element={<MenuCategories />}
          />
          {/* Settings (admin): landing page + master data */}
          <Route
            path="/settings"
            element={
              isAdminUser ? <SettingsHome /> : <Navigate to="/book-table" replace />
            }
          />
          <Route
            path="/settings/cooks"
            element={
              isAdminUser ? <Cooks /> : <Navigate to="/book-table" replace />
            }
          />
          <Route
            path="/settings/servers"
            element={
              isAdminUser ? <Servers /> : <Navigate to="/book-table" replace />
            }
          />
          <Route
            path="/settings/cleaners"
            element={
              isAdminUser ? <Cleaners /> : <Navigate to="/book-table" replace />
            }
          />
          <Route
            path="/menu-categories"
            element={<Navigate to="/settings/menu-categories" replace />}
          />
          <Route element={<Home />}>
            
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/hotellist" element={<CreateHotel />} />
                <Route path="/book-table" element={<BookTables />} />
                <Route
                  path="/book-table/details/:id"
                  element={<HotelDetails />}
                />
                <Route path="/details/:id" element={<HotelDetails />} />
              </>
            
              <Route
                path="/booked-table"
                element={
                  isAdminUser ? (
                    <ReservationBoard />
                  ) : (
                    <BookedTableDetails data={auth} />
                  )
                }
              />
              <Route
                path="/orders"
                element={
                  isAdminUser ? (
                    <OrderBoard />
                  ) : (
                    <Navigate to="/booked-table" replace />
                  )
                }
              />
            
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </AppErrorBoundary>
  );
};

export default App;
