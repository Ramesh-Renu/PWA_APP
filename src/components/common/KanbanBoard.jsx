import React, { useEffect, useMemo, useRef, useState } from "react";
import SkeletonLoading from "components/common/SkeletonLoading";
import AppSelect from "components/common/AppSelect";

/**
 * Generic Kanban board. Each column is a status; cards move between columns
 * by drag-and-drop, or with the "Move to" select (works on touch/keyboard).
 *
 * columns: [{ id, name, color }]
 */
const MINIMAP_BLOCK_WIDTH = 16;
const MINIMAP_GAP = 4;

/**
 * Mini-map horizontal scroller: one block per column plus a frame showing
 * the visible part of the board. Click or drag on it to scroll.
 */
const KanbanMinimap = ({ boardRef, columnCount }) => {
  const trackRef = useRef(null);
  const [metrics, setMetrics] = useState({ left: 0, width: 0, total: 0 });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;

    const update = () =>
      setMetrics({
        left: board.scrollLeft,
        width: board.clientWidth,
        total: board.scrollWidth,
      });

    update();
    board.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(board);
    Array.from(board.children).forEach((child) => observer.observe(child));
    return () => {
      board.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [boardRef, columnCount]);

  if (!columnCount || metrics.total <= metrics.width + 1) return null;

  const trackWidth =
    columnCount * MINIMAP_BLOCK_WIDTH + (columnCount - 1) * MINIMAP_GAP;
  const ratio = trackWidth / metrics.total;
  const thumbWidth = Math.max(metrics.width * ratio, MINIMAP_BLOCK_WIDTH);
  const thumbLeft = Math.min(metrics.left * ratio, trackWidth - thumbWidth);

  const scrollToPointer = (clientX) => {
    const board = boardRef.current;
    const track = trackRef.current;
    if (!board || !track) return;
    const x = clientX - track.getBoundingClientRect().left - thumbWidth / 2;
    board.scrollLeft = x / ratio;
  };

  return (
    <div className="kanban-minimap-dock">
      <div
        ref={trackRef}
        className="kanban-minimap"
        style={{ width: trackWidth }}
        role="scrollbar"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(
          (metrics.left / (metrics.total - metrics.width)) * 100,
        )}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          scrollToPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            scrollToPointer(event.clientX);
          }
        }}
      >
        {Array.from({ length: columnCount }, (_, index) => (
          <span key={index} className="kanban-minimap__block" />
        ))}
        <span
          className="kanban-minimap__thumb"
          style={{ left: thumbLeft, width: thumbWidth }}
        />
      </div>
    </div>
  );
};

// Pointer-based drag (mouse, pen and touch). Native HTML5 drag-and-drop is
// not used: it never fires on touch screens and Chrome cancels it when the
// dragged element re-renders during dragstart.
const DRAG_THRESHOLD_PX = 5;
const TOUCH_HOLD_MS = 250;
const TOUCH_SCROLL_TOLERANCE_PX = 8;
const AUTO_SCROLL_EDGE_PX = 70;
const AUTO_SCROLL_STEP_PX = 14;
// Buttons/links inside a card stay draggable (a drag never fires their click);
// only form controls keep their own pointer behaviour.
const NON_DRAG_TARGETS = "select, input, textarea, [data-no-drag]";
// Clicks on these inside a card do not open it (see onCardClick).
const CARD_CONTROLS = "button, a, select, input, textarea, [data-no-drag]";

// Swallows the click the browser fires right after a drag ends, so dropping a
// card grabbed by its title does not also trigger the title button.
const suppressNextClick = () => {
  const swallow = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, true), 0);
};

