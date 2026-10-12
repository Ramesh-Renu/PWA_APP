import React, { useMemo, useState } from "react";
import { SearchRounded } from "@mui/icons-material";
import MenuCard from "./MenuCard";
import OrderSummary from "./OrderSummary";

export default function MenuOrderPopup({
  menus = [],
  categories = [],
  onPlaceOrder,
  onSkip,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [qty, setQty] = useState({});

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
  };

  const total = menus.reduce(
    (t, m) => t + (qty[m.id] || 0) * Number(m.price),
    0,
  );

  const items = menus
    .filter((menu) => (qty[menu.id] || 0) > 0)
    .map((menu) => ({
      menu_id: menu.id,
      menu_name: menu.menu_name,
      quantity: qty[menu.id],
      unit_price: Number(menu.price),
      total_price: qty[menu.id] * Number(menu.price),
    }));

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

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
        onPlaceOrder={() => onPlaceOrder(items)}
      />
    </div>
  );
}
