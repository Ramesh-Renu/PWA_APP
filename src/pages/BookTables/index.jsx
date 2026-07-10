import React, { Fragment, useEffect, useRef, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import {
  getAllHotel,
  searchHotelbyNameLocation,
  deleteHotel,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import Table from "components/common/Table";
import TableDetails from "pages/TableDetails/TableDetails";
import { createColumnHelper } from "@tanstack/react-table";
import useToast from "hooks/useToast";
import * as images from "../../assets/images/index";
import { useNavigate } from "react-router-dom";
import ToolTipPopup from "components/common/ToolTipPopup";
import { renderArea, renderLocation } from "utils/common";

const BookTables = () => {
  const [activeTab, setActiveTab] = useState("availability");
  const [listOfHotel, setListOfHotel] = useState([]);
  const [showDeleteHotel, setShowDeleteHotel] = useState(false);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(false);
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();
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
  const [seletedHotelId, setSeletedHotelId] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [reloadTable, setReloadTable] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);
  const fetchHotels = async () => {
    setLoadingHotelListApp(true);
    try {
      const hotels = await getAllHotel();
      setListOfHotel(hotels.data); // <-- changed from `value` to `hotels`
    } catch (err) {
      console.error("fetchHotels error", err);
    } finally {
      setLoadingHotelListApp(false);
    }
  };
  useEffect(() => {
    fetchHotels();
    // ...existing code...
  }, []);

  const fetchSearchHotel = async (value) => {
    setLoadingHotelListApp(true);
    try {
      const response = await searchHotelbyNameLocation(value);
      if (response.success) {
        const hotels = response.data;
        setListOfHotel(hotels);
      }
    } catch (error) {
      console.error("Error updating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoadingHotelListApp(false);
    }
  };
  /** HANDLE HOTEL TABLE VIEW */
  const handleHotelView = (hotelId, hotelData, isEditable=false, isBooking=false) => {
    if (hotelId) {
      navigate(`/book-table/details/${hotelId}`, {
        state: { hotelData, isEditable, isBooking },
      });
    }
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
            onClick={() => handleHotelView(rowData?.id, rowData, false, true)}
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
    // columnHelper.accessor("tableCount", {
    //   header: () => <span className="customHeader">Table Count</span>,
    // }),
    columnHelper.accessor("tables_per_floor", {
      header: () => <span className="customHeader">Table Per floor</span>,
    }),
    columnHelper.accessor("seatCount", {
      header: () => <span className="customHeader">Seat Count</span>,
    }),
    // columnHelper.accessor("id", {
    //   header: () => <span className="customHeader">Action</span>,
    //   cell: (info) => {
    //     const rowData = info.row.original;
    //     return (
    //       <div className="mx-auto w-100">
    //         <ToolTipPopup
    //           toolTipDatas={[
    //             {
    //               name: (
    //                 <button className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between">
    //                   Edit
    //                   <img
    //                     src={images.pencilSimpleLine}
    //                     alt="Edit Hotel"
    //                   />
    //                 </button>
    //               ),
    //               id: 1,
    //             },
    //             {
    //               name: (
    //                 <button
    //                   className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
    //                   disabled={rowData?.isProcessOrder}
    //                 >
    //                   Delete
    //                   <img src={images.trashIcon} alt="Remove Hotel" />
    //                 </button>
    //               ),
    //               id: 2,
    //             },
    //           ]}
    //           labelField="name"
    //           valueField="id"
    //           getSeletedVal={(e) =>
    //             handleEditDeleteValue(e, info.getValue(), rowData)
    //           }
    //           canEdit={true}
    //           isCustomFieldswithFilter={false}
    //           arrow={true}
    //         />
    //       </div>
    //     );
    //   },
    //   // cell: (info) => {
    //   //   const getHotelId = info.getValue();
    //   //   const getHotelData = listOfHotel.filter(
    //   //     (hotel) => hotel.id === getHotelId
    //   //   );
    //   //   return (
    //   //     <span
    //   //       className="edit-icon"
    //   //       onClick={() => {
    //   //         handleUpdateHotel(getHotelData);
    //   //         setSeletedHotelId(getHotelData);
    //   //         setUpdateHotel(true);
    //   //       }}
    //   //     >
    //   //       <img src={images.editPencilIcon} alt="Edit" />
    //   //     </span>
    //   //   );
    //   // },
    // }),
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

  const handleTabSelect = (tab) => {
    if (tab === "reservations") {
      navigate("/booked-table");
      return;
    }

    setActiveTab(tab);
  };

  const handleNewReservation = () => {
    setActiveTab("availability");
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const tabs = [
    { id: "reservations", label: "Reservations" },
    { id: "availability", label: "Check Availability" },
    { id: "menu", label: "Menu" },
    { id: "orders", label: "Order History" },
  ];

  const renderTabButton = (tab) => (
    <button
      key={tab.id}
      type="button"
      className={activeTab === tab.id ? "active" : ""}
      onClick={() => handleTabSelect(tab.id)}
    >
      {tab.label}
    </button>
  );

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
      <section className="customer-booking-page book-table-page">
        <div className="customer-booking-shell">
          <header className="customer-booking-header">
            <h1>Your Dashboard</h1>
            <p>Welcome back! Find restaurants and reserve your next table.</p>
          </header>

          <div className="customer-booking-tabs customer-booking-tabs--mobile">
            {tabs.map(renderTabButton)}
          </div>

          <div className="customer-booking-grid">
            <aside className="customer-booking-sidebar">
              {tabs.map(renderTabButton)}
            </aside>

            <main className="customer-booking-main">
              <div className="customer-booking-title-row">
                <div>
                  <h2>Check Availability</h2>
                  <p>{listOfHotel?.length || 0} restaurants available for booking</p>
                </div>
              </div>

              <div className="customer-booking-search-card">
                <label htmlFor="hotel-search">Restaurant, location or area</label>
                <input
                  id="hotel-search"
                  className="customer-booking-search"
                  onChange={handleSearchHotel}
                  placeholder="Search by restaurant, location or area..."
                />
              </div>

              {seletedHotelId && seletedHotelId.length > 0 && (
                <div className="table-details-preview p-2">
                  <TableDetails data={seletedHotelId[0]} />
                </div>
              )}

              <div className="customer-booking-list">
                {loadingHotelListApp && (
                  <div className="customer-booking-empty">Loading restaurants...</div>
                )}

                {!loadingHotelListApp &&
                  listOfHotel?.map((hotel) => {
                    const locationName =
                      renderLocation(hotel?.location_id, locationList?.data || [])[0]?.name ||
                      "N/A";
                    const areaName =
                      renderArea(hotel?.area_id, areaList?.data || [])[0]?.name || "N/A";

                    return (
                      <article className="customer-booking-card" key={hotel.id}>
                        <div className="customer-booking-card__head">
                          <div>
                            <h3>{hotel?.hotel_name || "Restaurant"}</h3>
                            <p>{areaName} • {locationName}</p>
                          </div>
                          <span className="customer-booking-status">Available</span>
                        </div>

                        <div className="customer-booking-meta">
                          <div>
                            <span>Address</span>
                            <strong>{hotel?.address || "N/A"}</strong>
                          </div>
                          <div>
                            <span>Floors</span>
                            <strong>{hotel?.floorCount ?? "N/A"}</strong>
                          </div>
                          <div>
                            <span>Seats</span>
                            <strong>{hotel?.seatCount ?? "N/A"}</strong>
                          </div>
                        </div>

                        <div className="customer-booking-actions">
                          <button
                            type="button"
                            onClick={() => handleHotelView(hotel?.id, hotel, false, true)}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            className="customer-booking-actions__primary"
                            onClick={() => handleHotelView(hotel?.id, hotel, false, true)}
                          >
                            Book Table
                          </button>
                        </div>
                      </article>
                    );
                  })}

                {!loadingHotelListApp && listOfHotel?.length === 0 && (
                  <div className="customer-booking-empty">
                    No restaurants found. Try a different restaurant, location or area.
                  </div>
                )}
              </div>

              <div className="customer-booking-cta">
                <h3>Book Another Table</h3>
                <p>Find and reserve your next dining experience</p>
                <button type="button">Make a New Reservation</button>
              </div>
            </main>
          </div>
        </div>
      </section>
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

export default BookTables;
