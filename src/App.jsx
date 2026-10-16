import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppErrorBoundary from "components/common/AppErrorBoundary";
import Spinner from "components/spinner/spinner.component";
import "styles/index.scss";
import useAuth from "hooks/useAuth";
import { can, homePathFor, isStaffRole } from "utils/permissions";

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
const Areas = lazy(() => import("pages/Settings/Areas/Areas"));
const MasterPage = lazy(() => import("pages/Settings/Masters/MasterPage"));
const SettingsHome = lazy(() => import("pages/Settings/SettingsHome"));
const MenuCategories = lazy(
  () => import("pages/Settings/MenuCategories/MenuCategories"),
);
const AdminUsers = lazy(() => import("pages/Settings/AdminUsers/AdminUsers"));
const StaffUsers = lazy(() => import("pages/Settings/AdminUsers/StaffUsers"));
const InactiveUsers = lazy(() => import("pages/Settings/AdminUsers/InactiveUsers"));
const NoAccess = lazy(() => import("pages/Unauthorized/NoAccess"));
const App = () => {
  const [{ data: auth }, { getUserInfoData }] = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setisAdmin] = useState(null);
  const token = localStorage.getItem("token");
  const details = auth?.details;
  const isAdminUser = isStaffRole(details?.role);
  const goHome = <Navigate to={homePathFor(details)} replace />;
  // Staff-only page: needs view access to `page` (guests go to their home).
  const staffPage = (page, element) => (can(details, page) ? element : goHome);
  // Shared page: guests always pass, staff need view access to `page`.
  const sharedPage = (page, element) =>
    !isAdminUser || can(details, page) ? element : goHome;

  useEffect(() => {
    const restoreAuth = async () => {
      if (auth?.details) {
        setCheckingAuth(false);
        setisAdmin(isStaffRole(auth?.details?.role));
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

  // The window is the page scroller, so start each new page at the top
  // instead of keeping the previous page's scroll position. `?tab=` counts as
  // a page too: the side-nav's Menu / My bookings / My orders are /book-table tabs.
  const pageTab = new URLSearchParams(location.search).get("tab");
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, pageTab]);

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
            element={staffPage("menuCategories", <MenuCategories />)}
          />
          {/* SuperAdmin: create Admins and grant pages, options and hotels. */}
          <Route
            path="/user-management/admins"
            element={staffPage("adminUsers", <AdminUsers />)}
          />
          {/* Admin: create hotel Staff users (Manager / Lead / Member). */}
          <Route
            path="/user-management/staff"
            element={staffPage("users", <StaffUsers />)}
          />
          {/* Disabled Staff / Admin users, with Activate. */}
          <Route
            path="/user-management/inactive"
            element={staffPage("inactiveUsers", <InactiveUsers />)}
          />
          {/* Old links from when these were under Settings. */}
          <Route path="/settings/staff-users" element={<Navigate to="/user-management/staff" replace />} />
          <Route path="/settings/admin-users" element={<Navigate to="/user-management/admins" replace />} />
          <Route path="/no-access" element={<NoAccess />} />
          {/* Settings (admin): landing page + master data */}
          <Route
            path="/settings"
            element={
              isAdminUser ? <SettingsHome /> : goHome
            }
          />
          <Route
            path="/settings/cooks"
            element={
              staffPage("cooks", <Cooks />)
            }
          />
          <Route
            path="/settings/servers"
            element={
              staffPage("servers", <Servers />)
            }
          />
          <Route
            path="/settings/cleaners"
            element={
              staffPage("cleaners", <Cleaners />)
            }
          />
          <Route
            path="/settings/areas"
            element={
              staffPage("areas", <Areas />)
            }
          />
          {/* Locations, statuses, spice levels (pages/Settings/Masters). */}
          <Route
            path="/settings/masters/:master"
            element={
              isAdminUser ? <MasterPage /> : goHome
            }
          />
          <Route
            path="/menu-categories"
            element={<Navigate to="/settings/menu-categories" replace />}
          />
          <Route element={<Home />}>
            
              <>
                <Route path="/dashboard" element={sharedPage("dashboard", <Dashboard />)} />
                <Route path="/hotellist" element={sharedPage("hotels", <CreateHotel />)} />
                <Route path="/book-table" element={<BookTables />} />
                <Route
                  path="/book-table/details/:id"
                  element={<HotelDetails />}
                />
                <Route path="/details/:id" element={sharedPage("hotels", <HotelDetails />)} />
              </>
            
              <Route
                path="/booked-table"
                element={
                  isAdminUser ? (
                    staffPage("reservations", <ReservationBoard />)
                  ) : (
                    <BookedTableDetails data={auth} />
                  )
                }
              />
              <Route
                path="/orders"
                element={
                  isAdminUser ? (
                    staffPage("orders", <OrderBoard />)
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
