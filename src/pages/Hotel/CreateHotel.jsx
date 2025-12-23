import React, { Fragment, useEffect, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import { getAllHotel, updateHotelbyid } from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import Table from "components/common/Table";
import { createColumnHelper } from "@tanstack/react-table";
import { createHotelAPi } from "services";
import useToast from "hooks/useToast";
import * as images from "../../assets/images/index";

const CreateHotel = () => {
  const [listOfHotel, setListOfHotel] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [showCreateHotelForm, setShowCreateHotelForm] = useState(false);
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();
  const [getLocationBasedArea, setGetLocationBasedArea] = useState([]);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "orderDate",
    sortOrder: "desc",
  });
  const columnHelper = createColumnHelper();
  const [sorting, setSorting] = useState([
    {
      id: "hotel_name",
      desc: false,
    },
  ]);
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

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const hotels = await getAllHotel();
        setListOfHotel(hotels); // <-- changed from `value` to `hotels`
      } catch (err) {
        console.error("fetchHotels error", err);
      }
    };

    fetchHotels();
    // ...existing code...
  }, []);

  useEffect(() => {
    if(selectedLocation.length > 0) {
    setGetLocationBasedArea(areaList.data.filter((area)=>area.location_id ===selectedLocation[0].id));
    }

  }, [selectedLocation]);
 
  const fetchCreateHotel = async (hotelData) => {
    try {
      const response = await createHotelAPi(hotelData);
      // Optionally, refresh the hotel list or provide user feedback here
      showToast({
        message: response.data.message || "Hotel created successfully",
        variant: "success",
      });
      if (response) {
        const hotels = await getAllHotel();
        setListOfHotel(hotels);
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
    try {
      const response = await updateHotelbyid(hotelData, hotelId);
      showToast({
        message: response.data.message || "Hotel updated successfully",
        variant: "success",
      });
      if (response) {
        const hotels = await getAllHotel();
        setListOfHotel(hotels);
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

  const renderLocation = (id, data) => {
    const location = data.filter((loc) => loc.id === id);
    return location ? location : "N/A";
  };

  const renderArea = (id, data) => {
    const area = data.filter((area) => area.id === id);
    return area ? area : "N/A";
  };
  const handleUpdateHotel = (hotelData) => {
    // Logic to update hotel
    setShowCreateHotelForm(!showCreateHotelForm);
    setHotelName(hotelData[0].hotel_name);
    setSelectedArea(renderArea(hotelData[0].area_id, areaList?.data || []));
    setSelectedLocation(
      renderLocation(hotelData[0].location_id, locationList?.data || [])
    );
    setHotelAddress(hotelData[0].address);
    setHotelFloorCount(hotelData[0].floor);
    setHotelTableCount(hotelData[0].tables_per_floor);
    setHotelChairsPerTable(hotelData[0].chairs_per_table);
  };

  /** COLUMNS DEFINITION */
  const columns = [
    columnHelper.accessor("hotel_name", {
      header: () => <span className="customHeader">Hotel Name</span>,
    }),
    columnHelper.accessor("location_id", {
      header: () => <span className="customHeader">Location</span>,
      cell: (info) => {
        return (
          renderLocation(info.getValue(), locationList?.data || [])[0]?.name ||
          "N/A"
        );
      },
    }),
    columnHelper.accessor("area_id", {
      header: () => <span className="customHeader">Area</span>,
      cell: (info) => {
        return (
          renderArea(info.getValue(), areaList?.data || [])[0]?.name || "N/A"
        );
      },
    }),
    columnHelper.accessor("address", {
      header: () => <span className="customHeader">Address</span>,
      // cell: (info) => {
      //   return renderArea(info.getValue(), areaList?.data || [])[0]?.name || "N/A";
      // },
    }),
    columnHelper.accessor("floor", {
      header: () => <span className="customHeader">Number of Floor</span>,
    }),
    columnHelper.accessor("tableCount", {
      header: () => <span className="customHeader">Table Count</span>,
    }),
    columnHelper.accessor("tables_per_floor", {
      header: () => <span className="customHeader">Table Per floor</span>,
    }),
    columnHelper.accessor("seatCount", {
      header: () => <span className="customHeader">Seat Count</span>,
    }),
    columnHelper.accessor("id", {
      header: () => <span className="customHeader">Action</span>,
      cell: (info) => {
        const getHotelId = info.getValue();
        const getHotelData = listOfHotel.data.filter(
          (hotel) => hotel.id === getHotelId
        );
        return (
          <span
            className="edit-icon"
            onClick={() => {
              handleUpdateHotel(getHotelData);
              setSeletedHotelId(getHotelData);
              setUpdateHotel(true);
            }}
          >
            <img src={images.editPencilIcon} alt="Edit" />
          </span>
        );
      },
    }),
  ];

  /** HANDLE TABLE SORT CHANGE */
  const handleSortChange = (columnId, order) => {
    const sortData = { sortBy: columnId, sortOrder: order };
    setSortConfig(sortData);
    setHasMoreRecords(true);
    // dispatch({
    //   type: "SET_FILTER",
    //   payload: mergedFilters,
    // });
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
        floor: parseInt(hotelFloorCount, 10),
        tables_per_floor: parseInt(hotelTableCount, 10),
        chairs_per_table: parseInt(hotelChairsPerTable, 10),
      };
      if (action === "Update") {
        const oldData = listOfHotel.data.find(
          (hotel) => hotel.id === seletedHotelId[0].id
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

  return (
    <Fragment>
      <div className="create-hotel-page">
        <div className="create-hotel-page-flex">
          <div className="create-hotel-page-flex-column">
            <button className="createHotel" onClick={handleCreateHotelShow}>
              Create
            </button>
          </div>
          <div className="create-hotel-page-flex-column"></div>
        </div>
      </div>
      {listOfHotel?.data?.length > 0 && (
        <Table
          columns={columns}
          columnData={listOfHotel.data}
          className={"products__body-table dashboard_table"}
          onSortingChange={handleSortChange}
          sorting={sorting}
          setSorting={setSorting}
          tableName="Order_list"
          noDataContent={"Do not render any no data content while loading"}
          tableHeight={"80vh"}
          //loading={props?.loading}
          //onScrollEnd={handleInfiniteScroll}
        />
      )}
      {showCreateHotelForm && (
        <PopupModal
          show={showCreateHotelForm}
          onClose={closeShowPopup}
          className={"create-hotel-page-popup-content bg-white rounded-4"}
          width={"40vh"}
          header={true}
          title={<span className="move-to-aarow">&#160;&#160;Hotel</span>}
        >
          <Fragment>
            <Row className="p-2 top-content">
              <Col lg={5} md={5} xs={10} className="my-2">
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
              <Col lg={5} md={5} xs={10} className="my-2">
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
              <Col lg={5} md={5} xs={10} className="my-2">
                <label className="create-hotel-label">
                  Area <sup>*</sup>
                </label>
                {locationList?.data && (
                  <SelectDropDown
                    multi={false}
                    options={getLocationBasedArea || []}
                    labelField={"name"}
                    valueField={"id"}
                    values={selectedArea || []}
                    searchable={true}
                    placeholder={"Select Area"}
                    className="single-select-dropdownRenderer"
                    disabled={selectedLocation?.length === 0 ? true : false}
                    onChange={selectedHotelArea}
                    dropdownPosition="auto"
                    optionType="radio"
                  />
                )}
                {errorMessage.area && (
                  <label className="error-label">
                    <sup>*</sup> Hotel Area required
                  </label>
                )}
              </Col>
              <Col lg={5} md={5} xs={10} className="my-2">
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
              <Col lg={5} md={5} xs={10} className="my-2">
                <label className="create-hotel-label">
                  Floor Count <sup>*</sup>
                </label>
                <input
                  type="text"
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
              <Col lg={5} md={5} xs={10} className="my-2">
                <label className="create-hotel-label">
                  Table Per Floor <sup>*</sup>
                </label>
                <input
                  type="text"
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
              <Col lg={5} md={5} xs={10} className="my-2">
                <label className="create-hotel-label">
                  Chairs Per Table <sup>*</sup>
                </label>
                <input
                  type="text"
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
                  {updateHotel ? "Update" : "Submit"}
                </button>{" "}
                <button className="btn btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </Col>
            </Row>
          </Fragment>
        </PopupModal>
      )}
    </Fragment>
  );
};

export default CreateHotel;
