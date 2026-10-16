import { useCallback, useEffect, useMemo, useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ConfirmDialog from "components/common/ConfirmDialog";
import usePermission from "hooks/usePermission";
import { getApiErrorMessage } from "utils/apiError";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { getAllHotel, getRemovedUsers, restoreUser } from "services";

const listOf = (response) => {
  const value = response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const RESTORE_LABELS = { staff: "Staff User", admin: "Admin User" };

/** What they were before removal, e.g. "Server" + "Member", or "Admin". */
const previousOf = (user) => {
  const prev = user.previous_access || {};
  const role = String(prev.role || "").toLowerCase();
  if (role === "admin") return { badge: "Admin", level: null, kind: "admin" };
  return { badge: prev.staff_type || "Staff", level: prev.staff_category, kind: "staff" };
};

/**
 * User Management → Inactive users: people whose Staff / Admin access was
 * removed (from Staff users, Admin users, or by deleting their Cook /
 * Server / Cleaner). "Retrieve user as" gives it back: Admins as Staff
 * User, the SuperAdmin as Staff User or Admin User.
 */
const InactiveUsers = () => {
  const { can } = usePermission();
  const canRetrieve = can("users", "create");

  const [rows, setRows] = useState([]);
  const [restoreAs, setRestoreAs] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("");
  const [pending, setPending] = useState(null); // { user, as }
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRemovedUsers();
      setRows(listOf(response));
      setRestoreAs(Array.isArray(response?.restore_as) ? response.restore_as : ["staff"]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || "Unable to load inactive users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getAllHotel()
      .then((response) => setHotels(listOf(response)))
      .catch(() => setHotels([]));
  }, [load]);

  const hotelsLabel = (user) => {
    if (user.hotel_ids == null) return "All hotels";
    if (!user.hotel_ids.length) return "No hotels";
    const names = user.hotel_ids.map(
      (id) => hotels.find((hotel) => Number(hotel.id) === Number(id))?.hotel_name || `#${id}`,
    );
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
  };

  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((user) =>
      [user.name, user.mobilenumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const visible = tab ? searched.filter((user) => previousOf(user).kind === tab) : searched;
  const count = (kind) => searched.filter((user) => previousOf(user).kind === kind).length;
  const tabs = [
    { value: "", label: "All", count: searched.length },
    { value: "staff", label: "Staff", count: count("staff") },
    ...(restoreAs.includes("admin") ? [{ value: "admin", label: "Admins", count: count("admin") }] : []),
  ];

  const confirmRestore = async () => {
    if (!pending) return;
    setRestoring(true);
    setError("");
    try {
      const response = await restoreUser(pending.user.id, pending.as);
      setNotice(
        response?.message ||
          `“${pending.user.name || pending.user.mobilenumber}” is back as ${RESTORE_LABELS[pending.as]}.`,
      );
      setPending(null);
      await load();
    } catch (requestError) {
      setPending(null);
      setError(getApiErrorMessage(requestError) || "Unable to retrieve this user.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <section className="ui-page access-page">
      <header className="ui-header">
        <div>
          <span className="ui-kicker">User Management</span>
          <h1>Inactive users</h1>
          <p>
            People whose access was removed. They can still sign in as guests. Retrieve one
            to give them their old pages and hotels back.
          </p>
        </div>
      </header>

      {error && (
        <div className="ui-alert ui-alert--danger" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="ui-alert ui-alert--success" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <div className="ui-toolbar">
        <label className="ui-search">
          <SearchRoundedIcon fontSize="small" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or mobile"
            aria-label="Search inactive users"
          />
        </label>
        <span className="ui-toolbar__count">{visible.length} inactive</span>
      </div>

      {tabs.length > 2 && (
        <div className="ui-segment access-tabs" role="tablist" aria-label="Type">
          {tabs.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={tab === item.value ? "is-active" : ""}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              <span className="access-tabs__count">{item.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="ui-panel ui-table-wrap ui-table-wrap--scroll admin-users__table">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hotels</th>
              <th>Location</th>
              <th>Area</th>
              <th>Removed on</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ui-table__state">
                <td colSpan={6}>Loading inactive users…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr className="ui-table__state">
                <td colSpan={6}>No inactive users.</td>
              </tr>
            ) : (
              visible.map((user) => {
                const previous = previousOf(user);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-users__person">
                        <StaffAvatar
                          name={user.name || user.mobilenumber}
                          photo={user.photo_url}
                          size={40}
                          tone={String(user.previous_access?.staff_type || "cook").toLowerCase()}
                        />
                        <div>
                          <strong>{user.name || "—"}</strong>
                          <small className="admin-users__sub">{user.mobilenumber}</small>
                          <span className="admin-users__role">
                            <span className="ui-chip">{previous.badge}</span>
                            {previous.level && (
                              <small className="admin-users__level">{previous.level}</small>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{hotelsLabel(user)}</td>
                    <td>{user.location_name || "—"}</td>
                    <td>{user.area_name || "—"}</td>
                    <td>{formatDate(user.removed_at)}</td>
                    <td className="is-right">
                      {canRetrieve ? (
                        <div className="inactive-users__retrieve">
                          <span>Retrieve user as:</span>
                          {restoreAs.map((as) => (
                            <button
                              key={as}
                              type="button"
                              className="ui-btn ui-btn--ghost"
                              onClick={() => setPending({ user, as })}
                            >
                              {RESTORE_LABELS[as]}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-users__level">View only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        show={Boolean(pending)}
        tone="warning"
        title={`Retrieve “${pending?.user.name || pending?.user.mobilenumber || ""}” as ${
          RESTORE_LABELS[pending?.as] || ""
        }?`}
        message={
          pending?.as === "admin"
            ? "They become an Admin with the pages and hotels they had. You can change them in Admin users."
            : "They get back their category, job, pages and hotels (only what you have). You can change them in Staff users."
        }
        confirmLabel="Retrieve"
        loading={restoring}
        onConfirm={confirmRestore}
        onCancel={() => setPending(null)}
      />
    </section>
  );
};

export default InactiveUsers;
