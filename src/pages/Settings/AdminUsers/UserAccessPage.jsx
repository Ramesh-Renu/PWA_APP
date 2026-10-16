import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import AppSelect from "components/common/AppSelect";
import { getApiErrorMessage } from "utils/apiError";
import { PAGE_LABELS } from "utils/permissions";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { getAllHotel } from "services";

const ACTIONS = ["view", "create", "edit", "delete"];
const ACTION_LABELS = { view: "View", create: "Add", edit: "Edit", delete: "Delete" };

const emptyForm = {
  name: "",
  mobilenumber: "",
  email: "",
  location: "",
  staff_category: "",
  is_active: true,
  all_hotels: false,
  hotel_ids: [],
  permissions: {},
};

// How much taller the table gets when the header folds away (keep in step
// with the two max-heights in styles/pages/adminusers.scss: 300px vs 170px).
const COMPACT_TABLE_GROWTH = 130;

const OTHER_JOB = "other";
const jobOf = (user) => user.staff_type || OTHER_JOB;

const listOf = (response) => {
  const value = response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

/**
 * A list of users plus an access form: details, hotels and a pages × options
 * grid. Used by Admin users (SuperAdmin creates Admins) and Staff users
 * (Admin creates Manager / Lead / Member); see AdminUsers.jsx / StaffUsers.jsx
 * for each `config`. The API enforces the same rules.
 */
const UserAccessPage = ({ config }) => {
  const { api, categories, presets, canCreate = true, canEdit = true, canDelete = true } = config;
  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [allHotelsAllowed, setAllHotelsAllowed] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // Job tab: "" = all, a job type ("Cook"…), or OTHER_JOB (added directly).
  const [jobFilter, setJobFilter] = useState("");
  // The page header folds away while the table is scrolled down — only when
  // the rows still overflow after the table grows into the header's space
  // (else the table would stop scrolling, jump to the top and loop).
  const [headerHidden, setHeaderHidden] = useState(false);
  const tableRef = useRef(null);
  const handleTableScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop === 0) {
      setHeaderHidden(false);
    } else if (scrollTop > 24 && scrollHeight - clientHeight > COMPACT_TABLE_GROWTH + 48) {
      setHeaderHidden(true);
    }
  };
  // A new tab / filter / search starts at the top with the header shown.
  useEffect(() => {
    setHeaderHidden(false);
    if (tableRef.current) tableRef.current.scrollTop = 0;
  }, [jobFilter, categoryFilter, search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const singular = config.singular;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(listOf(await api.list()));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || `Unable to load ${config.title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [api, config.title]);

  useEffect(() => {
    load();
    if (canCreate || canEdit) {
      api
        .catalog()
        .then((response) => {
          setCatalog(listOf(response));
          setAllHotelsAllowed(response?.all_hotels_allowed !== false);
        })
        .catch(() => setCatalog([]));
    }
    // The API returns only the hotels this user may manage.
    getAllHotel()
      .then((response) => setHotels(listOf(response)))
      .catch(() => setHotels([]));
  }, [load, api, canCreate, canEdit]);

  const hotelName = (id) =>
    hotels.find((hotel) => Number(hotel.id) === Number(id))?.hotel_name || `#${id}`;

  const groups = useMemo(() => {
    const byGroup = new Map();
    catalog.forEach((page) => {
      if (!byGroup.has(page.group)) byGroup.set(page.group, []);
      byGroup.get(page.group).push(page);
    });
    return [...byGroup.entries()];
  }, [catalog]);

  // Search + category, before the job tab (the tab counts use this).
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        (!categoryFilter || user.staff_category === categoryFilter) &&
        (!query ||
          [user.name, user.mobilenumber, user.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))),
    );
  }, [users, search, categoryFilter]);

  const visible = useMemo(
    () => (jobFilter ? filtered.filter((user) => jobOf(user) === jobFilter) : filtered),
    [filtered, jobFilter],
  );

  // Job tabs with counts; "Other" (added directly, no job) only when used.
  const jobTabs = useMemo(() => {
    if (!config.jobTypes) return null;
    const count = (job) => filtered.filter((user) => jobOf(user) === job).length;
    const tabs = [
      { value: "", label: "All", count: filtered.length },
      ...config.jobTypes.map((job) => ({ value: job, label: job, count: count(job) })),
    ];
    const other = count(OTHER_JOB);
    if (other || jobFilter === OTHER_JOB) tabs.push({ value: OTHER_JOB, label: "Other", count: other });
    return tabs;
  }, [filtered, config.jobTypes, jobFilter]);

  /** Permissions a category starts with, limited to what can be granted. */
  const presetFor = (category) => {
    const actions = presets?.[category];
    if (!actions) return {};
    return Object.fromEntries(
      catalog
        .map((page) => [page.key, page.actions.filter((a) => actions.includes(a))])
        .filter(([, list]) => list.length),
    );
  };

  const openCreate = () => {
    setEditing(null);
    const category = categories?.[categories.length - 1] || "";
    setForm({
      ...emptyForm,
      staff_category: category,
      all_hotels: false,
      permissions: presetFor(category),
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || "",
      mobilenumber: user.mobilenumber || "",
      email: user.email || "",
      location: user.location || "",
      staff_category: user.staff_category || "",
      is_active: user.is_active !== false,
      all_hotels: user.hotel_ids == null,
      hotel_ids: (user.hotel_ids || []).map(Number),
      permissions:
        user.permissions == null && config.fullAccessWhenUnset
          ? Object.fromEntries(catalog.map((page) => [page.key, [...page.actions]]))
          : user.permissions || {},
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const handleChange = ({ target }) =>
    setForm((current) => ({ ...current, [target.name]: target.value }));

  // Picking a category fills in its usual options (adjust them below).
  const handleCategory = ({ target }) =>
    setForm((current) => ({
      ...current,
      staff_category: target.value,
      permissions: presetFor(target.value),
    }));

  const hasAction = (pageKey, action) => Boolean(form.permissions[pageKey]?.includes(action));

  // Any option needs "view"; removing "view" removes the page's options.
  const toggleAction = (page, action) =>
    setForm((current) => {
      const actions = new Set(current.permissions[page.key] || []);
      if (actions.has(action)) {
        if (action === "view") actions.clear();
        else actions.delete(action);
      } else {
        actions.add(action);
        actions.add("view");
      }
      const permissions = { ...current.permissions };
      if (actions.size) permissions[page.key] = page.actions.filter((a) => actions.has(a));
      else delete permissions[page.key];
      return { ...current, permissions };
    });

  const togglePage = (page) =>
    setForm((current) => {
      const permissions = { ...current.permissions };
      const full = (permissions[page.key] || []).length === page.actions.length;
      if (full) delete permissions[page.key];
      else permissions[page.key] = [...page.actions];
      return { ...current, permissions };
    });

  const setAllPermissions = (on) =>
    setForm((current) => ({
      ...current,
      permissions: on
        ? Object.fromEntries(catalog.map((page) => [page.key, [...page.actions]]))
        : {},
    }));

  const toggleHotel = (id) =>
    setForm((current) => ({
      ...current,
      hotel_ids: current.hotel_ids.includes(id)
        ? current.hotel_ids.filter((hotelId) => hotelId !== id)
        : [...current.hotel_ids, id],
    }));

  const mobileValid = /^\d{10}$/.test(form.mobilenumber.trim());
  const pageCount = Object.keys(form.permissions).length;
  const canSave =
    form.name.trim() &&
    mobileValid &&
    (!categories || form.staff_category) &&
    (form.all_hotels || form.hotel_ids.length > 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      is_active: form.is_active,
      all_hotels: form.all_hotels,
      hotel_ids: form.all_hotels ? [] : form.hotel_ids,
      permissions: form.permissions,
      ...(categories && { staff_category: form.staff_category }),
    };

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.update(editing.id, body);
        setNotice(`“${body.name}” updated.`);
      } else {
        const response = await api.create({ ...body, mobilenumber: form.mobilenumber.trim() });
        setNotice(response?.message || `“${body.name}” added.`);
      }
      setDialogOpen(false);
      await load();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError) || `Unable to save this ${singular}.`);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    setError("");
    try {
      await api.remove(toRemove.id);
      setNotice(
        `“${toRemove.name || toRemove.mobilenumber}” is no longer ${config.removedAs}. You can retrieve them from Inactive users.`,
      );
      setToRemove(null);
      await load();
    } catch (requestError) {
      setToRemove(null);
      setError(getApiErrorMessage(requestError) || "Unable to remove access.");
    } finally {
      setRemoving(false);
    }
  };

  const hotelsLabel = (user) => {
    if (config.isLocked?.(user) || user.hotel_ids == null) return "All hotels";
    if (!user.hotel_ids.length) return "No hotels";
    const names = user.hotel_ids.map(hotelName);
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
  };

  /**
   * Access column: the screens (pages) this user can open, e.g.
   * "Orders, Reservations +3"; the tooltip lists each page's options.
   */
  const accessLabel = (user) => {
    if (config.isLocked?.(user) || (user.permissions == null && config.fullAccessWhenUnset)) {
      return { text: "Full access", title: "Every page and option" };
    }
    const permissions = user.permissions || {};
    const order = catalog.map((page) => page.key);
    const keys = Object.keys(permissions).sort(
      (a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999),
    );
    if (!keys.length) return { text: "No pages", title: "Can't open any page yet" };
    const labelOf = (key) =>
      catalog.find((page) => page.key === key)?.label || PAGE_LABELS[key] || key;
    const names = keys.map(labelOf);
    return {
      text: names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", "),
      title: keys
        .map((key) => `${labelOf(key)}: ${permissions[key].map((a) => ACTION_LABELS[a] || a).join(", ")}`)
        .join("\n"),
    };
  };

  return (
    <section className={`ui-page access-page${headerHidden ? " is-compact" : ""}`}>
      <header className="ui-header access-page__header" aria-hidden={headerHidden || undefined}>
        <div>
          <span className="ui-kicker">{config.kicker}</span>
          <h1>{config.title}</h1>
          <p>{config.intro}</p>
          {config.readOnlyNote && <p className="access-page__note">{config.readOnlyNote}</p>}
        </div>
        {canCreate && (
          <div className="ui-header__actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
              <AddRoundedIcon fontSize="small" /> Add {singular}
            </button>
          </div>
        )}
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
            placeholder="Search name, mobile or email"
            aria-label={`Search ${config.title.toLowerCase()}`}
          />
        </label>
        {categories && (
          <AppSelect
            variant="toolbar"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Category"
            options={[
              { value: "", label: "Every category" },
              ...categories.map((category) => ({ value: category, label: category })),
            ]}
          />
        )}
        <span className="ui-toolbar__count">
          {visible.length} {visible.length === 1 ? config.countNoun[0] : config.countNoun[1]}
        </span>
      </div>

      {jobTabs && (
        <div className="ui-segment access-tabs" role="tablist" aria-label="Job">
          {jobTabs.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={jobFilter === tab.value}
              className={jobFilter === tab.value ? "is-active" : ""}
              onClick={() => setJobFilter(tab.value)}
            >
              {tab.label}
              <span className="access-tabs__count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rows scroll inside the panel; the tabs and column headings stay put. */}
      <div
        className="ui-panel ui-table-wrap ui-table-wrap--scroll admin-users__table"
        ref={tableRef}
        onScroll={handleTableScroll}
      >
        <table className="ui-table">
          <thead>
            <tr>
              <th>Name</th>
              <th title="Screens this user can open after signing in">Access</th>
              <th>Hotels</th>
              <th>Location</th>
              <th>Area</th>
              <th>Status</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ui-table__state">
                <td colSpan={7}>Loading {config.title.toLowerCase()}…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr className="ui-table__state">
                <td colSpan={7}>No {config.title.toLowerCase()} found.</td>
              </tr>
            ) : (
              visible.map((user) => {
                const locked = config.isLocked?.(user);
                return (
                  <tr key={user.id}>
                    <td>
                      {/* Photo, then name / mobile / category. */}
                      <div className="admin-users__person">
                        <StaffAvatar
                          name={user.name || user.mobilenumber}
                          photo={user.photo_url}
                          size={40}
                          tone={String(user.staff_type || "cook").toLowerCase()}
                        />
                        <div>
                          <strong>{user.name || "—"}</strong>
                          <small className="admin-users__sub">{user.mobilenumber}</small>
                          {/* Job (Cook / Server…) stands out; role level is smaller. */}
                          <span className="admin-users__role">
                            <span className={`ui-chip ${locked ? "ui-chip--brand" : "ui-chip--job"}`}>
                              {config.roleText(user)}
                            </span>
                            {config.levelText?.(user) && (
                              <small className="admin-users__level">{config.levelText(user)}</small>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td title={accessLabel(user).title}>{accessLabel(user).text}</td>
                    <td>{hotelsLabel(user)}</td>
                    <td>{user.location_name || "—"}</td>
                    <td>{user.area_name || "—"}</td>
                    <td>
                      <span className={`ui-chip ${user.is_active !== false ? "ui-chip--success" : ""}`}>
                        {user.is_active !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="is-right">
                      {!locked && canEdit && (
                        <button
                          type="button"
                          className="ui-icon-btn"
                          title="Edit access"
                          aria-label={`Edit ${user.name || user.mobilenumber}`}
                          onClick={() => openEdit(user)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      )}
                      {!locked && canDelete && (
                        <button
                          type="button"
                          className="ui-icon-btn ui-icon-btn--danger"
                          title="Remove access"
                          aria-label={`Remove access of ${user.name || user.mobilenumber}`}
                          onClick={() => setToRemove(user)}
                        >
                          <PersonRemoveOutlinedIcon fontSize="small" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PopupModal
        show={dialogOpen}
        onClose={closeDialog}
        header
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog admin-users-dialog"
      >
        <form className="menu-editor" onSubmit={handleSubmit}>
          <div className="hotel-form">
            {formError && (
              <p className="menu-editor__alert" role="alert">
                {formError}
              </p>
            )}

            <section className="hotel-form__section">
              <h3 className="admin-users__title">Details</h3>
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="access-name">
                    Name <sup>*</sup>
                  </label>
                  <input
                    id="access-name"
                    name="name"
                    className="hotel-form__input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Priya"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="access-mobile">
                    Mobile number <sup>*</sup>
                  </label>
                  <input
                    id="access-mobile"
                    name="mobilenumber"
                    className={`hotel-form__input${form.mobilenumber && !mobileValid ? " is-invalid" : ""}`}
                    value={form.mobilenumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mobilenumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    inputMode="numeric"
                    placeholder="10-digit mobile (used to sign in)"
                    disabled={Boolean(editing)}
                    required
                  />
                  {form.mobilenumber && !mobileValid && (
                    <span className="hotel-form__error">Enter a 10-digit mobile number.</span>
                  )}
                </div>
                {categories && (
                  <div className="hotel-form__field">
                    <label className="hotel-form__label" htmlFor="access-category">
                      Category <sup>*</sup>
                    </label>
                    <AppSelect
                      id="access-category"
                      name="staff_category"
                      value={form.staff_category}
                      onChange={handleCategory}
                      placeholder="Select category"
                      options={categories.map((category) => ({ value: category, label: category }))}
                    />
                  </div>
                )}
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="access-email">
                    Email
                  </label>
                  <input
                    id="access-email"
                    name="email"
                    type="email"
                    className="hotel-form__input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="access-location">
                    Location
                  </label>
                  <input
                    id="access-location"
                    name="location"
                    className="hotel-form__input"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
                <label className="menu-switch hotel-form__field--full">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, is_active: event.target.checked }))
                    }
                  />
                  <span className="menu-switch__track" aria-hidden />
                  <span>
                    <strong>{form.is_active ? "Active" : "Disabled"}</strong>
                    <small>Disabled users can't sign in or use these pages.</small>
                  </span>
                </label>
              </div>
            </section>

            <section className="hotel-form__section">
              <h3 className="admin-users__title">Hotels</h3>
              {allHotelsAllowed && (
                <label className="admin-users__check admin-users__check--strong">
                  <input
                    type="checkbox"
                    checked={form.all_hotels}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, all_hotels: event.target.checked }))
                    }
                  />
                  All hotels (including hotels added later)
                </label>
              )}
              {!form.all_hotels && (
                <div className="admin-users__hotels">
                  {hotels.length === 0 && <p className="admin-users__hint">No hotels available.</p>}
                  {hotels.map((hotel) => (
                    <label key={hotel.id} className="admin-users__check">
                      <input
                        type="checkbox"
                        checked={form.hotel_ids.includes(Number(hotel.id))}
                        onChange={() => toggleHotel(Number(hotel.id))}
                      />
                      {hotel.hotel_name}
                    </label>
                  ))}
                </div>
              )}
              {!form.all_hotels && form.hotel_ids.length === 0 && (
                <span className="hotel-form__error">Pick at least one hotel.</span>
              )}
            </section>

            <section className="hotel-form__section">
              <div className="admin-users__title-row">
                <h3 className="admin-users__title">
                  Pages &amp; options <small>({pageCount} of {catalog.length} pages)</small>
                </h3>
                <span>
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setAllPermissions(true)}>
                    Select all
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setAllPermissions(false)}>
                    Clear
                  </button>
                </span>
              </div>
              <div className="admin-users__matrix-wrap">
                <table className="ui-table admin-users__matrix">
                  <thead>
                    <tr>
                      <th>Page</th>
                      {ACTIONS.map((action) => (
                        <th key={action} className="is-center">
                          {ACTION_LABELS[action]}
                        </th>
                      ))}
                      <th className="is-center">All</th>
                    </tr>
                  </thead>
                  {groups.map(([group, pages]) => (
                    <tbody key={group}>
                      <tr className="admin-users__group">
                        <td colSpan={ACTIONS.length + 2}>{group}</td>
                      </tr>
                      {pages.map((page) => (
                        <tr key={page.key}>
                          <td className="is-strong">{page.label}</td>
                          {ACTIONS.map((action) => (
                            <td key={action} className="is-center">
                              {page.actions.includes(action) ? (
                                <input
                                  type="checkbox"
                                  checked={hasAction(page.key, action)}
                                  onChange={() => toggleAction(page, action)}
                                  aria-label={`${page.label}: ${ACTION_LABELS[action]}`}
                                />
                              ) : (
                                <span className="admin-users__na">—</span>
                              )}
                            </td>
                          ))}
                          <td className="is-center">
                            <input
                              type="checkbox"
                              checked={(form.permissions[page.key] || []).length === page.actions.length}
                              onChange={() => togglePage(page)}
                              aria-label={`${page.label}: all options`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
              <p className="admin-users__hint">{config.permissionsHint}</p>
            </section>
          </div>

          <div className="hotel-form__actions">
            <button
              type="button"
              className="hotel-form__btn hotel-form__btn--ghost"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="hotel-form__btn hotel-form__btn--primary"
              disabled={saving || !canSave}
            >
              {saving && <span className="btn-spinner" aria-hidden />}
              {saving ? "Saving…" : editing ? "Save changes" : `Add ${singular}`}
            </button>
          </div>
        </form>
      </PopupModal>

      <ConfirmDialog
        show={Boolean(toRemove)}
        tone="danger"
        title={`Remove access of “${toRemove?.name || toRemove?.mobilenumber || ""}”?`}
        message="They move to Inactive users, where their access can be retrieved later. Their bookings and orders are kept."
        confirmLabel="Remove access"
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </section>
  );
};

export default UserAccessPage;
