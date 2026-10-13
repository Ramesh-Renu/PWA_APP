import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  AddRounded,
  DeleteOutlineRounded,
  HourglassTopRounded,
  RemoveRounded,
  RestaurantMenuOutlined,
  SearchRounded,
  ShoppingBagOutlined,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import useAuth from "hooks/useAuth";
import useToast from "hooks/useToast";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getReservationByUser,
} from "services";
import { getApiErrorMessage } from "utils/apiError";
import AppSelect from "components/common/AppSelect";

const TAX_RATE = 0.05; // same as the API (reservationOrder.controller.js)
const CART_KEY = "customerCart";
// Order / reservation statuses that are finished (utils/*Status.js in the API).
// Served / Delivered finish an order (6 = old "Completed", 7 = Cancelled).
const CLOSED_ORDER_STATUSES = [5, 6, 7, 8];
const CLOSED_RESERVATION_STATUSES = [3, 4];
const ORDER_STATUS_NAMES = {
  1: "Ordered",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Served",
  8: "Delivered",
};

const hotelIdOf = (menu) => menu.hotel_id ?? menu?.hotel?.id ?? "unknown";
const hotelNameOf = (menu) =>
  menu?.hotel?.hotel_name || menu?.hotel?.name || "Restaurant";
const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

// The cart holds one hotel's dishes: { hotelId, hotelName, items: { [menuId]: qty } }
const emptyCart = { hotelId: null, hotelName: "", items: {} };
const readCart = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || emptyCart;
  } catch {
    return emptyCart;
  }
};

/**
 * Customer menu: dishes grouped by restaurant, with Add / − + steppers.
 * One restaurant per order; the order bar opens a review popup that places
 * the order on the customer's open booking at that restaurant.
 */
