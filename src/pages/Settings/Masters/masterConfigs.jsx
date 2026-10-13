import {
  createLocation,
  createSpiceLevel,
  deleteLocation,
  deleteSpiceLevel,
  getAllLocation,
  getAllSpiceLevels,
  getDiningStatus,
  getOrderStatuses,
  getPaymentStatuses,
  getSeatsStatusMatsers,
  updateDiningStatusMaster,
  updateLocation,
  updateOrderStatusMaster,
  updatePaymentStatusMaster,
  updateSeatStatusMaster,
  updateSpiceLevel,
} from "services";
import { PAYMENT_DEFAULT_COLORS } from "utils/paymentStatus";

// "NO_SPICE" / "no spice" → "No Spice"
const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const countCell = (value) => Number(value) || 0;

// #000000 in a status table means "colour not set": the app then uses its
// built-in colour (same values as the boards / utils/paymentStatus).
const ORDER_DEFAULT_COLORS = {
  1: "#6366F1", 2: "#0EA5E9", 3: "#F59E0B", 4: "#14B8A6",
  5: "#8B5CF6", 6: "#22C55E", 7: "#EF4444", 8: "#0EA5E9",
};
const isUnset = (color) => !color || String(color).toUpperCase() === "#000000";
const effectiveColor = (row, defaults = {}) =>
  isUnset(row.color_code) ? defaults[row.status_id] || "#64748B" : row.color_code;

/**
 * Status masters (dining, order, payment, seat): the app's flows use the
 * status number, so only the display name and colour are editable here.
 */
const statusMaster = ({
  title,
  singular,
  intro,
  list,
  update,
  refreshGlobal,
  defaultColors = {},
}) => ({
  title,
  singular,
  intro,
  systemNote:
    "System statuses: the app's flows use their numbers, so they can't be added or removed. You can change the name and colour that people see.",
  api: { list, update },
  refreshGlobal,
  sort: (a, b) => Number(a.status_id) - Number(b.status_id),
  rowName: (row) => titleCase(row.name),
  searchText: (row) => [row.name, row.status_id, row.color_code],
  uniqueField: "name",
  columns: [
    { label: "No.", align: "center", render: (row) => row.status_id },
    {
      label: "Name",
      strong: true,
      render: (row) => (
        <span
          className="ui-chip booking-status"
          style={{ "--status-color": effectiveColor(row, defaultColors) }}
        >
          {titleCase(row.name)}
        </span>
      ),
    },
    {
      label: "Colour",
      render: (row) => (
        <span className="master-swatch">
          <span style={{ background: effectiveColor(row, defaultColors) }} aria-hidden />
          {effectiveColor(row, defaultColors).toUpperCase()}
          {isUnset(row.color_code) && <em>(default)</em>}
        </span>
      ),
    },
  ],
  fields: [
    { name: "name", label: "Name", required: true, autoFocus: true, placeholder: "e.g. Food prepared" },
    { name: "color_code", label: "Colour", type: "color", required: true },
  ],
  editHint: (row) => `Status number ${row.status_id} stays the same.`,
  toForm: (row) => ({
    name: row.name || "",
    color_code: effectiveColor(row, defaultColors).toUpperCase(),
  }),
  toBody: (form) => ({ name: form.name.trim(), color_code: form.color_code.trim() }),
});

