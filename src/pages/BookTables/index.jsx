import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  EventNoteOutlined,
  LocationOnOutlined,
  ReceiptLongOutlined,
  RestaurantMenuOutlined,
  SearchRounded,
  StorefrontOutlined,
} from "@mui/icons-material";
import {
  getAllHotel,
  searchHotelbyNameLocation,
  getAllMenu,
  getAllOrders,
  getReservationByUser,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import useToast from "hooks/useToast";
import useAuth from "hooks/useAuth";
import { renderArea, renderLocation } from "utils/common";
import ReservationPage from "pages/BoockedList/ReservationPage";
import OrderHistory from "pages/OrderHistory/OrderHistory";
import CustomerMenu from "./CustomerMenu";

const TABS = [
  {
    id: "availability",
    label: "Book",
    title: "Find a table",
    subtitle: "Search restaurants and reserve your seats.",
    icon: StorefrontOutlined,
  },
  {
    id: "menu",
    label: "Menu",
    title: "Menu",
    subtitle: "Dishes from every restaurant.",
    icon: RestaurantMenuOutlined,
  },
  {
    id: "reservations",
    label: "Bookings",
    title: "My bookings",
    subtitle: "Upcoming and past reservations.",
    icon: EventNoteOutlined,
  },
  {
    id: "orders",
    label: "Orders",
    title: "My orders",
    subtitle: "Food you ordered at the table.",
    icon: ReceiptLongOutlined,
  },
];

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const BookTables = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [{ data: auth }] = useAuth();
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();

  // The open tab lives in the URL so "Back" from a hotel returns to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((tab) => tab.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "availability";
  const tab = TABS.find((item) => item.id === activeTab);

  const [hotels, setHotels] = useState([]);
  // The customer's upcoming bookings, shown on the matching restaurant card.
  const [myBookings, setMyBookings] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (areaList.data.length === 0) getAllArea();
    if (locationList.data.length === 0) getAllLocation();
    fetchHotels();
  }, []);

  useEffect(() => {
    if (!auth?.details?.id || activeTab !== "availability") return;
    getReservationByUser({ user_id: auth.details.id })
      .then((response) => setMyBookings(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setMyBookings([]));
  }, [auth?.details?.id, activeTab]);

  // Soonest open booking (not completed / cancelled) at a restaurant.
  const nextBookingAt = (hotelId) =>
    myBookings
      .filter(
        (row) =>
          String(row.hotel_id) === String(hotelId) && ![3, 4].includes(row.dining_status),
      )
      .sort((a, b) => new Date(a.dining_date) - new Date(b.dining_date))[0];

  useEffect(() => {
    if (activeTab === "menu" && menus.length === 0) loadMenus();
    if (activeTab === "orders") loadOrders();
  }, [activeTab]);

  const fetchHotels = async () => {
    setLoadingHotels(true);
    try {
      const response = await getAllHotel();
      setHotels(response?.data || []);
    } catch (error) {
      console.error("fetchHotels error", error);
    } finally {
      setLoadingHotels(false);
    }
  };

  const searchHotels = async (value) => {
    setLoadingHotels(true);
    try {
      const response = await searchHotelbyNameLocation(value);
      if (response.success) setHotels(response.data || []);
    } catch (error) {
      showToast({ message: error, variant: "danger" });
    } finally {
      setLoadingHotels(false);
    }
  };

  const loadMenus = async () => {
    setLoadingMenus(true);
    try {
      // The menu API pages at 10 rows by default.
      const response = await getAllMenu({ limit: 500 });
      const rows = response?.rows || response?.data || [];
      setMenus(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error loading menus:", error);
    } finally {
      setLoadingMenus(false);
    }
  };

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) setLoadingOrders(true);
    try {
      const response = await getAllOrders();
      const rows =
        response?.rows || response?.data?.rows || response?.data || [];
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  // Live order tracking: poll while the Orders tab is open and visible.
  useEffect(() => {
    if (activeTab !== "orders") return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadOrders({ silent: true });
    }, 30000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleSearch = (event) => {
    const value = event.target.value.trim();
    if (value.length > 2) searchHotels(value);
    else if (value.length === 0) fetchHotels();
  };

  const selectTab = (id) => {
    setSearchParams(id === "availability" ? {} : { tab: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHotel = (hotel) =>
    navigate(`/book-table/details/${hotel.id}`, {
      state: {
        hotelData: hotel,
        isEditable: false,
        isBooking: true,
        // Back to the tab the hotel was opened from (Find a table or Menu).
        from: {
          label: tab.id === "availability" ? "Find a table" : tab.title,
          path:
            tab.id === "availability" ? "/book-table" : `/book-table?tab=${tab.id}`,
        },
      },
    });

  const hotelPlace = (hotel) =>
    [
      renderArea(hotel?.area_id, areaList?.data || [])[0]?.name,
      renderLocation(hotel?.location_id, locationList?.data || [])[0]?.name,
    ]
      .filter(Boolean)
      .join(" · ");

  const firstName = auth?.details?.name?.split(" ")[0];

  const renderTabs = (className) => (
    <nav className={className} aria-label="Sections">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={activeTab === id ? "is-active" : ""}
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => selectTab(id)}
        >
          <Icon aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  const hotelsById = useMemo(
    () => Object.fromEntries(hotels.map((hotel) => [String(hotel.id), hotel])),
    [hotels],
  );

  return (
    <section className="cx-page">
      <header className="cx-hero">
        {firstName && <span className="ui-kicker">Hi, {firstName}</span>}
        <h1>{tab.title}</h1>
        <p>{tab.subtitle}</p>
      </header>

      {renderTabs("cx-tabs")}

      {activeTab === "availability" && (
        <div className="cx-section">
          <label className="ui-search cx-search">
            <SearchRounded fontSize="small" aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              onChange={handleSearch}
              placeholder="Restaurant, area or city"
              aria-label="Search restaurants"
            />
          </label>

          {loadingHotels ? (
            <div className="cx-grid">
              {[0, 1, 2].map((key) => (
                <div key={key} className="cx-card cx-card--skeleton" />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="ui-empty">
              <StorefrontOutlined />
              <h3>No restaurants found</h3>
              <p>Try a different name, area or city.</p>
            </div>
          ) : (
            <div className="cx-grid">
              {hotels.map((hotel) => (
                <article key={hotel.id} className="cx-card cx-hotel">
                  <div className="cx-hotel__head">
                    <span className="cx-avatar" aria-hidden>
                      {initialsOf(hotel.hotel_name) || "R"}
                    </span>
                    <div className="cx-hotel__title">
                      <h3>{hotel.hotel_name || "Restaurant"}</h3>
                      {hotelPlace(hotel) && <p>{hotelPlace(hotel)}</p>}
                    </div>
                  </div>

                  {hotel.address && (
                    <p className="cx-hotel__address">
                      <LocationOnOutlined aria-hidden />
                      {hotel.address}
                    </p>
                  )}

                  {(() => {
                    const booking = nextBookingAt(hotel.id);
                    if (!booking) return null;
                    return (
                      <button
                        type="button"
                        className="cx-hotel__booking"
                        onClick={() => selectTab("reservations")}
                        title="Open My bookings"
                      >
                        <span>Your booking</span>
                        <strong>#{booking.id}</strong>
                        {booking.dining_date &&
                          ` · ${dayjs(booking.dining_date).format("ddd, D MMM, h:mm A")}`}
                      </button>
                    );
                  })()}

                  <ul className="cx-facts">
                    <li>
                      <strong>{hotel.floorCount ?? "—"}</strong>
                      {hotel.floorCount === 1 ? "floor" : "floors"}
                    </li>
                    <li>
                      <strong>{hotel.tableCount ?? "—"}</strong>
                      {hotel.tableCount === 1 ? "table" : "tables"}
                    </li>
                    <li>
                      <strong>{hotel.seatCount ?? "—"}</strong>
                      {hotel.seatCount === 1 ? "seat" : "seats"}
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="ui-btn ui-btn--primary cx-hotel__cta"
                    onClick={() => openHotel(hotel)}
                  >
                    Book a table
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "menu" && (
        <div className="cx-section">
          <CustomerMenu
            menus={menus}
            loading={loadingMenus}
            onBook={(hotelId) => {
              const hotel = hotelsById[String(hotelId)];
              if (hotel) openHotel(hotel);
            }}
            onOrdered={() => selectTab("orders")}
          />
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="cx-section">
          <ReservationPage onBookTable={() => selectTab("availability")} />
        </div>
      )}

      {activeTab === "orders" && (
        <div className="cx-section">
          <OrderHistory orders={orders} loading={loadingOrders} onChanged={loadOrders} />
        </div>
      )}

      {renderTabs("cx-bottom-nav")}
    </section>
  );
};

export default BookTables;
