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
  RefreshRounded,
  SearchRounded,
} from "@mui/icons-material";
import KanbanBoard from "components/common/KanbanBoard";
import ConfirmDialog from "components/common/ConfirmDialog";
import AssignStaffDialog from "pages/Orders/AssignStaffDialog";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";
import { CLEANER_CONFIG, SERVER_CONFIG } from "pages/Settings/Staff/staffConfig";
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
// Guests can only be seated / served once their booking time has come
// (up to 15 minutes early). The API applies the same rule.
const ARRIVAL_STATUSES = [STATUS.SEATED, STATUS.SERVING];
const EARLY_ARRIVAL_MINUTES = 15;
// The server is chosen when a booking is confirmed and can be changed while
// the guests are at the table; the cleaner is chosen when the table goes to
// Cleaning. Later columns just show who it was.
const STAFF = {
  server: {
    config: SERVER_CONFIG,
    editableIn: [STATUS.CONFIRMED, STATUS.SEATED, STATUS.SERVING],
    question: "Who will serve this table?",
    moveLabel: "Confirm booking",
    movedVerb: "confirmed",
  },
  cleaner: {
    config: CLEANER_CONFIG,
    editableIn: [STATUS.CLEANING],
    question: "Who will clean this table?",
    moveLabel: "Start cleaning",
    movedVerb: "moved to Cleaning",
  },
};

const countSeats = (seatStatus) =>
  Array.isArray(seatStatus)
    ? seatStatus.reduce((sum, table) => sum + (table.seat_ids?.length || 0), 0)
    : 0;

const getTableIds = (seatStatus) =>
  Array.isArray(seatStatus)
    ? [...new Set(seatStatus.map((table) => table.table_id).filter(Boolean))]
    : [];

