import React, { useEffect, useState } from "react";
import { TimerOutlined, WarningAmberRounded } from "@mui/icons-material";

// Colour bands for how long the kitchen has been cooking (minutes).
const WARN_AFTER = 15;
const LATE_AFTER = 30;

const pad = (value) => String(value).padStart(2, "0");

export const formatElapsed = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const toTime = (value) => (value ? new Date(value).getTime() : NaN);

const toneOf = (ms) => {
  const minutes = ms / 60000;
  return minutes >= LATE_AFTER ? "late" : minutes >= WARN_AFTER ? "warn" : "ok";
};

// Current time, refreshed every second while `live`.
const useNow = (live) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);
  return now;
};

/**
 * Order cooking time. Live ("Preparing for") from `since` while cooking;
 * frozen ("Prepared in") when `until` is given, i.e. every dish is done.
 */
const PrepTimer = ({ since, until }) => {
  const start = toTime(since);
  const end = toTime(until);
  const frozen = !Number.isNaN(end);
  const now = useNow(!Number.isNaN(start) && !frozen);

  if (Number.isNaN(start)) return null;

  const elapsed = (frozen ? end : now) - start;
  const late = !frozen && toneOf(elapsed) === "late";

  return (
    <div
      className={`kanban-card__timer kanban-card__timer--${frozen ? "done" : toneOf(elapsed)}`}
      title={`Cooking started ${new Date(start).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`}
    >
      <TimerOutlined aria-hidden />
      {/* Over 30 min while cooking: flagged as delayed (the card turns red). */}
      {late ? (
        <span className="kanban-card__timer-alert" role="alert">
          <WarningAmberRounded aria-hidden /> Delayed · over {LATE_AFTER} min
        </span>
      ) : (
        <span>{frozen ? "Prepared in" : "Preparing for"}</span>
      )}
      <strong role="timer" aria-live="off">
        {formatElapsed(elapsed)}
      </strong>
    </div>
  );
};

/**
 * One dish's cooking time: ticking while it cooks, frozen once it was
 * ticked as prepared (readyAt).
 */
export const ItemTimer = ({ since, readyAt }) => {
  const start = toTime(since);
  const end = toTime(readyAt);
  const done = !Number.isNaN(end);
  const now = useNow(!Number.isNaN(start) && !done);

  if (Number.isNaN(start)) return null;

  const elapsed = (done ? end : now) - start;
  return (
    <span
      className={`kanban-card__item-time kanban-card__item-time--${done ? "done" : toneOf(elapsed)}`}
      title={done ? "Time this dish took" : "Cooking for"}
    >
      {formatElapsed(elapsed)}
    </span>
  );
};

export default PrepTimer;
