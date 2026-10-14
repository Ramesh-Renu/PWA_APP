import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A dish's cooking note on one line. When it doesn't fit, "more" opens a
 * small popup beside it with the whole note, one choice per line. The popup
 * is rendered into <body> so it also works inside dialogs and board cards.
 */
const ItemNote = ({ text, title }) => {
  const textRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  // Place the popup under the button, kept inside the window.
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = buttonRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const left = Math.max(8, Math.min(anchor.left - width / 2, window.innerWidth - width - 8));
    const below = anchor.bottom + 6;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, anchor.top - height - 6) : below;
    setStyle({ left, top });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onPointerDown = (event) => {
      if (!panelRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        close();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation(); // don't close the dialog underneath
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  if (!text) return null;
  const parts = String(text).split(" · ").filter(Boolean);

  return (
    <span className="item-note item-note--clamp">
      <span ref={textRef} className="item-note__text" title={text}>
        {text}
      </span>
      {overflows && (
        <button
          ref={buttonRef}
          type="button"
          data-no-drag
          className="item-note__toggle"
          aria-haspopup="dialog"
          aria-expanded={open}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            setStyle(null);
            setOpen((value) => !value);
          }}
        >
          more
        </button>
      )}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="item-note-popover"
            role="dialog"
            aria-label={title ? `Notes for ${title}` : "Notes"}
            style={style || { left: -9999, top: 0 }}
          >
            <div className="item-note-popover__head">
              <strong>{title ? `Notes · ${title}` : "Notes"}</strong>
              <button
                type="button"
                className="item-note-popover__close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <ul>
              {parts.map((part, index) => (
                <li key={index}>{part}</li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </span>
  );
};

export default ItemNote;
