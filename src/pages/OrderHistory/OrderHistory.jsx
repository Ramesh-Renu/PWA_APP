import { ReceiptLongOutlined } from "@mui/icons-material";
import OrderHistoryCard from "./OrderHistoryCard";

const OrderHistory = ({ orders = [], loading = false, onChanged }) => {
  if (loading) {
    return (
      <div className="cx-grid">
        {[0, 1].map((key) => (
          <div key={key} className="cx-card cx-card--skeleton" />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="ui-empty">
        <ReceiptLongOutlined />
        <h3>No orders yet</h3>
        <p>Orders you place at the table will show up here.</p>
      </div>
    );
  }

  // Orders still in progress first, then finished ones; newest first in each.
  const isFinished = (order) => [5, 6, 7, 8].includes(order.order_status);
  const sorted = [...orders].sort(
    (a, b) =>
      Number(isFinished(a)) - Number(isFinished(b)) ||
      new Date(b.ordered_at || b.createdAt || 0) -
        new Date(a.ordered_at || a.createdAt || 0),
  );

  return (
    <div className="cx-grid">
      {sorted.map((order) => (
        <OrderHistoryCard key={order.id} order={order} onChanged={onChanged} />
      ))}
    </div>
  );
};

export default OrderHistory;
