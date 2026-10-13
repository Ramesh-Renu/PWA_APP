import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AddPhotoAlternateOutlined,
  AddRounded,
  DeleteOutlineRounded,
  EditOutlined,
  SearchRounded,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import useToast from "hooks/useToast";
import {
  getAllArea,
  getAllFloor,
  getAllHotel,
  getAllLocation,
  uploadMenuImage,
} from "services";
import { getApiErrorMessage } from "utils/apiError";
import StaffAvatar, { avatarColorOf, initialsOf } from "./StaffAvatar";
import SettingsBackLink from "pages/Settings/SettingsBackLink";
import AppSelect from "components/common/AppSelect";

// Optional personal details + working hours (API: staffPersonalFields.js).
const PERSONAL_FIELDS = [
  "phone",
  "email",
  "gender",
  "date_of_birth",
  "address",
  "emergency_contact",
  "joined_on",
  "shift_start",
  "shift_end",
  // Where they work (API keeps these in step with the hotel).
  "location_id",
  "area_id",
  "floor_id",
];
const TIME_FIELDS = ["shift_start", "shift_end"];
const EMPTY_PERSONAL = Object.fromEntries(PERSONAL_FIELDS.map((field) => [field, ""]));
const GENDERS = ["Male", "Female", "Other"];