const KanbanBoard = ({
  columns = [],
  items = [],
  getItemId = (item) => item.id,
  getColumnId,
  renderCard,
  canMove = () => true,
  onMove,
  // Called when a drop is refused: reason is "locked" (canMove is false) or
  // "outside" (released outside every column). column is null for "outside".
  onBlocked,
  loading = false,
  emptyLabel = "No items",
  // Optional: open a card (click / Enter). Clicks on buttons, links and form
  // controls inside the card, and the click that ends a drag, are ignored.
  onCardClick,
  // Optional: extra class for a card (e.g. "is-cancelled" to fade it).
  getCardClassName,
}) => {
  const [dragging, setDragging] = useState(null); // { item, width, height }
  const [overColumnId, setOverColumnId] = useState(null);
  const boardRef = useRef(null);
  const ghostRef = useRef(null);
  const dragRef = useRef(null);

  const itemsByColumn = useMemo(() => {
    const grouped = new Map(columns.map((column) => [String(column.id), []]));
    items.forEach((item) => {
      grouped.get(String(getColumnId(item)))?.push(item);
    });
    return grouped;
  }, [columns, items, getColumnId]);

  const moveItem = (item, column) => {
    if (!item || !column) return;
    if (String(getColumnId(item)) === String(column.id)) return;
    if (!canMove(item)) return;
    onMove?.(item, column);
  };

  // Keep the latest moveItem/columns for the window listeners below.
  const latestRef = useRef({});
  latestRef.current = { moveItem, columns, getColumnId, onBlocked };

  const positionGhost = (x, y) => {
    const drag = dragRef.current;
    if (!ghostRef.current || !drag) return;
    ghostRef.current.style.transform = `translate(${x - drag.offsetX}px, ${
      y - drag.offsetY
    }px) rotate(2deg)`;
  };

  const columnIdAtPoint = (x, y) =>
    document
      .elementFromPoint(x, y)
      ?.closest("[data-kanban-column]")
      ?.getAttribute("data-kanban-column") ?? null;

  const stopDrag = (commit) => {
    const drag = dragRef.current;
    if (!drag) return;
    clearTimeout(drag.holdTimer);
    cancelAnimationFrame(drag.scrollFrame);
    window.removeEventListener("pointermove", drag.onMove);
    window.removeEventListener("pointerup", drag.onUp);
    window.removeEventListener("pointercancel", drag.onCancel);
    window.removeEventListener("touchmove", drag.onTouchMove);
    document.body.classList.remove(
      "kanban-is-dragging",
      "kanban-is-dragging-locked",
    );
    dragRef.current = null;

    if (drag.started) suppressNextClick();

    if (commit && drag.started) {
      const latest = latestRef.current;
      const column = latest.columns.find(
        (target) => String(target.id) === drag.overColumnId,
      );
      const sameColumn =
        column && String(column.id) === String(latest.getColumnId(drag.item));

      if (!column) {
        latest.onBlocked?.(drag.item, null, "outside");
      } else if (!sameColumn) {
        if (drag.locked) {
          latest.onBlocked?.(drag.item, column, "locked");
        } else {
          latest.moveItem(drag.item, column);
        }
      }
    }
    setDragging(null);
    setOverColumnId(null);
  };

  const autoScroll = () => {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag?.started || !board) return;
    const rect = board.getBoundingClientRect();
    if (drag.x < rect.left + AUTO_SCROLL_EDGE_PX) {
      board.scrollLeft -= AUTO_SCROLL_STEP_PX;
    } else if (drag.x > rect.right - AUTO_SCROLL_EDGE_PX) {
      board.scrollLeft += AUTO_SCROLL_STEP_PX;
    }
    drag.scrollFrame = requestAnimationFrame(autoScroll);
  };

  const startDrag = () => {
    const drag = dragRef.current;
    if (!drag || drag.started) return;
    drag.started = true;
    document.body.classList.add(
      drag.locked ? "kanban-is-dragging-locked" : "kanban-is-dragging",
    );
    setDragging({
      item: drag.item,
      width: drag.width,
      height: drag.height,
      locked: drag.locked,
    });
    drag.scrollFrame = requestAnimationFrame(autoScroll);
    if (drag.pointerType === "touch") navigator.vibrate?.(15);
  };

  const handlePointerDown = (event, item, locked) => {
    if (event.button !== 0 || dragRef.current) return;
    if (event.target.closest(NON_DRAG_TARGETS)) return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const drag = {
      item,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      started: false,
      locked,
      overColumnId: null,
    };

    drag.onMove = (moveEvent) => {
      if (moveEvent.pointerId !== drag.pointerId) return;
      drag.x = moveEvent.clientX;
      drag.y = moveEvent.clientY;
      const distance = Math.hypot(
        drag.x - drag.startX,
        drag.y - drag.startY,
      );

      if (!drag.started) {
        if (drag.pointerType === "touch") {
          // Moving before the hold completes means the user is scrolling.
          if (distance > TOUCH_SCROLL_TOLERANCE_PX) stopDrag(false);
          return;
        }
        if (distance < DRAG_THRESHOLD_PX) return;
        startDrag();
      }

      positionGhost(drag.x, drag.y);
      const columnId = columnIdAtPoint(drag.x, drag.y);
      if (columnId !== drag.overColumnId) {
        drag.overColumnId = columnId;
        setOverColumnId(columnId);
      }
    };
    drag.onUp = (upEvent) => {
      if (upEvent.pointerId === drag.pointerId) stopDrag(true);
    };
    drag.onCancel = (cancelEvent) => {
      if (cancelEvent.pointerId === drag.pointerId) stopDrag(false);
    };
    // Stops the page/column from scrolling under the finger while dragging.
    drag.onTouchMove = (touchEvent) => {
      if (drag.started) touchEvent.preventDefault();
    };

    dragRef.current = drag;
    window.addEventListener("pointermove", drag.onMove);
    window.addEventListener("pointerup", drag.onUp);
    window.addEventListener("pointercancel", drag.onCancel);
    window.addEventListener("touchmove", drag.onTouchMove, { passive: false });

    if (drag.pointerType === "touch") {
      drag.holdTimer = setTimeout(startDrag, TOUCH_HOLD_MS);
    }
  };

  // Place the ghost under the pointer as soon as it mounts.
  useEffect(() => {
    if (dragging && dragRef.current) {
      positionGhost(dragRef.current.x, dragRef.current.y);
    }
  }, [dragging]);

  useEffect(() => () => stopDrag(false), []);

  const draggingId = dragging ? getItemId(dragging.item) : null;
  const draggingColumn = dragging
    ? columns.find(
        (column) => String(column.id) === String(getColumnId(dragging.item)),
      )
    : null;

  return (
    <div className="kanban-board-wrap">
      <div className="kanban-board" ref={boardRef}>
        {columns.map((column) => {
          const columnItems = itemsByColumn.get(String(column.id)) || [];
          const isOver =
            dragging != null &&
            overColumnId === String(column.id) &&
            String(column.id) !== String(getColumnId(dragging.item));

          return (
            <section
              key={column.id}
              data-kanban-column={String(column.id)}
              className={`kanban-column${
                isOver ? (dragging.locked ? " is-blocked" : " is-over") : ""
              }`}
              style={{ "--kanban-column-color": column.color }}
            >
              <header className="kanban-column__header">
                <span className="kanban-column__dot" />
                <span className="kanban-column__title">{column.name}</span>
                <span className="kanban-column__count">
                  {columnItems.length}
                </span>
              </header>

              <div className="kanban-column__body">
                {loading ? (
                  <SkeletonLoading
                    count={2}
                    height="110px"
                    width="100%"
                    borderRadius="10px"
                  />
                ) : columnItems.length === 0 ? (
                  <p className="kanban-column__empty">{emptyLabel}</p>
                ) : (
                  columnItems.map((item) => {
                    const itemId = getItemId(item);
                    const movable = canMove(item);

                    return (
                      <article
                        key={itemId}
                        className={`kanban-card${
                          movable ? " is-movable" : " is-locked"
                        }${
                          String(draggingId) === String(itemId)
                            ? " is-dragging"
                            : ""
                        }${getCardClassName?.(item) ? ` ${getCardClassName(item)}` : ""}`}
                        onPointerDown={(event) =>
                          handlePointerDown(event, item, !movable)
                        }
                        {...(onCardClick && {
                          tabIndex: 0,
                          "data-clickable": "",
                          onClick: (event) => {
                            if (event.target.closest(CARD_CONTROLS)) return;
                            onCardClick(item);
                          },
                          onKeyDown: (event) => {
                            if (
                              event.key === "Enter" &&
                              event.target === event.currentTarget
                            ) {
                              onCardClick(item);
                            }
                          },
                        })}
                      >
                        {renderCard(item)}

                        {movable && (
                          <AppSelect
                            variant="compact"
                            className="kanban-card__move-select"
                            value={String(column.id)}
                            aria-label="Move to status"
                            searchable={false}
                            onChange={(event) =>
                              moveItem(
                                item,
                                columns.find(
                                  (target) =>
                                    String(target.id) === event.target.value,
                                ),
                              )
                            }
                            options={columns.map((target) => ({
                              value: target.id,
                              label:
                                String(target.id) === String(column.id)
                                  ? "Move to…"
                                  : target.name,
                            }))}
                          />
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
      <KanbanMinimap boardRef={boardRef} columnCount={columns.length} />

      {dragging && (
        <div
          ref={ghostRef}
          className={`kanban-card kanban-card--ghost${
            dragging.locked ? " is-locked" : ""
          }`}
          style={{
            width: dragging.width,
            minHeight: dragging.height,
            "--kanban-column-color": draggingColumn?.color,
          }}
          aria-hidden
        >
          {renderCard(dragging.item)}
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
