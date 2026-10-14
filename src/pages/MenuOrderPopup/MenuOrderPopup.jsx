import React, { useMemo, useState } from "react";
import { ArrowBackRounded, SearchRounded } from "@mui/icons-material";
import { PreferencesFields } from "pages/BookTables/DishPreferences";
import { preferencesToNote } from "pages/BookTables/preferenceOptions";
import MenuCard from "./MenuCard";
import OrderSummary from "./OrderSummary";

export default function MenuOrderPopup({
  menus = [],
  categories = [],
  onPlaceOrder,
  onSkip,
  skipLabel,
  placing,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [qty, setQty] = useState({});
  // Cooking notes per dish: { [menuId]: { spice, msg, …, text } }.
  const [prefs, setPrefs] = useState({});
  // Dish whose notes are being edited: { menu, draft }. The notes panel
  // replaces the menu inside this popup (no popup on top of a popup).
  const [editing, setEditing] = useState(null);

  // Callers may pass no categories; fall back to the ones the menus use.
  const categoryNames = useMemo(() => {
    const names = categories.length
      ? categories.map((c) => c.category_name)
      : menus.map((m) => m.category?.category_name);
    return [...new Set(names.filter(Boolean))];
  }, [categories, menus]);

  const filtered = useMemo(
    () =>
      menus.filter((m) => {
        const bySearch = String(m.menu_name || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const byCat =
          category === "All" || m.category?.category_name === category;
        return bySearch && byCat;
      }),
    [menus, search, category],
  );

  const change = (id, diff) => {
    setQty((p) => {
      const next = Math.max((p[id] || 0) + diff, 0);
      return { ...p, [id]: next };
    });
    // A dish taken out of the order loses its notes.
    if (diff < 0 && (qty[id] || 0) + diff <= 0) {
      setPrefs((p) => {
        const { [id]: _removed, ...rest } = p;
        return rest;
      });
    }
  };

  const total = menus.reduce(
    (t, m) => t + (qty[m.id] || 0) * Number(m.price),
    0,
  );

  const items = menus
    .filter((menu) => (qty[menu.id] || 0) > 0)
    .map((menu) => {
      const notes = preferencesToNote(prefs[menu.id]);
      return {
        menu_id: menu.id,
        menu_name: menu.menu_name,
        quantity: qty[menu.id],
        unit_price: Number(menu.price),
        total_price: qty[menu.id] * Number(menu.price),
        ...(notes ? { notes } : {}),
      };
    });

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (editing) {
    const apply = () => {
      setPrefs((p) => ({ ...p, [editing.menu.id]: editing.draft }));
      setEditing(null);
    };
    return (
      <div className="order-popup order-popup--notes">
        <div className="order-popup__notes-head">
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Back to the menu"
            onClick={() => setEditing(null)}
          >
            <ArrowBackRounded fontSize="small" />
          </button>
          <div>
            <strong>Notes · {editing.menu.menu_name}</strong>
            <small>
              How the kitchen should make it
              {qty[editing.menu.id] > 1 ? ` (all ${qty[editing.menu.id]} portions)` : ""}.
            </small>
          </div>
        </div>
        <div className="order-popup__list dish-prefs">
          <PreferencesFields
            idPrefix={`menu-pref-${editing.menu.id}`}
            value={editing.draft}
            onChange={(draft) => setEditing((current) => ({ ...current, draft }))}
          />
        </div>
        {/* Same footer as the menu's order summary (padding, sticky bottom). */}
        <div className="hotel-form__actions order-popup__notes-actions">
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={() => setEditing((current) => ({ ...current, draft: {} }))}
          >
            Clear all
          </button>
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--primary"
            onClick={apply}
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-popup">
      <div className="order-popup__filters">
        <label className="menu-dishes__search order-popup__search">
          <SearchRounded fontSize="small" aria-hidden />
          <input
            type="search"
            placeholder="Search menu"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu"
          />
        </label>

        {categoryNames.length > 0 && (
          <div className="order-popup__chips" role="tablist" aria-label="Categories">
            {["All", ...categoryNames].map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={category === name}
                className={`order-chip${category === name ? " is-active" : ""}`}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="order-popup__list">
        {filtered.length === 0 ? (
          <p className="menu-dishes__empty">
            {menus.length === 0
              ? "No menu items for this hotel yet."
              : "No items match your search."}
          </p>
        ) : (
          <div className="order-popup__grid">
            {filtered.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                quantity={qty[menu.id] || 0}
                note={preferencesToNote(prefs[menu.id])}
                onEditNotes={() => setEditing({ menu, draft: prefs[menu.id] || {} })}
                onIncrease={() => change(menu.id, 1)}
                onDecrease={() => change(menu.id, -1)}
              />
            ))}
          </div>
        )}
      </div>

      <OrderSummary
        totalItems={totalQuantity}
        totalAmount={total}
        onSkip={onSkip}
        skipLabel={skipLabel}
        placing={placing}
        onPlaceOrder={() => onPlaceOrder(items)}
      />
    </div>
  );
}
