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
import { getFavoriteHotels, isFavoriteHotel, toggleFavoriteHotel } from "utils/favorites";
import {
  formatReminderLabel,
  getReminderSettings,
  requestBrowserNotificationPermission,
  saveReminderSettings,
} from "utils/reminders";
import { getLoyaltySummary } from "utils/loyalty";
import { getActivePromotion, getRedeemedPromotionIds, redeemPromotion } from "utils/promotions";

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
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteHotels());
  const [reminderSettings, setReminderSettings] = useState(() => getReminderSettings());
  const [redeemedPromos, setRedeemedPromos] = useState(() => getRedeemedPromotionIds());
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

  const nextBooking = useMemo(
    () =>
      [...myBookings]
        .filter(
          (row) =>
            ![3, 4].includes(Number(row.dining_status)) &&
            new Date(row.dining_date).getTime() > Date.now(),
        )
        .sort((a, b) => new Date(a.dining_date) - new Date(b.dining_date))[0],
    [myBookings],
  );

  const favoriteHotels = useMemo(
    () => hotels.filter((hotel) => favoriteIds.includes(String(hotel.id))),
    [favoriteIds, hotels],
  );

  const guestStats = useMemo(() => {
    const upcomingCount = myBookings.filter(
      (row) => ![3, 4].includes(row.dining_status),
    ).length;
    const memberDate =
      auth?.details?.created_at || auth?.details?.createdAt || null;

    return {
      upcomingCount,
      totalBookings: myBookings.length,
      savedPlaces: favoriteHotels.length,
      memberSince: memberDate ? dayjs(memberDate).format("MMM YYYY") : "New guest",
    };
  }, [auth?.details?.created_at, auth?.details?.createdAt, favoriteHotels.length, myBookings]);

  const loyalty = useMemo(
    () => getLoyaltySummary(guestStats.totalBookings, guestStats.savedPlaces),
    [guestStats.savedPlaces, guestStats.totalBookings],
  );
  const activePromotion = useMemo(
    () => getActivePromotion(guestStats.totalBookings, guestStats.savedPlaces, redeemedPromos),
    [guestStats.savedPlaces, guestStats.totalBookings, redeemedPromos],
  );

  const hotelsById = useMemo(
    () => Object.fromEntries(hotels.map((hotel) => [String(hotel.id), hotel])),
    [hotels],
  );

  const handleRedeemPromotion = (promo) => {
    if (!promo) return;

    redeemPromotion(promo.id);
    setRedeemedPromos(getRedeemedPromotionIds());
    showToast({ message: `${promo.code} is now active on your next booking.`, variant: "success" });
  };

  const updateReminder = async (key, value) => {
    const next = saveReminderSettings({ [key]: value });
    setReminderSettings(next);

    if (key === "push" && value) {
      const permission = await requestBrowserNotificationPermission();
      if (!permission.granted) {
        showToast({
          title: "Notifications blocked",
          message: "Browser notifications are off. You can still see reminders in-app.",
          variant: "warning",
        });
        return;
      }

      showToast({
        title: "Reminder enabled",
        message: nextBooking
          ? `We will remind you ${formatReminderLabel(next.leadMinutes)} before your next booking.`
          : "We will remind you when you have an upcoming booking.",
        variant: "success",
      });
    }
  };

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

  const toggleFavorite = (hotelId) => {
    toggleFavoriteHotel(hotelId);
    setFavoriteIds(getFavoriteHotels());
  };

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
          {nextBooking && (
            <div className="ui-alert ui-alert--info">
              <div>
                <span className="ui-kicker">Next reservation</span>
                <p>
                  {hotelsById[String(nextBooking.hotel_id)]?.hotel_name || "Your table"} on {dayjs(nextBooking.dining_date).format("ddd, D MMM")}
                </p>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--sm"
                onClick={() => selectTab("reservations")}
              >
                View booking
              </button>
            </div>
          )}

          <div className="ui-guest-profile">
            <div className="ui-guest-profile__identity">
              <div className="ui-guest-profile__avatar" aria-hidden>
                {initialsOf(auth?.details?.name || "Guest") || "G"}
              </div>
              <div>
                <span className="ui-kicker">Guest profile</span>
                <h3>{auth?.details?.name || "Guest"}</h3>
              </div>
            </div>

            <div className="ui-guest-profile__stats">
              <div>
                <strong>{guestStats.upcomingCount}</strong>
                <span>Upcoming</span>
              </div>
              <div>
                <strong>{guestStats.totalBookings}</strong>
                <span>Total bookings</span>
              </div>
              <div>
                <strong>{guestStats.savedPlaces}</strong>
                <span>Saved places</span>
              </div>
              <div>
                <strong>{guestStats.memberSince}</strong>
                <span>Member since</span>
              </div>
            </div>
          </div>

          <div className="ui-loyalty-card">
            <div className="ui-loyalty-card__header">
              <span className="ui-kicker">Loyalty</span>
              <span className="ui-loyalty-card__tier">{loyalty.tier}</span>
            </div>
            <div className="ui-loyalty-card__body">
              <div>
                <strong>{loyalty.points}</strong>
                <span>points</span>
              </div>
              <div>
                <strong>{loyalty.perks}</strong>
                <span>current perk</span>
              </div>
            </div>
            {loyalty.nextTier && (
              <p>
                {loyalty.nextTier} unlocks at {loyalty.nextTarget} bookings.
              </p>
            )}
          </div>

          {activePromotion && (
            <div className="ui-promo-card">
              <div className="ui-promo-card__copy">
                <span className="ui-kicker">Exclusive offer</span>
                <h3>{activePromotion.label}</h3>
                <p>
                  Use code <strong>{activePromotion.code}</strong> on your next reservation.
                </p>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn--primary ui-btn--sm"
                onClick={() => handleRedeemPromotion(activePromotion)}
              >
                Use offer
              </button>
            </div>
          )}

          <div className="ui-reminder-card">
            <div className="ui-reminder-card__body">
              <span className="ui-kicker">Reservation reminders</span>
              <p>
                {nextBooking
                  ? `We'll remind you ${formatReminderLabel(reminderSettings.leadMinutes)} for your next booking.`
                  : `Set a reminder so you never miss your table.`}
              </p>
            </div>

            <div className="ui-reminder-card__actions">
              {[
                { key: "push", label: "Push" },
                { key: "email", label: "Email" },
                { key: "sms", label: "SMS" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={reminderSettings[key] ? "ui-toggle is-on" : "ui-toggle"}
                  onClick={() => updateReminder(key, !reminderSettings[key])}
                >
                  <span className="ui-toggle__track" aria-hidden>
                    <span className="ui-toggle__thumb" />
                  </span>
                  {label}
                </button>
              ))}
            </div>

            <div className="ui-reminder-card__options">
              {[15, 30, 60, 120].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={
                    reminderSettings.leadMinutes === minutes
                      ? "ui-reminder-chip is-selected"
                      : "ui-reminder-chip"
                  }
                  onClick={() => updateReminder("leadMinutes", minutes)}
                >
                  {formatReminderLabel(minutes)}
                </button>
              ))}
            </div>
          </div>

          {favoriteHotels.length > 0 && (
            <div className="ui-favorite-strip">
              <div className="ui-favorite-strip__header">
                <span className="ui-kicker">Saved places</span>
              </div>
              <div className="ui-favorite-strip__list">
                {favoriteHotels.map((hotel) => (
                  <button
                    key={hotel.id}
                    type="button"
                    className="ui-favorite-pill"
                    onClick={() => openHotel(hotel)}
                  >
                    {hotel.hotel_name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    <button
                      type="button"
                      className={`ui-btn ui-btn--sm ${isFavoriteHotel(hotel.id) ? "ui-btn--primary" : "ui-btn--ghost"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(hotel.id);
                      }}
                      aria-pressed={isFavoriteHotel(hotel.id)}
                      aria-label={`${isFavoriteHotel(hotel.id) ? "Remove" : "Save"} ${hotel.hotel_name || "restaurant"} from favorites`}
                    >
                      {isFavoriteHotel(hotel.id) ? "Saved" : "Save"}
                    </button>
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