const CustomerMenu = ({ menus = [], loading = false, onBook, onOrdered }) => {
  const [{ data: auth }] = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [hotelFilter, setHotelFilter] = useState("all");

  const [cart, setCart] = useState(readCart);
  const [pendingSwitch, setPendingSwitch] = useState(null); // { menu }
  const [confirmClear, setConfirmClear] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [activeOrder, setActiveOrder] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reservationId, setReservationId] = useState(""); // "" = no booking
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Storage unavailable: the selection just isn't kept across tabs.
    }
  }, [cart]);

  // Open order (one at a time) and open bookings (where an order can go).
  const loadStatus = async () => {
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        getAllOrders({ limit: 100 }),
        auth?.details?.id
          ? getReservationByUser({ user_id: auth.details.id })
          : Promise.resolve(null),
      ]);
      const orders = ordersRes?.rows || ordersRes?.data || [];
      setActiveOrder(
        (Array.isArray(orders) ? orders : []).find(
          (order) => !CLOSED_ORDER_STATUSES.includes(order.order_status),
        ) || null,
      );
      const rows = bookingsRes?.data || [];
      setBookings(
        (Array.isArray(rows) ? rows : []).filter(
          (row) => !CLOSED_RESERVATION_STATUSES.includes(row.dining_status),
        ),
      );
    } catch {
      // Status is a convenience; the API still enforces the rules.
    }
  };

  useEffect(() => {
    loadStatus();
  }, [auth?.details?.id]);

  const menusById = useMemo(
    () => Object.fromEntries(menus.map((menu) => [String(menu.id), menu])),
    [menus],
  );

  const restaurants = useMemo(() => {
    const seen = new Map();
    menus.forEach((menu) => {
      const id = String(hotelIdOf(menu));
      if (!seen.has(id)) seen.set(id, hotelNameOf(menu));
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [menus]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byHotel = new Map();
    menus
      .filter((menu) => !vegOnly || menu.is_veg)
      .filter(
        (menu) => hotelFilter === "all" || String(hotelIdOf(menu)) === hotelFilter,
      )
      .filter((menu) => {
        if (!query) return true;
        return [
          menu.menu_name,
          menu.category?.category_name,
          menu.category_name,
          ...(menu.sideDishes || []).map((dish) => dish.side_dish_name),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .forEach((menu) => {
        const id = String(hotelIdOf(menu));
        if (!byHotel.has(id)) {
          byHotel.set(id, { id, name: hotelNameOf(menu), items: [] });
        }
        byHotel.get(id).items.push(menu);
      });
    return [...byHotel.values()];
  }, [menus, search, vegOnly, hotelFilter]);

  /* ---------------- cart ---------------- */
  const cartLines = Object.entries(cart.items)
    .map(([menuId, quantity]) => ({ menu: menusById[menuId], quantity }))
    .filter((line) => line.menu && line.quantity > 0);
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce(
    (sum, line) => sum + Number(line.menu.price) * line.quantity,
    0,
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const quantityOf = (menu) =>
    String(cart.hotelId) === String(hotelIdOf(menu)) ? cart.items[menu.id] || 0 : 0;

  const setQuantity = (menu, quantity) => {
    const hotelId = String(hotelIdOf(menu));
    setCart((current) => {
      const sameHotel = String(current.hotelId) === hotelId;
      const items = { ...(sameHotel ? current.items : {}) };
      if (quantity > 0) items[menu.id] = quantity;
      else delete items[menu.id];
      return Object.keys(items).length
        ? { hotelId, hotelName: hotelNameOf(menu), items }
        : emptyCart;
    });
  };

  const addFirst = (menu) => {
    const otherHotel =
      cart.hotelId &&
      String(cart.hotelId) !== String(hotelIdOf(menu)) &&
      itemCount > 0;
    if (otherHotel) {
      setPendingSwitch({ menu });
      return;
    }
    setQuantity(menu, 1);
  };

  /* ---------------- order ---------------- */
  const hotelBookings = bookings
    .filter((row) => String(row.hotel_id) === String(cart.hotelId))
    .sort((a, b) => new Date(a.dining_date) - new Date(b.dining_date));

  useEffect(() => {
    if (!reviewOpen) return;
    setOrderError("");
    setReservationId(hotelBookings[0] ? String(hotelBookings[0].id) : "");
  }, [reviewOpen]);

  // Customers may cancel their open order until the kitchen accepts it.
  const cancelActiveOrder = async () => {
    if (!activeOrder) return;
    setCancelling(true);
    try {
      const response = await cancelOrder(activeOrder.id);
      if (response?.success === false) throw new Error(response.message);
      showToast({
        message: `Order ${activeOrder.order_number || `#${activeOrder.id}`} cancelled`,
        variant: "success",
      });
      setConfirmCancel(false);
      loadStatus();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || error?.message || "Unable to cancel the order.",
        variant: "danger",
      });
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  const placeOrder = async () => {
    if (cartLines.length === 0) return;
    setPlacing(true);
    setOrderError("");
    try {
      const response = await createOrder({
        reservation_id: reservationId ? Number(reservationId) : null,
        hotel_id: Number(cart.hotelId),
        items: cartLines.map((line) => ({
          menu_id: line.menu.id,
          quantity: line.quantity,
        })),
      });
      if (response?.success === false) throw new Error(response.message);
      showToast({
        message: `Order placed at ${cart.hotelName}`,
        variant: "success",
      });
      setCart(emptyCart);
      setReviewOpen(false);
      loadStatus();
      onOrdered?.();
    } catch (error) {
      setOrderError(
        getApiErrorMessage(error) || error?.message || "Unable to place the order.",
      );
      loadStatus();
    } finally {
      setPlacing(false);
    }
  };


  if (loading) {
    return (
      <div className="cx-grid">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="cx-card cx-card--skeleton cx-card--short" />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="ui-empty">
        <RestaurantMenuOutlined />
        <h3>No dishes yet</h3>
        <p>Restaurants haven't added their menus.</p>
      </div>
    );
  }

  return (
    <div className={itemCount > 0 ? "cx-menu has-cart" : "cx-menu"}>
      {activeOrder && (
        <div className="cx-order-banner" role="status">
          <HourglassTopRounded aria-hidden />
          <div>
            <strong>
              Order {activeOrder.order_number || `#${activeOrder.id}`} is{" "}
              {(ORDER_STATUS_NAMES[activeOrder.order_status] || "in progress").toLowerCase()}
              {activeOrder.hotel?.hotel_name ? ` at ${activeOrder.hotel.hotel_name}` : ""}.
            </strong>
            <span>Track it in My orders. You can keep ordering.</span>
          </div>
          {activeOrder.order_status === 1 && (
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--sm cx-order-banner__action"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel order
            </button>
          )}
        </div>
      )}

      <div className="cx-menu-filters">
        <label className="ui-search cx-search">
          <SearchRounded fontSize="small" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Dish, category or side dish"
            aria-label="Search dishes"
          />
        </label>

        <div className="cx-chip-row" role="toolbar" aria-label="Filters">
          <button
            type="button"
            className={`cx-chip cx-chip--veg${vegOnly ? " is-active" : ""}`}
            aria-pressed={vegOnly}
            onClick={() => setVegOnly((value) => !value)}
          >
            <span className="ui-diet ui-diet--veg" aria-hidden /> Veg only
          </button>
          {restaurants.length > 1 &&
            [{ id: "all", name: "All restaurants" }, ...restaurants].map(
              (restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  className={`cx-chip${hotelFilter === restaurant.id ? " is-active" : ""}`}
                  aria-pressed={hotelFilter === restaurant.id}
                  onClick={() => setHotelFilter(restaurant.id)}
                >
                  {restaurant.name}
                </button>
              ),
            )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="ui-empty">
          <SearchRounded />
          <h3>No dishes match</h3>
          <p>Try another search or clear the filters.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="cx-menu-group" aria-label={group.name}>
            <header className="cx-menu-group__head">
              <div>
                <h2>{group.name}</h2>
                <span>
                  {group.items.length} {group.items.length === 1 ? "dish" : "dishes"}
                  {String(cart.hotelId) === group.id && itemCount > 0 && " · in your order"}
                </span>
              </div>
              {onBook && (
                <button
                  type="button"
                  className="ui-btn ui-btn--ghost ui-btn--sm"
                  onClick={() => onBook(group.id)}
                >
                  Book a table
                </button>
              )}
            </header>

            <div className="cx-dishes">
              {group.items.map((menu) => {
                const name = menu.menu_name ?? menu.name;
                const image = menu.image_url ?? menu.image;
                const category = menu.category_name ?? menu.category?.category_name;
                const sides = (menu.sideDishes || []).map((dish) => dish.side_dish_name);
                const qty = quantityOf(menu);

                return (
                  <article
                    key={menu.id ?? menu.menu_id}
                    className={`cx-dish${menu.is_available ? "" : " is-unavailable"}${qty ? " is-picked" : ""}`}
                  >
                    <div className="cx-dish__media">
                      {image ? (
                        <img src={image} alt="" loading="lazy" />
                      ) : (
                        <span aria-hidden>{name?.charAt(0) || "M"}</span>
                      )}
                    </div>
                    <div className="cx-dish__body">
                      <h3>
                        <span
                          className={`ui-diet ${menu.is_veg ? "ui-diet--veg" : "ui-diet--nonveg"}`}
                          aria-label={menu.is_veg ? "Veg" : "Non-veg"}
                        />
                        {name}
                      </h3>
                      <p className="cx-dish__meta">
                        {[category, menu.preparation_time ? `${menu.preparation_time} min` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {sides.length > 0 && (
                        <p className="cx-dish__sides" title={sides.join(", ")}>
                          With {sides.slice(0, 3).join(", ")}
                          {sides.length > 3 && ` +${sides.length - 3} more`}
                        </p>
                      )}
                      <div className="cx-dish__foot">
                        <strong>{money(menu.price)}</strong>
                        {!menu.is_available ? (
                          <span className="ui-chip">Unavailable</span>
                        ) : qty > 0 ? (
                          <span className="dish-card__qty">
                            <button
                              type="button"
                              aria-label={`One less ${name}`}
                              onClick={() => setQuantity(menu, qty - 1)}
                            >
                              <RemoveRounded fontSize="small" />
                            </button>
                            <span aria-live="polite">{qty}</span>
                            <button
                              type="button"
                              aria-label={`One more ${name}`}
                              onClick={() => setQuantity(menu, qty + 1)}
                            >
                              <AddRounded fontSize="small" />
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="dish-card__add"
                            onClick={() => addFirst(menu)}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      {itemCount > 0 && (
        <div className="cx-cart-bar" role="region" aria-label="Your order">
          <div className="cx-cart-bar__summary">
            <ShoppingBagOutlined aria-hidden />
            <span>
              <strong>
                {itemCount} {itemCount === 1 ? "item" : "items"} · {money(total)}
              </strong>
              <small>{cart.hotelName} · incl. tax</small>
            </span>
          </div>
          <div className="cx-cart-bar__actions">
            <button
              type="button"
              className="ui-btn cx-cart-bar__cancel"
              onClick={() => setConfirmClear(true)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={() => setReviewOpen(true)}
            >
              View order
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={confirmCancel}
        tone="warning"
        title={`Cancel order ${activeOrder?.order_number || ""}?`}
        message="The kitchen hasn't started it yet. You can place a new order afterwards."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancelling}
        onConfirm={cancelActiveOrder}
        onCancel={() => setConfirmCancel(false)}
      />

      <ConfirmDialog
        show={confirmClear}
        tone="warning"
        title="Clear your selection?"
        message={`${itemCount} ${itemCount === 1 ? "item" : "items"} from ${cart.hotelName} will be removed.`}
        confirmLabel="Clear"
        cancelLabel="Keep"
        onConfirm={() => {
          setCart(emptyCart);
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        show={Boolean(pendingSwitch)}
        tone="warning"
        title={`Start a new order from ${pendingSwitch ? hotelNameOf(pendingSwitch.menu) : ""}?`}
        message={`An order can only have dishes from one restaurant. Your ${itemCount} ${itemCount === 1 ? "item" : "items"} from ${cart.hotelName} will be removed.`}
        confirmLabel="Start new order"
        cancelLabel="Keep current"
        onConfirm={() => {
          const { menu } = pendingSwitch;
          setPendingSwitch(null);
          setCart(emptyCart);
          setQuantity(menu, 1);
        }}
        onCancel={() => setPendingSwitch(null)}
      />

      <PopupModal
        show={reviewOpen}
        onClose={() => !placing && setReviewOpen(false)}
        header
        title={`Your order · ${cart.hotelName}`}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
      >
        <div className="hotel-form">
          {orderError && (
            <p className="menu-editor__alert" role="alert">
              {orderError}
            </p>
          )}

          <section className="hotel-form__section">
            <h3 className="hotel-form__section-title">Items</h3>
            <ul className="order-lines">
              {cartLines.map(({ menu, quantity }) => {
                const name = menu.menu_name ?? menu.name;
                return (
                  <li key={menu.id}>
                    <span className="order-lines__name">
                      <strong>{name}</strong>
                      <small>{money(menu.price)} each</small>
                    </span>
                    <span className="dish-card__qty order-lines__qty">
                      <button
                        type="button"
                        aria-label={`One less ${name}`}
                        onClick={() => setQuantity(menu, quantity - 1)}
                      >
                        <RemoveRounded fontSize="small" />
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label={`One more ${name}`}
                        onClick={() => setQuantity(menu, quantity + 1)}
                      >
                        <AddRounded fontSize="small" />
                      </button>
                    </span>
                    <span className="order-lines__total">
                      {money(Number(menu.price) * quantity)}
                    </span>
                    <button
                      type="button"
                      className="ui-icon-btn ui-icon-btn--danger"
                      aria-label={`Remove ${name}`}
                      onClick={() => setQuantity(menu, 0)}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {cartLines.length === 0 && (
              <p className="menu-dishes__empty">Your order is empty.</p>
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

          <section className="hotel-form__section">
            <h3 className="hotel-form__section-title">
              Your table <span className="cx-optional">optional</span>
            </h3>
            {hotelBookings.length === 0 ? (
              <p className="cx-order-booking cx-order-booking--none">
                No table booking at {cart.hotelName}. Your order will be placed
                without a table.
              </p>
            ) : (
              <AppSelect
                value={reservationId}
                onChange={(event) => setReservationId(event.target.value)}
                aria-label="Table booking for this order"
                options={[
                  { value: "", label: "No table — order without a booking" },
                  ...hotelBookings.map((row) => ({
                    value: row.id,
                    label: `Booking #${row.id}${
                      row.dining_date
                        ? ` · ${dayjs(row.dining_date).format("ddd, D MMM, h:mm A")}`
                        : ""
                    }`,
                  })),
                ]}
              />
            )}
          </section>
        </div>

        <div className="hotel-form__actions">
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--ghost"
            onClick={() => setReviewOpen(false)}
            disabled={placing}
          >
            Keep browsing
          </button>
          <button
            type="button"
            className="hotel-form__btn hotel-form__btn--primary"
            onClick={placeOrder}
            disabled={placing || cartLines.length === 0}
          >
            {placing ? "Placing…" : `Confirm order · ${money(total)}`}
          </button>
        </div>
      </PopupModal>
    </div>
  );
};

export default CustomerMenu;
