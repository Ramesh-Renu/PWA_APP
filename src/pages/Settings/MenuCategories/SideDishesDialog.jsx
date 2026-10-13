import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PopupModal from "components/common/PopupModal";

import { getApiErrorMessage } from "utils/apiError";
import {
  createCategorySideDish,
  deleteCategorySideDish,
  updateCategorySideDish,
} from "services";

const emptyForm = {
  side_dish_name: "",
  description: "",
  price: "",
  display_order: 0,
  is_active: true,
};

const isActive = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

// Add, edit and remove the side dishes of one menu category.
const SideDishesDialog = ({ category, sideDishes, onClose, onChanged }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingDish, setEditingDish] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const show = Boolean(category);

  useEffect(() => {
    setForm(emptyForm);
    setEditingDish(null);
    setError("");
  }, [category]);

  const duplicateName = useMemo(() => {
    const name = form.side_dish_name.trim().toLowerCase();
    if (!name) return false;
    return sideDishes.some(
      (dish) =>
        dish.id !== editingDish?.id &&
        String(dish.side_dish_name || "").trim().toLowerCase() === name,
    );
  }, [sideDishes, form.side_dish_name, editingDish]);

  const busy = saving || deletingId !== null;

  const handleChange = ({ target }) =>
    setForm((current) => ({ ...current, [target.name]: target.value }));

  const startEdit = (dish) => {
    setEditingDish(dish);
    setForm({
      side_dish_name: dish.side_dish_name ?? "",
      description: dish.description ?? "",
      price: dish.price ?? "",
      display_order: dish.display_order ?? 0,
      is_active: isActive(dish.is_active),
    });
    setError("");
  };

  const resetForm = () => {
    setEditingDish(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = {
      category_id: category.id,
      side_dish_name: form.side_dish_name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      display_order: Number(form.display_order) || 0,
      is_active: Boolean(form.is_active),
    };

    if (!body.side_dish_name || duplicateName) return;

    setSaving(true);
    setError("");

    try {
      if (editingDish) {
        await updateCategorySideDish(editingDish.id, body);
      } else {
        await createCategorySideDish(body);
      }

      resetForm();
      await onChanged();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to save this side dish. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dish) => {
    if (!window.confirm(`Delete “${dish.side_dish_name}”?`)) return;

    setDeletingId(dish.id);
    setError("");

    try {
      await deleteCategorySideDish(dish.id);
      if (editingDish?.id === dish.id) resetForm();
      await onChanged();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to delete this side dish. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PopupModal
      show={show}
      onClose={() => !busy && onClose()}
      header
      title={`Side dishes · ${category?.category_name ?? ""}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog category-dialog side-dishes-dialog"
    >
      <div className="menu-editor">
        <div className="hotel-form">
          {error && (
            <p className="menu-editor__alert" role="alert">
              {error}
            </p>
          )}

          <form className="hotel-form__section" onSubmit={handleSubmit}>
            <h3 className="hotel-form__section-title">
              {editingDish ? "Edit side dish" : "Add side dish"}
            </h3>
            <div className="hotel-form__grid side-dish-form">
              <div className="hotel-form__field">
                <label className="hotel-form__label" htmlFor="side-dish-name">
                  Name <sup>*</sup>
                </label>
                <input
                  id="side-dish-name"
                  name="side_dish_name"
                  className={`hotel-form__input${duplicateName ? " is-invalid" : ""}`}
                  value={form.side_dish_name}
                  onChange={handleChange}
                  placeholder="e.g. Raita"
                  autoComplete="off"
                  aria-invalid={duplicateName}
                  autoFocus
                  required
                />
                {duplicateName && (
                  <span className="hotel-form__error">
                    This category already has “{form.side_dish_name.trim()}”.
                  </span>
                )}
              </div>

              <div className="hotel-form__field">
                <label className="hotel-form__label" htmlFor="side-dish-price">
                  Price (₹)
                </label>
                <input
                  id="side-dish-price"
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  className="hotel-form__input"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0 = free"
                />
              </div>

              <div className="hotel-form__field">
                <label className="hotel-form__label" htmlFor="side-dish-order">
                  Order
                </label>
                <input
                  id="side-dish-order"
                  type="number"
                  min="0"
                  name="display_order"
                  className="hotel-form__input"
                  value={form.display_order}
                  onChange={handleChange}
                />
              </div>

              <div className="hotel-form__field hotel-form__field--full">
                <label className="hotel-form__label" htmlFor="side-dish-description">
                  Description
                </label>
                <input
                  id="side-dish-description"
                  name="description"
                  className="hotel-form__input"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <label className="menu-switch hotel-form__field--full">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.checked }))
                  }
                />
                <span className="menu-switch__track" aria-hidden />
                <span>
                  <strong>{form.is_active ? "Active" : "Inactive"}</strong>
                  <small>Inactive side dishes are hidden from menus</small>
                </span>
              </label>
            </div>

            <div className="side-dish-form__actions">
              {editingDish && (
                <button
                  type="button"
                  className="hotel-form__btn hotel-form__btn--ghost"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel edit
                </button>
              )}
              <button
                type="submit"
                className="hotel-form__btn hotel-form__btn--primary"
                disabled={busy || !form.side_dish_name.trim() || duplicateName}
              >
                {saving ? (
                  "Saving…"
                ) : editingDish ? (
                  "Save changes"
                ) : (
                  <>
                    <AddRoundedIcon fontSize="small" /> Add side dish
                  </>
                )}
              </button>
            </div>
          </form>

          <section className="hotel-form__section">
            <h3 className="hotel-form__section-title">
              Side dishes ({sideDishes.length})
            </h3>
            {sideDishes.length === 0 ? (
              <p className="category-names__empty">
                No side dishes yet. Add the first one above.
              </p>
            ) : (
              <ul className="side-dish-list">
                {sideDishes.map((dish) => {
                  const active = isActive(dish.is_active);
                  const price = Number(dish.price) || 0;

                  return (
                    <li
                      key={dish.id}
                      className={`side-dish-row${editingDish?.id === dish.id ? " is-editing" : ""}`}
                    >
                      <div className="side-dish-row__main">
                        <strong>{dish.side_dish_name}</strong>
                        {dish.description && <small>{dish.description}</small>}
                      </div>
                      <span className="side-dish-row__price">
                        {price ? `₹${price}` : "Free"}
                      </span>
                      <span className={`ui-chip ${active ? "ui-chip--success" : ""}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                      <span className="side-dish-row__actions">
                        <button
                          type="button"
                          className="ui-icon-btn"
                          title="Edit"
                          aria-label={`Edit ${dish.side_dish_name}`}
                          onClick={() => startEdit(dish)}
                          disabled={busy}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                        <button
                          type="button"
                          className="ui-icon-btn ui-icon-btn--danger"
                          title="Delete"
                          aria-label={`Delete ${dish.side_dish_name}`}
                          onClick={() => handleDelete(dish)}
                          disabled={busy}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="hotel-form__actions">
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={onClose}
            disabled={busy}
          >
            Done
          </button>
        </div>
      </div>
    </PopupModal>
  );
};

export default SideDishesDialog;
