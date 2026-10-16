/**
 * Roles and page/option access. Mirrors the API's utils/permissions.js: the
 * profile (GET /api/users/profile) carries the effective `permissions`
 * ({ pageKey: ["view", "create", "edit", "delete"] }) and `hotel_ids`.
 *
 *   SuperAdmin  everything; creates Admins
 *   Admin       what a SuperAdmin granted; creates Staff users
 *   Staff       hotel workers (Manager / Lead / Member), what their Admin granted
 *   user        guests
 */
export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  STAFF: "Staff",
  USER: "user",
};

export const STAFF_CATEGORIES = ["Manager", "Lead", "Member"];

const roleOf = (role) => String(role || "").toLowerCase();

export const isSuperAdmin = (role) => roleOf(role) === "superadmin";

export const isStaffMember = (role) => roleOf(role) === "staff";

/** SuperAdmin, Admin or Staff: a restaurant (not guest) session. */
export const isStaffRole = (role) => ["admin", "superadmin", "staff"].includes(roleOf(role));

/** Pages only a SuperAdmin can change (never granted). */
export const SUPER_ADMIN_PAGES = ["adminUsers"];

/** Can this user do `action` on `page`? Guests never; SuperAdmin always. */
export const can = (details, page, action = "view") => {
  if (!isStaffRole(details?.role)) return false;
  if (isSuperAdmin(details.role)) return true;
  // Admin users: Admins can look (read-only); only a SuperAdmin changes it.
  if (SUPER_ADMIN_PAGES.includes(page)) {
    return action === "view" && roleOf(details.role) === "admin";
  }
  // Inactive users (removed Staff): Admins who can see Staff users.
  if (page === "inactiveUsers") {
    return action === "view" && can(details, "users");
  }
  // Older API without permissions in the profile: full admin access.
  if (details.permissions == null) return !isStaffMember(details.role);
  return Boolean(details.permissions[page]?.includes(action));
};

/** Shown under the user's name: "Super Admin", "Admin", or the Staff category. */
export const roleLabel = (details) => {
  if (isSuperAdmin(details?.role)) return "Super Admin";
  if (isStaffMember(details?.role)) return details.staff_category || "Staff";
  return details?.role;
};

/** Master page (pages/Settings/Masters) → permission page key. */
export const MASTER_PERMISSION = {
  locations: "locations",
  "dining-status": "diningStatus",
  "order-status": "orderStatus",
  "payment-status": "paymentStatus",
  "seat-status": "seatStatus",
  "spice-levels": "spiceLevels",
};

/** Staff pages in landing order: the first one the user may view is home. */
const STAFF_PAGES = [
  { page: "dashboard", path: "/dashboard" },
  { page: "hotels", path: "/hotellist" },
  { page: "reservations", path: "/booked-table" },
  { page: "orders", path: "/orders" },
  { page: "users", path: "/user-management/staff" },
  { page: "menuCategories", path: "/settings/menu-categories" },
  { page: "cooks", path: "/settings/cooks" },
  { page: "servers", path: "/settings/servers" },
  { page: "cleaners", path: "/settings/cleaners" },
  { page: "areas", path: "/settings/areas" },
  ...Object.entries(MASTER_PERMISSION).map(([master, page]) => ({
    page,
    path: `/settings/masters/${master}`,
  })),
];

/** Where a user lands after sign-in (and when a page is not allowed). */
export const homePathFor = (details) => {
  if (!isStaffRole(details?.role)) return "/book-table";
  if (isSuperAdmin(details.role)) return "/dashboard";
  return STAFF_PAGES.find(({ page }) => can(details, page))?.path || "/no-access";
};

/** Page names (same as the API's PERMISSION_CATALOG labels), for display. */
export const PAGE_LABELS = {
  dashboard: "Dashboard",
  hotels: "Hotels",
  reservations: "Reservations",
  orders: "Orders",
  menu: "Hotel menu items",
  users: "Staff users",
  menuCategories: "Menu categories",
  cooks: "Cooks",
  servers: "Servers",
  cleaners: "Cleaners",
  locations: "Locations",
  areas: "Areas",
  spiceLevels: "Spice levels",
  diningStatus: "Dining status",
  orderStatus: "Order status",
  paymentStatus: "Payment status",
  seatStatus: "Seat status",
};
