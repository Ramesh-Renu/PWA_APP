// Tells other open tabs (e.g. the Reservations board) that orders changed,
// so they reload right away instead of waiting for their next poll.
const CHANNEL = "hotel-orders";

const channel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;

export const notifyOrdersChanged = () => {
  try {
    channel?.postMessage({ type: "orders-changed", at: Date.now() });
  } catch {
    // Live updates are a convenience; polling still catches up.
  }
};

/** Calls `callback` when another tab changes orders. Returns an unsubscribe. */
export const onOrdersChanged = (callback) => {
  if (!channel) return () => {};
  const listener = (event) => {
    if (event.data?.type === "orders-changed") callback();
  };
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
};
