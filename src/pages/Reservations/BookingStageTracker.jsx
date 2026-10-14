import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { CheckRounded, CloseRounded, TimerOutlined } from "@mui/icons-material";
import { formatElapsed } from "pages/Orders/PrepTimer";

// Booking statuses (utils/reservationStatus.js in the API).
const STATUS = {
  CONFIRMED: 1,
  SEATED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  PENDING: 5,
  CLEANING: 6,
  SERVING: 7,
};
const FLOW = [STATUS.CONFIRMED, STATUS.SEATED, STATUS.SERVING, STATUS.CLEANING, STATUS.COMPLETED];
const FINAL = [STATUS.COMPLETED, STATUS.CANCELLED];
const DEFAULT_STAGES = {
  [STATUS.PENDING]: { name: "Pending", color: "#f59e0b" },
  [STATUS.CONFIRMED]: { name: "Confirmed", color: "#0ea5e9" },
  [STATUS.SEATED]: { name: "Seated", color: "#22c55e" },
  [STATUS.SERVING]: { name: "Serving", color: "#8b5cf6" },
  [STATUS.CLEANING]: { name: "Cleaning", color: "#f59e0b" },
  [STATUS.COMPLETED]: { name: "Completed", color: "#16a34a" },
  [STATUS.CANCELLED]: { name: "Cancelled", color: "#ef4444" },
};

/** [{ status, at }] oldest first; older bookings without one get what is known. */
const historyOf = (reservation) => {
  const saved = Array.isArray(reservation.status_history) ? reservation.status_history : [];
  const list = saved.length
    ? saved
    : [
        { status: STATUS.CONFIRMED, at: reservation.booking_date || reservation.createdAt },
        ...(reservation.dining_status !== STATUS.CONFIRMED
          ? [{ status: reservation.dining_status, at: reservation.updated_at || reservation.updatedAt }]
          : []),
      ];
  return list
    .map((entry) => ({ status: Number(entry.status), at: new Date(entry.at).getTime() }))
    .filter((entry) => Number.isFinite(entry.at))
    .sort((a, b) => a.at - b.at);
};

const when = (ms) => {
  const time = dayjs(ms);
  return time.isSame(dayjs(), "day") ? time.format("h:mm A") : time.format("D MMM, h:mm A");
};

/**
 * Booking stages as a tracker: when each stage started and how long it took,
 * the current stage counting up live, and the stages still to come. When the
 * booking is completed (or cancelled) the clock stops and the total shows.
 *
 * columns (optional): [{ id, name, color }] from the dining status master.
 */
const BookingStageTracker = ({ reservation, columns = [] }) => {
  const current = Number(reservation?.dining_status);
  const finished = FINAL.includes(current);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (finished) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  if (!reservation) return null;

  const stageOf = (id) => {
    const column = columns.find((row) => Number(row.id) === id);
    // Master names may be stored upper-case ("SERVING"): show "Serving".
    const name = column?.name
      ? String(column.name).toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : null;
    return {
      name: name || DEFAULT_STAGES[id]?.name || "—",
      color: column?.color || DEFAULT_STAGES[id]?.color || "#64748b",
    };
  };

  // Time in each stage (a stage visited twice adds up) and when it was first entered.
  const history = historyOf(reservation);
  const spent = new Map();
  const enteredAt = new Map();
  history.forEach((entry, index) => {
    const next = history[index + 1];
    const end = next ? next.at : FINAL.includes(entry.status) ? entry.at : now;
    spent.set(entry.status, (spent.get(entry.status) || 0) + Math.max(0, end - entry.at));
    if (!enteredAt.has(entry.status)) enteredAt.set(entry.status, entry.at);
  });

  // Steps: the normal flow; Pending first if the booking had it; a cancelled
  // booking ends at Cancelled instead of the stages it never reached.
  let steps = [...FLOW];
  if (enteredAt.has(STATUS.PENDING)) steps = [STATUS.PENDING, ...steps];
  if (current === STATUS.CANCELLED) {
    steps = [...steps.filter((id) => enteredAt.has(id) && id !== STATUS.COMPLETED), STATUS.CANCELLED];
  }
  const currentIndex = steps.indexOf(current);

  const startedAt = history[0]?.at;
  const endedAt = finished ? history[history.length - 1]?.at : now;
  const total = startedAt ? Math.max(0, endedAt - startedAt) : 0;

  return (
    <section className="hotel-form__section stage-tracker" aria-label="Booking stages">
      <h3 className="hotel-form__section-title">Stage tracker</h3>
      <div className="stage-tracker__body">
        <ol className="stage-tracker__steps" style={{ "--steps": steps.length }}>
          {steps.map((id, index) => {
            const stage = stageOf(id);
            const isCurrent = id === current;
            const done = enteredAt.has(id) && !isCurrent;
            // Skipped: never entered although the booking has moved past it.
            const skipped = !enteredAt.has(id) && index < currentIndex;
            const state = isCurrent
              ? finished
                ? "final"
                : "current"
              : done
                ? "done"
                : skipped
                  ? "skipped"
                  : "upcoming";
            const duration = spent.get(id);
            return (
              <li
                key={id}
                className={`stage-tracker__step is-${state}`}
                style={{ "--stage-color": stage.color }}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="stage-tracker__dot" aria-hidden>
                  {state === "done" || (state === "final" && id === STATUS.COMPLETED) ? (
                    <CheckRounded fontSize="inherit" />
                  ) : id === STATUS.CANCELLED && state === "final" ? (
                    <CloseRounded fontSize="inherit" />
                  ) : (
                    index + 1
                  )}
                </span>
                <strong className="stage-tracker__name">{stage.name}</strong>
                {enteredAt.has(id) ? (
                  <>
                    <span className="stage-tracker__time" title={dayjs(enteredAt.get(id)).format("D MMM YYYY, h:mm:ss A")}>
                      {when(enteredAt.get(id))}
                    </span>
                    {/* Final stage just marks the end; others show time spent. */}
                    {state !== "final" && duration !== undefined && (
                      <span className={`stage-tracker__duration${isCurrent ? " is-live" : ""}`}>
                        {isCurrent && <span className="stage-tracker__pulse" aria-hidden />}
                        {formatElapsed(duration)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="stage-tracker__time is-muted">
                    {skipped ? "Skipped" : "Next"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className={`stage-tracker__total${finished ? " is-stopped" : ""}`}>
          <TimerOutlined aria-hidden />
          <span>
            <small>{finished ? "Total time" : "Time so far"}</small>
            <strong>{formatElapsed(total)}</strong>
            <small>
              {finished
                ? `Stopped ${when(endedAt)}`
                : startedAt
                  ? `Since ${when(startedAt)}`
                  : ""}
            </small>
          </span>
        </div>
      </div>
    </section>
  );
};

export default BookingStageTracker;
