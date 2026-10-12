import { Link } from "react-router-dom";
import {
  CategoryOutlined,
  CleaningServicesOutlined,
  ChevronRightRounded,
  RoomServiceOutlined,
  SoupKitchenOutlined,
} from "@mui/icons-material";

export const SETTINGS_SECTIONS = [
  {
    to: "/settings/menu-categories",
    label: "Menu categories",
    description: "Group each hotel's dishes, e.g. Starters, Rice, Desserts.",
    icon: CategoryOutlined,
  },
  {
    to: "/settings/cooks",
    label: "Cooks",
    description: "Kitchen staff assigned when an order is accepted.",
    icon: SoupKitchenOutlined,
  },
  {
    to: "/settings/servers",
    label: "Servers",
    description: "Floor staff assigned when a booking is confirmed or an order is served.",
    icon: RoomServiceOutlined,
  },
  {
    to: "/settings/cleaners",
    label: "Cleaners",
    description: "Housekeeping staff assigned when a table goes to Cleaning.",
    icon: CleaningServicesOutlined,
  },
];

const SettingsHome = () => (
  <section className="ui-page">
    <header className="ui-header">
      <div>
        <span className="ui-kicker">Admin</span>
        <h1>Settings</h1>
        <p>Master data used across hotels, menus and orders.</p>
      </div>
    </header>

    <div className="settings-grid">
      {SETTINGS_SECTIONS.map(({ to, label, description, icon: Icon }) => (
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

export default SettingsHome;