// "17:30" / "17:30:00" → "5:30 PM".
const formatClock = (value) => {
  const [hours, minutes] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const shiftLabel = (row) =>
  row?.shift_start && row?.shift_end
    ? `${formatClock(row.shift_start)} – ${formatClock(row.shift_end)}`
    : row?.shift_start
      ? `From ${formatClock(row.shift_start)}`
      : "";

/**
 * Settings page for staff master data (cooks, servers). `config` comes from
 * staffConfig.js and supplies field names, labels and API calls.
 */
const StaffPage = ({ config }) => {
  const {
    title,
    singular,
    intro,
    icon: Icon,
    kind,
    nameField,
    namePlaceholder,
    detailField,
    detailLabel,
    detailPlaceholder,
    detailSuggestions,
    api,
  } = config;
  const lower = singular.toLowerCase();

  const emptyForm = {
    name: "",
    detail: "",
    hotel_id: "",
    is_active: true,
    photo_url: "",
    photo_file_id: "",
    ...EMPTY_PERSONAL,
  };

  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hotelFilter, setHotelFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.list();
      setRows(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || `Unable to load ${title.toLowerCase()}.`,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [api, title]);

  useEffect(() => {
    load();
    getAllLocation()
      .then((response) => setLocations(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setLocations([]));
    getAllArea()
      .then((response) => setAreas(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setAreas([]));
    getAllHotel()
      .then((response) => setHotels(response?.data || []))
      .catch(() => setHotels([]));
  }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row[nameField], row[detailField], row.hotel?.hotel_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? row.is_active : !row.is_active);
      const matchesHotel =
        !hotelFilter ||
        (hotelFilter === "all-hotels"
          ? !row.hotel_id
          : String(row.hotel_id) === hotelFilter);
      return matchesSearch && matchesStatus && matchesHotel;
    });
  }, [rows, search, statusFilter, hotelFilter, nameField, detailField]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview("");
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row[nameField] || "",
      detail: row[detailField] || "",
      hotel_id: row.hotel_id ? String(row.hotel_id) : "",
      is_active: Boolean(row.is_active),
      photo_url: row.photo_url || "",
      photo_file_id: row.photo_file_id || "",
      // Optional personal details; API times come as "09:30:00".
      ...Object.fromEntries(
        PERSONAL_FIELDS.map((field) => [
          field,
          TIME_FIELDS.includes(field)
            ? String(row[field] || "").slice(0, 5)
            : row[field] == null ? "" : String(row[field]),
        ]),
      ),
    });
    setPhotoFile(null);
    setPhotoPreview(row.photo_url || "");
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const handleChange = ({ target }) =>
    setForm((current) => {
      const next = { ...current, [target.name]: target.value };
      // A hotel fixes the location / area (they come from the hotel) and
      // has its own floors.
      if (target.name === "hotel_id") {
        const hotel = hotels.find((row) => String(row.id) === target.value);
        next.location_id = hotel?.location_id ? String(hotel.location_id) : current.location_id;
        next.area_id = hotel?.area_id ? String(hotel.area_id) : hotel ? "" : current.area_id;
        next.floor_id = "";
      }
      // Areas belong to a location.
      if (target.name === "location_id") {
        const area = areas.find((row) => String(row.id) === String(current.area_id));
        if (area && String(area.location_id) !== target.value) next.area_id = "";
      }
      return next;
    });

  // Floors of the hotel picked in the form.
  useEffect(() => {
    if (!dialogOpen || !form.hotel_id) {
      setFloors([]);
      return undefined;
    }
    let active = true;
    getAllFloor({ hotel_id: form.hotel_id })
      .then((response) => active && setFloors(Array.isArray(response?.data) ? response.data : []))
      .catch(() => active && setFloors([]));
    return () => {
      active = false;
    };
  }, [dialogOpen, form.hotel_id]);

  const areaOptions = areas.filter(
    (area) => !form.location_id || String(area.location_id) === String(form.location_id),
  );
  const nameById = (list, id) => list.find((row) => String(row.id) === String(id))?.name;

  const pickPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setForm((current) => ({ ...current, photo_url: "", photo_file_id: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    setFormError("");
    try {
      const body = {
        [nameField]: name,
        [detailField]: form.detail.trim(),
        hotel_id: form.hotel_id ? Number(form.hotel_id) : null,
        is_active: form.is_active,
        photo_url: form.photo_url,
        photo_file_id: form.photo_file_id,
        // "" clears an optional detail on the API.
        ...Object.fromEntries(
          PERSONAL_FIELDS.map((field) => [field, String(form[field] || "").trim()]),
        ),
      };

      // The photo is optional; upload only when a new one was picked.
      if (photoFile) {
        const formData = new FormData();
        formData.append("image", photoFile);
        const upload = await uploadMenuImage(formData);
        const url = upload?.url || upload?.data?.url;
        if (!url) throw new Error(upload?.message || "Photo upload failed.");
        body.photo_url = url;
        body.photo_file_id = upload?.fileId || upload?.data?.fileId || "";
      }

      const response = editing
        ? await api.update(editing.id, body)
        : await api.create(body);
      showToast({
        message: response?.message || `${singular} ${editing ? "updated" : "added"}`,
        variant: "success",
      });
      setDialogOpen(false);
      load();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error) || error?.message || `Unable to save the ${lower}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await api.remove(toDelete.id);
      showToast({ message: response?.message || `${singular} deleted`, variant: "success" });
      load();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || `Unable to delete the ${lower}.`,
        variant: "danger",
      });
    } finally {
      setToDelete(null);
      setDeleting(false);
    }
  };

  return (
    <section className="ui-page">
      <SettingsBackLink />
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Settings</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className="ui-header__actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
            <AddRounded fontSize="small" /> Add {lower}
          </button>
        </div>
      </header>

      <div className="ui-toolbar">
        <div className="ui-toolbar__group">
          <label className="ui-search">
            <SearchRounded fontSize="small" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search name or ${detailLabel.toLowerCase()}`}
              aria-label={`Search ${title.toLowerCase()}`}
            />
          </label>
          <AppSelect
            variant="toolbar"
            value={hotelFilter}
            onChange={(event) => setHotelFilter(event.target.value)}
            aria-label="Filter by hotel"
            options={[
              { value: "", label: "Every hotel" },
              { value: "all-hotels", label: "Works at all hotels" },
              ...hotels.map((hotel) => ({ value: hotel.id, label: hotel.hotel_name })),
            ]}
          />
        </div>
        <div className="ui-segment" role="radiogroup" aria-label="Status">
          {["all", "active", "inactive"].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={statusFilter === value}
              className={statusFilter === value ? "is-active" : ""}
              onClick={() => setStatusFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="cook-grid">
          {[0, 1, 2].map((key) => (
            <div key={key} className="cook-card cook-card--skeleton" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="ui-empty">
          <Icon />
          <h3>{rows.length ? `No ${title.toLowerCase()} match` : `No ${title.toLowerCase()} yet`}</h3>
          <p>
            {rows.length
              ? "Try another search or filter."
              : `Add your ${title.toLowerCase()} to assign them to orders.`}
          </p>
          {!rows.length && (
            <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
              <AddRounded fontSize="small" /> Add {lower}
            </button>
          )}
        </div>
      ) : (
        <div className="cook-grid">
          {visible.map((row) => (
            <article
              key={row.id}
              className={`cook-card${row.is_active ? "" : " is-inactive"}`}
            >
              <StaffAvatar name={row[nameField]} photo={row.photo_url} size={56} tone={kind} />
              <div className="cook-card__body">
                <h3>{row[nameField]}</h3>
                <p>{row[detailField] || `No ${detailLabel.toLowerCase()} set`}</p>
                {(shiftLabel(row) || row.phone || row.location_id || row.area_id) && (
                  <p className="cook-card__extra">
                    {(row.location_id || row.area_id) && (
                      <span>
                        📍{" "}
                        {[nameById(locations, row.location_id), nameById(areas, row.area_id)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    {shiftLabel(row) && <span>🕘 {shiftLabel(row)}</span>}
                    {row.phone && <span>📞 {row.phone}</span>}
                  </p>
                )}
                <div className="cook-card__chips">
                  <span className="ui-chip ui-chip--brand">
                    {row.hotel?.hotel_name || "All hotels"}
                  </span>
                  <span className={`ui-chip ${row.is_active ? "ui-chip--success" : ""}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="cook-card__actions">
                <button
                  type="button"
                  className="ui-icon-btn"
                  title="Edit"
                  aria-label={`Edit ${row[nameField]}`}
                  onClick={() => openEdit(row)}
                >
                  <EditOutlined fontSize="small" />
                </button>
                <button
                  type="button"
                  className="ui-icon-btn ui-icon-btn--danger"
                  title="Delete"
                  aria-label={`Delete ${row[nameField]}`}
                  onClick={() => setToDelete(row)}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <PopupModal
        show={dialogOpen}
        onClose={closeDialog}
        header
        title={editing ? `Edit ${lower}` : `Add ${lower}`}
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

            <section className="hotel-form__section cook-form__photo-row">
              <div
                className={`cook-form__photo cook-form__photo--${kind}${
                  !photoPreview && form.name.trim() ? " has-initials" : ""
                }`}
                // Same colour the person gets everywhere once named.
                style={
                  !photoPreview && form.name.trim()
                    ? { background: avatarColorOf(form.name), color: "#fff" }
                    : undefined
                }
              >
                {photoPreview ? (
                  <img src={photoPreview} alt={singular} />
                ) : (
                  <span aria-hidden>
                    {initialsOf(form.name) || <AddPhotoAlternateOutlined />}
                  </span>
                )}
              </div>
              <div className="cook-form__photo-actions">
                <span className="hotel-form__label">Photo (optional)</span>
                <div>
                  <label className="ui-btn ui-btn--ghost ui-btn--sm">
                    {photoPreview ? "Change photo" : "Upload photo"}
                    <input type="file" accept="image/*" hidden onChange={pickPhoto} />
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost ui-btn--sm"
                      onClick={removePhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="hotel-form__hint">
                  Without a photo, initials are shown.
                </span>
              </div>
            </section>

            <section className="hotel-form__section">
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-name`}>
                    {singular} name <sup>*</sup>
                  </label>
                  <input
                    id={`${kind}-name`}
                    name="name"
                    className="hotel-form__input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={namePlaceholder}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-detail`}>
                    {detailLabel}
                  </label>
                  <input
                    id={`${kind}-detail`}
                    name="detail"
                    className="hotel-form__input"
                    value={form.detail}
                    onChange={handleChange}
                    placeholder={detailPlaceholder}
                    list={`${kind}-detail-options`}
                    autoComplete="off"
                  />
                  <datalist id={`${kind}-detail-options`}>
                    {detailSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-hotel`}>
                    Works at
                  </label>
                  <AppSelect
                    id={`${kind}-hotel`}
                    name="hotel_id"
                    value={form.hotel_id}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "All hotels" },
                      ...hotels.map((hotel) => ({ value: hotel.id, label: hotel.hotel_name })),
                    ]}
                  />
                </div>
                <label className="menu-switch cook-form__switch">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, is_active: event.target.checked }))
                    }
                  />
                  <span className="menu-switch__track" aria-hidden />
                  <span>
                    <strong>{form.is_active ? "Active" : "Inactive"}</strong>
                    <small>Only active {title.toLowerCase()} can be assigned</small>
                  </span>
                </label>
              </div>
            </section>

            {/* Where they work. With a hotel, location / area are the hotel's
                and the floor is one of its floors. */}
            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Work place</h3>
              <div className="hotel-form__grid hotel-form__grid--three">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-location`}>
                    Location
                  </label>
                  <AppSelect
                    id={`${kind}-location`}
                    name="location_id"
                    value={form.location_id}
                    onChange={handleChange}
                    disabled={Boolean(form.hotel_id)}
                    options={[
                      { value: "", label: "Any location" },
                      ...locations.map((location) => ({ value: location.id, label: location.name })),
                    ]}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-area`}>
                    Area
                  </label>
                  <AppSelect
                    id={`${kind}-area`}
                    name="area_id"
                    value={form.area_id}
                    onChange={handleChange}
                    disabled={Boolean(form.hotel_id)}
                    options={[
                      { value: "", label: "Any area" },
                      ...areaOptions.map((area) => ({ value: area.id, label: area.name })),
                    ]}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-floor`}>
                    Floor
                  </label>
                  <AppSelect
                    id={`${kind}-floor`}
                    name="floor_id"
                    value={form.floor_id}
                    onChange={handleChange}
                    disabled={!form.hotel_id}
                    placeholder="Pick a hotel first"
                    options={
                      form.hotel_id
                        ? [
                            { value: "", label: "Any floor" },
                            ...floors.map((floor) => ({
                              value: floor.id,
                              label: `Floor ${floor.floor_number}`,
                            })),
                          ]
                        : []
                    }
                  />
                </div>
              </div>
              <span className="hotel-form__hint">
                {form.hotel_id
                  ? "Location and area come from the hotel. Pick the floor they cover."
                  : "Working at all hotels: optionally limit them to a location / area."}
              </span>
            </section>

            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Shift timing</h3>
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-shift-start`}>
                    Starts at
                  </label>
                  <input
                    id={`${kind}-shift-start`}
                    type="time"
                    name="shift_start"
                    className="hotel-form__input"
                    value={form.shift_start}
                    onChange={handleChange}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-shift-end`}>
                    Ends at
                  </label>
                  <input
                    id={`${kind}-shift-end`}
                    type="time"
                    name="shift_end"
                    className="hotel-form__input"
                    value={form.shift_end}
                    onChange={handleChange}
                  />
                  {form.shift_start && form.shift_end && form.shift_end < form.shift_start && (
                    <span className="hotel-form__hint">Overnight shift (ends next day)</span>
                  )}
                </div>
              </div>
            </section>

            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Personal details (optional)</h3>
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-phone`}>
                    Phone
                  </label>
                  <input
                    id={`${kind}-phone`}
                    type="tel"
                    name="phone"
                    className="hotel-form__input"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. 98765 43210"
                    autoComplete="off"
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-email`}>
                    Email
                  </label>
                  <input
                    id={`${kind}-email`}
                    type="email"
                    name="email"
                    className="hotel-form__input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. priya@example.com"
                    autoComplete="off"
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-gender`}>
                    Gender
                  </label>
                  <AppSelect
                    id={`${kind}-gender`}
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    searchable={false}
                    options={[
                      { value: "", label: "Not specified" },
                      ...GENDERS.map((gender) => ({ value: gender, label: gender })),
                    ]}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-dob`}>
                    Date of birth
                  </label>
                  <input
                    id={`${kind}-dob`}
                    type="date"
                    name="date_of_birth"
                    className="hotel-form__input"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-joined`}>
                    Joined on
                  </label>
                  <input
                    id={`${kind}-joined`}
                    type="date"
                    name="joined_on"
                    className="hotel-form__input"
                    value={form.joined_on}
                    onChange={handleChange}
                  />
                </div>
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor={`${kind}-emergency`}>
                    Emergency contact
                  </label>
                  <input
                    id={`${kind}-emergency`}
                    name="emergency_contact"
                    className="hotel-form__input"
                    value={form.emergency_contact}
                    onChange={handleChange}
                    placeholder="e.g. Ravi (brother) 98765 43210"
                    autoComplete="off"
                  />
                </div>
                <div className="hotel-form__field hotel-form__field--full">
                  <label className="hotel-form__label" htmlFor={`${kind}-address`}>
                    Address
                  </label>
                  <textarea
                    id={`${kind}-address`}
                    name="address"
                    className="hotel-form__input menu-editor__textarea"
                    value={form.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="House no, street, area, city"
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
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Saving…" : editing ? "Save changes" : `Add ${lower}`}
            </button>
          </div>
        </form>
      </PopupModal>

      <ConfirmDialog
        show={Boolean(toDelete)}
        title={`Delete ${toDelete?.[nameField] || `this ${lower}`}?`}
        message={`${title} who have handled orders can't be deleted. Mark them inactive instead.`}
        confirmLabel={`Delete ${lower}`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
};

export default StaffPage;
