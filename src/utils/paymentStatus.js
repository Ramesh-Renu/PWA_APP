// Payment status names / colours from Settings → Payment status, with the
// app's built-in wording and colours as the fallback.

const DEFAULTS = {
  0: { code: "PENDING", label: "Payment pending", color: "#B45309" },
  1: { code: "PAID", label: "Paid", color: "#15803D" },
  2: { code: "REFUNDED", label: "Refunded", color: "#4338CA" },
};

// Unset colour in the master table.
const PLACEHOLDER_COLOR = "#000000";

const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const rowOf = (statusId, list = []) =>
  list.find((row) => Number(row.status_id) === Number(statusId));

/** Label: the admin's name, or the friendly default while it is unchanged. */
export const paymentLabel = (statusId, list) => {
  const fallback = DEFAULTS[statusId];
  const row = rowOf(statusId, list);
  const name = String(row?.name || "").trim();
  if (!name || /^STATUS_\d+$/.test(name) || name.toUpperCase() === fallback?.code) {
    return fallback?.label || titleCase(name) || "—";
  }
  return titleCase(name);
};

/** Colour: the admin's colour, or the built-in one while unset. */
export const paymentColor = (statusId, list) => {
  const row = rowOf(statusId, list);
  const color = String(row?.color_code || "").toUpperCase();
  return color && color !== PLACEHOLDER_COLOR ? color : DEFAULTS[statusId]?.color || "#64748B";
};

export const PAYMENT_DEFAULT_COLORS = Object.fromEntries(
  Object.entries(DEFAULTS).map(([id, { color }]) => [id, color]),
);
