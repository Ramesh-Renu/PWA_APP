import { Fragment, useEffect, useState } from "react";
import "../../styles/components/commons/CustomDatePicker.scss";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import PopupModal from "./PopupModal";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);

/** Restore saved dashboard range `{ start, end }` (YYYY-MM-DD) from MonthRangePicker / CustomDatePicker. */
function parseSavedRangeDefault(defaultDate) {
  if (!defaultDate?.start || !defaultDate?.end) return null;
  const from = dayjs(defaultDate.start);
  const to = dayjs(defaultDate.end);
  if (!from.isValid() || !to.isValid()) return null;
  return { from, to };
}

/** Dual calendar headers: if range is one calendar month, left = that month and right = next month; otherwise left = start month, right = end month. */
function getDualCalendarMonths(from, to) {
  const startM = from.startOf("month");
  const endM = to.startOf("month");
  if (startM.isSame(endM, "month")) {
    return {
      leftMonth: startM,
      rightMonth: startM.add(1, "month"),
    };
  }
  return {
    leftMonth: startM,
    rightMonth: endM,
  };
}

const CustomDatePicker = ({
  defaultDate,
  onSelect,
  oncancel,
  isDueDate = false,
  isOrderDate = false,
  onReset,
  apiLoading,
  isSingleCustomSelect = false,
  isRangeSelect = false,
  isDefault = true,
  twoSide = false,
}) => {
  const today = dayjs();

  const [mode, setMode] = useState(() => (isRangeSelect ? "custom" : "day")); // selection mode: "custom" = free start/end (same or different month)
  const [viewMode, setViewMode] = useState("day"); // UI view

  const savedRange = parseSavedRangeDefault(defaultDate);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (savedRange) return savedRange.to;
    if (typeof defaultDate === "string" && defaultDate?.length > 0) {
      return dayjs(defaultDate).startOf("month");
    }
    return today.startOf("month");
  });

  /** Dual calendar: independent month views (left / right). */
  const [leftMonth, setLeftMonth] = useState(() => {
    if (savedRange) {
      return getDualCalendarMonths(savedRange.from, savedRange.to).leftMonth;
    }
    return today.subtract(1, "month").startOf("month");
  });
  const [rightMonth, setRightMonth] = useState(() => {
    if (savedRange) {
      return getDualCalendarMonths(savedRange.from, savedRange.to).rightMonth;
    }
    return today.startOf("month");
  });

  /** Which calendar opened month/year picker (only that side shows the grid). */
  const [pickerFocusSide, setPickerFocusSide] = useState(null);
  const [resetDate, setResetDate] = useState(
    typeof defaultDate === "string" && defaultDate?.length > 0
      ? dayjs(defaultDate)
      : today,
  );

  const [selectedDate, setSelectedDate] = useState(
    typeof defaultDate === "string" && defaultDate?.length > 0
      ? dayjs(defaultDate)
      : today,
  );

  const [range, setRange] = useState(() =>
    savedRange ? { from: savedRange.from, to: savedRange.to } : { from: null, to: null },
  );
  const [resetrangeDate, setResetrangeDate] = useState(() =>
    savedRange ? { from: savedRange.from, to: savedRange.to } : { from: null, to: null },
  );

  const [showPopup, setShowPopup] = useState(false);
  const [description, setDescription] = useState(null);
  const [selectedButton, setSelectedButton] = useState(isRangeSelect ? "custom" : null);
  const [inputFrom, setInputFrom] = useState(() =>
    savedRange ? savedRange.from.format("DD/MM/YYYY") : "",
  );
  const [inputTo, setInputTo] = useState(() =>
    savedRange ? savedRange.to.format("DD/MM/YYYY") : "",
  );
  const [showEndDateMessage, setShowEndDateMessage] = useState("");
  const [showStartDateMessage, setShowStartDateMessage] = useState("");

  useEffect(() => {
    const next = parseSavedRangeDefault(defaultDate);
    if (!next) return;
    setRange({ from: next.from, to: next.to });
    setInputFrom(next.from.format("DD/MM/YYYY"));
    setInputTo(next.to.format("DD/MM/YYYY"));
    setCurrentMonth(next.to);
    const { leftMonth: lm, rightMonth: rm } = getDualCalendarMonths(next.from, next.to);
    setLeftMonth(lm);
    setRightMonth(rm);
    setResetrangeDate({ from: next.from, to: next.to });
  }, [defaultDate?.start, defaultDate?.end]);

  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");

  const startDay = startOfMonth.day(); // 0-6
  const totalDays = 42; // 🔥 always 6 rows (6*7)

  const days = [];

  // 🔹 Previous month dates
  const prevMonth = currentMonth.subtract(1, "month");
  const prevMonthDays = prevMonth.daysInMonth();

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      current: false,
      date: prevMonth.date(prevMonthDays - i),
    });
  }

  // 🔹 Current month dates
  for (let d = 1; d <= endOfMonth.date(); d++) {
    days.push({
      day: d,
      current: true,
      date: currentMonth.date(d),
    });
  }

  // 🔹 Next month dates
  const nextMonth = currentMonth.add(1, "month");

  let nextDay = 1;
  while (days.length < totalDays) {
    days.push({
      day: nextDay,
      current: false,
      date: nextMonth.date(nextDay),
    });
    nextDay++;
  }

  // 🎨 Selection check
  const isSelected = (date) => {
    if (mode === "day") {
      return selectedDate?.isSame(date, "day");
    }

    // In custom range mode, highlight both range boundaries
    // so start and end use the same selected-circle styling.
    if (range?.from && date.isSame(range.from, "day")) {
      return true;
    }

    if (range?.to && date.isSame(range.to, "day")) {
      return true;
    }

    return false;
  };
  // 📅 Month & Year
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // const getYearsForMonth = (m) => Array.from({ length: 50 }, (_, i) => m.year() - 20 + i);
  const getYearsForMonth = (m) => {
    const startYear = 2020;
    const currentYear = m.year();
    const futureYear = currentYear + 3;

    return Array.from({ length: futureYear - startYear + 1 }, (_, i) => startYear + i);
  };

  const setMonthForSide = (side, updater) => {
    if (!twoSide) {
      setCurrentMonth(updater);
      return;
    }
    if (side === "left") setLeftMonth(updater);
    if (side === "right") setRightMonth(updater);
  };

  /** Dual calendar: move both panels by the same year (year/month picker or year grid). */
  const shiftBothYears = (delta) => {
    setLeftMonth((prev) => prev.add(delta, "year"));
    setRightMonth((prev) => prev.add(delta, "year"));
  };

  /** Dual calendar: move both panels by the same month in day view (any arrow updates both). */
  const shiftBothMonths = (delta) => {
    setLeftMonth((prev) => prev.add(delta, "month"));
    setRightMonth((prev) => prev.add(delta, "month"));
  };

  // 🔥 NAVIGATION — side: "left" | "right" | undefined (single calendar)
  const handlePrev = (side) => {
    const s = twoSide ? side : undefined;
    if (viewMode === "year" || viewMode === "month") {
      if (twoSide) shiftBothYears(-1);
      else setCurrentMonth((prev) => prev.subtract(1, "year"));
    } else {
      if (twoSide) shiftBothMonths(-1);
      else setMonthForSide(s, (prev) => prev.subtract(1, "month"));
    }
  };

  const handleNext = (side) => {
    const s = twoSide ? side : undefined;
    if (viewMode === "year" || viewMode === "month") {
      if (twoSide) shiftBothYears(1);
      else setCurrentMonth((prev) => prev.add(1, "year"));
    } else {
      if (twoSide) shiftBothMonths(1);
      else setMonthForSide(s, (prev) => prev.add(1, "month"));
    }
  };

  // 🎯 SELECT LOGIC
  const handleDayClick = (date) => {
    const isPast = isDueDate
      ? date.isBefore(today, "day")
      : isOrderDate
        ? date.isAfter(today, "day")
        : false;
    if (isPast) return;

    if (mode === "custom") {
      setSelectedButton("custom");
      if (!range.from || range.to) {
        setRange({ from: date, to: null });
        setInputFrom(date.format("DD/MM/YYYY"));
        setInputTo("");
      } else {
        let from = range.from;
        let to = date;
        if (to.isBefore(from, "day")) {
          [from, to] = [to, from];
        }
        setRange({ from, to });
        setInputFrom(from.format("DD/MM/YYYY"));
        setInputTo(to.format("DD/MM/YYYY"));
      }
      return;
    }

    if (mode === "day") {
      setSelectedDate(date);
      setSelectedButton("day");
    }

    if (mode === "week") {
      setRange({
        from: date.startOf("week"),
        to: date.endOf("week"),
      });
    }

    if (mode === "month") {
      setRange({
        from: date.startOf("month"),
        to: date.endOf("month"),
      });
    }

    if (mode === "year") {
      setRange({
        from: date.startOf("year"),
        to: date.endOf("year"),
      });
    }
  };

  const handleDone = () => {
    if (mode === "day" && selectedDate && !isRangeSelect) {
      onSelect({
        type: "day",
        date: selectedDate.format("YYYY-MM-DD"),
      });
    }

    if (range?.from && range?.to) {
      const fromStr = range.from.format("YYYY-MM-DD");
      const toStr = range.to.format("YYYY-MM-DD");
      const getMonthCount = range.from
        .startOf("month")
        .isSame(range.to.startOf("month"), "month")
        ? "multiple"
        : "multiple";
      onSelect({
        type: mode,
        from: fromStr,
        to: toStr,
        start: fromStr,
        end: toStr,
        getMonthCount,
      });
    }
  };

  const handleMonthSelect = (i, side) => {
    if (twoSide) {
      if (side === "left") {
        setLeftMonth((prev) => {
          const nextLeft = prev.month(i);
          setRightMonth(nextLeft.add(1, "month"));
          return nextLeft;
        });
      } else if (side === "right") {
        setRightMonth((prev) => {
          const nextRight = prev.month(i);
          setLeftMonth(nextRight.subtract(1, "month"));
          return nextRight;
        });
      }
    } else {
      setCurrentMonth((prev) => prev.month(i));
    }
    setViewMode("day");
    setPickerFocusSide(null);
  };

  const handleYearSelect = (y, side) => {
    if (twoSide) {
      setLeftMonth((prev) => prev.year(y));
      setRightMonth((prev) => prev.year(y));
    } else {
      setCurrentMonth((prev) => prev.year(y));
    }
    setViewMode("day");
    setPickerFocusSide(null);
  };

  const toggleMonthPicker = (side) => {
    if (viewMode === "month") {
      setViewMode("day");
      setPickerFocusSide(null);
    } else {
      setPickerFocusSide(twoSide ? side : "single");
      setViewMode("month");
    }
  };

  const toggleYearPicker = (side) => {
    if (viewMode === "year") {
      setViewMode("day");
      setPickerFocusSide(null);
    } else {
      setPickerFocusSide(twoSide ? side : "single");
      setViewMode("year");
    }
  };

  const handleLastWeek = () => {
    const end = dayjs(); // today
    const start = dayjs().subtract(6, "day"); // last 6 days + today = 7 days
    setMode("week");
    setSelectedDate(null);
    setRange({ from: start, to: end });
    setSelectedButton("lastWeek");
    setCurrentMonth(start);
  };

  const handleToday = () => {
    const todayDate = dayjs();
    setMode("day");
    setSelectedDate(todayDate);
    setRange({ from: null, to: null }); // IMPORTANT
    setSelectedButton("today");
    setCurrentMonth(todayDate);
  };

  const handleSelectedClearDates = (type) => {
    setSelectedButton(type);
    setSelectedDate(resetDate);
    setRange({ from: null, to: null });
    setInputFrom("");
    setInputTo("");
    setShowEndDateMessage("");
    setShowStartDateMessage("");
  };

  const handleCustomSelected = () => {
    setMode("custom");
    setSelectedButton("custom");
    setSelectedDate(null);
    setRange({ from: null, to: null });
    setInputFrom("");
    setInputTo("");
  };

  const handleSelectedReset = () => {
    if (!resetrangeDate?.from || !resetrangeDate?.to) return;
    setSelectedButton("custom");
    setSelectedDate(resetDate);
    setRange({ from: resetrangeDate.from, to: resetrangeDate.to });
    setInputFrom(resetrangeDate.from.format("DD/MM/YYYY"));
    setInputTo(resetrangeDate.to.format("DD/MM/YYYY"));
    setCurrentMonth(resetrangeDate.to);
    if (twoSide) {
      const { leftMonth: lm, rightMonth: rm } = getDualCalendarMonths(
        resetrangeDate.from,
        resetrangeDate.to,
      );
      setLeftMonth(lm);
      setRightMonth(rm);
    }
  };

  /**
   * Require a finished dd/mm/yyyy before parsing/validating on change.
   * - Normalizes `-` to `/` (same as parseDate).
   * - Year: not 1 or 3 chars (still typing).
   * - Two-digit year "20" is NOT complete on change (often typing 2026, 2020… as 4 digits).
   * - On blur, pass `{ forBlur: true }` to allow "20" as YY 2020.
   */
  const isCompleteDateInput = (value, options = {}) => {
    const { forBlur = false } = options;
    if (value == null || String(value).trim() === "") return false;
    const normalized = String(value).replace(/-/g, "/").trim();
    const parts = normalized.split("/").filter((p) => p.length > 0);
    if (parts.length !== 3) return false;
    const [d, m, yRaw] = parts.map((p) => String(p).trim());
    if (!d || !m || !yRaw) return false;
    const y = yRaw;
    if (y.length === 1) return false;
    if (y.length === 3) return false;
    if (!forBlur && y.length === 2 && y === "20") return false;
    return true;
  };

  const parseDate = (value, fallbackYear) => {
    if (!value) return null;

    let clean = value.replace(/-/g, "/");
    const parts = clean.split("/");

    // ❌ not enough parts
    if (parts.length < 2) return null;

    let [day, month, year] = parts;

    day = Number(day);
    month = Number(month);

    // ✅ FIX DAY
    if (day > 31) day = 31;
    if (day < 1) day = 1;

    // ✅ FIX MONTH
    if (month > 12) month = 12;
    if (month < 1) month = 1;

    // ✅ YEAR LOGIC (IMPORTANT)
    if (!year || year === "" || isNaN(Number(year))) {
      // 👉 use fallback (start date year OR current year)
      year = fallbackYear || dayjs().year();
    } else {
      year = Number(year);

      if (year < 100) {
        year = 2000 + year;
      }
    }
    const formatted = `${day}/${month}/${year}`;
    const parsed = dayjs(formatted, "D/M/YYYY", true);
    return parsed.isValid() ? parsed : null;
  };

  const rangeSelectFrom = (value) => {
    setInputFrom(value);
    if (!isCompleteDateInput(value)) return;
    setShowEndDateMessage("");
    setShowStartDateMessage("");
    const parsed = parseDate(value, dayjs().year());
    if (!parsed) return;

    // ❌ block future calendar year (and future day when order date)
    if (parsed.year() > dayjs().year()) {
      // alert("Future year is not allowed");
      setShowStartDateMessage("Future year is not allowed");
      setInputFrom("");
      return;
    }
    if (isOrderDate && parsed.isAfter(dayjs(), "day")) {
      // alert("Future dates are not allowed");
      setShowStartDateMessage("Future dates are not allowed");
      setInputFrom("");
      setCurrentMonth(today.startOf("month"));
      return;
    }

    setSelectedDate(null);
    setInputTo("");

    setRange({
      from: parsed,
      to: null,
    });

    if (twoSide) {
      const sm = parsed.startOf("month");
      setLeftMonth(sm);
      setRightMonth(sm.add(1, "month"));
    }
    setCurrentMonth(parsed);
    setInputFrom(parsed.format("DD/MM/YYYY"));
  };

  const rangeSelectTo = (value) => {
    setInputTo(value);
    if (!range?.from) return;

    if (!isCompleteDateInput(value)) return;

    const parsed = parseDate(value, range.from.year());
    if (!parsed) {
      return;
    }

    if (parsed.year() > dayjs().year()) {
      // alert("Future year is not allowed");
      setShowEndDateMessage("Future year is not allowed");
      setInputTo("");
      return;
    }
    if (isOrderDate && parsed.isAfter(dayjs(), "day")) {
      // alert("Future dates are not allowed");
      setShowEndDateMessage("Future dates are not allowed");
      setInputTo("");
      return;
    }

    const from = range.from;

    if (parsed.isBefore(from, "day")) {
      // alert("End date cannot be before start date");
      setShowEndDateMessage("End date cannot be before start date");
      setInputTo("");
      setRange({ from, to: null });
      return;
    }

    setRange({
      from,
      to: parsed,
    });

    if (twoSide) {
      const { leftMonth: lm, rightMonth: rm } = getDualCalendarMonths(from, parsed);
      setLeftMonth(lm);
      setRightMonth(rm);
    }
    setCurrentMonth(parsed);
    setInputTo(parsed.format("DD/MM/YYYY"));
  };

  const handleRangeEndBlur = () => {
    if (!isCompleteDateInput(inputTo, { forBlur: true }) || !range?.from) return;
    const parsed = parseDate(inputTo, range.from.year());
    if (!parsed) return;
    if (parsed.year() > dayjs().year()) return;
    if (isOrderDate && parsed.isAfter(dayjs(), "day")) return;
    if (parsed.isBefore(range.from, "day")) return;
    setInputTo(parsed.format("DD/MM/YYYY"));
  };

  const handleRangeStartBlur = () => {
    if (!isCompleteDateInput(inputFrom, { forBlur: true })) return;
    const parsed = parseDate(inputFrom, dayjs().year());
    if (!parsed) return;
    if (parsed.year() > dayjs().year()) return;
    if (isOrderDate && parsed.isAfter(dayjs(), "day")) return;
    setInputFrom(parsed.format("DD/MM/YYYY"));
  };

  const currentYear = dayjs().year();
  const currentDueMonth = dayjs().month();

  const getDays = (month) => {
    const startOfMonth = month.startOf("month");
    const endOfMonth = month.endOf("month");

    const startDay = startOfMonth.day();
    const totalDays = 42;

    const days = [];

    const prevMonth = month.subtract(1, "month");
    const prevMonthDays = prevMonth.daysInMonth();

    // previous month
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        current: false,
        date: prevMonth.date(prevMonthDays - i),
      });
    }

    // current month
    for (let d = 1; d <= endOfMonth.date(); d++) {
      days.push({
        day: d,
        current: true,
        date: month.date(d),
      });
    }

    // next month
    const next = month.add(1, "month");
    let nextDay = 1;

    while (days.length < totalDays) {
      days.push({
        day: nextDay,
        current: false,
        date: next.date(nextDay),
      });
      nextDay++;
    }

    return days;
  };

  const CalendarGrid = ({ month, days, monthSide }) => {
    const yearsForGrid = getYearsForMonth(month);
    const showMonthGrid =
      viewMode === "month" &&
      (!twoSide ||
        pickerFocusSide === monthSide ||
        (pickerFocusSide === "single" && monthSide == null));
    const showYearGrid =
      viewMode === "year" &&
      (!twoSide ||
        pickerFocusSide === monthSide ||
        (pickerFocusSide === "single" && monthSide == null));

    return (
      <Fragment>
        <div className="d-flex justify-content-between align-items-center mb-3 w-100">
          <button
            type="button"
            className="btn btn-0 arrowButton"
            onClick={() => handlePrev(monthSide)}
            disabled={
              isDueDate &&
              currentYear === month.year() &&
              currentDueMonth >= month.month()
            }
          >
            ‹
          </button>
          <div className="header-year-month">
            {/* Month */}
            <div className={`month-year-dropdwon`}>
              <span
                role="button"
                tabIndex={0}
                onClick={() => toggleMonthPicker(monthSide)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleMonthPicker(monthSide);
                }}
                className={` ${
                  showMonthGrid ? "active" : viewMode === "day" ? "" : "not-active"
                }`}
              >
                {month.format("MMMM")}
              </span>
              {/* MONTH GRID — only on the calendar that opened it (two-side) */}
              {showMonthGrid && (
                <div className="month-grid">
                  {months.map((m, i) => (
                    <button
                      type="button"
                      key={m}
                      className={i === month.month() ? "active" : ""}
                      onClick={() => handleMonthSelect(i, monthSide)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
              &#160;
              {/* Year */}
              <span
                role="button"
                tabIndex={0}
                onClick={() => toggleYearPicker(monthSide)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleYearPicker(monthSide);
                }}
                className={
                  showYearGrid ? "active" : viewMode === "day" ? "" : "not-active"
                }
              >
                {month.year()}
              </span>
              {/* YEAR GRID */}
              {showYearGrid && (
                <div className="year-grid">
                  {yearsForGrid.map((y) => {
                    const isFuture =
                      (isOrderDate && y > currentYear) || (isDueDate && y < currentYear);
                    return (
                      <button
                        type="button"
                        key={y}
                        disabled={isFuture}
                        className={`${y === month.year() ? "active" : ""} ${isFuture ? "disabled" : ""}`}
                        onClick={() => !isFuture && handleYearSelect(y, monthSide)}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* )} */}
          {(monthSide === "left" ||
            (monthSide === "right" && isOrderDate && isRangeSelect)) && (
            <button
              type="button"
              className="btn btn-0 arrowButton"
              onClick={() => handleNext(monthSide)}
              disabled={
                (isOrderDate || !isRangeSelect) &&
                currentYear === month.year() &&
                currentDueMonth <= month.month()
              }
            >
              ›
            </button>
          )}
          {/* Right side → Today button */}
          {monthSide === "right" && isOrderDate && !isRangeSelect && (
            <button
              type="button"
              onClick={() => {
                handleToday();
                setSelectedButton("today");
              }}
              className={`action-btn today-button ${
                selectedButton === "today" ? "active" : ""
              }`}
            >
              Today
            </button>
          )}
        </div>

        {/* DAY GRID */}
        {/* {viewMode === "day" && ( */}
        <>
          <div className="week-header">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} style={{ width: "100%" }}>
                {d}
              </div>
            ))}
          </div>

          <div className="day-list">
            {days.map((item, i) => {
              const { day, current, date } = item; // correct

              const isPast = isDueDate
                ? date.isBefore(today, "day") // disable past dates
                : isOrderDate
                  ? date.isAfter(today, "day") // disable future dates
                  : false;

              // In dual-calendar mode, avoid applying range styles on overflow days
              // (days rendered from previous/next month inside a panel), otherwise
              // the same date appears highlighted on both panels.
              const canHighlightThisCell = !twoSide || current;
              const isStart = canHighlightThisCell && range?.from?.isSame(date, "day");
              const isEnd = canHighlightThisCell && range?.to?.isSame(date, "day");
              const selected = canHighlightThisCell && isSelected(date);
              const inRange =
                canHighlightThisCell &&
                range?.from &&
                range?.to &&
                date.isBetween(range.from, range.to, "day", "()");

              return (
                <div
                  key={i}
                  className={`calendar-day ${!current ? "other-month" : ""} ${selected ? "selected" : ""} ${inRange ? "in-range" : ""} ${isStart ? "range-start" : ""} ${isEnd ? "range-end" : ""} ${isPast ? "disabled" : ""}`}
                  onClick={() => !isPast && handleDayClick(date)}
                >
                  <div className="calendar-day-inner">{day}</div>{" "}
                </div>
              );
            })}
          </div>
        </>
        {/* )} */}
      </Fragment>
    );
  };

  return (
    <div className={`customDatePicker`} style={{ width: twoSide ? "100%" : "370px" }}>
      {/* HEADER */}
      <div className="header-container">
        <h4 className="header-title">{isRangeSelect ? "Custom Range" : "Select Date"}</h4>
        <div className="clear-btn-reset">
          <button
            onClick={() => handleSelectedClearDates(isRangeSelect ? "custom" : null)}
            className={`action-btn ${selectedButton === "clearDates" ? "active" : ""}`}
            disabled={
              selectedButton === "custom" && range?.from === null && range?.to === null
            }
          >
            Clear
          </button>
        </div>
      </div>
      {twoSide ? (
        <div className={`dual-calendar`}>
          {/* LEFT*/}
          <div className="calendar">
            <CalendarGrid
              month={leftMonth}
              days={getDays(leftMonth)}
              monthSide={"left"}
              twoSide={twoSide}
            />
          </div>

          {/* RIGHT */}
          <div className="calendar">
            <CalendarGrid
              month={rightMonth}
              days={getDays(rightMonth)}
              monthSide={"right"}
              twoSide={twoSide}
            />
          </div>
        </div>
      ) : (
        <div className="single-calendar">
          <CalendarGrid
            month={currentMonth}
            days={getDays(currentMonth)}
            twoSide={twoSide}
          />
        </div>
      )}

      <div
        className={`calendar-footer d-flex space-between left-side ${twoSide ? "twoSide-calendar" : "single-calendar"}`}
      >
        <Fragment>
          <div className="calendar-footer-left">
            {/* {isRangeSelect && (
              <div className="custom-range-selection-col">
                <label>{twoSide ? "Start Date" : "From"}</label>
                <input
                  onChange={(e) => rangeSelectFrom(e.target.value)}
                  onBlur={handleRangeStartBlur}
                  value={inputFrom}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            )}{" "}
            {isRangeSelect && showStartDateMessage && (
              <p className="error-message">{showStartDateMessage}</p>
            )}
            {isRangeSelect && showEndDateMessage && (
              <p className="error-message">{showEndDateMessage}</p>
            )}
            {isRangeSelect &&
              resetrangeDate?.from &&
              resetrangeDate?.to &&
              range?.from &&
              range?.to &&
              (!range.from.isSame(resetrangeDate.from, "day") ||
                !range.to.isSame(resetrangeDate.to, "day")) && (
                <div className="custom-range-selection-col1">
                  <button
                    type="button"
                    onClick={handleSelectedReset}
                    className={`action-btn ${selectedButton === "clearDates" ? "active" : ""}`}
                  >
                    Reset
                  </button>
                </div>
              )} */}
          </div>
          <div className="calendar-footer-right">
            {/* {isRangeSelect && (
              <div className="custom-range-selection-col">
                <label>{twoSide ? "End Date" : "To"}</label>
                <input
                  onChange={(e) => rangeSelectTo(e.target.value)}
                  value={inputTo}
                  placeholder="dd/mm/yyyy"
                  disabled={range?.from === null}
                  onBlur={handleRangeEndBlur}
                />
              </div>
            )} */}
            <p className="error-message">{showEndDateMessage}</p>
            <div className="submit-btn-cancel">
              <button
                onClick={() => {
                  oncancel();
                  setResetDate(null);
                  setResetrangeDate({ from: null, to: null });
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="submit-btn"
                disabled={isRangeSelect && (!range?.from || !range?.to)}
              >
                Save
              </button>
            </div>
          </div>
        </Fragment>
      </div>

      {showPopup && (
        <PopupModal show={showPopup} onClose={() => setShowPopup(false)} title="Reason">
          <textarea
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </PopupModal>
      )}
    </div>
  );
};

export default CustomDatePicker;
