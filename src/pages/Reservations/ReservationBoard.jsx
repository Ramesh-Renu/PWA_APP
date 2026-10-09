import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  EventAvailableOutlined,
  LayersOutlined,
  TableRestaurantOutlined,
  EventSeatOutlined,
} from "@mui/icons-material";
import KanbanBoard from "components/common/KanbanBoard";
import PopupModal from "components/common/PopupModal";
import useToast from "hooks/useToast";
import useGlobalMaster from "hooks/useGlobalMaster";
import {
  getReservationByUser,
  updateDiningStatus,
  deleteReservation,
} from "services";

// Matches RESERVATION_STATUS in the API (utils/reservationStatus.js).
const STATUS = {
  CONFIRMED: 1,
  SEATED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  PENDING: 5,
  CLEANING: 6,
  SERVING: 7,
};
const FLOW_ORDER = [
  STATUS.PENDING,
  STATUS.CONFIRMED,
  STATUS.SEATED,
  STATUS.SERVING,
  STATUS.CLEANING,
  STATUS.COMPLETED,
  STATUS.CANCELLED,
];
const LOCKED_STATUSES = [STATUS.COMPLETED, STATUS.CANCELLED];

const countSeats = (seatStatus) =>
  Array.isArray(seatStatus)
    ? seatStatus.reduce((sum, table) => sum + (table.seat_ids?.length || 0), 0)
    : 0;

const getTableIds = (seatStatus) =>
  Array.isArray(seatStatus)
    ? [...new Set(seatStatus.map((table) => table.table_id).filter(Boolean))]
    : [];

const SEARCH_FIELDS = [
  {
    value: "all",
    label: "All fields",
    placeholder: "Search hotel, booking, floor or table",
  },
  { value: "hotel", label: "Hotel name", placeholder: "e.g. Sangeetha Veg" },
  { value: "booking", label: "Booking ID", placeholder: "e.g. 110" },
  { value: "floor", label: "Floor", placeholder: "e.g. 2" },
  { value: "table", label: "Table ID", placeholder: "e.g. 12" },
];

