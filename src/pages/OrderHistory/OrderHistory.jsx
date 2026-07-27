import OrderHistoryCard from "./OrderHistoryCard";

const OrderHistory = ({ orders = [] }) => {
  if (!orders.length) {
    return (
      <div className="order-history-empty">
        No completed orders found.
      </div>
    );
  }

  return (
    <div className="order-history">

      {orders.map((order) => (
        <OrderHistoryCard
          key={order.id}
          order={order}
        />
      ))}

    </div>
  );
};

export default OrderHistory;