import { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import { getApiErrorMessage } from "utils/apiError";
import SettingsBackLink from "pages/Settings/SettingsBackLink";
import {
  createArea,
  deleteArea,
  getAllArea,
  getAllLocation,
  updateArea,
} from "services";
import AppSelect from "components/common/AppSelect";

const emptyForm = { name: "", location_id: "", description: "" };

const listOf = (response) => {
  const value = response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

/**
 * Settings → Areas: the areas (e.g. T Nagar, Adyar) a hotel is placed in,
 * each inside a location (city). Used by the hotel form and hotel search.
 */
const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAreas(listOf(await getAllArea()));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || "Unable to load areas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getAllLocation()
      .then((response) => setLocations(listOf(response)))
      .catch(() => setLocations([]));
  }, [load]);

  const locationName = (id) =>
    locations.find((location) => String(location.id) === String(id))?.name || "—";

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return areas.filter((area) => {
      const matchesSearch =
        !query ||
        [area.name, area.description, locationName(area.location_id)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesLocation =
        !locationFilter || String(area.location_id) === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [areas, search, locationFilter, locations]);

  // An area name can exist only once.
  const duplicateName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) return false;
    return areas.some(
      (area) =>
        area.id !== editing?.id && String(area.name || "").trim().toLowerCase() === name,
    );
  }, [areas, form.name, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, location_id: locationFilter });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (area) => {
    setEditing(area);
    setForm({
      name: area.name || "",
      location_id: area.location_id ? String(area.location_id) : "",
      description: area.description || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const handleChange = ({ target }) =>
    setForm((current) => ({ ...current, [target.name]: target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = {
      name: form.name.trim(),
      location_id: form.location_id ? Number(form.location_id) : null,
      description: form.description.trim(),
    };
    if (!body.name || !body.location_id || duplicateName) return;

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateArea(editing.id, body);
        setNotice(`“${body.name}” updated.`);
      } else {
        await createArea(body);
        setNotice(`“${body.name}” added.`);
      }
      setDialogOpen(false);
      await load();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError) || "Unable to save this area.");
    } finally {
      setSaving(false);
    }
  };

  const inUse = Number(toDelete?.hotel_count) || 0;

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (inUse) {
      setToDelete(null);
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteArea(toDelete.id);
      setNotice(`“${toDelete.name}” deleted.`);
      setToDelete(null);
      await load();
    } catch (requestError) {
      setToDelete(null);
      setError(getApiErrorMessage(requestError) || "Unable to delete this area.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="ui-page">
      <SettingsBackLink />
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Settings</span>
          <h1>Areas</h1>
          <p>Areas (e.g. T Nagar, Adyar) inside each location, used to place and find hotels.</p>
        </div>
        <div className="ui-header__actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
            <AddRoundedIcon fontSize="small" /> Add area
          </button>
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
            placeholder="Search areas"
            aria-label="Search areas"
          />
        </label>
        <AppSelect
          variant="toolbar"
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
          aria-label="Location"
          options={[
            { value: "", label: "Every location" },
            ...locations.map((location) => ({ value: location.id, label: location.name })),
          ]}
        />
        <span className="ui-toolbar__count">
          {visible.length} {visible.length === 1 ? "area" : "areas"}
        </span>
      </div>

      <div className="ui-panel ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Area</th>
              <th>Location</th>
              <th>Description</th>
              <th className="is-center">Hotels</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ui-table__state">
                <td colSpan={5}>Loading areas…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr className="ui-table__state">
                <td colSpan={5}>No areas found. Add one or adjust your search.</td>
              </tr>
            ) : (
              visible.map((area) => (
                <tr key={area.id}>
                  <td className="is-strong">{area.name}</td>
                  <td>{locationName(area.location_id)}</td>
                  <td className="is-muted">{area.description || "—"}</td>
                  <td className="is-center">{Number(area.hotel_count) || 0}</td>
                  <td className="is-right">
                    <button
                      type="button"
                      className="ui-icon-btn"
                      title="Edit"
                      aria-label={`Edit ${area.name}`}
                      onClick={() => openEdit(area)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </button>
                    <button
                      type="button"
                      className="ui-icon-btn ui-icon-btn--danger"
                      title="Delete"
                      aria-label={`Delete ${area.name}`}
                      onClick={() => setToDelete(area)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PopupModal
        show={dialogOpen}
        onClose={closeDialog}
        header
        title={editing ? "Edit area" : "Add area"}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
      >
        <form className="menu-editor" onSubmit={handleSubmit}>
          <div className="hotel-form">
            {formError && (
              <p className="menu-editor__alert" role="alert">
                {formError}
              </p>
            )}
            <section className="hotel-form__section">
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="area-name">
                    Area name <sup>*</sup>
                  </label>
                  <input
                    id="area-name"
                    name="name"
                    className={`hotel-form__input${duplicateName ? " is-invalid" : ""}`}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. T Nagar"
                    autoComplete="off"
                    aria-invalid={duplicateName}
                    autoFocus
                    required
                  />
                  {duplicateName && (
                    <span className="hotel-form__error">
                      An area named “{form.name.trim()}” already exists.
                    </span>
                  )}
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="area-location">
                    Location <sup>*</sup>
                  </label>
                  <AppSelect
                    id="area-location"
                    name="location_id"
                    value={form.location_id}
                    onChange={handleChange}
                    placeholder="Select location"
                    options={locations.map((location) => ({
                      value: location.id,
                      label: location.name,
                    }))}
                  />
                </div>
                <div className="hotel-form__field hotel-form__field--full">
                  <label className="hotel-form__label" htmlFor="area-description">
                    Description
                  </label>
                  <textarea
                    id="area-description"
                    name="description"
                    className="hotel-form__input menu-editor__textarea"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Optional, e.g. landmark or pin code"
                  />
                </div>
              </div>
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
              disabled={saving || !form.name.trim() || !form.location_id || duplicateName}
            >
              {saving && <span className="btn-spinner" aria-hidden />}
              {saving ? "Saving…" : editing ? "Save changes" : "Add area"}
            </button>
          </div>
        </form>
      </PopupModal>

      <ConfirmDialog
        show={Boolean(toDelete)}
        tone={inUse ? "warning" : "danger"}
        title={
          inUse
            ? `“${toDelete?.name}” is used by ${inUse} ${inUse === 1 ? "hotel" : "hotels"}`
            : `Delete “${toDelete?.name || "this area"}”?`
        }
        message={
          inUse
            ? "Move those hotels to another area first (Hotels → Edit), then delete it."
            : "It will be removed from the areas list."
        }
        confirmLabel={inUse ? "OK" : "Delete area"}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
};

export default Areas;
