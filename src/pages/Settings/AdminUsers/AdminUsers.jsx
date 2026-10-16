import { useMemo } from "react";
import UserAccessPage from "./UserAccessPage";
import usePermission from "hooks/usePermission";
import { isSuperAdmin } from "utils/permissions";
import {
  createAdminUser,
  getAdminUsers,
  getPermissionCatalog,
  removeAdminUser,
  updateAdminUser,
} from "services";

const ADMIN_API = {
  list: getAdminUsers,
  catalog: getPermissionCatalog,
  create: createAdminUser,
  update: updateAdminUser,
  remove: removeAdminUser,
};

const ADMIN_CONFIG = {
  kicker: "Super Admin",
  title: "Admin users",
  singular: "admin",
  countNoun: ["admin", "admins"],
  removedAs: "an admin",
  intro: "Create Admins and choose the pages, options and hotels each one can use.",
  permissionsHint:
    "Any option also gives View. Give “Staff users” so this Admin can create their hotel team.",
  api: ADMIN_API,
  // Admins from before roles existed (permissions unset) have full access.
  fullAccessWhenUnset: true,
  isLocked: (user) => isSuperAdmin(user.role),
  roleText: (user) => (isSuperAdmin(user.role) ? "Super Admin" : "Admin"),
};

/**
 * User Management → Admin users: the SuperAdmin manages Admins; Admins can
 * only look (the API refuses their changes too).
 */
const AdminUsers = () => {
  const { isSuperAdmin: superAdmin } = usePermission();
  const config = useMemo(
    () => ({
      ...ADMIN_CONFIG,
      canCreate: superAdmin,
      canEdit: superAdmin,
      canDelete: superAdmin,
      ...(!superAdmin && {
        kicker: "User Management",
        intro: "Admins and the pages, options and hotels each one can use.",
        readOnlyNote: "View only — only the Super Admin can add or change admins.",
      }),
    }),
    [superAdmin],
  );
  return <UserAccessPage config={config} />;
};

export default AdminUsers;
