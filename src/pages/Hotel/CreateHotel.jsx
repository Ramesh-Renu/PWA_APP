import React, { Fragment, useEffect, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import {
  getAllHotel,
  updateHotelbyid,
  deleteHotel,
  searchHotelbyNameLocation,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import { createHotelAPi } from "services";
import useToast from "hooks/useToast";
import * as images from "../../assets/images/index";
import { useNavigate } from "react-router-dom";
import ToolTipPopup from "components/common/ToolTipPopup";
import { renderArea, renderLocation } from "utils/common";

const CreateHotel = () => {
  const [listOfHotel, setListOfHotel] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [showCreateHotelForm, setShowCreateHotelForm] = useState(false);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(true);
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
  const [errorMessage, setErrorMessage] = useState({
    name: false,
    location: false,
    area: false,
    address: false,
    floor: false,
    tablePerFloor: false,
    chairsPerTable: false,
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

  const fetchCreateHotel = async (hotelData) => {
    setLoadingHotelListApp(true);
    try {
      const response = await createHotelAPi(hotelData);
      // Optionally, refresh the hotel list or provide user feedback here
      showToast({
        message: response.data.message || "Hotel created successfully",
        variant: "success",
      });
      if (response) {
        const hotels = await getAllHotel();
        setListOfHotel(hotels?.data);
        setLoadingHotelListApp(false);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setShowCreateHotelForm(false);
    }
  };
  const fetchUpdateHotel = async (hotelData, hotelId) => {
    setLoadingHotelListApp(true);
    try {
      const response = await updateHotelbyid(hotelData, hotelId);
      showToast({
        message: response?.message || "Hotel updated successfully",
        variant: "success",
      });
      if (response?.success) {
        const hotels = await getAllHotel();
        setListOfHotel(hotels?.data);
        setLoadingHotelListApp(false);
      }
    } catch (error) {
      console.error("Error updating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setShowCreateHotelForm(false);
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
        state: { hotelData, isEditable, isBooking },
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
    console.log("param", param);

    try {
      const response = await deleteHotel({
        hotel_id: param,
      });
      if (response?.status) {
        showToast({
          message: response.data.message,
          variant: "success",
        });
        const hotels = await getAllHotel();
        setListOfHotel(hotels?.data);
        setLoadingHotelListApp(false);
      } else {
        showToast({
          message: response.data.message,
          variant: "danger",
        });
      }
    } catch (error) {
      showToast({
        message: error?.message || "Something went wrong",
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
  };

  const handleCreateHotel = (e) => {
    // Logic to create hotel
    const hotelName = e.target.value.trim();
    setHotelName(hotelName);
    setErrorMessage({ ...errorMessage, name: false });
  };
  const handleCreateHotelAddress = (e) => {
    // Logic to create hotel
    const hotelAddress = e.target.value.trim();
    setHotelAddress(hotelAddress);
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

  const handleCreateHotelSubmit = (action) => {
    // Logic to create hotel
    if (
      hotelName !== "" &&
      hotelAddress !== "" &&
      hotelFloorCount !== "" &&
      hotelTableCount !== "" &&
      hotelChairsPerTable !== ""
    ) {
      const hotelData = {
        hotel_name: hotelName,
        location_id: selectedLocation[0]?.id, // Assuming single selection
        area_id: selectedArea[0]?.id, // Assuming single selection
        address: hotelAddress,
        floor_per_hotel: parseInt(hotelFloorCount, 10),
        tables_per_floor: parseInt(hotelTableCount, 10),
        chairs_per_table: parseInt(hotelChairsPerTable, 10),
      };
      if (action === "Update") {
        const oldData = listOfHotel?.find(
          (hotel) => hotel.id === seletedHotelId[0].id,
        );
        const compareHotelData = (hotelData, oldData) =>
          Object.keys(hotelData).some((key) => hotelData[key] !== oldData[key])
            ? true
            : false;
        const checkUpdated = compareHotelData(hotelData, oldData);
        if (checkUpdated) {
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
        name: hotelName === "" ? true : false,
        location: selectedLocation.length === 0 ? true : false,
        area: selectedArea.length === 0 ? true : false,
        address: hotelAddress === "" ? true : false,
        floor: hotelFloorCount === "" ? true : false,
        tablePerFloor: hotelTableCount === "" ? true : false,
        chairsPerTable: hotelChairsPerTable === "" ? true : false,
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

  const handleSearchHotel = (e) => {
    // Logic to Search hotel
    const getValue = e.target.value;
    if (getValue?.length > 2) {
      fetchSearchHotel(getValue);
    } else if (getValue?.length === 0) {
      fetchHotels();
    }
  };

  return (
    <Fragment>
      <section className="app-page hotels-admin-page">
        <header className="app-page-header hotels-admin-header">
          <div>
            <span className="page-kicker">HOTEL SETUP</span>
            <h1>Hotels & table layouts</h1>
            <p>
              Create Hotel and configure floors, tables and seating capacity.
            </p>
          </div>
          <div className="header-stat">
            <strong>{listOfHotel?.length || 0}</strong>
            <span>hotel managed</span>
          </div>
        </header>
        <div className="create-hotel-page">
          <div className="create-hotel-page-flex">
            <div className="create-hotel-page-flex-column-one">
              <input
                className="search-hotel"
                onChange={handleSearchHotel}
                placeholder="Search Hotel name/location"
              />
            </div>
            <div className="create-hotel-page-flex-column-two">
              {" "}
              <button className="createHotel" onClick={handleCreateHotelShow}>
                Create
              </button>
            </div>
          </div>
        </div>
        {listOfHotel?.length > 0 && (
          <div className="page-table-shell hotel-list-shell">
            {loadingHotelListApp ? (
              <div className="hotel-list-state">Loading hotel...</div>
            ) : (
              <div className="hotel-list-grid">
                {listOfHotel.map((hotel) => {
                  const locationName =
                    renderLocation(
                      hotel.location_id,
                      locationList?.data || [],
                    )[0]?.name || "N/A";
                  const areaName =
                    renderArea(hotel.area_id, areaList?.data || [])[0]?.name ||
                    "N/A";

                  return (
                    <article className="hotel-list-card" key={hotel.id}>
                      <div className="hotel-list-card__header">
                        <div className="hotel-list-card__identity">
                          <button
                            type="button"
                            className="hotel-list-card__name"
                            onClick={() =>
                              handleHotelView(hotel.id, hotel, true)
                            }
                          >
                            {hotel.hotel_name || "Unnamed Hotel"}
                          </button>
                          <p className="hotel-list-card__address">
                            {hotel.address || "Address not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="hotel-list-card__details">
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Location</span>
                          <span className="name">{locationName}</span>
                        </div>
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Area</span>
                          <span className="name">{areaName}</span>
                        </div>
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Floors</span>
                          <span className="name">
                            {hotel.floorCount ?? hotel.floor_per_hotel ?? "N/A"}
                          </span>
                        </div>
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Tables</span>
                          <span className="name">
                            {hotel.tableCount ?? "N/A"}
                          </span>
                        </div>
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Per floor</span>
                          <span className="name">
                            {hotel.tables_per_floor ?? "N/A"}
                          </span>
                        </div>
                        <div className="hotel-list-card__details--list">
                          <span className="heading">Seats</span>
                          <span className="name">
                            {hotel.seatCount ?? "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="hotel-list-card__footer">
                        <div className="hotel-list-card__footer--first-col">
                          <button
                            className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between"
                            onClick={() =>
                              handleEditDeleteValue("Edit", hotel.id, hotel)
                            }
                          >
                            <img
                              src={images.pencilSimpleLine}
                              alt="Edit Hotel"
                            />
                          </button>

                          <button
                            className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
                            disabled={hotel?.isProcessOrder}
                            onClick={() =>
                              handleEditDeleteValue("Delete", hotel.id, hotel)
                            }
                          >
                            <img src={images.trashIcon} alt="Remove Hotel" />
                          </button>
                        </div>
                        <div className="hotel-list-card__footer--second-col">
                        <button
                          type="button"
                          onClick={() => handleHotelView(hotel.id, hotel, true)}
                        >
                          Open Hotel <span aria-hidden="true">→</span>
                        </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
      {showCreateHotelForm && (
        <PopupModal
          show={showCreateHotelForm}
          onClose={closeShowPopup}
          className={"create-hotel-page-popup-content bg-white rounded-4"}
          size="lg"
          customClassName="hotel-modal-dialog"
          header={true}
          title={
            <span className="move-to-aarow">
              {updateHotel ? "Edit hotel" : "Create new Hotel"}
            </span>
          }
        >
          <Fragment>
            <div className="hotel-form-intro">
              <span>✦</span>
              <div>
                <strong>Hotel information</strong>
                <p>Set up the hotel and its initial table capacity.</p>
              </div>
            </div>
            <Row className="p-2 top-content">
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
                  Name <sup>*</sup>
                </label>
                <input
                  type="text"
                  className="craete-hotel-name"
                  onChange={handleCreateHotel}
                  placeholder="Enter Hotel Name"
                  value={hotelName}
                />
                {errorMessage.name && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Name required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
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
                    placeholder={"Select Location"}
                    className="single-select-dropdownRenderer"
                    disabled={
                      hotelName === "" || locationList?.data?.length === 0
                        ? true
                        : false
                    }
                    onChange={selectedHotelLocated}
                    dropdownPosition="auto"
                    optionType="radio"
                  />
                )}
                {errorMessage.location && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Location required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
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
                    placeholder={"Select Area"}
                    className="single-select-dropdownRenderer"
                    disabled={
                      hotelName === "" || locationList?.data?.length === 0
                        ? true
                        : false
                    }
                    onChange={selectedHotelArea}
                    dropdownPosition="top"
                    optionType="radio"
                  />
                )}
                {errorMessage.area && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Area required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
                  Address <sup>*</sup>
                </label>
                <input
                  type="text"
                  className="craete-hotel-name"
                  onChange={handleCreateHotelAddress}
                  placeholder="Enter Address"
                  value={hotelAddress}
                />
                {errorMessage.address && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Address required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
                  Floor Count <sup>*</sup>
                </label>
                <input
                  type="number"
                  min="1"
                  className="craete-hotel-name"
                  onChange={handleCreateHotelFloorCount}
                  placeholder="Enter floor count"
                  value={hotelFloorCount}
                />
                {errorMessage.floor && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Floor required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
                  Table Per Floor <sup>*</sup>
                </label>
                <input
                  type="number"
                  min="1"
                  className="craete-hotel-name"
                  onChange={handleCreateHotelTablePerFloor}
                  placeholder="Enter table count"
                  value={hotelTableCount}
                />
                {errorMessage.tablePerFloor && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Table Per Floor required
                  </label>
                )}
              </Col>
              <Col lg={6} md={6} xs={12} className="my-2">
                <label className="create-hotel-label">
                  Chairs Per Table <sup>*</sup>
                </label>
                <input
                  type="number"
                  min="1"
                  className="craete-hotel-name"
                  onChange={handleCreateHotelChairsPerTable}
                  placeholder="Enter char count"
                  value={hotelChairsPerTable}
                />
                {errorMessage.chairsPerTable && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Chairs Per Table required
                  </label>
                )}
              </Col>
            </Row>
            <Row className="p-2 top-content">
              <Col lg={12} md={12} xs={12} className="my-2">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    handleCreateHotelSubmit(updateHotel ? "Update" : "Create")
                  }
                >
                  {updateHotel ? "Save changes" : "Create Hotel"}
                </button>{" "}
                <button className="btn btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </Col>
            </Row>
          </Fragment>
        </PopupModal>
      )}
      <PopupModal
        show={showDeleteHotel}
        onClose={() => setShowDeleteHotel(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Delete this Hotel ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() => handleDeleteOrder(selectedId)}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setShowDeleteHotel(false);
                setSeletedHotelId(null);
              }}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>
    </Fragment>
  );
};

export default CreateHotel;
