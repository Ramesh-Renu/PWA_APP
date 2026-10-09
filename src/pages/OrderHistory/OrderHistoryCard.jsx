import {
  FiCalendar,
  FiClock,
  FiHome,
  FiGrid,
  FiUsers,
  FiEye,
} from "react-icons/fi";

const OrderHistoryCard = ({ order }) => {

  // Support both reservation-based and order-based payloads
  const tableCount = order.seat_status?.length ?? 0;

  const seatCount =
    order.seat_status?.reduce((count, table) => count + (table.seat_ids?.length || 0), 0) || 0;

  const orderDate = order.ordered_at || order.booking_date || order.createdAt;
  const dateDisplay = orderDate ? new Date(orderDate).toLocaleDateString() : "-";
  const timeDisplay = orderDate ? new Date(orderDate).toLocaleTimeString() : "-";

  const hotelName = order.hotel?.hotel_name || "-";
  const floorNumber = order.floor?.floor_number ?? "-";

  const totalAmount =
    order.total_amount || order.totalAmount || order.subtotal || order.total || "0";

  const amountDisplay =
    typeof totalAmount === "string" ? totalAmount : String(totalAmount);

  const statusText =
    order.order_status === 1 ? "Placed" : order.order_status === 2 ? "Preparing" : order.order_status === 3 ? "Completed" : "-";

  const itemsCount = order.items?.length ?? 0;

  return (
    <div className="order-card">

      <div className="order-card__top">

        <div>
          <h4>{order.order_number ? `Order ${order.order_number}` : `Order #${order.id}`}</h4>

          <span>
            <FiCalendar />
            {dateDisplay}
          </span>
        </div>

        <div className={`status ${statusText.toLowerCase()}`}>
          {statusText}
        </div>

      </div>

      <div className="order-card__hotel">

        <FiHome />

        <div>
          <h5>{hotelName}</h5>
          <small>Floor {floorNumber}</small>
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
          <span>{timeDisplay}</span>
        </div>

      </div>

      {order.items && order.items.length > 0 && (
        <div className="order-card__items">
          <ul>
            {order.items.map((it, i) => (
              <li key={it.id || i} className="order-item">
                <div className="order-item__name">{it.menu_name || it.name || "Item"}</div>
                <div className="order-item__qty">{it.quantity ?? it.qty ?? 1}</div>
                <div className="order-item__price">₹{it.total_price ?? it.totalPrice ?? it.unit_price ?? it.price ?? "0"}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="order-card__footer">
        <div></div>
        <div className="order-card__total">
          <strong>₹{amountDisplay}</strong>
          <small>Total Amount</small>
        </div>
{/* 
        <button>
          <FiEye />
          View ({itemsCount} items)
        </button> */}

      </div>

    </div>
  );
};

export default OrderHistoryCard;