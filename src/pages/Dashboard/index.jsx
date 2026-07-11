import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import CustomDatePicker from "components/common/CustomDatePicker";
import { getDashboardSummary } from "services";
import useAuth from "hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getDashboardSummaryParams } from "utils/dashboard";
import ReservationStatusDonut from "./ReservationStatusDonut";
import useGlobalMaster from "hooks/useGlobalMaster";
import { renderArea, renderLocation } from "utils/common";
import Table from "components/common/Table";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
const statusMeta = {
  1: { label: "Confirmed", className: "confirmed" },
  2: { label: "Seated", className: "seated" },
  3: { label: "Completed", className: "completed" },
  4: { label: "Cancelled", className: "cancelled" },
  5: { label: "Pending", className: "pending" },
  6: { label: "Cleaning", className: "cleaning" },
};

export const BOARD_FILTER_OPTIONS = [
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 60 Days", value: "LAST_60_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
  { label: "Custom Date Range", value: "CUSTOM_RANGE" },
];

const Icon = ({ name }) => {
  const paths = {
    booking: (
      <>
        <path d="M7 3v3M17 3v3M4 9h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="m9 15 2 2 4-5" />
      </>
    ),
    hotel: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M9 7h3M9 11h3M9 15h3M17 9h3v12M2 21h20" />
      </>
    ),
    table: (
      <>
        <path d="M4 10h16M6 10V7h12v3M7 10l-2 11M17 10l2 11M8 16h8" />
      </>
    ),
    seat: (
      <>
        <path d="M7 12V6a3 3 0 0 1 6 0v6M5 10a2 2 0 0 0-2 2v4h18v-4a2 2 0 0 0-2-2M5 16v5M19 16v5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [{ data: auth }] = useAuth();
  const [data, setData] = useState(null);
  const [recentReservationData, setRecentReservationData] = useState(null);
  const columnHelper = createColumnHelper();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState(
    BOARD_FILTER_OPTIONS?.[0]?.value,
  );
  const [initialLoad, setInitialLoad] = useState(true);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const dateTimeRef = useRef(null);
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();

  const selectedOption = useMemo(
    () => BOARD_FILTER_OPTIONS.find((option) => option.value === filterType),
    [filterType],
  );
  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);

  const onSelectedCustomMonthRange = (values) => {
    if (!Array.isArray(values) || values.length === 0) return;
    const selectedValue = values[0]?.value;
    if (!selectedValue) return;

    setFilterType(selectedValue);
    if (selectedValue !== "CUSTOM_RANGE") {
      setShowCalendar(false);
      setRangeStart("");
      setRangeEnd("");
      return;
    }

    setShowCalendar(true);
  };

  const onCustomMonthApply = (selectedRangeValue) => {
    if (!selectedRangeValue?.start || !selectedRangeValue?.end) return;
    setShowCalendar(false);
    setRangeStart(selectedRangeValue.start);
    setRangeEnd(selectedRangeValue.end);
    loadDashboard(
      getDashboardSummaryParams("CUSTOM_RANGE", {
        start_date: selectedRangeValue.start,
        end_date: selectedRangeValue.end,
      }),
      { full: true },
    );
  };

  const onCancelCustomMonthApply = () => {
    setShowCalendar(false);
  };

  const loadDashboard = useCallback(
    async (params = {}, options = { full: false }) => {
      const showLoading = options.full || initialLoad;
      if (showLoading) setLoading(true);
      setError("");
      try {
        const response = await getDashboardSummary(params);
        setData(response.data || []);
        setRecentReservationData(response?.data?.recent || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "We couldn't load the dashboard right now.",
        );
      } finally {
        if (showLoading) setLoading(false);
        setInitialLoad(false);
      }
    },
    [initialLoad],
  );

  useEffect(() => {
    const params = getDashboardSummaryParams(filterType);
    if (params) {
      loadDashboard(params, { full: true });
    }
  }, [filterType, loadDashboard]);

  const handleViewReservationDetails = (reservation) => {
    const hotelId = reservation.hotel_id || reservation.hotel?.id;
    if (!hotelId) return;

    navigate(`/book-table/details/${hotelId}`, {
      state: {
        hotelData: reservation.hotel || { id: hotelId },
        isBooking: true,
        fromDashboard: true,
        reservationId: reservation.id,
      },
    });
  };

  if (loading)
    return (
      <div className="dashboard-state">
        <span className="dashboard-loader" />
        <p>Preparing your dashboard…</p>
      </div>
    );
  if (error)
    return (
      <div className="dashboard-state dashboard-error">
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <button
        // onClick={() => loadDashboard(buildFilterParams(), { full: true })}
        >
          Try again
        </button>
      </div>
    );

  const totals = data?.totals || {};
  const cards = [
    {
      label: data?.isAdmin ? "Bookings in range" : "My bookings",
      value: totals.todayBookings,
      icon: "booking",
      tone: "coral",
      note: `${data?.todayStatus?.pending || 0} awaiting confirmation`,
    },
    {
      label: "Hotels",
      value: totals.hotels,
      icon: "hotel",
      tone: "purple",
      note: totals.hotelsWithBookings
        ? `${totals.hotelsWithBookings} hotels booked in range`
        : "Properties in your network",
    },
    {
      label: "Dining tables",
      value: totals.tables,
      icon: "table",
      tone: "blue",
      note: `${totals.tablesBooked || 0} tables booked in range`,
    },
    {
      label: "Seat occupancy",
      value: `${totals.occupancyRate || 0}%`,
      icon: "seat",
      tone: "green",
      note: `${totals.occupiedSeats || 0} seats currently in use`,
    },
  ];
  /** COLUMNS DEFINITION */
  const columns = [
    columnHelper.accessor("hotel", {
      header: () => <span className="customHeader">Name</span>,
      cell: (info) => {
        const rowData = info.row.original;
        return (
          <span>
            {rowData?.hotel?.hotel_name || rowData?.hotel_name || "N/A"}
          </span>
        );
      },
    }),
    columnHelper.accessor("reservation_id", {
      header: () => <span className="customHeader">Reservation</span>,
      cell: (info) => {
        const rowData = info.row.original;
        return (
          <div
            tabIndex={0}
            className="truncate-2-lines"
            title={rowData?.id}
            onClick={() => handleHotelView(rowData?.id, rowData, true)}
          >
            <strong>#{String(rowData?.id).padStart(4, "0")}</strong>
          </div>
        );
      },
    }),
    columnHelper.accessor("dining_date", {
      header: () => <span className="customHeader">Date</span>,
      cell: (info) => {
        return dayjs(info?.getValue()).format("MM/DD/YYYY") || "N/A";
      },
    }),
    columnHelper.accessor("start_time", {
      header: () => <span className="customHeader">Time</span>,
      cell: (info) => {
        return info?.getValue() || "N/A";
      },
    }),
    columnHelper.accessor("table_id", {
      header: () => <span className="customHeader">Table Number</span>,
      cell: (info) => {
        const tableList = (info.row.original.seat_status || [])
          .map(({ table_id }) => table_id)
          .join(", ");
        return <span className={`status-badge`}>{tableList || "N/A"}</span>;
      },
    }),
    columnHelper.accessor("seat_status", {
      header: () => <span className="customHeader">Seats Count</span>,
      cell: (info) => {
        const guests = (info.row.original.seat_status || []).reduce(
          (sum, table) => sum + (table.seat_ids?.length || 0),
          0,
        );
        return <span className={`status-badge`}>{guests || "N/A"}</span>;
      },
    }),
  ];
  
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Good day, {auth?.details?.name?.split(" ")[0] || "Guest"}</h1>
          <p>
            {data?.isAdmin
              ? "Here’s what’s happening across your restaurants today."
              : "Here’s a quick look at your booking activity."}
          </p>
        </div>

        <section className="dashboard-filters">
          <SelectDropDown
            options={BOARD_FILTER_OPTIONS}
            values={selectedOption ? [selectedOption] : []}
            onChange={onSelectedCustomMonthRange}
            labelField="label"
            valueField="value"
            multi={false}
            searchable={false}
            clearable={false}
            optionType="radio"
            className="filter-select-dropDown dashboard-page__action-btn p-2 dashboard-page__action-btn--ghost"
          />
          {showCalendar && (
            <div className="dashboard-page__custom-month" ref={dateTimeRef}>
              <CustomDatePicker
                defaultDate={[rangeStart, rangeEnd]}
                onSelect={onCustomMonthApply}
                oncancel={onCancelCustomMonthApply}
                isOrderDate={true}
                isDueDate={false}
                isRangeSelect={true}
                twoSide={true}
              />
            </div>
          )}
        </section>
        <button
          className="refresh-button"
          // onClick={() => loadDashboard(buildFilterParams(), { full: true })}
          aria-label="Refresh dashboard"
        >
          ↻ <span>Refresh</span>
        </button>
      </header>

      <section className="metric-grid" aria-label="Key metrics">
        {cards.map((card) => (
          <article className={`metric-card ${card.tone}`} key={card.label}>
            <div className={`metric-icon ${card.tone}`}>
              <Icon name={card.icon} />
            </div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value ?? 0}</strong>
              <small>{card.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel status-panel">
          <div className="panel-heading">
            <div>
              <h2>Today’s flow</h2>
              <p>Reservation status at a glance</p>
            </div>
          </div>
          <div className="occupancy-chart-container">
            <div
              className="occupancy-ring"
              style={{ "--progress": `${totals.occupancyRate || 0}%` }}
            >
              <div>
                <strong>{totals.occupancyRate || 0}%</strong>
                <span>occupied</span>
              </div>
            </div>
            <div className="status-values-display">
              {Object.entries(data?.todayStatus || {}).map(([key, value]) => {
                return (
                  <div key={key} className={`status-value-box ${key}`}>
                    <div className="status-dot-inline"></div>
                    <div className="status-info">
                      <span className="status-label">{key}</span>
                      <span className="status-count">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
        <article className="dashboard-panel donut-panel">
          <div className="panel-heading">
            <div>
              <h2>Reservation status</h2>
              <p>Created / Cancelled / Completed</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <ReservationStatusDonut data={data} loading={loading} />
          </div>
        </article>
      </section>

      <article className="dashboard-panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent reservations</h2>
            <p>
              {data?.isAdmin
                ? "Latest activity across all hotels and dates"
                : "Your latest booking activity across all dates"}
            </p>
          </div>
          <div className="recent-heading-actions">
            <span className="table-count">
              {data?.recent?.length || 0} recent
            </span>
            <button
              className="view-all-reservations"
              onClick={() => navigate("/booked-table")}
            >
              View all history <span>→</span>
            </button>
          </div>
        </div>
        {!data?.recent?.length ? (
          <div className="empty-reservations">
            <Icon name="booking" />
            <h3>No reservations yet</h3>
            <p>New reservations will appear here.</p>
          </div>
        ) : (
          <div className="reservation-table">
            <Table
              columns={columns}
              columnData={recentReservationData || []}
              className={"products__body-table dashboard_table"}
              tableName="Order_list"
              noDataContent={"Do not render any no data content while loading"}
              tableHeight={"calc(100vh - 95px)"}
              loading={loading}
              //onScrollEnd={handleInfiniteScroll}
            />
          </div>
        )}
      </article>
    </main>
  );
};

export default Dashboard;
