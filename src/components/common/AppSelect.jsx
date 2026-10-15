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
 * `portal`: render the open list in <body> (fixed position) so a scrolling
 * parent — e.g. a Kanban column — can't clip it.
 */

// A press inside the portalled list. react-dropdown-select sees it as a
// click outside the field (the list lives in <body>) and asks to close on
// mousedown — before the option's click lands. That close is skipped
// (see portalCloseRequest); the option's own click then picks and closes.
let pressedInList = false;

const portalCloseRequest = ({ close }) => {
  if (pressedInList) {
    pressedInList = false;
    return;
  }
  close();
};

// The portalled list is placed (position: fixed) from the field's position,
// which react-dropdown-select only re-measures on a *window* scroll/resize.
// Scrolling the Kanban board sideways or a column doesn't fire those, so the
// list opened where the field used to be. While a portalled list is open,
// any scroll inside the page — and the opening itself — sends a window
// "scroll" so the library re-measures and the list stays under its field.
let openPortalLists = 0;
let remeasureFrame = 0;
const remeasure = () => {
  if (remeasureFrame) return;
  remeasureFrame = requestAnimationFrame(() => {
    remeasureFrame = 0;
    window.dispatchEvent(new Event("scroll"));
  });
};
const onPageScroll = (event) => {
  const host = document.getElementById("app-select-portal");
  // Scrolling the list itself doesn't move the field.
  if (openPortalLists > 0 && !(host && host.contains(event.target))) remeasure();
};
const portalOpened = () => {
  if (openPortalLists === 0) document.addEventListener("scroll", onPageScroll, true);
  openPortalLists += 1;
  remeasure();
};
const portalClosed = () => {
  openPortalLists = Math.max(0, openPortalLists - 1);
  if (openPortalLists === 0) document.removeEventListener("scroll", onPageScroll, true);
};

// One body-level host for portalled lists. It carries the classes the list
// styles hang off (.app-select / .single-select-dropdownRenderer), and
// data-no-drag so clicks in the list don't drag or open the Kanban card
// (React events from a portal bubble to the card).
const getPortalHost = () => {
  let host = document.getElementById("app-select-portal");
  if (!host) {
    host = document.createElement("div");
    host.id = "app-select-portal";
    host.className = "app-select app-select--portal";
    host.setAttribute("data-no-drag", "");
    // Capture phase: runs before the library's document listener.
    const markPress = () => {
      pressedInList = true;
    };
    ["mousedown", "touchstart", "pointerdown"].forEach((type) =>
      host.addEventListener(type, markPress, { capture: true, passive: true }),
    );
    // A press that never became a click (e.g. a touch-scroll of the list)
    // must not swallow the next real outside click.
    host.addEventListener(
      "pointerup",
      () =>
        setTimeout(() => {
          pressedInList = false;
        }, 300),
      true,
    );
    const root = document.createElement("div");
    root.className = "react-dropdown-select single-select-dropdownRenderer app-select-portal__root";
    host.appendChild(root);
    document.body.appendChild(host);
  }
  return host.firstChild;
};
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
  portal = false,
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
        {...(portal && {
          portal: getPortalHost(),
          onDropdownCloseRequest: portalCloseRequest,
          onDropdownOpen: portalOpened,
          onDropdownClose: portalClosed,
        })}
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
