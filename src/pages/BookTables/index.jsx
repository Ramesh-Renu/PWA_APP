import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  getAllHotel,
  searchHotelbyNameLocation,
  deleteHotel,
  getAllMenu,
  getReservationByUser,
  getAllOrders
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
import useAuth from "hooks/useAuth";
import BookedTableDetails from "pages/TableDetails/BookedTableDetails";
import ReservationPage from "pages/BoockedList/ReservationPage";
import OrderHistory from "pages/OrderHistory/OrderHistory";
import { Avatar, Button, Paper } from "@mui/material";

const BookTables = () => {
  const [activeTab, setActiveTab] = useState("availability");
  const [{ data: auth }] = useAuth();
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
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
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

  useEffect(() => {
    if (activeTab === "menu") {
      loadMenus();
    }
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab]);

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

  const loadMenus = async () => {
    setLoadingMenus(true);
    try {
      const res = await getAllMenu({});
      const rows = res?.rows || res?.data || [];
      setMenus(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error loading menus:", error);
    } finally {
      setLoadingMenus(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await getAllOrders();
      // Accept several common response shapes from the API
      // e.g. { rows: [...] } or { data: [...] } or { data: { rows: [...] } }
      const rows =
        response?.rows || response?.data || response?.data?.rows || [];
      console.log("loadOrders response:", response);

      setOrders(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };
  /** HANDLE HOTEL TABLE VIEW */
  const handleHotelView = (
    hotelId,
    hotelData,
    isEditable = false,
    isBooking = false,
  ) => {
    if (hotelId) {
      navigate(`/book-table/details/${hotelId}`, {
        state: { hotelData, isEditable, isBooking },
      });
    }
  };

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
    // if (tab === "reservations") {
    //   navigate("/booked-table");
    //   return;
    // }

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
  console.log("activeTab", activeTab);

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
            {activeTab === "reservations" && (
              <main className="customer-booking-main customer-booking-main--reservations">
                <div className="customer-booking-title-row">
                  <div className="customer-booking-title-content">
                    <h2>Reservations</h2>
                  </div>
                </div>
                <ReservationPage />
              </main>
            )}
            {activeTab === "availability" && (
              <main className="customer-booking-main">
                <div className="customer-booking-title-row">
                  <div>
                    <h2>Check Availability</h2>
                    <p>
                      {listOfHotel?.length || 0} restaurants available for
                      booking
                    </p>
                  </div>
                </div>

                <div className="customer-booking-search-card">
                  <label htmlFor="hotel-search">
                    Restaurant, location or area
                  </label>
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
                    <div className="customer-booking-empty">
                      Loading restaurants...
                    </div>
                  )}

                  {!loadingHotelListApp &&
                    listOfHotel?.map((hotel) => {
                      const locationName =
                        renderLocation(
                          hotel?.location_id,
                          locationList?.data || [],
                        )[0]?.name || "N/A";
                      const areaName =
                        renderArea(hotel?.area_id, areaList?.data || [])[0]
                          ?.name || "N/A";

                      return (
                        <article
                          className="customer-booking-card"
                          key={hotel.id}
                        >
                          <div className="customer-booking-card__head">
                            <div>
                              <h3>{hotel?.hotel_name || "Restaurant"}</h3>
                              <p>
                                {areaName} • {locationName}
                              </p>
                            </div>
                            <span className="customer-booking-status">
                              Available
                            </span>
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
                              onClick={() =>
                                handleHotelView(hotel?.id, hotel, false, true)
                              }
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              className="customer-booking-actions__primary"
                              onClick={() =>
                                handleHotelView(hotel?.id, hotel, false, true)
                              }
                            >
                              Book Table
                            </button>
                          </div>
                        </article>
                      );
                    })}

                  {!loadingHotelListApp && listOfHotel?.length === 0 && (
                    <div className="customer-booking-empty">
                      No restaurants found. Try a different restaurant, location
                      or area.
                    </div>
                  )}
                </div>

                <div className="customer-booking-cta">
                  <h3>Book Another Table</h3>
                  <p>Find and reserve your next dining experience</p>
                  <button type="button">Make a New Reservation</button>
                </div>
              </main>
            )}
            {activeTab === "menu" && (
              <main className="customer-booking-main">
                <div className="customer-booking-title-row">
                  <div>
                    <h2>Menu</h2>
                    <p>Menu items grouped by restaurant</p>
                  </div>
                </div>
                {loadingMenus ? (
                  <div className="customer-booking-empty">Loading menu...</div>
                ) : menus.length === 0 ? (
                  <div className="customer-booking-empty">
                    No menu items found.
                  </div>
                ) : (
                  <div className="menu-group-table">
                    <Paper className="menu-table-panel">
                      <table className="menu-table">
                        <thead>
                          <tr>
                            <th>Hotel</th>
                            <th>Image</th>
                            <th>Menu Name</th>
                            <th>Side Dishes</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Veg</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                        {menus.map((menu, idx) => {
                            const menuId = menu.id ?? menu.menu_id;
                            const menuName = menu.menu_name ?? menu.name;
                            const imageUrl = menu.image_url ?? menu.image;
                            const categoryName = menu.category_name ?? menu.category?.category_name;
                            const hotelId = menu.hotel_id ?? menu?.hotel?.id ?? "unknown";
                            const hotelName = menu?.hotel?.hotel_name || menu?.hotel?.name || `Hotel ${hotelId}`;

                            const sameHotelCount = menus.filter(
                              (h) => (h.hotel_id ?? h?.hotel?.id ?? "unknown") === hotelId,
                            ).length;

                            const firstIndexForHotel = menus.findIndex(
                              (h) => (h.hotel_id ?? h?.hotel?.id ?? "unknown") === hotelId,
                            );

                            const showHotelCell = idx === firstIndexForHotel;

                            return (
                              <tr key={menuId}>
                                {showHotelCell && (
                                  <td data-label="Hotel" rowSpan={sameHotelCount}>
                                    {hotelName}
                                  </td>
                                )}
                                <td data-label="Image">
                                  {imageUrl ? (
                                    <img src={imageUrl} alt={menuName} className="menu-item-image" />
                                  ) : (
                                    <Avatar className="menu-item-image menu-item-avatar">{menuName?.charAt(0) || "M"}</Avatar>
                                  )}
                                </td>
                                <td data-label="Menu Name">{menuName}</td>
                                <td data-label="Side Dishes">
                                  {menu.sideDishes?.length ? (
                                    <ul className="menu-side-dishes">
                                      {menu.sideDishes.map((dish) => (
                                        <li key={dish.id} className="side-dish-item">{dish.side_dish_name}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td data-label="Category">{categoryName}</td>
                                <td data-label="Price">&#8377; {menu.price}</td>
                                <td data-label="Veg">{menu.is_veg ? "Veg" : "Non Veg"}</td>
                                <td data-label="Status">{menu.is_available ? "Available" : "Unavailable"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Paper>
                  </div>
                )}
              </main>
            )}
            {activeTab === "orders" && (
              <main className="customer-booking-main">
                <div className="customer-booking-title-row">
                  <div>
                    <h2>Orders</h2>
                    <p>Your reservation order history</p>
                  </div>
                </div>
                {loadingOrders ? (
                  <div className="customer-booking-empty">
                    Loading orders...
                  </div>
                ) : (
                  <OrderHistory orders={orders} />
                )}
              </main>
            )}
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
