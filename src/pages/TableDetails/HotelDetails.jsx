import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  ApartmentOutlined,
  ChevronRightRounded,
  EventSeatOutlined,
  LayersOutlined,
  PersonOutlineRounded,
  PlaceOutlined,
  TableRestaurantOutlined,
} from "@mui/icons-material";
import TableDetails from "pages/TableDetails/TableDetails";
import SlotPicker, { defaultMeal } from "pages/TableDetails/SlotPicker";
import dayjs from "dayjs";
import { renderLocation } from "utils/common";
import useGlobalMaster from "hooks/useGlobalMaster";
import useAuth from "hooks/useAuth";
import { getHotelbyid } from "services";
import MenuList from "pages/Menu/MenuList";

const HotelDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hotelData, setHotelData] = useState(location.state?.hotelData || null);
  // Front desk booking for a guest (Reservations → New reservation).
  const guest = location.state?.guest || null;
  const [isEditable, setIsEditable] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  // Booking slot (Zomato-style picker): date, guests, meal, time.
  const [slot, setSlot] = useState(() => {
    // "View booking" opens on that booking's slot (if it isn't in the past).
    const given = location.state?.slot;
    if (given?.date && !dayjs(given.date).isBefore(dayjs(), "day")) return given;
    const date = dayjs().format("YYYY-MM-DD");
    // Guests start empty: the party size is chosen before tables are shown.
    return { date, guests: null, meal: defaultMeal(date), time: "" };
  });

  const [showMenuList, setShowMenuList] = useState(false);
  // Free seats on the floor shown in the plan at the chosen time.
  const [floorFreeSeats, setFloorFreeSeats] = useState(null);
  const [{ data: auth }] = useAuth();
  const isAdmin = auth?.details?.role === "Admin";
  // Breadcrumb points back to the page this hotel was opened from (callers
  // pass state.from); direct links fall back to the role's hotel list.
  const backTo = location.state?.from?.path
    ? location.state.from
    : isAdmin
      ? { label: "Hotels", path: "/hotellist" }
      : { label: "Find a table", path: "/book-table" };
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();
  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);

  useEffect(() => {
    if (location?.state?.isEditable) {
      setIsEditable(true);
    }
    if (location?.state?.isBooking) {
      setIsBooking(true);
    }
  }, [location?.state]);

  const fetchHotelDetailsbyId = async (param) => {
    try {
      const response = await getHotelbyid(param);
      if (response.success) {
        setHotelData(response.data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
    }
  };

  useEffect(() => {
    if (hotelData === null && location.state?.hotel_id) {
      fetchHotelDetailsbyId({ hotel_id: location.state.hotel_id });
    }
  }, [hotelData]);

  const computeTotals = (hd) => {
    const floorCount = parseInt(hd?.floorCount ?? hd?.floorCount ?? 0, 10) || 0;
    const tables_per_floor =
      parseInt(hd?.tables_per_floor ?? hd?.chairs_per_table ?? 0, 10) || 0;
    const totalTables =
      floorCount && tables_per_floor
        ? floorCount * tables_per_floor
        : hd?.tableCount || 0;
    const seatCount = hd?.seatCount || 0;
    return { floorCount, tables_per_floor, totalTables, seatCount };
  };

  const stats = computeTotals(hotelData || {});
  const locationName =
    renderLocation(hotelData?.location_id, locationList?.data)[0]?.name ||
    hotelData?.location_name;
  const areaName = hotelData?.area_name || hotelData?.area;
  const modeLabel = isEditable
    ? "Editing layout"
    : isBooking
      ? "Booking"
      : "Overview";

  const initials = (hotelData?.hotel_name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  const statItems = [
    { key: "floors", label: "Floors", value: stats.floorCount, icon: LayersOutlined },
    { key: "tables", label: "Tables", value: stats.totalTables, icon: TableRestaurantOutlined },
    { key: "seats", label: "Seats", value: stats.seatCount, icon: EventSeatOutlined },
  ];

  return (
    <main className="hotel-details-page">
      <nav className="hd-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate(backTo.path)}>
          {backTo.label}
        </button>
        <ChevronRightRounded fontSize="inherit" aria-hidden />
        <span aria-current="page">{hotelData?.hotel_name || "Hotel"}</span>
      </nav>

      <header className="hd-hero">
        <div className="hd-hero__media" aria-hidden>
          {initials || <ApartmentOutlined />}
        </div>

        <div className="hd-hero__body">
          <span className="hd-hero__eyebrow">{modeLabel}</span>
          <h1 className="hd-hero__title">{hotelData?.hotel_name || "—"}</h1>

          <div className="hd-hero__chips">
            {locationName && (
              <span className="hd-chip hd-chip--location">
                <PlaceOutlined fontSize="inherit" />
                {locationName}
              </span>
            )}
            {areaName && <span className="hd-chip">{areaName}</span>}
          </div>

          <p className="hd-hero__address">
            {hotelData?.address || "Address not available"}
          </p>

          {isEditable && (
            <div className="hd-hero__actions">
              <div className="hd-tabs" role="tablist" aria-label="Hotel section">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!showMenuList}
                  className={!showMenuList ? "is-active" : ""}
                  onClick={() => setShowMenuList(false)}
                >
                  Floor plan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={showMenuList}
                  className={showMenuList ? "is-active" : ""}
                  onClick={() => setShowMenuList(true)}
                >
                  Menu
                </button>
              </div>
            </div>
          )}
        </div>

        <dl className="hd-hero__stats">
          {statItems.map(({ key, label, value, icon: Icon }) => (
            <div key={key} className={`hd-stat hd-stat--${key}`}>
              <dt>
                <Icon fontSize="inherit" /> {label}
              </dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </header>

      {!showMenuList && (
        <>
          {guest && isBooking && !isEditable && (
            <p className="hd-guest-banner" role="status">
              <PersonOutlineRounded fontSize="small" aria-hidden />
              <span>
                Booking for <strong>{guest.name}</strong>
                {guest.mobile ? ` · ${guest.mobile}` : ""}
              </span>
            </p>
          )}
          {isBooking && !isEditable && (
            <SlotPicker
              value={slot}
              onChange={setSlot}
              // Guests offered up to the free seats of the floor shown below
              // (known once a time is picked).
              maxGuests={slot.time ? floorFreeSeats : null}
            />
          )}
          {isBooking && !isEditable && !slot.time ? (
            <p className="slot-picker__prompt">
              Pick a time slot above to see the tables available then.
            </p>
          ) : (
            <TableDetails
              data={hotelData || { id }}
              isEditable={isEditable}
              isBooking={isBooking}
              // A party bigger than this floor's free seats counts as "not
              // chosen yet" here (the Guests field says why).
              slot={
                isBooking && !isEditable
                  ? floorFreeSeats !== null && slot.guests > floorFreeSeats
                    ? { ...slot, guests: null }
                    : slot
                  : null
              }
              onFloorFreeSeats={setFloorFreeSeats}
              guest={guest}
            />
          )}
        </>
      )}
      {showMenuList && (
        <div className="menu-list-header">
          <MenuList hotelId={hotelData?.id} />
        </div>
      )}
    </main>
  );
};

export default HotelDetails;
