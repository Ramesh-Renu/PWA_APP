import React, { useEffect, useState } from "react";
import PopupModal from "components/common/PopupModal";
import { NOTE_MAX_LENGTH, PREFERENCE_GROUPS } from "./preferenceOptions";

/**
 * The preference chips (spice, Ajinomoto, deep fry, …) and a free note.
 * Tapping a chosen option again clears it. Used in the customer popup below
 * and inline in the admin order popup.
 */
export const PreferencesFields = ({ value = {}, onChange, idPrefix = "pref" }) => {
  const choose = (groupId, optionValue) =>
    onChange({
      ...value,
      [groupId]: value[groupId] === optionValue ? undefined : optionValue,
    });

  return (
    <>
      {PREFERENCE_GROUPS.map((group) => (
        <div key={group.id} className="dish-prefs__row">
          <span className="dish-prefs__label" id={`${idPrefix}-${group.id}`}>
            {group.label}
            {group.hint && <small>{group.hint}</small>}
          </span>
          <div
            className="dish-prefs__options"
            role="radiogroup"
            aria-labelledby={`${idPrefix}-${group.id}`}
          >
            {group.options.map((option) => {
              const selected = value[group.id] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`dish-prefs__chip${selected ? " is-selected" : ""}`}
                  onClick={() => choose(group.id, option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <label className="dish-prefs__text">
        <span className="dish-prefs__label">
          Anything else?
          <small>Allergies, extra lemon, cut small…</small>
        </span>
        <textarea
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          value={value.text || ""}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          placeholder="e.g. Nut allergy, please no cashews"
        />
        <small className="dish-prefs__count">
          {(value.text || "").length}/{NOTE_MAX_LENGTH}
        </small>
      </label>
    </>
  );
};

/**
 * Popup to set how a dish is cooked. Applies to every portion of the dish in
 * the order.
 */
const DishPreferences = ({ show, dishName, quantity = 1, value, onSave, onClose }) => {
  const [prefs, setPrefs] = useState(value || {});

  useEffect(() => {
    if (show) setPrefs(value || {});
  }, [show]);

  return (
    <PopupModal
      show={show}
      onClose={onClose}
      header
      title={`Customize · ${dishName}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog category-dialog dish-prefs-dialog"
    >
      <div className="hotel-form dish-prefs">
        <p className="dish-prefs__intro">
          Tell the kitchen how you like it
          {quantity > 1 ? ` — applies to all ${quantity} portions` : ""}. Skip anything
          you're happy with.
        </p>
        <PreferencesFields value={prefs} onChange={setPrefs} />
      </div>

      <div className="hotel-form__actions">
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={() => setPrefs({})}
        >
          Clear all
        </button>
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--primary"
          onClick={() => onSave(prefs)}
        >
          Save
        </button>
      </div>
    </PopupModal>
  );
};

export default DishPreferences;
