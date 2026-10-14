import { Fragment, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  AddRounded,
  DeleteOutlineRounded,
  RemoveRounded,
  SearchRounded,
  TimerOutlined,
  TuneRounded,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import { getAllMenu, getCooks, updateOrderItems } from "services";
import { getApiErrorMessage } from "utils/apiError";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import AppSelect from "components/common/AppSelect";
import ItemNote from "components/common/ItemNote";
import { formatDuration } from "./PrepTimer";
import { PreferencesFields } from "pages/BookTables/DishPreferences";
import {
  noteToPreferences,
  preferencesToNote,
} from "pages/BookTables/preferenceOptions";

const TAX_RATE = 0.05; // same as the API (reservationOrder.controller.js)
const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const ITEM_CANCELLED = 5;

// A dish's cooking time: start of cooking (order) to when it was ticked ready.
const dishCookTime = (order, line) =>
  order?.preparing_at && line.ready_at
    ? formatDuration(new Date(line.ready_at) - new Date(order.preparing_at))
    : null;

// Whole order: start of cooking to the last dish ticked (all dishes ready).
const orderCookTime = (order) => {
  const dishes = (order?.items || []).filter((item) => item.item_status !== ITEM_CANCELLED);
  if (!order?.preparing_at || !dishes.length || dishes.some((item) => !item.ready_at)) return null;
  const last = Math.max(...dishes.map((item) => new Date(item.ready_at).getTime()));
  return formatDuration(last - new Date(order.preparing_at).getTime());
};

/**
 * Admin order popup: ordered items (change quantity / remove) and the hotel's
 * menu to add more. Saves through PUT /api/orders/:id/items.
 */
// onAddItems (optional): shows "Add more items", used where extra dishes go to
// the kitchen as a new order ticket instead of changing this order.
const OrderDetailsDialog = ({
  order,
  statusName,
  statusColor,
  readOnly,
  onClose,
  onSaved,
  onAddItems,
  // reduceOnly: quantities can only go down / dishes be removed (no adding).
  reduceOnly = false,
  // onCancelOrder (optional): shows a "Cancel order" button.
  onCancelOrder,
}) => {
  const [lines, setLines] = useState([]);
  const [menus, setMenus] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Dish whose notes are open for editing: { menuId, prefs } (inline, under the dish).
  const [notesEditor, setNotesEditor] = useState(null);

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
        cook_photo: item.cook?.photo_url || null,
        notes: item.notes || null,
        ready_at: item.ready_at || null,
        item_status: item.item_status,
      })),
    );
    setSearch("");
    setCategory("all");
    setError("");
    setNotesEditor(null);
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

  // Quantity as ordered (reduceOnly caps each dish at this).
  const originalQuantity = (menuId) =>
    Number(
      (order?.items || []).find((item) => Number(item.menu_id) === Number(menuId))
        ?.quantity || 0,
    );

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
          ? {
              ...line,
              cook_id: cookId ? Number(cookId) : null,
              cook_name:
                cooks.find((cook) => cook.id === Number(cookId))?.cook_name || null,
              cook_photo:
                cooks.find((cook) => cook.id === Number(cookId))?.photo_url || null,
            }
          : line,
      ),
    );

  const setLineNotes = (menuId, notes) =>
    setLines((current) =>
      current.map((line) =>
        line.menu_id === Number(menuId) ? { ...line, notes: notes || null } : line,
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
          `${Number(item.menu_id)}:${Number(item.quantity)}:${item.cook_id ?? item.cook?.id ?? ""}:${item.notes || ""}`,
      )
      .sort()
      .join(",");
    const current = lines
      .map((line) => `${line.menu_id}:${line.quantity}:${line.cook_id ?? ""}:${line.notes || ""}`)
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
          notes: line.notes || "", // "" clears a removed note
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
          {orderCookTime(order) && (
            <span className="order-details__cooked" title="Start of cooking to the last dish ready">
              <TimerOutlined fontSize="inherit" aria-hidden /> Prepared in {orderCookTime(order)}
            </span>
          )}
          {/* Cooks are shown per dish below. */}
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
              {lines.map((line) => {
                const editingNotes = notesEditor?.menuId === line.menu_id;
                return (
                <Fragment key={line.menu_id}>
                <li>
                  <span className="order-lines__name">
                    <strong>{line.name}</strong>
                    <small>{money(line.unit_price)} each</small>
                    <ItemNote text={line.notes} title={line.name} />
                    {!readOnly && (
                      <button
                        type="button"
                        className={`order-lines__notes-btn${line.notes ? " is-set" : ""}`}
                        aria-expanded={editingNotes}
                        onClick={() =>
                          setNotesEditor(
                            editingNotes
                              ? null
                              : { menuId: line.menu_id, prefs: noteToPreferences(line.notes) },
                          )
                        }
                      >
                        <TuneRounded fontSize="inherit" aria-hidden />
                        {editingNotes ? "Close notes" : line.notes ? "Edit notes" : "Add notes"}
                      </button>
                    )}
                  </span>
                  {readOnly || reduceOnly ? (
                    line.cook_name && (
                      <span className="order-lines__cook-read">
                        <StaffAvatar
                          name={line.cook_name}
                          photo={line.cook_photo}
                          size={20}
                          tone="cook"
                        />
                        {line.cook_name}
                      </span>
                    )
                  ) : (
                    <span className="order-lines__cook-wrap">
                    {(() => {
                      // Photo (or initials) of the chosen cook before the picker.
                      const cook =
                        cooks.find((row) => row.id === line.cook_id) ||
                        (line.cook_name
                          ? { cook_name: line.cook_name, photo_url: line.cook_photo }
                          : null);
                      return cook ? (
                        <StaffAvatar
                          name={cook.cook_name}
                          photo={cook.photo_url}
                          size={26}
                          tone="cook"
                        />
                      ) : null;
                    })()}
                    <AppSelect
                      variant="compact"
                      className="order-lines__cook-select"
                      value={line.cook_id ?? ""}
                      onChange={(event) => setLineCook(line.menu_id, event.target.value)}
                      aria-label={`Cook for ${line.name}`}
                      options={[
                        { value: "", label: "No cook" },
                        // Keep a cook who is no longer active selectable for display.
                        ...(line.cook_id && !cooks.some((cook) => cook.id === line.cook_id)
                          ? [{ value: line.cook_id, label: line.cook_name || `Cook #${line.cook_id}` }]
                          : []),
                        ...cooks.map((cook) => ({
                          value: cook.id,
                          label: `${cook.cook_name}${cook.speciality ? ` · ${cook.speciality}` : ""}`,
                        })),
                      ]}
                    />
                    </span>
                  )}
                  {/* How long the cook took on this dish (once it was ticked ready). */}
                  {dishCookTime(order, line) ? (
                    <span
                      className="order-lines__cook-time"
                      title="From the start of cooking to this dish being ready"
                    >
                      <TimerOutlined fontSize="inherit" aria-hidden />
                      {dishCookTime(order, line)}
                    </span>
                  ) : order.preparing_at && !line.ready_at && line.item_status !== ITEM_CANCELLED &&
                    [2, 3].includes(order.order_status) ? (
                    <span className="order-lines__cook-time is-cooking">Cooking…</span>
                  ) : null}
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
                        disabled={reduceOnly && line.quantity >= originalQuantity(line.menu_id)}
                        title={
                          reduceOnly && line.quantity >= originalQuantity(line.menu_id)
                            ? "To add more, place a new order"
                            : undefined
                        }
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
                {editingNotes && (
                  <li className="order-lines__notes-editor">
                    <div className="dish-prefs">
                      <PreferencesFields
                        idPrefix={`order-pref-${line.menu_id}`}
                        value={notesEditor.prefs}
                        onChange={(prefs) => setNotesEditor({ menuId: line.menu_id, prefs })}
                      />
                      <div className="order-lines__notes-actions">
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--sm"
                          onClick={() => setNotesEditor({ menuId: line.menu_id, prefs: {} })}
                        >
                          Clear all
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--sm"
                          onClick={() => setNotesEditor(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn--primary ui-btn--sm"
                          onClick={() => {
                            setLineNotes(line.menu_id, preferencesToNote(notesEditor.prefs));
                            setNotesEditor(null);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </li>
                )}
                </Fragment>
                );
              })}
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

        {readOnly || reduceOnly ? (
          <p className="hotel-form__hint">
            {reduceOnly
              ? lines.length === 0
                ? "Every dish is removed. To drop the whole order, use “Cancel order”."
                : "Reduce or remove dishes here. Extra dishes go to the kitchen as a new order ticket (“Add more items”)."
              : onAddItems
                ? "Extra dishes go to the kitchen as a new order ticket. Use “Add more items”."
                : `${statusName} orders can't be changed.`}
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
        {onCancelOrder && (
          <button
            type="button"
            className="hotel-form__btn order-details__cancel-order"
            onClick={() => onCancelOrder(order)}
            disabled={saving}
          >
            Cancel order
          </button>
        )}
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={onClose}
          disabled={saving}
        >
          {readOnly || reduceOnly ? "Close" : "Cancel"}
        </button>
        {onAddItems && (
          <button
            type="button"
            // Secondary when "Save changes" is also shown.
            className={`hotel-form__btn ${readOnly ? "hotel-form__btn--primary" : "hotel-form__btn--ghost"}`}
            onClick={() => onAddItems(order)}
            disabled={saving}
          >
            <AddRounded fontSize="small" /> Add more items
          </button>
        )}
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
