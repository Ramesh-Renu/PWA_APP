import {
  Calendar,
  Building2,
  Pencil,
  TableProperties,
  Users,
} from "lucide-react";

const ReservationCard = ({ reservation, onEdit }) => {
  const tableCount = reservation.seat_status?.length || 0;

  const seatCount =
    reservation.seat_status?.reduce(
      (total, table) => total + table.seat_ids.length,
      0
    ) || 0;

  return (
    <div className="reservation-card">

      <div className="reservation-card__header">
        <div>
          <h4>#{reservation.id}</h4>
          <span>
            <Calendar size={14} />
            {new Date(reservation.booking_date).toLocaleDateString()}
          </span>
        </div>

        <span className={`status status-${reservation.dining_status}`}>
          Confirmed
        </span>
      </div>

      <div className="reservation-card__hotel">
        <Building2 size={18} />
        <div>
          <h5>{reservation.hotel.hotel_name}</h5>
          <p>Floor {reservation.floor.floor_number}</p>
        </div>
      </div>

      <div className="reservation-card__chips">

        <div className="chip">
          <TableProperties size={14} />
          {tableCount} Tables
        </div>

        <div className="chip">
          <Users size={14} />
          {seatCount} Seats
        </div>

      </div>

      <div className="reservation-card__footer">

        <div>
          <small>Dining Time</small>
          <h5>{reservation.start_time}</h5>
        </div>

        <button
          type="button"
          className="reservation-card__edit-btn"
          onClick={() => onEdit(reservation)}
        >
          <Pencil size={16} />
          Edit
        </button>

      </div>

    </div>
  );
};

export default ReservationCard;
