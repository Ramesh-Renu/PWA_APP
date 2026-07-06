import dayjs from "dayjs";

const formatDate = (date) => {
  const y = date?.getFullYear();
  const m = String(date?.getMonth() + 1).padStart(2, "0");
  const d = String(date?.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getDashboardSummaryParams = (rangeType, customRange = {}) => {
  const today = new Date();
  let startDate;
  let endDate;

  if (rangeType === "CUSTOM_RANGE") {
    if (customRange.start_date && customRange.end_date) {
      return {
        start_date: customRange.start_date,
        end_date: customRange.end_date,
      };
    }
    return null;
  }

  switch (rangeType) {
    case "LAST_7_DAYS": {
      startDate = addDays(today, -6);
      endDate = today;
      break;
    }

    case "LAST_30_DAYS": {
      startDate = addDays(today, -29);
      endDate = today;
      break;
    }

    case "LAST_60_DAYS": {
      startDate = addDays(today, -59);
      endDate = today;
      break;
    }

    case "LAST_90_DAYS": {
      startDate = addDays(today, -89);
      endDate = today;
      break;
    }

    default:
      return null;
  }
  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
};


export const customMonthDashboardDates = (input, fromPage) => {
  const start = dayjs(input?.start);
  const end = dayjs(input?.end);

  if (input?.getMonthCount === "single") {
    const fromDate = start.subtract(5, "months").startOf("month");
    const toDate = start.endOf("month");
    return {
      workspacehealthsummary: {
        start_date: toDate.format("YYYY-MM-DD"),
        end_date: start.subtract(1, "months").endOf("month").format("YYYY-MM-DD"),
      },

      performancehealthsummary: {
        fromDate: fromDate.format("YYYY-MM-DD"),
        toDate: toDate.format("YYYY-MM-DD"),
      },

      velocitycomparison: {
        compareThisMonth: start.subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
      },
      compareWithMonth: start.endOf("month").format("YYYY-MM-DD"),
    };
  }

  if (input?.getMonthCount === "multiple") {
    const perfFrom = end.subtract(5, "months").startOf("month");
    const perfTo = end.endOf("month");

    return {
      workspacehealthsummary: {
        start_date:
          fromPage === "workspace" ? end.format("YYYY-MM-DD") : end.format("YYYY-MM-DD"),
        end_date:
          fromPage === "workspace"
            ? start.format("YYYY-MM-DD")
            : start.format("YYYY-MM-DD"),
      },

      performancehealthsummary: {
        fromDate:
          fromPage === "workspace"
            ? perfFrom.format("YYYY-MM-DD")
            : start.format("YYYY-MM-DD"),
        toDate:
          fromPage === "workspace"
            ? perfTo.format("YYYY-MM-DD")
            : end.format("YYYY-MM-DD"),
      },

      velocitycomparison: {
        compareThisMonth:
          fromPage === "workspace"
            ? end.format("YYYY-MM-DD")
            : start.format("YYYY-MM-DD"),
        compareWithMonth:
          fromPage === "workspace"
            ? start.format("YYYY-MM-DD")
            : end.format("YYYY-MM-DD"),
      },
    };
  }
};


export const COLORS_VALUES = (MaterValue) => {
  return {
    healthy:
      MaterValue?.filter(
        (check) =>
          check.label.toLowerCase().toString().replaceAll(" ", "-") === "healthy",
      )[0]?.color || "#0f9d74",
    needsAttention:
      MaterValue?.filter(
        (check) =>
          check.label.toLowerCase().toString().replaceAll(" ", "-") === "needs-attention",
      )[0]?.color || "#d97706",
    atRisk: MaterValue?.filter(
      (check) => check.label.toLowerCase().toString().replaceAll(" ", "-") === "at-risk",
    )[0]?.color,
    muted: "#e5e7eb",
    line:
      MaterValue?.filter(
        (check) =>
          check.label.toLowerCase().toString().replaceAll(" ", "-") === "healthy",
      )[0]?.color || "#e5e7eb",
    marker:
      MaterValue?.filter(
        (check) =>
          check.label.toLowerCase().toString().replaceAll(" ", "-") === "healthy",
      )[0]?.color || "#e5e7eb",
    disabled: "#e5e7eb",
    total: "#4F46E5",
  };
};
