import React, { Fragment, useEffect, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import {
  getAllHotel,
  updateHotelbyid,
  searchHotelbyNameLocation,
  deleteHotel,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import Table from "components/common/Table";
import TableDetails from "pages/TableDetails/TableDetails";
import { createColumnHelper } from "@tanstack/react-table";
import { createHotelAPi } from "services";
import useToast from "hooks/useToast";
import * as images from "../../assets/images/index";
import { useNavigate } from "react-router-dom";
import ToolTipPopup from "components/common/ToolTipPopup";
import { renderArea, renderLocation } from "utils/common";

const CreateTables = () => {
  const [listOfHotel, setListOfHotel] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [showCreateHotelForm, setShowCreateHotelForm] = useState(false);
  const [showDeleteHotel, setShowDeleteHotel] = useState(false);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(false);
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
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [reloadTable, setReloadTable] = useState(false);

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
      setListOfHotel(hotels.data); // <-- changed from `value` to `hotels`
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
    if (selectedLocation.length > 0) {
      setGetLocationBasedArea(
        areaList.data.filter(
          (area) => area.location_id === selectedLocation[0].id
        )
      );
    }
  }, [selectedLocation]);

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
        setListOfHotel(hotels);
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
        message: response.data.message || "Hotel updated successfully",
        variant: "success",
      });
      if (response) {
        const hotels = await getAllHotel();
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
      setShowCreateHotelForm(false);
    }
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

  /** HANDLE HOTEL TABLE VIEW */
  const handleOrderView = (hotelId, hotelData, isEditable) => {
    if (hotelId) {
      navigate(`/hotel/details/${hotelId}`, {
        state: { hotelData, isEditable },
      });
    }
  };

  /** HANDLE EDIT OR DELETE TABLE  VALUE */
  const handleEditDeleteValue = (e, getVal, rowData) => {
    if (rowData?.isProcessOrder && e.name.props.children.includes("Delete"))
      return;
    if (e.id === 2) {
      deleteConfirmation(getVal);
    } else {
      handleOrderView(getVal, rowData, true);
    }
  };

  /** DELETE CONFIRMATION POPUP */
  const deleteConfirmation = (id) => {
    setSelectedId(id);
    setShowDeleteHotel(true);
  };

  /** COLUMNS DEFINITION */
  const columns = [
    columnHelper.accessor("hotel_name", {
      header: () => <span className="customHeader">Hotel Name</span>,
      cell: (info) => {
        const rowData = info.row.original;
        return (
          <div
            tabIndex={0}
            className="truncate-2-lines"
            title={info.getValue()}
            onClick={() => handleOrderView(rowData?.id, rowData)}
          >
            {info.getValue()}
          </div>
        );
      },
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
    columnHelper.accessor("floorCount", {
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
        const rowData = info.row.original;
        return (
          <div className="mx-auto w-100">
            <ToolTipPopup
              toolTipDatas={[
                {
                  name: (
                    <button className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between">
                      Edit
                      <img
                        src={images.pencilSimpleLine}
                        alt="pencilSimpleLine"
                      />
                    </button>
                  ),
                  id: 1,
                },
                {
                  name: (
                    <button
                      className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
                      disabled={rowData?.isProcessOrder}
                    >
                      Delete
                      <img src={images.trashIcon} alt="Remove Instrument" />
                    </button>
                  ),
                  id: 2,
                },
              ]}
              labelField="name"
              valueField="id"
              getSeletedVal={(e) =>
                handleEditDeleteValue(e, info.getValue(), rowData)
              }
              canEdit={true}
              isCustomFieldswithFilter={false}
              arrow={true}
            />
          </div>
        );
      },
      // cell: (info) => {
      //   const getHotelId = info.getValue();
      //   const getHotelData = listOfHotel.filter(
      //     (hotel) => hotel.id === getHotelId
      //   );
      //   return (
      //     <span
      //       className="edit-icon"
      //       onClick={() => {
      //         handleUpdateHotel(getHotelData);
      //         setSeletedHotelId(getHotelData);
      //         setUpdateHotel(true);
      //       }}
      //     >
      //       <img src={images.editPencilIcon} alt="Edit" />
      //     </span>
      //   );
      // },
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

  const handleSearchHotel = (e) => {
    // Logic to Search hotel
    const getValue = e.target.value;
    if (getValue?.length > 2) {
      fetchSearchHotel(getValue);
    } else if (getValue?.length === 0) {
      fetchHotels();
    }
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
        const oldData = listOfHotel.find(
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

  /** HANDLE DELETE ORDER */
  const handleDeleteOrder = async (param) => {
    setShowDeleteHotel(false);
    try {
      const response = await deleteHotel({
        ticket_id: param,
      });
      if (response?.status) {
        showToast({
          message: response.data.message,
          variant: "success",
        });
        setReloadTable(true);
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

  return (
    <Fragment>
      <div className="create-hotel-page">
        <div className="create-hotel-page-flex">
          <div className="create-hotel-page-flex-column">
            <input
              className="search-hotel"
              onChange={handleSearchHotel}
              placeholder="Search Hotel name/location"
            />
          </div>
          <div className="create-hotel-page-flex-column"></div>
        </div>
      </div>
      {seletedHotelId && seletedHotelId.length > 0 && (
        <div className="table-details-preview p-2">
          <TableDetails data={seletedHotelId[0]} />
        </div>
      )}
      {listOfHotel?.length > 0 && (
        <Table
          columns={columns}
          columnData={listOfHotel}
          className={"products__body-table dashboard_table"}
          onSortingChange={handleSortChange}
          sorting={sorting}
          setSorting={setSorting}
          tableName="Order_list"
          noDataContent={"Do not render any no data content while loading"}
          tableHeight={"calc(100vh - 115px)"}
          // loading={loadingHotelListApp}
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

      {/* DELETE CONFIRMATION POPUP */}

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

export default CreateTables;
