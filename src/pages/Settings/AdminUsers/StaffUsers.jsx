import { useMemo } from "react";
import UserAccessPage from "./UserAccessPage";
import usePermission from "hooks/usePermission";
import { STAFF_CATEGORIES } from "utils/permissions";
import {
  createStaffUser,
  getStaffPermissionCatalog,
  getStaffUsers,
  removeStaffUser,
  updateStaffUser,
} from "services";

const STAFF_API = {
  list: getStaffUsers,
  catalog: getStaffPermissionCatalog,
  create: createStaffUser,
  update: updateStaffUser,
  remove: removeStaffUser,
};

// Options each category starts with when picked (the Admin can adjust them).
const CATEGORY_PRESETS = {
  Manager: ["view", "create", "edit", "delete"],
  Lead: ["view", "create", "edit"],
  Member: ["view"],
};

/**
 * Settings → Staff users: an Admin's hotel team (Manager / Lead / Member),
 * given only pages, options and hotels the Admin has.
 */
const StaffUsers = () => {
  const { can } = usePermission();
  const canCreate = can("users", "create");
  const canEdit = can("users", "edit");
  const canDelete = can("users", "delete");

  const config = useMemo(
    () => ({
      kicker: "Team",
      title: "Staff users",
      singular: "staff user",
      countNoun: ["Staff", "Staff"],
      removedAs: "staff",
      intro:
        "Your hotel team — Managers, Leads and Members. You can give them only the pages, options and hotels you have.",
      permissionsHint:
        "Picking a category fills in its usual options (Manager: all, Lead: view/add/edit, Member: view). Any option also gives View.",
      api: STAFF_API,
      categories: STAFF_CATEGORIES,
      // Tabs: people added from Settings → Cooks / Servers / Cleaners.
      jobTypes: ["Cook", "Server", "Cleaner"],
      presets: CATEGORY_PRESETS,
      fullAccessWhenUnset: false,
      // Badge: their job (Cook / Server / Cleaner); smaller: Manager / Lead / Member.
      roleText: (user) => user.staff_type || "Staff",
      levelText: (user) => user.staff_category,
      canCreate,
      canEdit,
      canDelete,
    }),
    [canCreate, canEdit, canDelete],
  );

  return <UserAccessPage config={config} />;
};

export default StaffUsers;
