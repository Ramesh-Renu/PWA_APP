import React, { useMemo } from "react";
import dayjs from "dayjs";
import {
  CheckCircleRounded,
  DarkModeOutlined,
  GroupOutlined,
  LightModeOutlined,
  WbTwilightRounded,
} from "@mui/icons-material";

// Booking windows; slots every 15 minutes. A booking holds its seats for
// 60 minutes (utils/slotAvailability.js in the API).
export const MEALS = [
  { id: "breakfast", label: "Breakfast", from: "07:00", to: "10:45", icon: WbTwilightRounded },
  { id: "lunch", label: "Lunch", from: "12:00", to: "17:45", icon: LightModeOutlined },
  { id: "dinner", label: "Dinner", from: "18:15", to: "23:15", icon: DarkModeOutlined },
];
const STEP_MINUTES = 15;
const DAYS_AHEAD = 7;
const MAX_GUESTS = 20;

// Guest count is hidden for now (kept for later): when false the picker
// doesn't show it and bookings don't require one seat per guest.
export const SHOW_GUESTS = false;

const toMinutes = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
const toHm = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** "20:15" → "8:15 PM" */
export const formatSlot = (hm) => dayjs(`2000-01-01T${hm}`).format("h:mm A");

/** Slots of a meal on a date; today's slots that have started are dropped. */
export const slotsFor = (date, mealId, now = dayjs()) => {
  const meal = MEALS.find((item) => item.id === mealId);
  if (!meal) return [];
  const isToday = dayjs(date).isSame(now, "day");
  const nowMinutes = now.hour() * 60 + now.minute();
  const slots = [];
  for (let m = toMinutes(meal.from); m <= toMinutes(meal.to); m += STEP_MINUTES) {
    if (!isToday || m > nowMinutes) slots.push(toHm(m));
  }
  return slots;
};

/** First meal with slots left on that date (else the last meal). */
export const defaultMeal = (date) =>
  MEALS.find((meal) => slotsFor(date, meal.id).length > 0)?.id || MEALS[MEALS.length - 1].id;

/**
 * Date / meal / time picker for a table booking.
 * value = { date: "YYYY-MM-DD", guests, meal, time: "HH:mm" | "" }
 */
const SlotPicker = ({ value, onChange }) => {
  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, index) => {
        const day = dayjs().add(index, "day");
        return {
          value: day.format("YYYY-MM-DD"),
          tag: index === 0 ? "Today" : index === 1 ? "Tomorrow" : day.format("ddd"),
          dayNumber: day.format("D"),
          month: day.format("MMM"),
        };
      }),
    [],
  );

  const update = (patch) => onChange({ ...value, ...patch });
  const slots = slotsFor(value.date, value.meal);

  // Group the meal's slots by hour: { "7 AM": ["07:00", "07:15", …], … }
  const hours = useMemo(() => {
    const groups = new Map();
    slots.forEach((slot) => {
      const label = dayjs(`2000-01-01T${slot}`).format("h A");
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(slot);
    });
    return [...groups.entries()];
  }, [slots]);

  const selectDay = (date) => {
    const meal = slotsFor(date, value.meal).length ? value.meal : defaultMeal(date);
    update({ date, meal, time: "" });
  };

  return (
    <section className="slot-picker" aria-label="Choose when to dine">
      <div className="slot-picker__top">
        <h3>When would you like to dine?</h3>
        {SHOW_GUESTS && (
          <label className="slot-picker__guests">
            <GroupOutlined aria-hidden />
            <select
              value={value.guests || 2}
              onChange={(event) => update({ guests: Number(event.target.value) })}
              aria-label="Guests"
            >
              {Array.from({ length: MAX_GUESTS }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Day strip */}
      <div className="slot-days" role="radiogroup" aria-label="Date">
        {days.map((day) => {
          const selected = value.date === day.value;
          return (
            <button
              key={day.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`slot-day${selected ? " is-selected" : ""}`}
              onClick={() => selectDay(day.value)}
            >
              <span className="slot-day__tag">{day.tag}</span>
              <strong>{day.dayNumber}</strong>
              <span className="slot-day__month">{day.month}</span>
            </button>
          );
        })}
      </div>

      {/* Meal tabs */}
      <div className="slot-meals" role="tablist" aria-label="Meal">
        {MEALS.map((meal) => {
          const Icon = meal.icon;
          const open = slotsFor(value.date, meal.id).length > 0;
          const selected = value.meal === meal.id;
          return (
            <button
              key={meal.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`slot-meal${selected ? " is-selected" : ""}${open ? "" : " is-closed"}`}
              onClick={() => update({ meal: meal.id, time: "" })}
            >
              <Icon aria-hidden />
              <span>
                <strong>{meal.label}</strong>
                <small>
                  {open
                    ? `${formatSlot(meal.from)} – ${formatSlot(meal.to)}`
                    : "Closed today"}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {/* Times grouped by hour */}
      {hours.length === 0 ? (
        <p className="slot-picker__empty">
          No more {MEALS.find((meal) => meal.id === value.meal)?.label.toLowerCase()} times
          today. Pick another meal or day.
        </p>
      ) : (
        <div className="slot-hours" role="radiogroup" aria-label="Time">
          {hours.map(([hour, hourSlots]) => (
            <div key={hour} className="slot-hour">
              <span className="slot-hour__label">{hour}</span>
              <div className="slot-hour__times">
                {hourSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={value.time === slot}
                    className={`slot-time${value.time === slot ? " is-selected" : ""}`}
                    onClick={() => update({ time: slot })}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className={`slot-picker__summary${value.time ? " is-set" : ""}`}>
        {value.time ? (
          <>
            <CheckCircleRounded aria-hidden />
            {dayjs(value.date).format("ddd, D MMM")} ·{" "}
            {MEALS.find((meal) => meal.id === value.meal)?.label} · {formatSlot(value.time)}
            <span> · table held for 1 hour</span>
          </>
        ) : (
          "Choose a time to see the free tables."
        )}
      </p>
    </section>
  );
};

export default SlotPicker;
