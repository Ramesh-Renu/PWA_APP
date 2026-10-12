import React from "react";
import { AddRounded, RemoveRounded, RestaurantMenuRounded } from "@mui/icons-material";

const MenuCard = ({ menu, quantity = 0, onIncrease, onDecrease }) => {
  const spice = menu.spiceLevel?.spice_level;

  return (
    <article className={`dish-card${quantity > 0 ? " is-picked" : ""}`}>
      <div className="dish-card__media">
        {menu.image ? (
          <img src={menu.image} alt="" loading="lazy" />
        ) : (
          <RestaurantMenuRounded aria-hidden />
        )}
      </div>

      <div className="dish-card__body">
        <div className="dish-card__title">
          <span
            className={`dish-card__diet ${menu.is_veg ? "is-veg" : "is-nonveg"}`}
            title={menu.is_veg ? "Veg" : "Non-veg"}
            aria-label={menu.is_veg ? "Veg" : "Non-veg"}
          />
          <h3>{menu.menu_name}</h3>
        </div>

        {menu.description && (
          <p className="dish-card__desc">{menu.description}</p>
        )}
        {spice && (
          <span className="dish-card__spice">
            {String(spice).toLowerCase().replace(/_/g, " ")}
          </span>
        )}

        <div className="dish-card__foot">
          <strong className="dish-card__price">₹{Number(menu.price)}</strong>

          {quantity === 0 ? (
            <button type="button" className="dish-card__add" onClick={onIncrease}>
              Add
            </button>
          ) : (
            <div className="dish-card__qty">
              <button
                type="button"
                onClick={onDecrease}
                aria-label={`Remove one ${menu.menu_name}`}
              >
                <RemoveRounded fontSize="small" />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={onIncrease}
                aria-label={`Add one ${menu.menu_name}`}
              >
                <AddRounded fontSize="small" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
