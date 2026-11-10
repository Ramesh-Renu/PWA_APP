import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { EventAvailableOutlined } from "@mui/icons-material";
import { getAverageRating, getHotelReviews, saveHotelReview } from "utils/reviews";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const ReservationCard = ({ reservation, status, canCancel, isPast, onView, onCancel }) => {
  const tables = reservation.seat_status || [];
  const seatCount = tables.reduce(
    (total, table) => total + (table.seat_ids?.length || 0),
    0,
  );
  const hotelName = reservation.hotel?.hotel_name || "Restaurant";
  const hotelId = reservation.hotel_id ?? reservation.hotel?.id ?? reservation.id;
  // Table codes from the API (e.g. "SACT0001").
  const codes = tables.map((table) => table.table_code).filter(Boolean);
  const dining = reservation.dining_date ? dayjs(reservation.dining_date) : null;
  const ratingSummary = useMemo(
    () => ({
      average: getAverageRating(hotelId),
      count: getHotelReviews(hotelId).length,
    }),
    [hotelId],
  );
  const [localRating, setLocalRating] = useState(() => {
    const reviews = getHotelReviews(hotelId);
    return reviews[0]?.rating || 0;
  });

  const handleRate = (nextValue) => {
    const review = saveHotelReview(hotelId, {
      rating: nextValue,
      comment: "",
      guestName: "Guest",
    });

    if (review) {
      setLocalRating(nextValue);
    }
  };

  return (
    <article className="cx-card cx-booking">
      <div className="cx-hotel__head">
        <span className="cx-avatar" aria-hidden>
          {initialsOf(hotelName) || "R"}
        </span>
        <div className="cx-hotel__title">
          <h3>{hotelName}</h3>
          <p>
            Booking #{reservation.id}
            {reservation.floor?.floor_number != null &&
              ` · Floor ${reservation.floor.floor_number}`}
            {codes.length > 0 && ` · ${codes.join(", ")}`}
          </p>
        </div>
        <span
          className="ui-chip booking-status"
          style={{ "--status-color": status?.color_code || "#64748b" }}
        >
          {status?.name || "—"}
        </span>
      </div>

      {dining && (
        <p className="cx-booking__when">
          <EventAvailableOutlined aria-hidden />
          <span>
            <strong>{dining.format("ddd, D MMM")}</strong>
            {/* start_time is "HH:mm[:ss]" (24h); show it as 7:00 PM. */}
            {` · ${
              reservation.start_time
                ? dayjs(
                    `${dining.format("YYYY-MM-DD")}T${String(reservation.start_time).slice(0, 5)}`,
                  ).format("h:mm A")
                : dining.format("h:mm A")
            }`}
          </span>
        </p>
      )}

      <ul className="cx-facts">
        <li>
          <strong>{tables.length}</strong>
          {tables.length === 1 ? "table" : "tables"}
        </li>
        <li>
          <strong>{seatCount}</strong>
          {seatCount === 1 ? "seat" : "seats"}
        </li>
      </ul>

      {isPast && (
        <div className="cx-review-inline" aria-label={`Rate ${hotelName}`}>
          <div className="cx-review-inline__stars" role="radiogroup" aria-label="Rate your experience">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value <= (localRating || 0) ? "is-active" : ""}
                aria-label={`Rate ${value} out of 5`}
                onClick={() => handleRate(value)}
              >
                ★
              </button>
            ))}
          </div>
          <span>
            {ratingSummary.count > 0
              ? `${ratingSummary.average.toFixed(1)} avg · ${ratingSummary.count} review${ratingSummary.count === 1 ? "" : "s"}`
              : "Rate your visit"}
          </span>
        </div>
      )}

      <div className="cx-card__actions">
        {canCancel && (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className={`ui-btn ${isPast ? "ui-btn--ghost" : "ui-btn--primary"}`}
          onClick={onView}
        >
          {/* A finished booking can't be changed; offer a new one instead. */}
          {isPast ? "Book again" : "View booking"}
        </button>
      </div>
    </article>
  );
};

export default ReservationCard;
