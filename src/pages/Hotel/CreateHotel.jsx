import React, { Fragment, useEffect, useMemo, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import {
  getAllHotel,
  updateHotelbyid,
  deleteHotel,
  searchHotelbyNameLocation,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import { createHotelAPi } from "services";
import useToast from "hooks/useToast";
import { useNavigate } from "react-router-dom";
import ToolTipPopup from "components/common/ToolTipPopup";
import { getApiErrorMessage } from "utils/apiError";
import useAuth from "hooks/useAuth";
import CreateOrderDialog from "pages/Orders/CreateOrderDialog";
import {
  LocationOnOutlined,
  AddRounded,
  SearchRounded,
  EditOutlined,
  DeleteOutlineRounded,
  GridViewOutlined,
  ApartmentOutlined,
  TableRestaurantOutlined,
  LayersOutlined,
  EventSeatOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { renderArea, renderLocation } from "utils/common";
import SkeletonLoading from "components/common/SkeletonLoading";

const TABLE_PREFIX_PATTERN = /^[A-Z0-9]{2,8}$/;

const normalizeTablePrefix = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

// Same rule as the API (utils/tableCode.js).
const suggestTablePrefix = (hotelName, locationName, areaName) => {
  const prefix =
    normalizeTablePrefix(hotelName).slice(0, 2) +
    normalizeTablePrefix(locationName).slice(0, 1) +
    normalizeTablePrefix(areaName).slice(0, 1);
  return prefix.length >= 2 ? prefix : "";
};

const apiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getHotelCounts = (hotel) => {
  const floorCount = hotel.floorCount ?? hotel.floor_per_hotel ?? "N/A";
  const tablesPerFloor =
    hotel.tables_per_floor ?? hotel.tablesPerFloor ?? "N/A";
  const tableCount =
    hotel.tableCount ??
    hotel.totalTables ??
    hotel.total_tables ??
    (Number.isFinite(Number(floorCount)) &&
    Number.isFinite(Number(tablesPerFloor))
      ? Number(floorCount) * Number(tablesPerFloor)
      : "N/A");
  const seatCount =
    hotel.seatCount ?? hotel.totalSeats ?? hotel.total_seats ?? "N/A";
  return { floorCount, tablesPerFloor, tableCount, seatCount };
};

const CreateHotel = () => {
  const [listOfHotel, setListOfHotel] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [showCreateHotelForm, setShowCreateHotelForm] = useState(false);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(true);
  const [{ data: auth }] = useAuth();
  const isAdminUser = auth?.details?.role === "Admin";
  // Hotel an admin is placing an order for (no table booking).
  const [orderHotel, setOrderHotel] = useState(null);
  const navigate = useNavigate();
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();
  const [getLocationBasedArea, setGetLocationBasedArea] = useState([]);
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelFloorCount, setHotelFloorCount] = useState("");
  const [hotelTableCount, setHotelTableCount] = useState("");
  const [hotelChairsPerTable, setHotelChairsPerTable] = useState("");
  const [seletedHotelId, setSeletedHotelId] = useState(null);
  const [tableCodePrefix, setTableCodePrefix] = useState("");
  // The hotel as it was when the edit form opened; null when creating.
  const [originalHotel, setOriginalHotel] = useState(null);
  // Once the admin types a prefix (or edits an existing hotel) stop
  // overwriting it with the suggestion.
  const [prefixEdited, setPrefixEdited] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    name: false,
    location: false,
    area: false,
    address: false,
    floor: false,
    tablePerFloor: false,
    chairsPerTable: false,
    prefix: false,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [showDeleteHotel, setShowDeleteHotel] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);

  const [updateHotel, setUpdateHotel] = useState(false);
  const fetchHotels = async () => {
    setLoadingHotelListApp(true);
    try {
      const hotels = await getAllHotel();
      setListOfHotel(hotels?.data); // <-- changed from `value` to `hotels`
      setLoadingHotelListApp(false);
    } catch (err) {
      console.error("fetchHotels error", err);
    }
  };

  useEffect(() => {
    fetchHotels();
    // ...existing code...
  }, []);

  useEffect(() => {
    if (selectedLocation.length === 0) {
      setGetLocationBasedArea([]);
      return;
    }

    const selectedLocationId = String(selectedLocation[0]?.id);
    setGetLocationBasedArea(
      (areaList?.data || []).filter(
        (area) => String(area.location_id) === selectedLocationId,
      ),
    );
  }, [selectedLocation, areaList?.data]);

  // Suggested table code prefix: 2 letters of the hotel + first letter of the
  // location + first letter of the area (Sangeetha, Chennai, T Nagar -> SACT).
  useEffect(() => {
    if (prefixEdited) return;
    setTableCodePrefix(
      suggestTablePrefix(
        hotelName,
        selectedLocation[0]?.name,
        selectedArea[0]?.name,
      ),
    );
  }, [hotelName, selectedLocation, selectedArea, prefixEdited]);

  const fetchCreateHotel = async (hotelData) => {
    try {
      const response = await createHotelAPi(hotelData);
      showToast({
        message:
          response?.message || response?.data?.message || "Hotel created successfully",
        variant: "success",
      });
      setShowCreateHotelForm(false);
      fetchHotels();
    } catch (error) {
      // Keep the form open so the admin can fix e.g. a duplicate prefix.
      console.error("Error creating hotel:", error);
      showToast({
        message: apiErrorMessage(error, "Failed to create hotel"),
        variant: "danger",
      });
    }
  };
  const fetchUpdateHotel = async (hotelData, hotelId) => {
    try {
      const response = await updateHotelbyid(hotelData, hotelId);
      showToast({
        message: response?.message || "Hotel updated successfully",
        variant: "success",
      });
      setShowCreateHotelForm(false);
      fetchHotels();
    } catch (error) {
      console.error("Error updating hotel:", error);
      showToast({
        message: apiErrorMessage(error, "Failed to update hotel"),
        variant: "danger",
      });
    }
  };

  const selectedHotelLocated = (value) => {
    setSelectedLocation(value);
    setSelectedArea([]);
    setErrorMessage({ ...errorMessage, location: false });
  };

  const selectedHotelArea = (value) => {
    setSelectedArea(value);
    setErrorMessage({ ...errorMessage, area: false });
  };

  const closeShowPopup = () => {
    setShowCreateHotelForm(false);
    setShowCreateHotelForm(false);
    setErrorMessage({
      name: false,
      location: false,
      area: false,
      address: false,
      floor: false,
      tablePerFloor: false,
      chairsPerTable: false,
    });
  };

  const handleUpdateHotel = (hotelData) => {
    // Logic to update hotel
    setShowCreateHotelForm(!showCreateHotelForm);
    setHotelName(hotelData[0].hotel_name);
    setSelectedArea(renderArea(hotelData[0].area_id, areaList?.data || []));
    setSelectedLocation(
      renderLocation(hotelData[0].location_id, locationList?.data || []),
    );
    setHotelAddress(hotelData[0].address);
    setHotelFloorCount(hotelData[0].floorCount);
    setHotelTableCount(hotelData[0].tables_per_floor);
    setHotelChairsPerTable(hotelData[0].chairs_per_table);
    setTableCodePrefix(hotelData[0].table_code_prefix || "");
    setPrefixEdited(Boolean(hotelData[0].table_code_prefix));
    setOriginalHotel(hotelData[0]);
  };

  /** HANDLE HOTEL TABLE VIEW */
  const handleHotelView = (
    hotelId,
    hotelData,
    isEditable = true,
    isBooking = false,
  ) => {
    if (hotelId) {
      navigate(`/details/${hotelId}`, {
        state: {
          hotelData,
          isEditable,
          isBooking,
          from: { label: "Hotels", path: "/hotellist" },
        },
      });
    }
  };

  /** HANDLE EDIT OR DELETE TABLE  VALUE */
  const handleEditDeleteValue = (e, getVal, rowData) => {
    console.log("e", getVal);

    if (e === "Delete") {
      deleteConfirmation(getVal);
    } else {
      const getHotelId = getVal;
      const getHotelData = listOfHotel.filter(
        (hotel) => hotel.id === getHotelId,
      );
      handleUpdateHotel(getHotelData);
      setSeletedHotelId(getHotelData);
      setUpdateHotel(true);
    }
  };

  /** DELETE CONFIRMATION POPUP */
  const deleteConfirmation = (id) => {
    setSelectedId(id);
    setShowDeleteHotel(true);
  };

  /** HANDLE DELETE ORDER */
  const handleDeleteOrder = async (param) => {
    setShowDeleteHotel(false);

    try {
      // baseAPI resolves to the response body: { success, message }.
      const response = await deleteHotel({
        hotel_id: param,
      });
      if (response?.success) {
        showToast({
          message: response.message || "Hotel deleted successfully",
          variant: "success",
        });
        const hotels = await getAllHotel();
        setListOfHotel(hotels?.data);
        setLoadingHotelListApp(false);
      } else {
        showToast({
          message: response?.message || "Unable to delete the hotel.",
          variant: "danger",
        });
      }
    } catch (error) {
      // e.g. 409: the hotel still has active bookings or open orders.
      showToast({
        message: getApiErrorMessage(error) || "Unable to delete the hotel.",
        variant: "danger",
      });
    }
  };
  const handleCreateHotelShow = () => {
    // Logic to create hotel
    setShowCreateHotelForm(!showCreateHotelForm);
    setHotelName("");
    setSelectedArea([]);
    setSelectedLocation([]);
    setHotelAddress("");
    setHotelFloorCount("");
    setHotelTableCount("");
    setHotelChairsPerTable("");
    setTableCodePrefix("");
    setPrefixEdited(false);
    setUpdateHotel(false);
    setOriginalHotel(null);
  };

  const handleTableCodePrefix = (e) => {
    setTableCodePrefix(normalizeTablePrefix(e.target.value));
    setPrefixEdited(true);
    setErrorMessage({ ...errorMessage, prefix: false });
  };

  const handleCreateHotel = (e) => {
    // Trim on submit, not per keystroke, so spaces can be typed.
    setHotelName(e.target.value);
    setErrorMessage({ ...errorMessage, name: false });
  };
  const handleCreateHotelAddress = (e) => {
    // Logic to create hotel
    setHotelAddress(e.target.value);
    setErrorMessage({ ...errorMessage, address: false });
  };
  const handleCreateHotelFloorCount = (e) => {
    // Logic to create hotel
    const hotelFloorCount = e.target.value.trim();
    setHotelFloorCount(hotelFloorCount);
    setErrorMessage({ ...errorMessage, floor: false });
  };
  const handleCreateHotelTablePerFloor = (e) => {
    // Logic to create hotel
    const hotelTablePerFloor = e.target.value.trim();
    setHotelTableCount(hotelTablePerFloor);
    setErrorMessage({ ...errorMessage, tablePerFloor: false });
  };
  const handleCreateHotelChairsPerTable = (e) => {
    // Logic to create hotel
    const hotelChairsPerTable = e.target.value.trim();
    setHotelChairsPerTable(hotelChairsPerTable);
    setErrorMessage({ ...errorMessage, chairsPerTable: false });
  };

  // Edit mode only: true once any field differs from the hotel as loaded.
  const norm = (value) => String(value ?? "").trim();
  const hasChanges =
    !originalHotel ||
    [
      [hotelName, originalHotel.hotel_name],
      [selectedLocation[0]?.id, originalHotel.location_id],
      [selectedArea[0]?.id, originalHotel.area_id],
      [hotelAddress, originalHotel.address],
      [hotelFloorCount, originalHotel.floorCount],
      [hotelTableCount, originalHotel.tables_per_floor],
      [hotelChairsPerTable, originalHotel.chairs_per_table],
      [tableCodePrefix, originalHotel.table_code_prefix],
    ].some(([current, original]) => norm(current) !== norm(original));

  const handleCreateHotelSubmit = (action) => {
    // Logic to create hotel
    const prefixValid = TABLE_PREFIX_PATTERN.test(tableCodePrefix);
    if (
      hotelName.trim() !== "" &&
      hotelAddress.trim() !== "" &&
      hotelFloorCount !== "" &&
      hotelTableCount !== "" &&
      hotelChairsPerTable !== "" &&
      prefixValid
    ) {
      const hotelData = {
        hotel_name: hotelName.trim(),
        location_id: selectedLocation[0]?.id, // Assuming single selection
        area_id: selectedArea[0]?.id, // Assuming single selection
        address: hotelAddress.trim(),
        floor_per_hotel: parseInt(hotelFloorCount, 10),
        tables_per_floor: parseInt(hotelTableCount, 10),
        chairs_per_table: parseInt(hotelChairsPerTable, 10),
        table_code_prefix: tableCodePrefix,
      };
      if (action === "Update") {
        if (hasChanges) {
          fetchUpdateHotel(hotelData, seletedHotelId[0].id);
        } else {
          showToast({
            message: "No changes detected to update",
            variant: "danger",
          });
          setShowCreateHotelForm(false);
        }
      } else {
        fetchCreateHotel(hotelData);
      }
    } else {
      setErrorMessage({
        name: hotelName.trim() === "" ? true : false,
        location: selectedLocation.length === 0 ? true : false,
        area: selectedArea.length === 0 ? true : false,
        address: hotelAddress.trim() === "" ? true : false,
        floor: hotelFloorCount === "" ? true : false,
        tablePerFloor: hotelTableCount === "" ? true : false,
        chairsPerTable: hotelChairsPerTable === "" ? true : false,
        prefix: !prefixValid,
      });
    }
  };

  const handleCancel = () => {
    // Logic to create hotel
    setShowCreateHotelForm(false);
    setErrorMessage({
      name: false,
      location: false,
      area: false,
      address: false,
      floor: false,
      tablePerFloor: false,
      chairsPerTable: false,
    });
  };
  const fetchSearchHotel = async (value) => {
    setLoadingHotelListApp(true);
    try {
      const response = await searchHotelbyNameLocation(value);
      if (response.success) {
        const hotels = response.data;
        setListOfHotel(hotels);
        setLoadingHotelListApp(false);
      }
    } catch (error) {
      console.error("Error updating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };

  // The form body scrolls, so bring a freshly opened dropdown list into view
  // instead of leaving it below the fold.
  const revealOpenDropdown = () => {
    requestAnimationFrame(() => {
      document
        .querySelector(".hotel-form .react-dropdown-select-dropdown")
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  const handleSearchHotel = (e) => {
    // Logic to Search hotel
    const getValue = e.target.value;
    if (getValue?.length > 2) {
      fetchSearchHotel(getValue);
    } else if (getValue?.length === 0) {
      fetchHotels();
    }
  };

  const hotelTotals = useMemo(() => {
    const sum = (key) =>
      (listOfHotel || []).reduce((total, hotel) => {
        const value = Number(getHotelCounts(hotel)[key]);
        return Number.isFinite(value) ? total + value : total;
      }, 0);
    return {
      hotels: listOfHotel?.length || 0,
      floors: sum("floorCount"),
      tables: sum("tableCount"),
      seats: sum("seatCount"),
    };
  }, [listOfHotel]);

  return (
    <Fragment>
      <section className="ui-page">
        <header className="ui-header">
          <div className="ui-header__copy">
            <span className="ui-kicker">Hotel setup</span>
            <h1>Hotels &amp; table layouts</h1>
            <p>Create hotels and configure floors, tables and seating capacity.</p>
          </div>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={handleCreateHotelShow}
          >
            <AddRounded fontSize="small" /> Add hotel
          </button>
        </header>

        <div className="ui-stats">
          {[
            { label: "Hotels", value: hotelTotals.hotels, icon: <ApartmentOutlined /> },
            { label: "Floors", value: hotelTotals.floors, icon: <LayersOutlined /> },
            { label: "Tables", value: hotelTotals.tables, icon: <TableRestaurantOutlined /> },
            { label: "Seats", value: hotelTotals.seats, icon: <EventSeatOutlined /> },
          ].map((stat) => (
            <div className="ui-stat" key={stat.label}>
              <span className="ui-stat__icon" aria-hidden>
                {stat.icon}
              </span>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ui-toolbar">
          <label className="ui-search">
            <SearchRounded aria-hidden />
            <input
              type="search"
              onChange={handleSearchHotel}
              placeholder="Search by hotel name or location"
              aria-label="Search hotels"
            />
          </label>
          <span className="ui-toolbar__count">
            {listOfHotel?.length || 0} hotel
            {listOfHotel?.length === 1 ? "" : "s"}
          </span>
        </div>

        {loadingHotelListApp ? (
          <SkeletonLoading
            count={3}
            flexDirection="row"
            flexWrap="wrap"
            height="230px"
            width="min(100%, 360px)"
            borderRadius="18px"
          />
        ) : listOfHotel?.length > 0 ? (
          <div className="hl-grid">
            {listOfHotel.map((hotel) => {
              const locationName =
                renderLocation(hotel.location_id, locationList?.data || [])[0]
                  ?.name || "N/A";
              const areaName =
                renderArea(hotel.area_id, areaList?.data || [])[0]?.name ||
                "N/A";
              const { floorCount, tablesPerFloor, tableCount, seatCount } =
                getHotelCounts(hotel);
              const hotelName = hotel.hotel_name || "Unnamed Hotel";
              const initials = hotelName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0].toUpperCase())
                .join("");

              return (
                <article className="hl-card" key={hotel.id}>
                  <div className="hl-card__head">
                    <span className="hl-card__avatar" aria-hidden>
                      {initials}
                    </span>
                    <div className="hl-card__identity">
                      <button
                        type="button"
                        className="hl-card__name"
                        onClick={() => handleHotelView(hotel.id, hotel, true)}
                        title="Edit table layout"
                      >
                        {hotelName}
                      </button>
                      <p className="hl-card__address">
                        {hotel.address || "Address not provided"}
                      </p>
                    </div>
                    <div className="hl-card__icons">
                      <button
                        type="button"
                        className="ui-icon-btn"
                        aria-label={`Edit ${hotelName}`}
                        title="Edit hotel"
                        onClick={() =>
                          handleEditDeleteValue("Edit", hotel.id, hotel)
                        }
                      >
                        <EditOutlined fontSize="small" />
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn ui-icon-btn--danger"
                        aria-label={`Delete ${hotelName}`}
                        title="Delete hotel"
                        disabled={hotel?.isProcessOrder}
                        onClick={() =>
                          handleEditDeleteValue("Delete", hotel.id, hotel)
                        }
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <p className="hl-card__place">
                    <LocationOnOutlined aria-hidden />
                    {areaName} · {locationName}
                  </p>

                  <dl className="hl-card__metrics">
                    <div>
                      <dt>Floors</dt>
                      <dd>{floorCount}</dd>
                    </div>
                    <div>
                      <dt>Tables</dt>
                      <dd>
                        {tableCount}
                        <small>{tablesPerFloor} / floor</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Seats</dt>
                      <dd>{seatCount}</dd>
                    </div>
                  </dl>

                  <div className="hl-card__actions">
                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost"
                      onClick={() => handleHotelView(hotel.id, hotel, true)}
                    >
                      <GridViewOutlined fontSize="small" /> Edit layout
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn--primary"
                      onClick={() =>
                        handleHotelView(hotel.id, hotel, false, true)
                      }
                    >
                      <TableRestaurantOutlined fontSize="small" /> Book table
                    </button>
                    {isAdminUser && (
                      <button
                        type="button"
                        className="ui-btn hl-card__order"
                        onClick={() => setOrderHotel(hotel)}
                      >
                        <ReceiptLongOutlined fontSize="small" /> Create order
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ui-empty">
            <ApartmentOutlined />
            <h2>No hotels found</h2>
            <p>Add a hotel to start configuring floors and tables.</p>
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={handleCreateHotelShow}
            >
              <AddRounded fontSize="small" /> Add hotel
            </button>
          </div>
        )}
      </section>
      {showCreateHotelForm && (
        <PopupModal
          show={showCreateHotelForm}
          onClose={closeShowPopup}
          className="hotel-form__body"
          customClassName="hotel-form-dialog"
          header={true}
          title={
            <span className="hotel-form__title">
              <span className="hotel-form__title-icon" aria-hidden>
                <ApartmentOutlined fontSize="small" />
              </span>
              <span>
                <strong>{updateHotel ? "Edit hotel" : "Create new hotel"}</strong>
                <small>
                  {updateHotel
                    ? "Update the hotel details and table capacity."
                    : "Set up the hotel and its initial table capacity."}
                </small>
              </span>
            </span>
          }
        >
          <div className="hotel-form">
            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Hotel information</h3>
              <div className="hotel-form__grid">
                <div className="hotel-form__field hotel-form__field--full">
                  <label className="hotel-form__label" htmlFor="hotel-form-name">
                    Name <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-name"
                    type="text"
                    className="hotel-form__input"
                    onChange={handleCreateHotel}
                    placeholder="Enter hotel name"
                    value={hotelName}
                  />
                  {errorMessage.name && (
                    <span className="hotel-form__error">Hotel name is required</span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label">
                    Location <sup>*</sup>
                  </label>
                  {locationList?.data && (
                    <SelectDropDown
                      multi={false}
                      options={locationList?.data || []}
                      labelField={"name"}
                      valueField={"id"}
                      values={selectedLocation || []}
                      searchable={true}
                      placeholder={"Select location"}
                      className="single-select-dropdownRenderer hotel-form__select"
                      disabled={
                        hotelName === "" || locationList?.data?.length === 0
                          ? true
                          : false
                      }
                      onChange={selectedHotelLocated}
                      dropdownPosition="bottom"
                      dropdownHeight="220px"
                      onDropdownOpen={revealOpenDropdown}
                      optionType="radio"
                    />
                  )}
                  {errorMessage.location && (
                    <span className="hotel-form__error">Location is required</span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label">
                    Area <sup>*</sup>
                  </label>
                  {areaList?.data && (
                    <SelectDropDown
                      multi={false}
                      options={getLocationBasedArea || []}
                      labelField={"name"}
                      valueField={"id"}
                      values={selectedArea || []}
                      searchable={true}
                      placeholder={"Select area"}
                      className="single-select-dropdownRenderer hotel-form__select"
                      disabled={
                        hotelName === "" || locationList?.data?.length === 0
                          ? true
                          : false
                      }
                      onChange={selectedHotelArea}
                      dropdownPosition="bottom"
                      dropdownHeight="220px"
                      onDropdownOpen={revealOpenDropdown}
                      optionType="radio"
                    />
                  )}
                  {errorMessage.area && (
                    <span className="hotel-form__error">Area is required</span>
                  )}
                </div>
                <div className="hotel-form__field hotel-form__field--full">
                  <label className="hotel-form__label" htmlFor="hotel-form-address">
                    Address <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-address"
                    type="text"
                    className="hotel-form__input"
                    onChange={handleCreateHotelAddress}
                    placeholder="Street, landmark"
                    value={hotelAddress}
                  />
                  {errorMessage.address && (
                    <span className="hotel-form__error">Address is required</span>
                  )}
                </div>
              </div>
            </section>

            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Seating capacity</h3>
              <div className="hotel-form__grid hotel-form__grid--three">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="hotel-form-floors">
                    Floors <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-floors"
                    type="number"
                    min="1"
                    className="hotel-form__input"
                    onChange={handleCreateHotelFloorCount}
                    placeholder="e.g. 2"
                    value={hotelFloorCount}
                  />
                  {errorMessage.floor && (
                    <span className="hotel-form__error">Floor count is required</span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="hotel-form-tables">
                    Tables per floor <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-tables"
                    type="number"
                    min="1"
                    className="hotel-form__input"
                    onChange={handleCreateHotelTablePerFloor}
                    placeholder="e.g. 10"
                    value={hotelTableCount}
                  />
                  {errorMessage.tablePerFloor && (
                    <span className="hotel-form__error">Table count is required</span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="hotel-form-chairs">
                    Chairs per table <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-chairs"
                    type="number"
                    min="1"
                    className="hotel-form__input"
                    onChange={handleCreateHotelChairsPerTable}
                    placeholder="e.g. 4"
                    value={hotelChairsPerTable}
                  />
                  {errorMessage.chairsPerTable && (
                    <span className="hotel-form__error">Chair count is required</span>
                  )}
                </div>
              </div>
              <div className="hotel-form__grid hotel-form__grid--prefix">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="hotel-form-prefix">
                    Table code prefix <sup>*</sup>
                  </label>
                  <input
                    id="hotel-form-prefix"
                    type="text"
                    className="hotel-form__input hotel-form__input--code"
                    onChange={handleTableCodePrefix}
                    placeholder="e.g. SACT"
                    value={tableCodePrefix}
                    maxLength={8}
                    autoComplete="off"
                  />
                  {errorMessage.prefix ? (
                    <span className="hotel-form__error">
                      Use 2–8 letters or digits
                    </span>
                  ) : (
                    <span className="hotel-form__hint">
                      {prefixEdited
                        ? "Custom prefix"
                        : "Suggested from hotel, location and area — you can change it"}
                    </span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <span className="hotel-form__label">Table codes</span>
                  <p className="hotel-form__codes">
                    {tableCodePrefix
                      ? (() => {
                          const total =
                            Number(hotelFloorCount) * Number(hotelTableCount) || 0;
                          const code = (n) =>
                            `${tableCodePrefix}${String(n).padStart(4, "0")}`;
                          if (total <= 0) return `${code(1)}, ${code(2)} …`;
                          return total === 1
                            ? code(1)
                            : `${code(1)} → ${code(total)}`;
                        })()
                      : "Enter a prefix"}
                  </p>
                </div>
              </div>
              <p className="hotel-form__summary">
                <TableRestaurantOutlined fontSize="small" />
                {Number(hotelFloorCount) * Number(hotelTableCount) || 0} tables
                <span aria-hidden>·</span>
                <EventSeatOutlined fontSize="small" />
                {Number(hotelFloorCount) *
                  Number(hotelTableCount) *
                  Number(hotelChairsPerTable) || 0}{" "}
                seats in total
              </p>
            </section>
          </div>

          <div className="hotel-form__actions">
            <button
              type="button"
              className="hotel-form__btn hotel-form__btn--ghost"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="hotel-form__btn hotel-form__btn--primary"
              onClick={() =>
                handleCreateHotelSubmit(updateHotel ? "Update" : "Create")
              }
              disabled={updateHotel && !hasChanges}
              title={
                updateHotel && !hasChanges ? "Change something to save" : undefined
              }
            >
              {updateHotel ? "Save changes" : "Create hotel"}
            </button>
          </div>
        </PopupModal>
      )}
      <ConfirmDialog
        show={showDeleteHotel}
        title={`Delete ${
          listOfHotel?.find((hotel) => hotel.id === selectedId)?.hotel_name ||
          "this hotel"
        }?`}
        message="Its floors, tables and seats will be removed too. This can't be undone."
        confirmLabel="Delete hotel"
        onConfirm={() => handleDeleteOrder(selectedId)}
        onCancel={() => {
          setShowDeleteHotel(false);
          setSeletedHotelId(null);
        }}
      />
      <CreateOrderDialog
        show={orderHotel !== null}
        hotelId={orderHotel?.id ?? ""}
        hotelName={orderHotel?.hotel_name ?? ""}
        onClose={() => setOrderHotel(null)}
      />
    </Fragment>
  );
};

export default CreateHotel;
