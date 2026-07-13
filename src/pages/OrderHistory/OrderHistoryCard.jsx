import {
  FiCalendar,
  FiClock,
  FiHome,
  FiGrid,
  FiUsers,
  FiEye,
} from "react-icons/fi";

const OrderHistoryCard = ({ order }) => {

  const tableCount = order.seat_status?.length || 0;

  const seatCount =
    order.seat_status?.reduce(
      (count, table) => count + table.seat_ids.length,
      0
    ) || 0;

  return (
    <div className="order-card">

      <div className="order-card__top">

        <div>
          <h4>Order #{order.id}</h4>

          <span>
            <FiCalendar />
            {new Date(order.booking_date).toLocaleDateString()}
          </span>
        </div>

        <div className="status completed">
          Completed
        </div>

      </div>

      <div className="order-card__hotel">

        <FiHome />

        <div>
          <h5>{order.hotel.hotel_name}</h5>
          <small>Floor {order.floor.floor_number}</small>
        </div>

      </div>

      <div className="order-card__grid">

        <div>
          <FiGrid />
          <span>{tableCount} Tables</span>
        </div>

        <div>
          <FiUsers />
          <span>{seatCount} Seats</span>
        </div>

        <div>
          <FiClock />
          <span>{order.start_time}</span>
        </div>

      </div>

      <div className="order-card__footer">

        <div>
          <strong>₹1,250</strong>
          <small>Total Amount</small>
        </div>

        <button>
          <FiEye />
          View
        </button>

      </div>

    </div>
  );
};

export default OrderHistoryCard;