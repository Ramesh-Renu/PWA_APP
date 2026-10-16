import { useMemo } from "react";
import useAuth from "hooks/useAuth";
import { can, homePathFor, isStaffRole, isSuperAdmin } from "utils/permissions";

/**
 * The signed-in user's role and page/option access:
 *   const { isStaff, isSuperAdmin, can } = usePermission();
 *   can("hotels", "edit")
 */
const usePermission = () => {
  const [{ data }] = useAuth();
  const details = data?.details;

  return useMemo(
    () => ({
      details,
      isStaff: isStaffRole(details?.role),
      isSuperAdmin: isSuperAdmin(details?.role),
      homePath: homePathFor(details),
      can: (page, action = "view") => can(details, page, action),
    }),
    [details],
  );
};

export default usePermission;