// "#110", "Booking 110", "Floor 2", "Table #12" → just the useful part.
const normalizeSearch = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^(booking|floor|table)\s*/, "")
    .replace(/^#/, "")
    .trim();

const matchesSearch = (row, field, query) => {
  if (!query) return true;
  const values = {
    hotel: [row.hotel?.hotel_name],
    booking: [row.id],
    floor: [row.floor?.floor_number],
    table: getTableIds(row.seat_status),
  };
  const fields = field === "all" ? Object.keys(values) : [field];
  return fields.some((key) =>
    values[key].some(
      (value) => value != null && String(value).toLowerCase().includes(query),
    ),
  );
};

const ReservationBoard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [searchField, setSearchField] = useState("all");
  const [searchText, setSearchText] = useState("");

  const searchQuery = normalizeSearch(searchText);
  const visibleReservations = useMemo(
    () =>
      reservations.filter((row) =>
        matchesSearch(row, searchField, searchQuery),
      ),
    [reservations, searchField, searchQuery],
  );
  const activeSearchField = SEARCH_FIELDS.find(
    (option) => option.value === searchField,
  );

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getReservationByUser();
      if (response.success) {
        setReservations(response.data || []);
      } else {
        showToast({ message: response.message, variant: "danger" });
      }
    } catch (error) {
      showToast({ message: error, variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (diningStatusList.data.length === 0) {
      getDiningStatus();
    }
    fetchReservations();
  }, []);

  const columns = useMemo(() => {
    const rank = (id) => {
      const index = FLOW_ORDER.indexOf(id);
      return index === -1 ? FLOW_ORDER.length + id : index;
    };
    return [...(diningStatusList.data || [])]
      .sort((a, b) => rank(a.status_id) - rank(b.status_id))
      .map((status) => ({
        id: status.status_id,
        name: status.name,
        color: status.color_code || "#64748b",
      }));
  }, [diningStatusList.data]);

  const setLocalStatus = (reservationId, statusId) =>
    setReservations((current) =>
      current.map((row) =>
        row.id === reservationId ? { ...row, dining_status: statusId } : row,
      ),
    );

  const statusName = (statusId) =>
    columns.find((column) => column.id === statusId)?.name || "this status";

  const changeStatus = async (reservation, statusId) => {
    const previousStatus = reservation.dining_status;
    setLocalStatus(reservation.id, statusId);
    try {
      const response = await updateDiningStatus(reservation.id, {
        dining_status: statusId,
      });
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Reservation status updated successfully",
        variant: "success",
      });
    } catch (error) {
      setLocalStatus(reservation.id, previousStatus);
      showToast({
        title: `Couldn't move reservation #${reservation.id} to ${statusName(statusId)}`,
        message: error,
        variant: "danger",
      });
    }
  };

  const confirmCancel = async () => {
    const reservation = pendingCancel;
    setPendingCancel(null);
    if (!reservation) return;

    const previousStatus = reservation.dining_status;
    setLocalStatus(reservation.id, STATUS.CANCELLED);
    try {
      // The cancel endpoint releases seats and stores a cancellation snapshot.
      const response = await deleteReservation({
        reservation_id: reservation.id,
      });
      if (!response.success) throw response.message;
      showToast({
        message: response.message || "Reservation cancelled successfully",
        variant: "success",
      });
    } catch (error) {
      setLocalStatus(reservation.id, previousStatus);
      showToast({
        title: `Couldn't cancel reservation #${reservation.id}`,
        message: error,
        variant: "danger",
      });
    }
  };

  const handleBlocked = (reservation, column, reason) => {
    if (reason === "outside") {
      showToast({
        title: "Reservation not moved",
        message: "Drop the card on a status column to change its status.",
        variant: "warning",
      });
      return;
    }
    showToast({
      title: `Can't move reservation #${reservation.id}`,
      message: `${statusName(reservation.dining_status)} reservations are closed and can't be moved to ${column.name}.`,
      variant: "warning",
    });
  };

  const handleMove = (reservation, column) => {
    if (column.id === STATUS.CANCELLED) {
      setPendingCancel(reservation);
      return;
    }
    changeStatus(reservation, column.id);
  };

  const renderCard = (row) => (
    <Fragment>
      <div className="kanban-card__head">
        <span className="kanban-card__title">Booking #{row.id}</span>
        <button
          type="button"
          className="kanban-card__ref kanban-card__ref--link"
          title={row.hotel?.hotel_name || "Unnamed Hotel"}
          onClick={() =>
            navigate("/book-table/details/" + row.hotel_id, {
              state: { hotel_id: row.hotel_id },
            })
          }
        >
          {row.hotel?.hotel_name || "Unnamed Hotel"}
        </button>
      </div>
      <div className="kanban-card__meta">
        <span>
          <EventAvailableOutlined sx={{ fontSize: 16, color: "#10b981" }} />
          {dayjs(row.dining_date).format("DD MMM YYYY, hh:mm A")}
        </span>
        <span>
          <LayersOutlined sx={{ fontSize: 16, color: "#8b5cf6" }} />
          Floor {row.floor?.floor_number ?? "-"}
        </span>
        <span>
          <TableRestaurantOutlined sx={{ fontSize: 16, color: "#f59e0b" }} />
          {(() => {
            const tableIds = getTableIds(row.seat_status);
            if (!tableIds.length) return "No table";
            return `${tableIds.length > 1 ? "Tables" : "Table"} ${tableIds
              .map((tableId) => `#${tableId}`)
              .join(", ")}`;
          })()}
        </span>
        <span>
          <EventSeatOutlined sx={{ fontSize: 16, color: "#06b6d4" }} />
          {countSeats(row.seat_status)} Seats
        </span>
      </div>
    </Fragment>
  );

  return (
    <Fragment>
      <section className="app-page kanban-page">
        <div className="kanban-search" role="search">
          <div>
            <select
              className="kanban-search__field"
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              aria-label="Search by"
            >
              {SEARCH_FIELDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            &#160;
            <input
              type="search"
              className="kanban-search__input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={activeSearchField?.placeholder}
              aria-label={`Search by ${activeSearchField?.label}`}
            />
            {searchQuery && (
              <span className="kanban-search__summary">
                {visibleReservations.length} of {reservations.length}{" "}
                reservations
                <button type="button" onClick={() => setSearchText("")}>
                  Clear
                </button>
              </span>
            )}
          </div>
            <button
              type="button"
              className="kanban-page__refresh"
              onClick={fetchReservations}
              disabled={loading}
            >
              Refresh
            </button>

        </div>

        <KanbanBoard
          columns={columns}
          items={visibleReservations}
          getColumnId={(row) => row.dining_status}
          canMove={(row) => !LOCKED_STATUSES.includes(row.dining_status)}
          onMove={handleMove}
          onBlocked={handleBlocked}
          renderCard={renderCard}
          loading={loading || diningStatusList.loading}
          emptyLabel="No reservations"
        />
      </section>

      <PopupModal
        show={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">
            Cancel reservation #{pendingCancel?.id} and release its seats?
          </h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={confirmCancel}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => setPendingCancel(null)}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>
    </Fragment>
  );
};

export default ReservationBoard;
