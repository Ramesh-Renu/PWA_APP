// A booking's food, dish by dish (the same dish from several orders is one
// entry), with where each portion is. Used by the Reservations card and the
// booking food popup.

const ITEM_READY = 3;
const ITEM_CANCELLED = 5;
const ORDER_CANCELLED = 7;
const COOKING_ORDER_STATUSES = [2, 3]; // Accepted, Preparing
const FOOD_PREPARED = 4; // order stage "Food prepared"

// From just ordered to finished; a dish shows its least advanced portion.
const STAGE_PROGRESS = [1, 2, 3, 4, 5, 8, 6];
const progressOf = (stageId) => {
  const index = STAGE_PROGRESS.indexOf(Number(stageId));
  return index === -1 ? STAGE_PROGRESS.length : index;
};

/** Stage of one order line: a ticked dish of an order still cooking is "Food prepared". */
export const lineStageId = (order, item) =>
  item.item_status === ITEM_READY && COOKING_ORDER_STATUSES.includes(order.order_status)
    ? FOOD_PREPARED
    : order.order_status;

/**
 * [{ key, name, quantity, stageId, lines: [{ order, item, stageId }] }] in the
 * order dishes were first ordered. Cancelled orders and dishes are left out.
 */
export const groupDishes = (orders = []) => {
  const groups = new Map();
  orders
    .filter((order) => order.order_status !== ORDER_CANCELLED)
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.item_status === ITEM_CANCELLED) return;
        const key = String(item.menu_id ?? item.menu_name);
        if (!groups.has(key)) {
          groups.set(key, { key, name: item.menu_name, quantity: 0, lines: [] });
        }
        const group = groups.get(key);
        group.quantity += Number(item.quantity || 0);
        group.lines.push({ order, item, stageId: lineStageId(order, item) });
      });
    });
  return [...groups.values()].map((group) => ({
    ...group,
    // The pill shows the portion furthest behind (what still needs doing).
    stageId: group.lines.reduce(
      (behind, line) => (progressOf(line.stageId) < progressOf(behind) ? line.stageId : behind),
      group.lines[0]?.stageId,
    ),
  }));
};

/** "2 Served, 1 Preparing" for a dish whose portions are at different stages. */
export const stageBreakdown = (group, stages) => {
  const counts = new Map();
  group.lines.forEach(({ item, stageId }) =>
    counts.set(stageId, (counts.get(stageId) || 0) + Number(item.quantity || 0)),
  );
  return [...counts.entries()]
    .sort(([a], [b]) => progressOf(a) - progressOf(b))
    .map(([stageId, count]) => `${count} ${stages[stageId]?.name || "—"}`)
    .join(", ");
};