// Table codes (e.g. "SACT0001"); older rows without a code fall back to T<n>.
const getTableLabels = (seatStatus) =>
  Array.isArray(seatStatus)
    ? [
        ...new Set(
          seatStatus
            .map(
              (table) =>
                table.table_code ||
                (table.table_number != null ? `T${table.table_number}` : null) ||
                (table.table_id != null ? `#${table.table_id}` : null),
            )
            .filter(Boolean),
        ),
      ]
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
  { value: "table", label: "Table code", placeholder: "e.g. SACT0001" },
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
    table: [...getTableLabels(row.seat_status), ...getTableIds(row.seat_status)],
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
  // { kind: "server" | "cleaner", reservation, status } while picking staff.
  const [staffRequest, setStaffRequest] = useState(null);
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

  // Moving to Confirmed / Cleaning (or changing the person) saves the status
  // and the server / cleaner together.
  const assignStaff = async (person) => {
    const { kind, reservation, status } = staffRequest;
    const { config, movedVerb } = STAFF[kind];
    const name = person[config.nameField];
    setStaffRequest(null);
    const previous = {
      dining_status: reservation.dining_status,
      [config.orderField]: reservation[config.orderField] ?? null,
      [config.orderRelation]: reservation[config.orderRelation] ?? null,
    };
    const patch = (values) =>
      setReservations((current) =>
        current.map((row) => (row.id === reservation.id ? { ...row, ...values } : row)),
      );
    patch({
      dining_status: status,
      [config.orderField]: person.id,
      [config.orderRelation]: person,
    });
    try {
      const response = await updateDiningStatus(reservation.id, {
        dining_status: status,
        [config.orderField]: person.id,
      });
      if (!response.success) throw response.message;
      showToast({
        message:
          status === reservation.dining_status
            ? `${name} assigned to booking #${reservation.id}`
            : `Booking #${reservation.id} ${movedVerb} · ${name}`,
        variant: "success",
      });
    } catch (error) {
      patch(previous);
      showToast({
        title: `Couldn't assign ${name} to booking #${reservation.id}`,
        message: error?.response?.data?.message || error,
        variant: "danger",
      });
    }
  };

  const handleMove = (reservation, column) => {
    if (ARRIVAL_STATUSES.includes(column.id) && reservation.dining_date) {
      const bookedFor = dayjs(reservation.dining_date);
      const openFrom = bookedFor.subtract(EARLY_ARRIVAL_MINUTES, "minute");
      if (dayjs().isBefore(openFrom)) {
        showToast({
          title: `Booking #${reservation.id} isn't due yet`,
          message: `It is for ${bookedFor.format("D MMM YYYY, h:mm A")}. It can move to ${column.name} from ${openFrom.format("D MMM, h:mm A")}.`,
          variant: "warning",
        });
        return;
      }
    }
    if (column.id === STATUS.CANCELLED) {
      setPendingCancel(reservation);
      return;
    }
    if (column.id === STATUS.CONFIRMED) {
      setStaffRequest({ kind: "server", reservation, status: STATUS.CONFIRMED });
      return;
    }
    if (column.id === STATUS.CLEANING) {
      setStaffRequest({ kind: "cleaner", reservation, status: STATUS.CLEANING });
      return;
    }
    changeStatus(reservation, column.id);
  };

  // Server / cleaner on a card, with Add / Change only in the columns where
  // that person can still be changed.
  const renderStaff = (row, kind) => {
    const { config, editableIn } = STAFF[kind];
    const person = row[config.orderRelation];
    const editable = editableIn.includes(row.dining_status);
    const ask = () => setStaffRequest({ kind, reservation: row, status: row.dining_status });

    if (!person) {
      return editable ? (
        <button
          type="button"
          data-no-drag
          className="kanban-card__cook-assign"
          onClick={ask}
        >
          + Add {config.singular.toLowerCase()}
        </button>
      ) : null;
    }

    return (
      <div className={`kanban-card__cook kanban-card__cook--${kind}`}>
        <StaffAvatar
          name={person[config.nameField]}
          photo={person.photo_url}
          size={26}
          tone={kind}
        />
        <span>
          <strong>{person[config.nameField]}</strong>
          <small>
            {config.singular}
            {person[config.detailField] ? ` · ${person[config.detailField]}` : ""}
          </small>
        </span>
        {editable && (
          <button
            type="button"
            data-no-drag
            className="kanban-card__cook-change"
            onClick={ask}
          >
            Change
          </button>
        )}
      </div>
    );
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
              state: {
                hotel_id: row.hotel_id,
                from: { label: "Reservations", path: "/booked-table" },
              },
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
            const labels = getTableLabels(row.seat_status);
            if (!labels.length) return "No table";
            return labels.join(", ");
          })()}
        </span>
        <span>
          <EventSeatOutlined sx={{ fontSize: 16, color: "#06b6d4" }} />
          {countSeats(row.seat_status)} Seats
        </span>
      </div>
      {renderStaff(row, "server")}
      {renderStaff(row, "cleaner")}
    </Fragment>
  );

  return (
    <Fragment>
      <section className="ui-page kanban-page">
        <header className="ui-header">
          <div>
            <span className="ui-kicker">Front desk</span>
            <h1>Reservations</h1>
            <p>Drag a booking to a new column to update its status.</p>
          </div>
          <div className="ui-header__actions">
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={fetchReservations}
              disabled={loading}
            >
              <RefreshRounded fontSize="small" /> Refresh
            </button>
          </div>
        </header>

        <div className="ui-toolbar" role="search">
          <label className="ui-search">
            <SearchRounded fontSize="small" aria-hidden />
            <select
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              aria-label="Search in"
            >
              {SEARCH_FIELDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={activeSearchField?.placeholder}
              aria-label={`Search by ${activeSearchField?.label}`}
            />
          </label>
          <span className="ui-toolbar__count">
            {searchQuery
              ? `${visibleReservations.length} of ${reservations.length} reservations`
              : `${reservations.length} reservations`}
            {searchQuery && (
              <button type="button" onClick={() => setSearchText("")}>
                Clear
              </button>
            )}
          </span>
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

      <AssignStaffDialog
        config={STAFF[staffRequest?.kind || "server"].config}
        order={staffRequest?.reservation}
        question={STAFF[staffRequest?.kind || "server"].question}
        confirmLabel={
          staffRequest &&
          staffRequest.status !== staffRequest.reservation.dining_status
            ? STAFF[staffRequest.kind].moveLabel
            : `Assign ${staffRequest?.kind || "server"}`
        }
        onAssign={assignStaff}
        onCancel={() => setStaffRequest(null)}
      />

      <ConfirmDialog
        show={Boolean(pendingCancel)}
        tone="warning"
        title={`Cancel reservation #${pendingCancel?.id}?`}
        message="Its seats will be released for new bookings."
        confirmLabel="Cancel reservation"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </Fragment>
  );
};

export default ReservationBoard;
