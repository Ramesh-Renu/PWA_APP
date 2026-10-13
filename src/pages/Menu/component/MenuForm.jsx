import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AddPhotoAlternateOutlined,
  CheckRounded,
  CloseRounded,
  SearchRounded,
} from "@mui/icons-material";
import { getAllMenu, getAllMenuCategories, getCategorySideDishes } from "services";

const defaultForm = {
  hotel_id: "",
  category_id: "",
  menu_name: "",
  menu_code: "",
  description: "",
  price: "",
  preparation_time: "",
  is_veg: true,
  spice_level: "",
  calories: "",
  is_available: true,
  display_order: 1,
};

const spiceLabel = (spiceLevel) =>
  String(spiceLevel?.spice_level ?? spiceLevel?.name ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const MenuForm = ({
  initialValues = {},
  hotels = [],
  categories = [],
  spiceLevels = [],
  spiceLevelsLoading = false,
  loading = false,
  isEdit = false,
  error = "",
  onClearError,
  onHotelChange,
  onSubmit,
  onCancel,
  selectedMenuSidedishes = [],
}) => {
  const [form, setForm] = useState(defaultForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [sideDishList, setSideDishList] = useState([]);
  const [selectedSideDishes, setSelectedSideDishes] = useState([]);
  const [dishSearch, setDishSearch] = useState("");
  // Categories of the selected hotel. The API only accepts a category that
  // belongs to the menu's hotel, and its list endpoint defaults to 10 rows,
  // so the generic `categories` prop can't be trusted here.
  const [hotelCategories, setHotelCategories] = useState(null);
  const [sideDishesLoading, setSideDishesLoading] = useState(false);

  // Side dishes come from the selected category (Settings → Menu categories).
  useEffect(() => {
    setDishSearch("");
    if (!form.category_id) {
      setSideDishList([]);
      return undefined;
    }
    let active = true;
    setSideDishesLoading(true);
    getCategorySideDishes({
      category_id: form.category_id,
      is_active: true,
      limit: 1000,
    })
      .then((res) => {
        if (active) setSideDishList(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => active && setSideDishList([]))
      .finally(() => active && setSideDishesLoading(false));
    return () => {
      active = false;
    };
  }, [form.category_id]);

  // The hotel's other dishes, to catch a duplicate menu code before saving.
  const [hotelMenus, setHotelMenus] = useState([]);
  const alertRef = useRef(null);

  useEffect(() => {
    if (!form.hotel_id) {
      setHotelCategories(null);
      setHotelMenus([]);
      return undefined;
    }
    let active = true;
    getAllMenuCategories({ hotel_id: form.hotel_id, limit: 500 })
      .then((res) => {
        if (active) setHotelCategories(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setHotelCategories(null);
      });
    getAllMenu({ hotel_id: form.hotel_id, limit: 500 })
      .then((res) => {
        const rows = res?.rows || res?.data || [];
        if (active) setHotelMenus(Array.isArray(rows) ? rows : []);
      })
      .catch(() => active && setHotelMenus([]));
    return () => {
      active = false;
    };
  }, [form.hotel_id]);

  // Same rule as the API: codes are unique per hotel, ignoring case.
  const codeClash = useMemo(() => {
    const code = String(form.menu_code || "").trim().toLowerCase();
    if (!code) return null;
    const ownId = initialValues?.id ?? initialValues?.menu_id;
    return (
      hotelMenus.find(
        (menu) =>
          String(menu.menu_code || "").trim().toLowerCase() === code &&
          String(menu.id) !== String(ownId),
      ) || null
    );
  }, [form.menu_code, hotelMenus, initialValues]);

  // A failed save shows its message at the top of the form; bring it into view
  // (the Save button is at the bottom of a scrolling popup).
  useEffect(() => {
    if (error) alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const categoryOptions = useMemo(() => {
    if (hotelCategories) return hotelCategories;
    // Fallback while loading / on error: whatever the parent passed, limited
    // to this hotel when the rows say which hotel they belong to.
    return categories.filter(
      (category) =>
        category.hotel_id == null ||
        String(category.hotel_id) === String(form.hotel_id),
    );
  }, [hotelCategories, categories, form.hotel_id]);

  useEffect(() => {
    if (selectedMenuSidedishes?.length) {
      setSelectedSideDishes(selectedMenuSidedishes.map((id) => Number(id)));
    } else {
      setSelectedSideDishes([]);
    }
  }, [selectedMenuSidedishes]);

  useEffect(() => {
    setForm({
      ...defaultForm,
      ...(initialValues || {}),
    });
    setImage(null);
    setPreview(initialValues?.image_url || initialValues?.image || "");
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // The last save error no longer applies once the form is edited.
    if (error) onClearError?.();

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // A category belongs to one hotel, so changing hotel clears it.
      ...(name === "hotel_id" ? { category_id: "" } : {}),
    }));

    // Side dishes belong to a category; a new category starts with none.
    if (name === "hotel_id" || name === "category_id") {
      setSelectedSideDishes([]);
    }

    if (name === "hotel_id" && onHotelChange) {
      onHotelChange(value);
    }
  };

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Undo a newly picked file; a previously saved image stays as it was.
  const removeImage = () => {
    setImage(null);
    setPreview(initialValues?.image_url || initialValues?.image || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (codeClash) {
      document.getElementById("menu-code")?.focus();
      return;
    }

    const payload = {
      hotel_id: Number(form.hotel_id),
      category_id: Number(form.category_id),
      menu_name: form.menu_name.trim(),
      price: Number(form.price),
      is_veg: Boolean(form.is_veg),
      is_available: Boolean(form.is_available),
      display_order: Number(form.display_order) || 0,
      // Only dishes of the chosen category (an inactive one is dropped).
      side_dishes: selectedSideDishes.filter((id) =>
        sideDishList.some((dish) => Number(dish.id) === id),
      ),
    };

    const optionalTextFields = ["menu_code", "description"];
    optionalTextFields.forEach((key) => {
      if (String(form[key] ?? "").trim()) {
        payload[key] = String(form[key]).trim();
      }
    });

    ["preparation_time", "calories", "spice_level"].forEach((key) => {
      if (String(form[key] ?? "").trim()) {
        payload[key] = Number(form[key]);
      }
    });

    onSubmit({ ...payload, imageFile: image });
  };

  /* ---------------- side dishes ---------------- */
  const visibleDishes = useMemo(() => {
    const term = dishSearch.trim().toLowerCase();
    if (!term) return sideDishList;
    return sideDishList.filter((dish) =>
      String(dish.side_dish_name || "").toLowerCase().includes(term),
    );
  }, [sideDishList, dishSearch]);

  const isDishSelected = (id) => selectedSideDishes.includes(Number(id));

  const toggleDish = (id) =>
    setSelectedSideDishes((prev) =>
      prev.includes(Number(id))
        ? prev.filter((dishId) => dishId !== Number(id))
        : [...prev, Number(id)],
    );

  // "Select all" / "Clear" act on the dishes currently shown, so a search
  // can be used to bulk-pick a subset.
  const allVisibleSelected =
    visibleDishes.length > 0 &&
    visibleDishes.every((dish) => isDishSelected(dish.id));

  const selectAllVisible = () =>
    setSelectedSideDishes((prev) => [
      ...new Set([...prev, ...visibleDishes.map((dish) => Number(dish.id))]),
    ]);

  const clearVisible = () => {
    const visibleIds = new Set(visibleDishes.map((dish) => Number(dish.id)));
    setSelectedSideDishes((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  return (
    <form className="menu-editor" onSubmit={handleSubmit}>
      <div className="hotel-form">
        {error && (
          <p className="menu-editor__alert" role="alert" ref={alertRef}>
            {error}
          </p>
        )}

        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">Menu item</h3>
          <div className="hotel-form__grid">
            {hotels.length > 0 && (
              <div className="hotel-form__field">
                <label className="hotel-form__label" htmlFor="menu-hotel">
                  Hotel <sup>*</sup>
                </label>
                <select
                  id="menu-hotel"
                  name="hotel_id"
                  className="hotel-form__input"
                  value={form.hotel_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.hotel_name || hotel.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className={`hotel-form__field${hotels.length > 0 ? "" : " hotel-form__field--full"}`}
            >
              <label className="hotel-form__label" htmlFor="menu-category">
                Category <sup>*</sup>
              </label>
              <select
                id="menu-category"
                name="category_id"
                className="hotel-form__input"
                value={form.category_id}
                onChange={handleChange}
                required
                disabled={!form.hotel_id}
              >
                <option value="">
                  {!form.hotel_id
                    ? "Select a hotel first"
                    : categoryOptions.length === 0
                      ? "No categories for this hotel"
                      : "Select category"}
                </option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {form.hotel_id && hotelCategories?.length === 0 && (
                <span className="hotel-form__hint">
                  Add a category for this hotel under Menu Categories first.
                </span>
              )}
            </div>

            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-name">
                Menu name <sup>*</sup>
              </label>
              <input
                id="menu-name"
                name="menu_name"
                className="hotel-form__input"
                value={form.menu_name}
                onChange={handleChange}
                placeholder="e.g. South Indian Meals"
                required
              />
            </div>

            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-code">
                Menu code
              </label>
              <input
                id="menu-code"
                name="menu_code"
                className={`hotel-form__input hotel-form__input--code${codeClash ? " is-invalid" : ""}`}
                value={form.menu_code}
                onChange={handleChange}
                placeholder="e.g. SIM01"
                autoComplete="off"
                aria-invalid={Boolean(codeClash)}
                aria-describedby="menu-code-help"
              />
              {codeClash ? (
                <span id="menu-code-help" className="hotel-form__error">
                  “{form.menu_code.trim()}” is already used by {codeClash.menu_name ?? codeClash.name}.
                  Use another code or leave it empty.
                </span>
              ) : (
                <span id="menu-code-help" className="hotel-form__hint">
                  Optional. Must be unique in this hotel.
                </span>
              )}
            </div>

            <div className="hotel-form__field hotel-form__field--full">
              <label className="hotel-form__label" htmlFor="menu-description">
                Description
              </label>
              <textarea
                id="menu-description"
                name="description"
                className="hotel-form__input menu-editor__textarea"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="What's in this dish?"
              />
            </div>
          </div>
        </section>

        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">Price &amp; details</h3>
          <div className="hotel-form__grid menu-editor__grid--four">
            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-price">
                Price <sup>*</sup>
              </label>
              <div className="menu-editor__affix">
                <span aria-hidden>₹</span>
                <input
                  id="menu-price"
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  className="hotel-form__input"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-prep">
                Prep time (min)
              </label>
              <input
                id="menu-prep"
                type="number"
                min="0"
                name="preparation_time"
                className="hotel-form__input"
                value={form.preparation_time}
                onChange={handleChange}
                placeholder="e.g. 15"
              />
            </div>

            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-calories">
                Calories
              </label>
              <input
                id="menu-calories"
                type="number"
                min="0"
                name="calories"
                className="hotel-form__input"
                value={form.calories}
                onChange={handleChange}
                placeholder="kcal"
              />
            </div>

            <div className="hotel-form__field">
              <label className="hotel-form__label" htmlFor="menu-spice">
                Spice level
              </label>
              <select
                id="menu-spice"
                name="spice_level"
                className="hotel-form__input"
                value={form.spice_level}
                onChange={handleChange}
                disabled={spiceLevelsLoading}
              >
                <option value="">
                  {spiceLevelsLoading
                    ? "Loading…"
                    : spiceLevels.length === 0
                      ? "None available"
                      : "Select level"}
                </option>
                {spiceLevels.map((spiceLevel) => {
                  const id =
                    spiceLevel?.id ??
                    spiceLevel?.spice_level_id ??
                    spiceLevel?.value;
                  return id !== undefined && id !== null ? (
                    <option key={id} value={String(id)}>
                      {spiceLabel(spiceLevel)}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
          </div>
        </section>

        <section className="hotel-form__section">
          <div className="menu-dishes__head">
            <h3 className="hotel-form__section-title">
              Side dishes
              <span className="menu-dishes__count">
                {sideDishList.filter((dish) => isDishSelected(dish.id)).length} of{" "}
                {sideDishList.length} selected
              </span>
            </h3>
            <div className="menu-dishes__bulk">
              <button
                type="button"
                className="menu-dishes__link"
                onClick={selectAllVisible}
                disabled={visibleDishes.length === 0 || allVisibleSelected}
              >
                Select all
              </button>
              <button
                type="button"
                className="menu-dishes__link"
                onClick={clearVisible}
                disabled={
                  !visibleDishes.some((dish) => isDishSelected(dish.id))
                }
              >
                Clear
              </button>
            </div>
          </div>

          {sideDishList.length > 6 && (
            <label className="menu-dishes__search">
              <SearchRounded fontSize="small" aria-hidden />
              <input
                type="search"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Search side dishes"
                aria-label="Search side dishes"
              />
            </label>
          )}

          {!form.category_id ? (
            <p className="menu-dishes__empty">
              Select a category to see its side dishes.
            </p>
          ) : sideDishesLoading ? (
            <p className="menu-dishes__empty">Loading side dishes…</p>
          ) : sideDishList.length === 0 ? (
            <p className="menu-dishes__empty">
              This category has no side dishes yet. Add them in Settings → Menu
              categories.
            </p>
          ) : visibleDishes.length === 0 ? (
            <p className="menu-dishes__empty">No side dishes match “{dishSearch}”.</p>
          ) : (
            <div className="menu-dishes__list" role="group" aria-label="Side dishes">
              {visibleDishes.map((dish) => {
                const selected = isDishSelected(dish.id);
                return (
                  <button
                    key={dish.id}
                    type="button"
                    className={`menu-dish${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleDish(dish.id)}
                    title={selected ? "Click to remove" : "Click to add"}
                  >
                    <span className="menu-dish__check" aria-hidden>
                      {selected && <CheckRounded />}
                    </span>
                    <span className="menu-dish__name">{dish.side_dish_name}</span>
                    {Number(dish.price) > 0 && (
                      <span className="menu-dish__price">₹{Number(dish.price)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">Options &amp; image</h3>
          <div className="menu-editor__options">
            <div className="menu-editor__option-stack">
              <div className="hotel-form__field">
                <span className="hotel-form__label">Food type</span>
                <div className="menu-segment" role="radiogroup" aria-label="Food type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.is_veg}
                    className={`menu-segment__item is-veg${form.is_veg ? " is-active" : ""}`}
                    onClick={() => setField("is_veg", true)}
                  >
                    <span className="menu-segment__dot" aria-hidden /> Veg
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!form.is_veg}
                    className={`menu-segment__item is-nonveg${!form.is_veg ? " is-active" : ""}`}
                    onClick={() => setField("is_veg", false)}
                  >
                    <span className="menu-segment__dot" aria-hidden /> Non-veg
                  </button>
                </div>
              </div>

              <label className="menu-switch">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={form.is_available}
                  onChange={handleChange}
                />
                <span className="menu-switch__track" aria-hidden />
                <span>
                  <strong>Available</strong>
                  <small>Show this item to customers</small>
                </span>
              </label>

              <div className="hotel-form__field">
                <label className="hotel-form__label" htmlFor="menu-order">
                  Display order
                </label>
                <input
                  id="menu-order"
                  type="number"
                  min="0"
                  name="display_order"
                  className="hotel-form__input"
                  value={form.display_order}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="hotel-form__field">
              <span className="hotel-form__label">Menu image</span>
              {preview ? (
                <div className="menu-image">
                  <img src={preview} alt="Menu preview" />
                  <div className="menu-image__actions">
                    <label className="menu-image__btn">
                      Change
                      <input type="file" accept="image/*" hidden onChange={handleImage} />
                    </label>
                    {image && (
                      <button
                        type="button"
                        className="menu-image__btn"
                        onClick={removeImage}
                        aria-label="Discard new image"
                        title="Discard new image"
                      >
                        <CloseRounded fontSize="small" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className="menu-image menu-image--empty">
                  <AddPhotoAlternateOutlined />
                  <strong>Upload image</strong>
                  <small>PNG or JPG</small>
                  <input type="file" accept="image/*" hidden onChange={handleImage} />
                </label>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="hotel-form__actions">
        {/* Repeat the error by the buttons: the form scrolls, the bar does not. */}
        {(error || codeClash) && (
          <p className="menu-editor__footer-error" role="alert">
            {error ||
              `Menu code "${form.menu_code.trim()}" is already used by ${codeClash.menu_name ?? codeClash.name}.`}
          </p>
        )}
        {onCancel && (
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="hotel-form__btn hotel-form__btn--primary"
          disabled={loading || Boolean(codeClash)}
        >
          {loading ? "Saving…" : isEdit ? "Update menu" : "Create menu"}
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
