import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventNoteOutlined } from "@mui/icons-material";
import useAuth from "hooks/useAuth";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import ConfirmDialog from "components/common/ConfirmDialog";
import { getReservationByUser, deleteReservation } from "services";
import ReservationCard from "./ReservationCard";
import dayjs from "dayjs";
import { MEALS, SHOW_GUESTS } from "pages/TableDetails/SlotPicker";

// The picker settings that show this booking's own slot.
const slotOf = (row) => {
  const date = row.dining_date ? dayjs(row.dining_date) : null;
  if (!date) return null;
  const time = (row.start_time || date.format("HH:mm")).slice(0, 5);
  const meal =
    MEALS.find((item) => time >= item.from && time <= item.to)?.id ||
    MEALS[MEALS.length - 1].id;
  return {
    date: date.format("YYYY-MM-DD"),
    time,
    guests: SHOW_GUESTS ? row.guest_count || 2 : null,
    meal,
  };
};

// Matches RESERVATION_STATUS in the API (utils/reservationStatus.js).
const COMPLETED = 3;
const CANCELLED = 4;

/** Customer "My bookings": upcoming first, then past bookings. */
const ReservationPage = ({ onBookTable }) => {
  const [{ data: auth }] = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    if (!auth?.details?.id) return;
    setLoading(true);
    try {
      const response = await getReservationByUser({ user_id: auth.details.id });
      if (response.success) {
        setBookings(response.data || []);
      } else {
        showToast({ message: response.message, variant: "danger" });
      }
    } catch (error) {
      showToast({ message: error, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (diningStatusList.data.length === 0) getDiningStatus();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [auth?.details?.id]);

  const { upcoming, past } = useMemo(() => {
    const byDate = (a, b) => new Date(a.dining_date) - new Date(b.dining_date);
    const isPast = (row) =>
      [COMPLETED, CANCELLED].includes(row.dining_status);
    return {
      upcoming: bookings.filter((row) => !isPast(row)).sort(byDate),
      past: bookings.filter(isPast).sort((a, b) => byDate(b, a)),
    };
  }, [bookings]);

  const statusOf = (row) =>
    diningStatusList.data.find((status) => status.status_id === row.dining_status);

  // Upcoming: open the booking's own slot. Past: start a new booking.
  const openHotel = (row, { again = false } = {}) =>
    navigate(`/book-table/details/${row.hotel_id}`, {
      state: {
        hotel_id: row.hotel_id,
        isBooking: true,
        slot: again ? null : slotOf(row),
        from: { label: "My bookings", path: "/book-table?tab=reservations" },
      },
    });

  const confirmCancel = async () => {
    const booking = toCancel;
    if (!booking) return;
    setCancelling(true);
    try {
      const response = await deleteReservation({ reservation_id: booking.id });
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Booking cancelled",
        variant: "success",
      });
      setToCancel(null);
      fetchBookings();
    } catch (error) {
      showToast({
        title: `Couldn't cancel booking #${booking.id}`,
        message: error,
        variant: "danger",
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="cx-grid">
        {[0, 1].map((key) => (
          <div key={key} className="cx-card cx-card--skeleton" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="ui-empty">
        <EventNoteOutlined />
        <h3>No bookings yet</h3>
        <p>Pick a restaurant and reserve your table.</p>
        {onBookTable && (
          <button type="button" className="ui-btn ui-btn--primary" onClick={onBookTable}>
            Find a table
          </button>
        )}
      </div>
    );
  }

  const renderList = (rows, { past = false } = {}) => (
    <div className="cx-grid">
      {rows.map((row) => (
        <ReservationCard
          key={row.id}
          reservation={row}
          status={statusOf(row)}
          // Same rule as before: only bookings not yet seated can be cancelled.
          canCancel={!(row.dining_status > 1)}
          isPast={past}
          onView={() => openHotel(row, { again: past })}
          onCancel={() => setToCancel(row)}
        />
      ))}
    </div>
  );

  return (
    <>
      {upcoming.length > 0 && (
        <section className="cx-block" aria-label="Upcoming bookings">
          <h2 className="cx-block__title">
            Upcoming <span>{upcoming.length}</span>
          </h2>
          {renderList(upcoming)}
        </section>
      )}
      {past.length > 0 && (
        <section className="cx-block" aria-label="Past bookings">
          <h2 className="cx-block__title">
            Past <span>{past.length}</span>
          </h2>
          {renderList(past, { past: true })}
        </section>
      )}

      <ConfirmDialog
        show={Boolean(toCancel)}
        tone="warning"
        title={`Cancel booking #${toCancel?.id}?`}
        message="Your seats will be released for others."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
};

export default ReservationPage;