export const MASTERS = {
  locations: {
    title: "Locations",
    singular: "Location",
    intro: "Cities / locations hotels are in (e.g. Chennai, Madurai). Areas sit inside a location.",
    api: { list: getAllLocation, create: createLocation, update: updateLocation, remove: deleteLocation },
    rowName: (row) => row.name,
    searchText: (row) => [row.name, row.description],
    uniqueField: "name",
    columns: [
      { label: "Location", strong: true, render: (row) => row.name },
      { label: "Description", muted: true, render: (row) => row.description || "—" },
      { label: "Areas", align: "center", render: (row) => countCell(row.area_count) },
      { label: "Hotels", align: "center", render: (row) => countCell(row.hotel_count) },
    ],
    fields: [
      { name: "name", label: "Location name", required: true, autoFocus: true, placeholder: "e.g. Chennai" },
      { name: "description", label: "Description", type: "textarea", full: true, placeholder: "Optional" },
    ],
    toForm: (row) => ({ name: row.name || "", description: row.description || "" }),
    toBody: (form) => ({ name: form.name.trim(), description: form.description.trim() }),
    inUse: (row) => {
      const areas = countCell(row.area_count);
      const hotels = countCell(row.hotel_count);
      if (!areas && !hotels) return null;
      const parts = [
        areas && `${areas} ${areas === 1 ? "area" : "areas"}`,
        hotels && `${hotels} ${hotels === 1 ? "hotel" : "hotels"}`,
      ].filter(Boolean);
      return `It is used by ${parts.join(" and ")}. Move them to another location first.`;
    },
  },

  "dining-status": statusMaster({
    title: "Dining status",
    singular: "Dining status",
    intro: "Stages of a table booking (the Reservations board columns).",
    list: getDiningStatus,
    update: updateDiningStatusMaster,
    refreshGlobal: "getDiningStatus",
  }),

  "order-status": statusMaster({
    title: "Order status",
    singular: "Order status",
    intro: "Stages of a food order (the Orders board columns).",
    list: getOrderStatuses,
    update: updateOrderStatusMaster,
    refreshGlobal: "getOrderStatus",
    defaultColors: ORDER_DEFAULT_COLORS,
  }),

  "payment-status": statusMaster({
    title: "Payment status",
    singular: "Payment status",
    intro: "Whether an order is paid: Pending, Paid, Refunded.",
    list: getPaymentStatuses,
    update: updatePaymentStatusMaster,
    refreshGlobal: "getPaymentStatus",
    defaultColors: PAYMENT_DEFAULT_COLORS,
  }),

  "seat-status": statusMaster({
    title: "Seat status",
    singular: "Seat status",
    intro: "States of a seat on the floor plan (available, booked, seated, cleaning…).",
    list: getSeatsStatusMatsers,
    update: updateSeatStatusMaster,
    refreshGlobal: "getSeatsStatusMatsers",
  }),

  "spice-levels": {
    title: "Spice levels",
    singular: "Spice level",
    intro: "Spice levels a menu item can have (e.g. No Spice, Mild, Hot).",
    api: { list: getAllSpiceLevels, create: createSpiceLevel, update: updateSpiceLevel, remove: deleteSpiceLevel },
    listParams: { limit: 100 },
    sort: (a, b) => Number(a.display_order) - Number(b.display_order),
    rowName: (row) => titleCase(row.spice_level),
    searchText: (row) => [titleCase(row.spice_level), row.description],
    uniqueField: "spice_level",
    // Stored as e.g. NO_SPICE; compare as typed ("No Spice").
    uniqueValue: (row) => titleCase(row.spice_level),
    columns: [
      { label: "Spice level", strong: true, render: (row) => titleCase(row.spice_level) },
      { label: "Description", muted: true, render: (row) => row.description || "—" },
      { label: "Order", align: "center", render: (row) => row.display_order ?? 0 },
      {
        label: "Status",
        render: (row) => (
          <span className={`ui-chip ${row.is_active ? "ui-chip--success" : ""}`}>
            {row.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      { label: "Menu items", align: "center", render: (row) => countCell(row.menu_count) },
    ],
    fields: [
      { name: "spice_level", label: "Name", required: true, autoFocus: true, placeholder: "e.g. Medium" },
      { name: "display_order", label: "Display order", type: "number", default: 0 },
      { name: "description", label: "Description", type: "textarea", full: true, placeholder: "Optional" },
      {
        name: "is_active",
        type: "switch",
        default: true,
        onLabel: "Active",
        offLabel: "Inactive",
        hint: "Inactive levels can't be picked for menu items",
      },
    ],
    toForm: (row) => ({
      spice_level: titleCase(row.spice_level),
      display_order: row.display_order ?? 0,
      description: row.description || "",
      is_active: Boolean(row.is_active),
    }),
    // Sent as typed ("No Spice"); the API stores it upper-case.
    toBody: (form) => ({
      spice_level: form.spice_level.trim(),
      display_order: Number(form.display_order) || 0,
      description: form.description.trim(),
      is_active: Boolean(form.is_active),
    }),
    inUse: (row) => {
      const items = countCell(row.menu_count);
      return items
        ? `It is used by ${items} menu ${items === 1 ? "item" : "items"}. Change them first, or mark the level inactive.`
        : null;
    },
  },
};

// Order of the tiles / sidebar links.
export const MASTER_KEYS = [
  "locations",
  "dining-status",
  "order-status",
  "payment-status",
  "seat-status",
  "spice-levels",
];
