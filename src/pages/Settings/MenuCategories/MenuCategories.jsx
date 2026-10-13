import { useCallback, useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import SideDishesDialog from "./SideDishesDialog";

import { getAllHotel } from "services";
import { getApiErrorMessage } from "utils/apiError";
import {
  createMenuCategory,
  deleteMenuCategory,
  getAllMenuCategories,
  getCategorySideDishes,
  updateMenuCategory,
} from "services";

// Offered in the "Category names" picker alongside names other hotels use.
const DEFAULT_CATEGORY_NAMES = [
  "Starters",
  "Soups",
  "Salads",
  "Main Course",
  "Rice",
  "Biryani",
  "Breads",
  "Curries",
  "South Indian",
  "North Indian",
  "Chinese",
  "Tandoor",
  "Snacks",
  "Desserts",
  "Beverages",
];

const emptyForm = {
  hotel_id: "",
  category_name: "",
  description: "",
  display_order: 0,
  is_active: true,
};

const unwrapList = (response) => {
  let value = response?.data ?? response;

  if (value?.data !== undefined) value = value.data;
  if (value?.items !== undefined) value = value.items;

  return Array.isArray(value) ? value : [];
};

const categoryId = (category) =>
  category?.id ?? category?.menu_category_id ?? category?.category_id;

const hotelName = (category, hotels) => {
  if (Number(category?.hotel_id) === 0) return "All hotels";

  const hotel = hotels.find(
    (item) => String(item?.id ?? item?.hotel_id) === String(category?.hotel_id),
  );

  return hotel?.hotel_name ?? hotel?.name ?? category?.hotel_name ?? "—";
};

const isActive = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

const MenuCategories = () => {
  const [categories, setCategories] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sideDishes, setSideDishes] = useState([]);
  const [sideDishTarget, setSideDishTarget] = useState(null);

  const loadSideDishes = useCallback(async () => {
    try {
      const response = await getCategorySideDishes({ limit: 1000 });
      setSideDishes(unwrapList(response));
    } catch {
      setSideDishes([]);
    }
  }, []);

  // Side dishes keyed by category id, already sorted by the API.
  const sideDishesByCategory = useMemo(() => {
    const grouped = new Map();
    sideDishes.forEach((dish) => {
      const key = String(dish?.category_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(dish);
    });
    return grouped;
  }, [sideDishes]);

  const categorySideDishes = (category) =>
    sideDishesByCategory.get(String(categoryId(category))) ?? [];

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // The API pages at 10 rows by default.
      const response = await getAllMenuCategories({ limit: 500 });
      setCategories(unwrapList(response));
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to load menu categories. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadSideDishes();

    getAllHotel()
      .then((response) => setHotels(unwrapList(response)))
      .catch(() => setHotels([]));
  }, [loadCategories, loadSideDishes]);

  // Other categories of the hotel picked in the form (excluding the one being
  // edited). A hotel can't have two categories with the same name.
  const hotelCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          form.hotel_id !== "" &&
          String(category?.hotel_id) === String(form.hotel_id) &&
          categoryId(category) !== categoryId(editingCategory),
      ),
    [categories, form.hotel_id, editingCategory],
  );

  const duplicateName = useMemo(() => {
    const name = form.category_name.trim().toLowerCase();
    if (!name) return false;
    return hotelCategories.some(
      (category) =>
        String(category?.category_name || "").trim().toLowerCase() === name,
    );
  }, [hotelCategories, form.category_name]);

  // Names to pick from: common ones plus every name used by any hotel,
  // de-duplicated case-insensitively. Names this hotel already has are
  // shown but disabled.
  const nameSuggestions = useMemo(() => {
    const taken = new Set(
      hotelCategories.map((category) =>
        String(category?.category_name || "").trim().toLowerCase(),
      ),
    );
    const seen = new Map();
    [
      ...DEFAULT_CATEGORY_NAMES,
      ...categories.map((category) => category?.category_name),
    ].forEach((name) => {
      const label = String(name || "").trim();
      const key = label.toLowerCase();
      if (label && !seen.has(key)) seen.set(key, label);
    });

    const query = form.category_name.trim().toLowerCase();
    return [...seen.entries()]
      .filter(([key]) => !query || key.includes(query))
      .map(([key, label]) => ({ label, taken: taken.has(key) }))
      .sort((a, b) => Number(a.taken) - Number(b.taken));
  }, [categories, hotelCategories, form.category_name]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...categories]
      .filter((category) => {
        const matchesSearch = !query ||
          [category?.category_name, category?.description, category?.hotel_name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const active = isActive(category?.is_active);
        const matchesStatus =
          statusFilter === "all" || (statusFilter === "active" ? active : !active);

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) =>
        Number(first?.display_order ?? 0) - Number(second?.display_order ?? 0),
      );
  }, [categories, search, statusFilter]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setForm({
      hotel_id: category?.hotel_id ?? "",
      category_name: category?.category_name ?? "",
      description: category?.description ?? "",
      display_order: category?.display_order ?? 0,
      is_active: isActive(category?.is_active),
    });
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const handleChange = ({ target }) => {
    const value = target.name === "is_active"
      ? target.value === "true"
      : target.value;

    setForm((current) => ({ ...current, [target.name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = {
      hotel_id: Number(form.hotel_id),
      category_name: form.category_name.trim(),
      description: form.description.trim(),
      display_order: Number(form.display_order) || 0,
      is_active: Boolean(form.is_active),
    };

    if (!body.category_name || !body.hotel_id || duplicateName) return;

    setSaving(true);
    setError("");

    try {
      if (editingCategory) {
        await updateMenuCategory(categoryId(editingCategory), body);
        setNotice("Menu category updated successfully.");
      } else {
        await createMenuCategory(body);
        setNotice("Menu category created successfully.");
      }

      setDialogOpen(false);
      await loadCategories();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to save this menu category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await deleteMenuCategory(categoryId(deleteTarget));
      setDeleteTarget(null);
      setNotice("Menu category deleted successfully.");
      await Promise.all([loadCategories(), loadSideDishes()]);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to delete this menu category. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="ui-page">
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Settings</span>
          <h1>Menu categories</h1>
          <p>Create and organize the categories used by each hotel's menu.</p>
        </div>
        <div className="ui-header__actions">
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={openCreateDialog}
          >
            <AddRoundedIcon fontSize="small" /> Add category
          </button>
        </div>
      </header>

      {error && !dialogOpen && (
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
            placeholder="Search categories"
            aria-label="Search categories"
          />
        </label>
        <div className="ui-segment" role="radiogroup" aria-label="Status">
          {[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={statusFilter === option.value}
              className={statusFilter === option.value ? "is-active" : ""}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ui-panel ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Hotel</th>
              <th>Side dishes</th>
              <th className="is-center">Order</th>
              <th>Status</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ui-table__state">
                <td colSpan={7}>Loading categories…</td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr className="ui-table__state">
                <td colSpan={7}>
                  No menu categories found. Add one or adjust your search.
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => {
                const active = isActive(category?.is_active);
                const dishes = categorySideDishes(category);

                return (
                  <tr key={categoryId(category)}>
                    <td className="is-strong">{category?.category_name || "—"}</td>
                    <td className="is-muted">{category?.description || "—"}</td>
                    <td>{hotelName(category, hotels)}</td>
                    <td>
                      <div className="category-sides">
                        {dishes.slice(0, 3).map((dish) => (
                          <span key={dish.id} className="ui-chip">
                            {dish.side_dish_name}
                          </span>
                        ))}
                        {dishes.length > 3 && (
                          <span
                            className="ui-chip ui-chip--brand"
                            title={dishes
                              .slice(3)
                              .map((dish) => dish.side_dish_name)
                              .join(", ")}
                          >
                            +{dishes.length - 3}
                          </span>
                        )}
                        <button
                          type="button"
                          className="category-sides__manage"
                          aria-label={`Manage side dishes of ${category?.category_name}`}
                          onClick={() => setSideDishTarget(category)}
                        >
                          {dishes.length ? "Manage" : (
                            <>
                              <AddRoundedIcon fontSize="inherit" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="is-center">{category?.display_order ?? 0}</td>
                    <td>
                      <span className={`ui-chip ${active ? "ui-chip--success" : ""}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="is-right">
                      <button
                        type="button"
                        className="ui-icon-btn"
                        title="Edit"
                        aria-label={`Edit ${category?.category_name}`}
                        onClick={() => openEditDialog(category)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn ui-icon-btn--danger"
                        title="Delete"
                        aria-label={`Delete ${category?.category_name}`}
                        onClick={() => setDeleteTarget(category)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </button>
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
        title={editingCategory ? "Edit menu category" : "Add menu category"}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
      >
        <form className="menu-editor" onSubmit={handleSubmit}>
          <div className="hotel-form">
            {error && dialogOpen && (
              <p className="menu-editor__alert" role="alert">
                {error}
              </p>
            )}

            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Category</h3>
              <div className="hotel-form__grid">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="category-hotel">
                    Hotel <sup>*</sup>
                  </label>
                  <select
                    id="category-hotel"
                    name="hotel_id"
                    className="hotel-form__input"
                    value={String(form.hotel_id)}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select hotel</option>
                    {hotels.map((hotel) => {
                      const id = hotel?.id ?? hotel?.hotel_id;
                      return (
                        <option key={id} value={String(id)}>
                          {hotel?.hotel_name ?? hotel?.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="category-name">
                    Category name <sup>*</sup>
                  </label>
                  <input
                    id="category-name"
                    name="category_name"
                    className={`hotel-form__input${duplicateName ? " is-invalid" : ""}`}
                    value={form.category_name}
                    onChange={handleChange}
                    placeholder="e.g. Starters"
                    autoComplete="off"
                    aria-invalid={duplicateName}
                    aria-describedby="category-name-help"
                    autoFocus
                    required
                  />
                  {duplicateName ? (
                    <span id="category-name-help" className="hotel-form__error">
                      This hotel already has a “{form.category_name.trim()}” category.
                    </span>
                  ) : (
                    <span id="category-name-help" className="hotel-form__hint">
                      Pick a name below or type a new one.
                    </span>
                  )}
                </div>

                <div className="hotel-form__field hotel-form__field--full">
                  <span className="hotel-form__label">
                    {form.hotel_id
                      ? "Category names"
                      : "Category names (select a hotel to see which are taken)"}
                  </span>
                  {nameSuggestions.length === 0 ? (
                    <p className="category-names__empty">
                      “{form.category_name.trim()}” is a new name for this hotel.
                    </p>
                  ) : (
                    <div className="category-names" role="listbox" aria-label="Category names">
                      {nameSuggestions.map(({ label, taken }) => {
                        const selected =
                          form.category_name.trim().toLowerCase() === label.toLowerCase();
                        return (
                          <button
                            key={label}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            aria-disabled={taken}
                            disabled={taken}
                            className={`category-name${selected ? " is-selected" : ""}${taken ? " is-taken" : ""}`}
                            title={taken ? "Already added to this hotel" : `Use “${label}”`}
                            onClick={() =>
                              setForm((current) => ({ ...current, category_name: label }))
                            }
                          >
                            {label}
                            {taken && <small>Added</small>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="hotel-form__field hotel-form__field--full">
                  <label className="hotel-form__label" htmlFor="category-description">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    name="description"
                    className="hotel-form__input menu-editor__textarea"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Shown to staff only"
                  />
                </div>
              </div>
            </section>

            <section className="hotel-form__section">
              <h3 className="hotel-form__section-title">Display</h3>
              <div className="hotel-form__grid category-dialog__display">
                <div className="hotel-form__field">
                  <label className="hotel-form__label" htmlFor="category-order">
                    Display order
                  </label>
                  <input
                    id="category-order"
                    type="number"
                    min="0"
                    name="display_order"
                    className="hotel-form__input"
                    value={form.display_order}
                    onChange={handleChange}
                  />
                </div>

                <label className="menu-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_active)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  <span className="menu-switch__track" aria-hidden />
                  <span>
                    <strong>{form.is_active ? "Active" : "Inactive"}</strong>
                    <small>Inactive categories are hidden from menus</small>
                  </span>
                </label>
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
              disabled={
                saving ||
                !form.category_name.trim() ||
                !form.hotel_id ||
                duplicateName
              }
            >
              {saving ? "Saving…" : editingCategory ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </PopupModal>

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title={`Delete “${deleteTarget?.category_name || "this category"}”?`}
        message="It will be removed from the menu categories, along with its side dishes."
        confirmLabel="Delete category"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SideDishesDialog
        category={sideDishTarget}
        sideDishes={sideDishTarget ? categorySideDishes(sideDishTarget) : []}
        onClose={() => setSideDishTarget(null)}
        onChanged={loadSideDishes}
      />
    </section>
  );
};

export default MenuCategories;
