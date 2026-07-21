import { useCallback, useEffect, useRef, useState } from "react";
import CustomDatePicker from "components/common/CustomDatePicker";
import { getDashboardSummary } from "services";
import useAuth from "hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getDashboardSummaryParams } from "utils/dashboard";
import ReservationStatusDonut from "./ReservationStatusDonut";
import useGlobalMaster from "hooks/useGlobalMaster";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  Chair,
  EventAvailable,
  Hotel,
  Refresh,
  TableRestaurant,
} from "@mui/icons-material";
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

const metricIconMap = {
  booking: EventAvailable,
  hotel: Hotel,
  table: TableRestaurant,
  seat: Chair,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [{ data: auth }] = useAuth();
  const [data, setData] = useState(null);
  const [recentReservationData, setRecentReservationData] = useState(null);
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

  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);

  const onSelectedCustomMonthRange = (event) => {
    const selectedValue = event.target.value;
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
      <Box className="dashboard-state">
        <CircularProgress size={38} thickness={4} />
        <p>Preparing your dashboard…</p>
      </Box>
    );
  if (error)
    return (
      <Box className="dashboard-state dashboard-error">
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <Button
          variant="contained"
          onClick={() =>
            loadDashboard(getDashboardSummaryParams(filterType), { full: true })
          }
        >
          Try again
        </Button>
      </Box>
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
  const recentRows = recentReservationData || [];
  
  return (
    <main className="dashboard-page">
      <Paper className="dashboard-header" component="header" elevation={0}>
        <Box>
          <Typography className="eyebrow" component="p">OVERVIEW</Typography>
          <Typography component="h1">Good day, {auth?.details?.name?.split(" ")[0] || "Guest"}</Typography>
          <p>
            {data?.isAdmin
              ? "Here’s what’s happening across your restaurants today."
              : "Here’s a quick look at your booking activity."}
          </p>
        </Box>

        <section className="dashboard-filters">
          <FormControl className="dashboard-range-select" size="small">
            <InputLabel id="dashboard-range-label">Range</InputLabel>
            <Select
              labelId="dashboard-range-label"
              label="Range"
              value={filterType}
              onChange={onSelectedCustomMonthRange}
            >
              {BOARD_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        <Button
          className="refresh-button"
          variant="contained"
          startIcon={<Refresh />}
          onClick={() =>
            loadDashboard(getDashboardSummaryParams(filterType), { full: true })
          }
          aria-label="Refresh dashboard"
        >
          Refresh
        </Button>
      </Paper>

      <section className="metric-grid" aria-label="Key metrics">
        {cards.map((card) => {
          const MetricIcon = metricIconMap[card.icon];
          return (
          <Card className={`metric-card ${card.tone}`} key={card.label} elevation={0}>
            <div className={`metric-icon ${card.tone}`}>
              <MetricIcon fontSize="small" />
            </div>
            <CardContent className="metric-card__content">
              <Typography component="p">{card.label}</Typography>
              <Typography component="strong">{card.value ?? 0}</Typography>
              <Typography component="small">{card.note}</Typography>
            </CardContent>
          </Card>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <Paper className="dashboard-panel status-panel" component="article" elevation={0}>
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
        </Paper>
        <Paper className="dashboard-panel donut-panel" component="article" elevation={0}>
          <div className="panel-heading">
            <div>
              <h2>Reservation status</h2>
              <p>Created / Cancelled / Completed</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <ReservationStatusDonut data={data} loading={loading} />
          </div>
        </Paper>
      </section>

      <Paper className="dashboard-panel recent-panel" component="article" elevation={0}>
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
            <Button
              className="view-all-reservations"
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/booked-table")}
            >
              View all history
            </Button>
          </div>
        </div>
        {!data?.recent?.length ? (
          <Stack className="empty-reservations" spacing={1} alignItems="center">
            <EventAvailable />
            <h3>No reservations yet</h3>
            <p>New reservations will appear here.</p>
          </Stack>
        ) : (
          <TableContainer className="reservation-table" component={Box}>
            <Table
              className="dashboard-mui-table"
              size="small"
              aria-label="Recent reservations"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Reservation</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Time</TableCell>
                  <TableCell align="center">Table Number</TableCell>
                  <TableCell align="center">Seats Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentRows.map((reservation) => {
                  const tableList = (reservation.seat_status || [])
                    .map(({ table_id }) => table_id)
                    .join(", ");
                  const guests = (reservation.seat_status || []).reduce(
                    (sum, table) => sum + (table.seat_ids?.length || 0),
                    0,
                  );

                  return (
                    <TableRow key={reservation.id} hover>
                      <TableCell>
                        {reservation?.hotel?.hotel_name ||
                          reservation?.hotel_name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          className="dashboard-reservation-link"
                          variant="text"
                          onClick={() =>
                            handleViewReservationDetails(reservation)
                          }
                        >
                          #{String(reservation?.id).padStart(4, "0")}
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        {reservation?.dining_date
                          ? dayjs(reservation.dining_date).format("MM/DD/YYYY")
                          : "N/A"}
                      </TableCell>
                      <TableCell align="center">
                        {reservation?.start_time || "N/A"}
                      </TableCell>
                      <TableCell align="center">
                        <span className="status-badge">
                          {tableList || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <span className="status-badge">
                          {guests || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </main>
  );
};

export default Dashboard;
