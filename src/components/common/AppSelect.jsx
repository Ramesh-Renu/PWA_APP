import React, { useMemo } from "react";
import SelectDropDown from "components/common/SelectDropDown";

/**
 * The app's single-choice dropdown (SelectDropDown), with a native-<select>
 * like API so forms can swap it in without changing their handlers:
 *
 *   <AppSelect
 *     name="hotel_id"
 *     value={form.hotel_id}
 *     onChange={handleChange}          // receives { target: { name, value } }
 *     options={[{ value: "", label: "All hotels" }, { value: 3, label: "Grand" }]}
 *   />
 *
 * Values are compared as strings ("" = the empty choice, if offered).
 * variant: "form" (hotel-form field), "toolbar" (filter bars), "compact".
 * Long lists (more than 6) get a search box unless `searchable` says otherwise.
 */
const AppSelect = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  searchable,
  variant = "form",
  className = "",
  "aria-label": ariaLabel,
}) => {
  const list = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        value: String(option.value ?? ""),
        label: String(option.label ?? ""),
      })),
    [options],
  );
  const current = String(value ?? "");
  const selected = list.filter((option) => option.value === current);

  return (
    <div
      id={id}
      className={`app-select app-select--${variant}${disabled ? " is-disabled" : ""} ${className}`.trim()}
      // Inside draggable cards (Kanban): don't start a drag from here.
      data-no-drag
      aria-label={ariaLabel}
    >
      <SelectDropDown
        multi={false}
        options={list}
        labelField="label"
        valueField="value"
        searchBy="label"
        values={selected}
        searchable={searchable ?? list.length > 6}
        placeholder={placeholder}
        className="single-select-dropdownRenderer app-select__control"
        disabled={disabled}
        dropdownPosition="auto"
        dropdownHeight="240px"
        optionType="radio"
        onChange={(values) => {
          const next = values?.[0]?.value ?? "";
          if (next !== current) onChange?.({ target: { name, value: next } });
        }}
      />
    </div>
  );
};

export default AppSelect;
