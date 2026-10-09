import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  ArrowBackRounded,
  ChevronRightRounded,
  EventSeatOutlined,
  LayersOutlined,
  PlaceOutlined,
  TableRestaurantOutlined,
} from "@mui/icons-material";
import TableDetails from "pages/TableDetails/TableDetails";
import { renderLocation } from "utils/common";
import useGlobalMaster from "hooks/useGlobalMaster";
import { getHotelbyid } from "services";
import { hotelPlaceholderImage } from "assets/images";
import MenuList from "pages/Menu/MenuList";

const HotelDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hotelData, setHotelData] = useState(location.state?.hotelData || null);
  const [isEditable, setIsEditable] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [showMenuList, setShowMenuList] = useState(false);
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

  const statItems = [
    { key: "floors", label: "Floors", value: stats.floorCount, icon: LayersOutlined },
    { key: "tables", label: "Tables", value: stats.totalTables, icon: TableRestaurantOutlined },
    { key: "seats", label: "Seats", value: stats.seatCount, icon: EventSeatOutlined },
  ];

  return (
    <main className="hotel-details-page">
      <nav className="hd-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate("/book-table")}>
          Hotels
        </button>
        <ChevronRightRounded fontSize="inherit" aria-hidden />
        <span aria-current="page">{hotelData?.hotel_name || "Hotel"}</span>
      </nav>

      <header className="hd-hero">
        <div className="hd-hero__media">
          <img src={hotelPlaceholderImage} alt="" />
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
              <button
                type="button"
                className="hd-btn hd-btn--ghost"
                onClick={() => navigate(-1)}
              >
                <ArrowBackRounded fontSize="small" /> Back
              </button>
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
        <TableDetails
          data={hotelData || { id }}
          isEditable={isEditable}
          isBooking={isBooking}
        />
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
