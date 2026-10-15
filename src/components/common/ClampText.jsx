import { useState } from "react";

/**
 * Long text cut to `lines` lines with an ellipsis. The full text shows as a
 * tooltip on hover, and a click / tap (or Enter) expands it in place.
 *
 *   <ClampText text={row.description} />
 */
const ClampText = ({ text, lines = 2, fallback = "—", className = "" }) => {
  const [open, setOpen] = useState(false);
  const value = String(text ?? "").trim();
  if (!value) return fallback;

  const toggle = (event) => {
    event.stopPropagation();
    setOpen((current) => !current);
  };

  return (
    <span
      className={`ui-clamp${open ? " is-open" : ""} ${className}`.trim()}
      style={{ "--clamp-lines": lines }}
      title={open ? undefined : value}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle(event);
        }
      }}
    >
      {value}
    </span>
  );
};

export default ClampText;
