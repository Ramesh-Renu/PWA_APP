import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  AddRounded,
  DeleteOutlineRounded,
  RemoveRounded,
  SearchRounded,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import { getAllMenu, getCooks, updateOrderItems } from "services";
import { getApiErrorMessage } from "utils/apiError";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";

const TAX_RATE = 0.05; // same as the API (reservationOrder.controller.js)
const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

/**
 * Admin order popup: ordered items (change quantity / remove) and the hotel's
 * menu to add more. Saves through PUT /api/orders/:id/items.
 */
const OrderDetailsDialog = ({ order, statusName, statusColor, readOnly, onClose, onSaved }) => {
  const [lines, setLines] = useState([]);
  const [menus, setMenus] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Working copy of the items, keyed by menu_id.
  useEffect(() => {
    if (!order) return;
    setLines(
      (order.items || []).map((item) => ({
        menu_id: Number(item.menu_id),
        name: item.menu_name,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        cook_id: item.cook_id ?? item.cook?.id ?? null,
        cook_name: item.cook?.cook_name || null,
      })),
    );
    setSearch("");
    setCategory("all");
    setError("");
  }, [order]);

  useEffect(() => {
    if (!order || readOnly) return undefined;
    let active = true;
    setLoadingMenus(true);
    getCooks({ hotel_id: order.hotel_id, is_active: true })
      .then((response) => active && setCooks(response?.data || []))
      .catch(() => active && setCooks([]));
    getAllMenu({ hotel_id: order.hotel_id, limit: 500 })
      .then((response) => {
        const rows = response?.rows || response?.data || [];
        if (active) setMenus(Array.isArray(rows) ? rows : []);
      })
      .catch(() => active && setMenus([]))
      .finally(() => active && setLoadingMenus(false));
    return () => {
      active = false;
    };
  }, [order, readOnly]);

  const quantityOf = (menuId) =>
    lines.find((line) => line.menu_id === Number(menuId))?.quantity || 0;

  const setQuantity = (menuId, quantity, menu) =>
    setLines((current) => {
      const id = Number(menuId);
      if (quantity <= 0) return current.filter((line) => line.menu_id !== id);
      if (current.some((line) => line.menu_id === id)) {
        return current.map((line) => (line.menu_id === id ? { ...line, quantity } : line));
      }
      return [
        ...current,
        {
          menu_id: id,
          name: menu?.menu_name ?? menu?.name ?? "Item",
          unit_price: Number(menu?.price || 0),
          quantity,
          // New items start with the order's cook, like the API does.
          cook_id: order?.cook_id ?? order?.cook?.id ?? null,
        },
      ];
    });

  const setLineCook = (menuId, cookId) =>
    setLines((current) =>
      current.map((line) =>
        line.menu_id === Number(menuId)
          ? { ...line, cook_id: cookId ? Number(cookId) : null }
          : line,
      ),
    );

  const subtotal = lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total =
    subtotal + tax + Number(order?.service_charge || 0) - Number(order?.discount || 0);

  const changed = useMemo(() => {
    if (!order) return false;
    const original = (order.items || [])
      .map(
        (item) =>
          `${Number(item.menu_id)}:${Number(item.quantity)}:${item.cook_id ?? item.cook?.id ?? ""}`,
      )
      .sort()
      .join(",");
    const current = lines
      .map((line) => `${line.menu_id}:${line.quantity}:${line.cook_id ?? ""}`)
      .sort()
      .join(",");
    return original !== current;
  }, [order, lines]);

  const categories = useMemo(() => {
    const names = new Set(
      menus.map((menu) => menu.category?.category_name || menu.category_name).filter(Boolean),
    );
    return [...names];
  }, [menus]);

  const visibleMenus = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menus.filter((menu) => {
      const name = String(menu.menu_name ?? menu.name ?? "").toLowerCase();
      const cat = menu.category?.category_name || menu.category_name;
      return (
        (!query || name.includes(query)) &&
        (category === "all" || cat === category)
      );
    });
  }, [menus, search, category]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await updateOrderItems(
        order.id,
        lines.map((line) => ({
          menu_id: line.menu_id,
          quantity: line.quantity,
          cook_id: line.cook_id ?? null,
        })),
      );
      if (response?.success === false) throw new Error(response.message);
      onSaved(response?.data);
    } catch (err) {
      setError(getApiErrorMessage(err) || err?.message || "Unable to update the order.");
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <PopupModal
      show={Boolean(order)}
      onClose={() => !saving && onClose()}
      header
      title={`Order ${order.order_number || `#${order.id}`}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog order-dialog"
    >
      <div className="hotel-form order-details">
        {error && (
          <p className="menu-editor__alert" role="alert">
            {error}
          </p>
        )}

        <div className="order-details__meta">
          <span
            className="ui-chip booking-status"
            style={{ "--status-color": statusColor || "#64748b" }}
          >
            {statusName}
          </span>
          <span>{order.hotel?.hotel_name || "—"}</span>
          <span>
            {order.reservation_id
              ? `Reservation #${order.reservation_id}`
              : "No table booking"}
          </span>
          <span>{dayjs(order.createdAt).format("D MMM, h:mm A")}</span>
          {order.cook && (
            <span className="order-details__staff">
              <StaffAvatar name={order.cook.cook_name} photo={order.cook.photo_url} size={22} tone="cook" />
              Cook: {order.cook.cook_name}
            </span>
          )}
          {order.server && (
            <span className="order-details__staff">
              <StaffAvatar name={order.server.server_name} photo={order.server.photo_url} size={22} tone="server" />
              Server: {order.server.server_name}
            </span>
          )}
        </div>

        <section className="hotel-form__section">
          <h3 className="hotel-form__section-title">
            Ordered items <span className="order-details__count">{lines.length}</span>
          </h3>
          {lines.length === 0 ? (
            <p className="menu-dishes__empty">
              No items. Add at least one item, or cancel the order from the board.
            </p>
          ) : (
            <ul className="order-lines">
              {lines.map((line) => (
                <li key={line.menu_id}>
                  <span className="order-lines__name">
                    <strong>{line.name}</strong>
                    <small>{money(line.unit_price)} each</small>
                  </span>
                  {readOnly ? (
                    line.cook_name && (
                      <span className="order-lines__cook-read">{line.cook_name}</span>
                    )
                  ) : (
                    <select
                      className="order-lines__cook"
                      value={line.cook_id ?? ""}
                      onChange={(event) => setLineCook(line.menu_id, event.target.value)}
                      aria-label={`Cook for ${line.name}`}
                    >
                      <option value="">No cook</option>
                      {/* Keep a cook who is no longer active selectable for display. */}
                      {line.cook_id &&
                        !cooks.some((cook) => cook.id === line.cook_id) && (
                          <option value={line.cook_id}>
                            {line.cook_name || `Cook #${line.cook_id}`}
                          </option>
                        )}
                      {cooks.map((cook) => (
                        <option key={cook.id} value={cook.id}>
                          {cook.cook_name}
                          {cook.speciality ? ` · ${cook.speciality}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {readOnly ? (
                    <span className="order-lines__qty-read">× {line.quantity}</span>
                  ) : (
                    <span className="dish-card__qty order-lines__qty">
                      <button
                        type="button"
                        aria-label={`One less ${line.name}`}
                        onClick={() => setQuantity(line.menu_id, line.quantity - 1)}
                      >
                        <RemoveRounded fontSize="small" />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`One more ${line.name}`}
                        onClick={() => setQuantity(line.menu_id, line.quantity + 1)}
                      >
                        <AddRounded fontSize="small" />
                      </button>
                    </span>
                  )}
                  <span className="order-lines__total">
                    {money(line.unit_price * line.quantity)}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="ui-icon-btn ui-icon-btn--danger"
                      title="Remove item"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => setQuantity(line.menu_id, 0)}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>Tax (5%)</dt>
              <dd>{money(tax)}</dd>
            </div>
            <div className="order-totals__grand">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        </section>

        {readOnly ? (
          <p className="hotel-form__hint">
            {statusName} orders can't be changed.
          </p>
        ) : (
          <section className="hotel-form__section">
            <h3 className="hotel-form__section-title">Add from menu</h3>
            <label className="menu-dishes__search order-details__search">
              <SearchRounded fontSize="small" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dishes"
                aria-label="Search dishes"
              />
            </label>
            {categories.length > 1 && (
              <div className="order-popup__chips order-details__chips" role="tablist">
                {["all", ...categories].map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={category === name}
                    className={`order-chip${category === name ? " is-active" : ""}`}
                    onClick={() => setCategory(name)}
                  >
                    {name === "all" ? "All" : name}
                  </button>
                ))}
              </div>
            )}

            {loadingMenus ? (
              <p className="menu-dishes__empty">Loading menu…</p>
            ) : visibleMenus.length === 0 ? (
              <p className="menu-dishes__empty">
                {menus.length
                  ? `No dishes match "${search.trim()}".`
                  : `${order.hotel?.hotel_name || "This hotel"} has no menu items yet. Add dishes under Hotels → ${order.hotel?.hotel_name || "the hotel"} → Menu.`}
              </p>
            ) : (
              <ul className="order-menu">
                {visibleMenus.map((menu) => {
                  const qty = quantityOf(menu.id);
                  const name = menu.menu_name ?? menu.name;
                  return (
                    <li key={menu.id} className={menu.is_available ? "" : "is-unavailable"}>
                      <span
                        className={`ui-diet ${menu.is_veg ? "ui-diet--veg" : "ui-diet--nonveg"}`}
                        aria-label={menu.is_veg ? "Veg" : "Non-veg"}
                      />
                      <span className="order-menu__name">
                        <strong>{name}</strong>
                        <small>
                          {menu.category?.category_name || menu.category_name || ""}
                          {!menu.is_available && " · Unavailable"}
                        </small>
                      </span>
                      <span className="order-menu__price">{money(menu.price)}</span>
                      {qty > 0 ? (
                        <span className="dish-card__qty">
                          <button
                            type="button"
                            aria-label={`One less ${name}`}
                            onClick={() => setQuantity(menu.id, qty - 1, menu)}
                          >
                            <RemoveRounded fontSize="small" />
                          </button>
                          <span>{qty}</span>
                          <button
                            type="button"
                            aria-label={`One more ${name}`}
                            onClick={() => setQuantity(menu.id, qty + 1, menu)}
                          >
                            <AddRounded fontSize="small" />
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="dish-card__add"
                          disabled={!menu.is_available}
                          onClick={() => setQuantity(menu.id, 1, menu)}
                        >
                          Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <div className="hotel-form__actions">
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={onClose}
          disabled={saving}
        >
          {readOnly ? "Close" : "Cancel"}
        </button>
        {!readOnly && (
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--primary"
            onClick={save}
            disabled={saving || !changed || lines.length === 0}
            title={!changed ? "Change the items to save" : undefined}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>
    </PopupModal>
  );
};

export default OrderDetailsDialog;
