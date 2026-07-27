import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "hooks/useToast";
import PopupModal from "components/common/PopupModal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  getReservationByUser,
  updateDiningStatus,
  deleteReservation,
} from "services";
import { renderBookingStatus } from "utils/common";
import useGlobalMaster from "hooks/useGlobalMaster";
import * as images from "../../assets/images/index";
import ToolTipPopup from "components/common/ToolTipPopup";
import useAuth from "hooks/useAuth";
import {
  EventNoteOutlined,
  EventAvailableOutlined,
  ConfirmationNumberOutlined,
  HotelOutlined,
  LayersOutlined,
  TableRestaurantOutlined,
  EventSeatOutlined,
} from "@mui/icons-material";
import SkeletonLoading from "components/common/SkeletonLoading";

const BookedTableDetails = ({ data }) => {
  const [bookedData, setBookedData] = useState([]);
  const navigate = useNavigate();
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const { showToast } = useToast();
  const [showCancelBookingSeats, setShowCancelBookingSeats] = useState(false);
  const [cancelBookingSeats, setCancelBookingSeats] = useState(null);
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const [{ data: auth }, { setAuth }] = useAuth();
  const [sortConfig, setSortConfig] = useState({
    sortBy: "orderDate",
    sortOrder: "desc",
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(true);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);

  useEffect(() => {
    if (diningStatusList.data.length === 0) {
      getDiningStatus();
    }
  }, []);

  const allowedStatuses = ["CONFIRMED", "PENDING", "SEATED", "COMPLETED"];

  const fetchHotelbyId = async (hotelData) => {
    setLoadingHotelListApp(true);
    try {
      const response = await getReservationByUser({
        user_id: hotelData.details.id,
      });
      if (response.success) {
        setBookedData(response.data);
        setLoadingHotelListApp(false);
      } else {
        setLoadingHotelListApp(false);
        showToast({
          message: response.message,
          variant: "danger",
        });
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
      setLoadingHotelListApp(false);
    } finally {
      setLoadingHotelListApp(false);
    }
  };

  useEffect(() => {
    fetchHotelbyId(data);
  }, []);

  const updateBookingTableinSeats = async (reservationId) => {
    try {
      const response = await deleteReservation({
        reservation_id: reservationId,
      });
      if (response.success) {
        showToast({
          message: response.message || "Booked seats canceld successfully",
          variant: "success",
        });
        setShowCancelBookingSeats(false);
        fetchHotelbyId(data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      setShowCancelBookingSeats(false);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };

  const updateBookingTableStatus = async (reservationId, statusId) => {
    const body = {
      dining_status: statusId,
    };
    try {
      const response = await updateDiningStatus(reservationId, body);
      if (response.success) {
        showToast({
          message:
            response.message || "Reservation status updated successfully",
          variant: "success",
        });
        setShowCancelBookingSeats(false);
        fetchHotelbyId(data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      setShowCancelBookingSeats(false);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };

  /** HANDLE Status UPDATE VALUE */
  const handleTableStatusUpdate = (e, rowData) => {
    updateBookingTableStatus(rowData.id, e.status_id);
  };

  /** HANDLE EDIT OR DELETE TABLE  VALUE */
  const handleEditDeleteValue = (e, getVal, rowData) => {
    if (
      (rowData?.dining_status > 1 &&
        e.name.props.children.includes("CANCEL")) ||
      rowData?.dining_status === 4
    )
      return;
    if (e.id === 2) {
      deleteConfirmation(getVal);
    } else {
      navigate("/book-table/details/" + rowData.hotel_id, {
        state: { hotel_id: rowData.hotel_id },
      });
    }
  };

  /** DELETE CONFIRMATION POPUP */
  const deleteConfirmation = (id) => {
    setSelectedId(id);
    setShowCancelBookingSeats(true);
  };

  const handleGoToBookingPage = () => {
    navigate("/book-table");
  };

  const formatDate = (date) => {
    return (
      dayjs(date).format("DD-MM-YYYY") + " - " + dayjs(date).format("hh:mm A")
    );
  };

  return (
    <Fragment>
      <section className="app-page reservations-page">
        <div className="page-summary-strip">
          <div>
            <span>All reservations</span>
            <strong>{bookedData?.length || 0}</strong>
          </div>
          <div>
            <span>Confirmed</span>
            <strong>
              {bookedData?.filter((item) => item.dining_status === 1).length ||
                0}
            </strong>
          </div>
          <div>
            <span>Seated</span>
            <strong>
              {bookedData?.filter((item) => item.dining_status === 2).length ||
                0}
            </strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>
              {bookedData?.filter((item) => item.dining_status === 3).length ||
                0}
            </strong>
          </div>
        </div>
        {bookedData?.length > 0 && (
          <div className="page-table-shell hotel-list-shell mt-4">
            {loadingHotelListApp ? (
              <SkeletonLoading
                count={3}
                height="120px"
                width="100%"
                borderRadius="8px"
              />
            ) : (
              <div className="hotel-list-grid">
                {bookedData.map((row) => {
                  const totalSeats = Array.isArray(row.seat_status)
                    ? row.seat_status.reduce(
                        (sum, item) => sum + (item.seat_ids?.length || 0),
                        0,
                      )
                    : 0;
                  const tableCount = Array.isArray(row.seat_status)
                    ? row.seat_status.length
                    : 0;
                  const statusInfo = renderBookingStatus(
                    row.dining_status,
                    diningStatusList?.data || [],
                  )[0] || { name: "N/A", color_code: "#000000" };

                  return (
                    <article className="hotel-list-card" key={row.id}>
                      <div className="hotel-list-card__header">
                        <div className="hotel-list-card__identity">
                          <button
                            type="button"
                            className="hotel-list-card__name"
                            onClick={() =>
                              handleEditDeleteValue(
                                {
                                  id: 1,
                                  name: { props: { children: "EDIT" } },
                                },
                                row.id,
                                row,
                              )
                            }
                          >
                            {row.hotel?.hotel_name || "Unnamed Hotel"}
                          </button>
                          <p className="hotel-list-card__address">
                            Reservation #{row.id}
                          </p>
                        </div>
                        <div
                          className="status-name"
                          style={{
                            backgroundColor: statusInfo.color_code || "#000000",
                            color: "var(--color-white)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            alignSelf: "flex-start",
                          }}
                        >
                          {statusInfo.name}
                        </div>
                      </div>

                      <div className="hotel-list-card__details">
                        <div className="hotel-list-card__details--list">
                          <EventNoteOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#6366f1", fontSize: 18 }}
                          />
                          <span className="name">
                            {formatDate(row.booking_date)}
                          </span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <EventAvailableOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#10b981", fontSize: 18 }}
                          />
                          <span className="name">
                            {formatDate(row.dining_date)}
                          </span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <ConfirmationNumberOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#f59e0b", fontSize: 18 }}
                          />
                          <span className="name">#{row.id}</span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <HotelOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#ef4444", fontSize: 18 }}
                          />
                          <span className="name">
                            {row.hotel?.hotel_name || "N/A"}
                          </span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <LayersOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#8b5cf6", fontSize: 18 }}
                          />
                          <span className="count">
                            {row.floor?.floor_number || "N/A"}{" "}
                            <span className="title">Floor</span>
                          </span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <TableRestaurantOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#f59e0b", fontSize: 18 }}
                          />
                          <span className="count">
                            {tableCount} <span className="title">Tables</span>
                          </span>
                        </div>

                        <div className="hotel-list-card__details--list">
                          <EventSeatOutlined
                            className="hotel-detail-icon"
                            sx={{ color: "#06b6d4", fontSize: 18 }}
                          />
                          <span className="count">
                            {totalSeats} <span className="title">Seats</span>
                          </span>
                        </div>
                      </div>

                      <div className="hotel-list-card__footer">
                        <div className="hotel-list-card__footer--first-col">
                          {auth?.details?.role === "Admin" && (
                            <ToolTipPopup
                              toolTipDatas={diningStatusList?.data || []}
                              labelField="name"
                              valueField="status_id"
                              defaultValue={statusInfo.name}
                              getSeletedVal={(e) =>
                                handleTableStatusUpdate(e, row)
                              }
                              canEdit={
                                row?.dining_status === 3 ||
                                row?.dining_status === 4
                                  ? false
                                  : true
                              }
                              isCustomFieldswithFilter={false}
                              arrow
                            />
                          )}
                          <button
                            className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between"
                            disabled={row?.dining_status > 1}
                            onClick={() =>
                              handleEditDeleteValue(
                                {
                                  id: 1,
                                  name: { props: { children: "EDIT" } },
                                },
                                row.id,
                                row,
                              )
                            }
                          >
                            <img
                              src={images.pencilSimpleLine}
                              alt="Edit Reservation"
                            />
                          </button>

                          <button
                            className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
                            disabled={row?.dining_status > 1}
                            onClick={() =>
                              handleEditDeleteValue(
                                {
                                  id: 2,
                                  name: { props: { children: "CANCEL" } },
                                },
                                row.id,
                                row,
                              )
                            }
                          >
                            <img
                              src={images.trashIcon}
                              alt="Cancel Reservation"
                            />
                          </button>
                        </div>
                        <div className="hotel-list-card__footer--second-col">
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/book-table/details/" + row.hotel_id, {
                                state: { hotel_id: row.hotel_id },
                              })
                            }
                          >
                            View Details
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
        {bookedData?.length === 0 && loadingHotelListApp === false && (
          <div className="no-booking-found">
            <h1 className="main-head">No Booking Found</h1>
            <p className="sub-head">
              Please select a seat and reserve your dining table!
            </p>
            <button
              className="go-to-booking-page"
              onClick={handleGoToBookingPage}
            >
              Go to Booking
            </button>
          </div>
        )}
      </section>
      <PopupModal
        show={showCancelBookingSeats}
        onClose={() => setShowCancelBookingSeats(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Cancel Booked Seat ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() => updateBookingTableinSeats(selectedId)}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setShowCancelBookingSeats(false);
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

export default BookedTableDetails;
