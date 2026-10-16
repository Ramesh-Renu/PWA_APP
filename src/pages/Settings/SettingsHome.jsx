import { Link } from "react-router-dom";
import {
  CategoryOutlined,
  CleaningServicesOutlined,
  ChevronRightRounded,
  EventNoteOutlined,
  EventSeatOutlined,
  LocalFireDepartmentOutlined,
  LocationCityOutlined,
  PaymentsOutlined,
  PlaceOutlined,
  ReceiptLongOutlined,
  RoomServiceOutlined,
  SoupKitchenOutlined,
} from "@mui/icons-material";
import usePermission from "hooks/usePermission";

export const SETTINGS_SECTIONS = [
  {
    to: "/settings/menu-categories",
    page: "menuCategories",
    label: "Menu categories",
    description: "Group each hotel's dishes, e.g. Starters, Rice, Desserts.",
    icon: CategoryOutlined,
  },
  {
    to: "/settings/cooks",
    page: "cooks",
    label: "Cooks",
    description: "Kitchen staff assigned when an order is accepted.",
    icon: SoupKitchenOutlined,
  },
  {
    to: "/settings/servers",
    page: "servers",
    label: "Servers",
    description: "Floor staff assigned when a booking is confirmed or an order is served.",
    icon: RoomServiceOutlined,
  },
  {
    to: "/settings/cleaners",
    page: "cleaners",
    label: "Cleaners",
    description: "Housekeeping staff assigned when a table goes to Cleaning.",
    icon: CleaningServicesOutlined,
  },
  {
    to: "/settings/masters/locations",
    page: "locations",
    label: "Locations",
    description: "Cities / locations hotels are in (e.g. Chennai, Madurai).",
    icon: LocationCityOutlined,
  },
  {
    to: "/settings/areas",
    page: "areas",
    label: "Areas",
    description: "Areas inside each location (e.g. T Nagar, Adyar) used to place hotels.",
    icon: PlaceOutlined,
  },
  {
    to: "/settings/masters/spice-levels",
    page: "spiceLevels",
    label: "Spice levels",
    description: "Spice levels a menu item can have (No Spice, Mild, Hot…).",
    icon: LocalFireDepartmentOutlined,
  },
  {
    to: "/settings/masters/dining-status",
    page: "diningStatus",
    label: "Dining status",
    description: "Names and colours of the booking stages (Reservations board).",
    icon: EventNoteOutlined,
  },
  {
    to: "/settings/masters/order-status",
    page: "orderStatus",
    label: "Order status",
    description: "Names and colours of the order stages (Orders board).",
    icon: ReceiptLongOutlined,
  },
  {
    to: "/settings/masters/payment-status",
    page: "paymentStatus",
    label: "Payment status",
    description: "Names and colours of Pending, Paid and Refunded.",
    icon: PaymentsOutlined,
  },
  {
    to: "/settings/masters/seat-status",
    page: "seatStatus",
    label: "Seat status",
    description: "Names and colours of seat states on the floor plan.",
    icon: EventSeatOutlined,
  },
];

const SettingsHome = () => {
  const { can } = usePermission();
  const sections = SETTINGS_SECTIONS.filter(({ page }) => can(page));

  return (
  <section className="ui-page">
    <header className="ui-header">
      <div>
        <span className="ui-kicker">Admin</span>
        <h1>Settings</h1>
        <p>Master data used across hotels, menus and orders.</p>
      </div>
    </header>

    <div className="settings-grid">
      {sections.map(({ to, label, description, icon: Icon }) => (
        <Link key={to} to={to} className="settings-tile">
          <span className="settings-tile__icon" aria-hidden>
            <Icon />
          </span>
          <span className="settings-tile__text">
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <ChevronRightRounded className="settings-tile__go" aria-hidden />
        </Link>
      ))}
    </div>
  </section>
  );
};

export default SettingsHome;
