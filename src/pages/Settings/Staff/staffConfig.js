import {
  CleaningServicesOutlined,
  RoomServiceOutlined,
  SoupKitchenOutlined,
} from "@mui/icons-material";
import {
  createCleaner,
  createCook,
  createServer,
  deleteCleaner,
  deleteCook,
  deleteServer,
  getCleaners,
  getCooks,
  getServers,
  updateCleaner,
  updateCook,
  updateServer,
} from "services";

/**
 * Staff master data shown in Settings and assigned on the Orders board.
 * Field names match the API models (cook.model.js / server.model.js).
 */
export const COOK_CONFIG = {
  kind: "cook",
  title: "Cooks",
  singular: "Cook",
  intro: "Kitchen staff you can assign to an order when you accept it.",
  icon: SoupKitchenOutlined,
  nameField: "cook_name",
  namePlaceholder: "e.g. Murugan",
  detailField: "speciality",
  detailLabel: "Speciality",
  detailPlaceholder: "e.g. South Indian",
  detailSuggestions: [
    "South Indian",
    "North Indian",
    "Chinese",
    "Tandoor",
    "Biryani",
    "Chettinad",
    "Bakery",
    "Desserts",
    "Beverages",
  ],
  orderField: "cook_id",
  orderRelation: "cook",
  settingsPath: "/settings/cooks",
  api: { list: getCooks, create: createCook, update: updateCook, remove: deleteCook },
};

export const SERVER_CONFIG = {
  kind: "server",
  title: "Servers",
  singular: "Server",
  intro: "Floor staff you can assign to an order when it is served.",
  icon: RoomServiceOutlined,
  nameField: "server_name",
  namePlaceholder: "e.g. Priya",
  detailField: "section",
  detailLabel: "Section / shift",
  detailPlaceholder: "e.g. Floor 1, Evening",
  detailSuggestions: [
    "Floor 1",
    "Floor 2",
    "Floor 3",
    "Morning",
    "Evening",
    "Night",
    "Banquet",
  ],
  orderField: "server_id",
  orderRelation: "server",
  settingsPath: "/settings/servers",
  api: {
    list: getServers,
    create: createServer,
    update: updateServer,
    remove: deleteServer,
  },
};

export const CLEANER_CONFIG = {
  kind: "cleaner",
  title: "Cleaners",
  singular: "Cleaner",
  intro: "Housekeeping staff you can assign when a table goes to Cleaning.",
  icon: CleaningServicesOutlined,
  nameField: "cleaner_name",
  namePlaceholder: "e.g. Lakshmi",
  detailField: "shift",
  detailLabel: "Shift / area",
  detailPlaceholder: "e.g. Morning, Floor 2",
  detailSuggestions: ["Morning", "Afternoon", "Evening", "Night", "Floor 1", "Floor 2", "Floor 3"],
  orderField: "cleaner_id",
  orderRelation: "cleaner",
  settingsPath: "/settings/cleaners",
  api: {
    list: getCleaners,
    create: createCleaner,
    update: updateCleaner,
    remove: deleteCleaner,
  },
};
