import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "hooks/useToast";
import ConfirmDialog from "components/common/ConfirmDialog";
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
import ToolTipPopup from "components/common/ToolTipPopup";
import useAuth from "hooks/useAuth";
import {
  EventNoteOutlined,
  EventAvailableOutlined,
  EventSeatOutlined,
  AddRounded,
  TaskAltRounded,
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
        state: {
          hotel_id: rowData.hotel_id,
          from: { label: "Reservations", path: "/booked-table" },
        },
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
      <section className="ui-page">
        <header className="ui-header">
          <div>
            <span className="ui-kicker">My bookings</span>
            <h1>Reservations</h1>
            <p>Your table bookings and their current status.</p>
          </div>
          <div className="ui-header__actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={handleGoToBookingPage}
            >
              <AddRounded fontSize="small" /> Book a table
            </button>
          </div>
        </header>

        <div className="ui-stats">
          {[
            { label: "All reservations", value: bookedData?.length || 0, icon: <EventNoteOutlined /> },
            { label: "Confirmed", value: bookedData?.filter((item) => item.dining_status === 1).length || 0, icon: <EventAvailableOutlined /> },
            { label: "Seated", value: bookedData?.filter((item) => item.dining_status === 2).length || 0, icon: <EventSeatOutlined /> },
            { label: "Completed", value: bookedData?.filter((item) => item.dining_status === 3).length || 0, icon: <TaskAltRounded /> },
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

        {loadingHotelListApp ? (
          <SkeletonLoading
            count={3}
            flexDirection="row"
            flexWrap="wrap"
            height="220px"
            width="min(100%, 360px)"
            borderRadius="18px"
          />
        ) : bookedData?.length > 0 ? (
          <div className="hl-grid">
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
              )[0] || { name: "N/A", color_code: "#64748b" };
              const hotelName = row.hotel?.hotel_name || "Unnamed Hotel";
              const initials = hotelName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0].toUpperCase())
                .join("");
              const canCancel = !(row?.dining_status > 1);

              return (
                <article className="hl-card" key={row.id}>
                  <div className="hl-card__head">
                    <span className="hl-card__avatar" aria-hidden>
                      {initials}
                    </span>
                    <div className="hl-card__identity">
                      <button
                        type="button"
                        className="hl-card__name"
                        onClick={() =>
                          navigate("/book-table/details/" + row.hotel_id, {
                            state: {
                              hotel_id: row.hotel_id,
                              from: { label: "Reservations", path: "/booked-table" },
                            },
                          })
                        }
                      >
                        {hotelName}
                      </button>
                      <p className="hl-card__address">Reservation #{row.id}</p>
                    </div>
                    <span
                      className="ui-chip booking-status"
                      style={{ "--status-color": statusInfo.color_code || "#64748b" }}
                    >
                      {statusInfo.name}
                    </span>
                  </div>

                  <p className="hl-card__place">
                    <EventAvailableOutlined aria-hidden />
                    {formatDate(row.dining_date)}
                  </p>

                  <dl className="hl-card__metrics">
                    <div>
                      <dt>Floor</dt>
                      <dd>{row.floor?.floor_number ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Tables</dt>
                      <dd>{tableCount}</dd>
                    </div>
                    <div>
                      <dt>Seats</dt>
                      <dd>{totalSeats}</dd>
                    </div>
                  </dl>

                  <p className="booking-card__booked">
                    Booked on {formatDate(row.booking_date)}
                  </p>

                  {auth?.details?.role === "Admin" && (
                    <ToolTipPopup
                      toolTipDatas={diningStatusList?.data || []}
                      labelField="name"
                      valueField="status_id"
                      defaultValue={statusInfo.name}
                      getSeletedVal={(e) => handleTableStatusUpdate(e, row)}
                      canEdit={
                        row?.dining_status === 3 || row?.dining_status === 4
                          ? false
                          : true
                      }
                      isCustomFieldswithFilter={false}
                      arrow
                    />
                  )}

                  <div className="hl-card__actions">
                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost"
                      disabled={!canCancel}
                      title={
                        canCancel
                          ? "Cancel this booking"
                          : "Only confirmed bookings can be cancelled"
                      }
                      onClick={() =>
                        handleEditDeleteValue(
                          { id: 2, name: { props: { children: "CANCEL" } } },
                          row.id,
                          row,
                        )
                      }
                    >
                      Cancel booking
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn--primary"
                      onClick={() =>
                        navigate("/book-table/details/" + row.hotel_id, {
                          state: {
                            hotel_id: row.hotel_id,
                            from: { label: "Reservations", path: "/booked-table" },
                          },
                        })
                      }
                    >
                      View details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ui-empty">
            <EventNoteOutlined />
            <h2>No bookings yet</h2>
            <p>Pick a restaurant and reserve your dining table.</p>
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={handleGoToBookingPage}
            >
              Book a table
            </button>
          </div>
        )}
      </section>
      <ConfirmDialog
        show={showCancelBookingSeats}
        tone="warning"
        title="Cancel your booking?"
        message="The booked seats will be released for others."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={() => updateBookingTableinSeats(selectedId)}
        onCancel={() => setShowCancelBookingSeats(false)}
      />
    </Fragment>
  );
};

export default BookedTableDetails;
