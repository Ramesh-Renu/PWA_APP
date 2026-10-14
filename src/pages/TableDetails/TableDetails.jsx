import React, { useState, useEffect, Fragment, useMemo } from "react";
import {
  AddRounded,
  CheckRounded,
  DeleteOutlineRounded,
  EventSeatOutlined,
  RemoveRounded,
  TableRestaurantOutlined,
} from "@mui/icons-material";
import {
  createTable,
  deleteTable,
  getTablebyid,
  addSeatInTable,
  deleteSeatInTable,
  createReservation,
  createOrder,
  updateReservation,
  getAllMenu,
} from "services";
import useToast from "hooks/useToast";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import useAuth from "hooks/useAuth";
import dayjs from "dayjs";
import { useGlobalContext } from "store/context/GlobalProvider";
import useGlobalMaster from "hooks/useGlobalMaster";
import MenuOrderPopup from "pages/MenuOrderPopup/MenuOrderPopup";

// Used when the seat status master has no row/colour for a status
// (matches SEAT_STATUS in the API: utils/seatStatus.js).
// Guest mode: a table may have at most this many spare seats for the party
// (unless no closer table exists).
const GUEST_SLACK = 1;

const SEAT_FALLBACK = {
  1: { name: "Booked", color: "#f43f5e" },
  2: { name: "Cancelled", color: "#94a3b8" },
  3: { name: "Cleaning", color: "#f59e0b" },
  4: { name: "Available", color: "#16a34a" },
  5: { name: "Seated", color: "#8b5cf6" },
  unknown: { name: "Unavailable", color: "#94a3b8" },
};

// "SACT0001" when the table has a code, otherwise the legacy "Table 1".
const tableLabel = (table) =>
  table?.table_code || `Table ${table?.table_number}`;

// slot (booking mode): { date: "YYYY-MM-DD", time: "HH:mm", guests } from
// SlotPicker; seats are shown and booked for that slot.
// onFloorFreeSeats(n): told the free seats of the floor on show (booking
// mode), so the Guests picker can offer up to that many.
// guest (optional): { name, mobile } when staff book for a phone / walk-in guest.
const TableDetails = ({ data, onChange, isEditable, isBooking, slot, onFloorFreeSeats, guest }) => {
  const slotActive = Boolean(isBooking && slot?.date && slot?.time);
  const [{ data: auth }, { setAuth }] = useAuth();
  const { reservationData, dispatch } = useGlobalContext();
  const { seatsStatusList, getSeatsStatusMatsers } = useGlobalMaster();
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [floorsState, setFloorsState] = useState([]);
  const [getloading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [showDeleteSeats, setshowDeleteSeats] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [showCancelBookingSeats, setShowCancelBookingSeats] = useState(false);
  const [cancelBookingSeats, setCancelBookingSeats] = useState(null);
  const [seletedSeatId, setSeletedSeatId] = useState(null);
  const [seletedTableId, setSeletedTableId] = useState(null);
  const [enbaleBoooking, setEnbaleBoooking] = useState(false);
  const [seletedSeatCount, setSeletedSeatCount] = useState(null);
  const [seletedTableCount, setSeletedTableCount] = useState(null);
  const [openAdminPopupTableId, setOpenAdminPopupTableId] = useState(null);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    hotel_id: "",
    category_id: "",
  });
  const [menus, setMenus] = useState([]);

  // Update filters when hotelId prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      hotel_id: data.id || "",
    }));
  }, [data]);

  // Refreshes only the floor plan (shown as an overlay on that section).
  const fetchHotelbyId = async (hotelData) => {
    setRefreshing(true);
    try {
      const response = await getTablebyid({
        hotel_id: hotelData.id,
        ...(slotActive ? { date: slot.date, time: slot.time } : {}),
      });
      // Optionally, refresh the hotel list or provide user feedback here
      if (response) {
        setFloorsState(response.data[0].floors);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (seatsStatusList === undefined || seatsStatusList?.data?.length === 0) {
      getSeatsStatusMatsers();
    }
  }, []);

  // Reload when the booking slot changes (availability differs per slot).
  useEffect(() => {
    fetchHotelbyId(data);
  }, [slot?.date, slot?.time]);

  useEffect(() => {
    loadMenus();
  }, [filters]);

  const loadMenus = async () => {
    // Wait for the hotel id: without it the API returns every hotel's menu,
    // and that reply could land after the hotel's own and replace it.
    if (!filters.hotel_id) return;
    try {
      setLoading(true);

      const res = await getAllMenu({ ...filters, limit: 500 }); // API default is 10
      setMenus(res.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Only empty tables can be removed from the layout (see the head button).
  const fetchDeleteTable = async (table) => {
    setTableToDelete(null);
    setLoading(true);
    try {
      const response = await deleteTable({ table_id: table.table_id });
      showToast({
        message: response?.message || `${tableLabel(table)} removed`,
        variant: "success",
      });
      fetchHotelbyId(data);
    } catch (error) {
      showToast({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to remove table",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCreateTable = async (hotelData) => {
    const body = {
      tableCount: 1,
    };
    const floorToShow = floors[selectedFloorIndex] || floors[0];
    setLoading(true);
    try {
      const response = await createTable(
        body,
        hotelData.id,
        floorToShow.floor_id,
      );
      // Optionally, refresh the hotel list or provide user feedback here
      showToast({
        message: response.message || "Table created successfully",
        variant: "success",
      });
      if (response.success) {
        fetchHotelbyId(hotelData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const floors = floorsState;
  const floorToShow = floors[selectedFloorIndex] || floors[0];

  const updateFloors = (updater) => {
    setFloorsState((prev) => {
      const next = updater(prev);
      if (typeof onChange === "function") onChange(next);
      return next;
    });
  };

  const fetchAddSeatsInTable = async (tableData) => {
    const newSeatCount =
      floorToShow.tables
        ?.find((t) => t.table_id === tableData.table_id)
        ?.seats?.filter((seat) => seat.is_new === true).length || 0;
    const body = {
      seatCount: newSeatCount,
    };
    setLoading(true);
    try {
      const response = await addSeatInTable(body, tableData.table_id);
      // Optionally, refresh the hotel list or provide user feedback here
      showToast({
        message: response.message || "Table created successfully",
        variant: "success",
      });
      if (response.success) {
        fetchHotelbyId(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeleteSeatsInTable = async (tableData, seatData) => {
    const body = {
      seatIds: [seatData.seat_id],
    };
    setshowDeleteSeats(false);
    setLoading(true);
    try {
      const response = await deleteSeatInTable(body, tableData.table_id);
      // Optionally, refresh the hotel list or provide user feedback here
      if (response.success) {
        fetchHotelbyId(data);
        setLoading(false);
        showToast({
          message: response.message || "Table created successfully",
          variant: "success",
        });
      } else {
        showToast({
          message: response.message || "Can't remove seat",
          variant: "danger",
        });
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeat = (floorIndex, table) => {
    const floorToShow = floors[floorIndex] || floors[0];
    updateFloors((prev) => {
      const next = prev.map((f) => {
        if (f.floor_id !== floorToShow.floor_id) return f;
        const newTables = f.tables.map((t) => {
          if (t.table_id !== table.table_id) return t;
          const seats = t.seats || [];
          const nextId =
            seats.length > 0
              ? seats[seats.length - 1].seat_id + 1
              : seats.length + 1;
          console.log("nextId", nextId);

          return {
            ...t,
            seats: [
              ...seats,
              {
                seat_id: nextId,
                seat_number: seats.length + 1,
                is_booked: false,
                is_new: true,
              },
            ],
          };
        });
        return { ...f, tables: newTables };
      });
      return next;
    });
  };

  const handleRemoveSeat = (floorIndex, table) => {
    const floorToShow = floors[floorIndex] || floors[0];

    updateFloors((prev) =>
      prev.map((f) => {
        if (f.floor_id !== floorToShow.floor_id) return f;

        const newTables = f.tables.map((t) => {
          if (t.table_id !== table.table_id) return t;

          const seats = t.seats || [];

          // 🔴 find last NEW seat
          const lastNewSeatIndex = [...seats]
            .map((s, i) => ({ ...s, i }))
            .filter((s) => s.is_new)
            .pop()?.i;

          // ❌ no new seat → do nothing
          if (lastNewSeatIndex === undefined) return t;

          return {
            ...t,
            seats: seats.filter((_, i) => i !== lastNewSeatIndex),
          };
        });

        return { ...f, tables: newTables };
      }),
    );
  };

  const handleRemoveThisSeat = (table, seatId) => {
    if (seatId.is_new) return;
    setSeletedSeatId(seatId);
    setSeletedTableId(table);
    setshowDeleteSeats(true);
  };

  const createBookingTableinSeats = async (hotelData) => {
    const floorToShow = floors[selectedFloorIndex] || floors[0];
    const bookingSeatsByTable = floorToShow?.tables
      .map((table) => {
        const seatIds = table.seats
          .filter((seat) => seat.is_booking === true)
          .map((seat) => seat.seat_id);

        return seatIds.length > 0
          ? { table_id: table.table_id, seat_ids: seatIds }
          : null;
      })
      .filter(Boolean);
    const now = dayjs();

    const param = {
      hotel_id: hotelData.id,
      floor_id: floorToShow.floor_id,
      seat_status: bookingSeatsByTable,
      customer_name: guest?.name || auth?.details?.name,
      customer_mobile: guest ? guest.mobile || null : auth?.details?.mobilenumber,
      // The chosen slot, or "now" when booking without the slot picker.
      dining_date: slotActive ? slot.date : now.format("YYYY-MM-DD"),
      reservation_time: slotActive ? slot.time : now.format("HH:mm"),
      guest_count: slot?.guests || null,
    };
    setLoading(true);
    try {
      const response = await createReservation(param);
      if (response.success) {
        const rid =
          response?.data?.id ||
          response?.data?.reservation_id ||
          response?.id ||
          response?.reservation_id;
        const bookedAt = dayjs(`${param.dining_date}T${param.reservation_time}`);
        const seatsText = `${seletedSeatCount || ""} ${seletedSeatCount === 1 ? "seat" : "seats"}`;
        showToast({
          title: rid ? `Booking #${rid} confirmed` : "Booking confirmed",
          // Users get the arrival rules with real clock times; admins a short summary.
          message: isAdminView
            ? `${guest?.name ? `For ${guest.name} · ` : ""}${bookedAt.format("ddd, D MMM [at] h:mm A")} · ${seatsText}`
            : `Your reservation (${seatsText}) is confirmed for ${bookedAt.format("ddd, D MMM [at] h:mm A")}. ` +
              `Please arrive between ${bookedAt.subtract(5, "minute").format("h:mm A")} and ${bookedAt.format("h:mm A")}. ` +
              `A 15-minute grace period is allowed; if you haven't arrived by ${bookedAt.add(15, "minute").format("h:mm A")}, ` +
              `your reservation will be automatically cancelled.`,
          variant: "success",
          // Long enough to read the arrival rules.
          showTime: isAdminView ? undefined : 12000,
        });
        fetchHotelbyId(hotelData);
        if (rid) setReservationId(rid);
        setShowMenuPopup(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
      // Seats taken meanwhile: reload the plan so they show as booked.
      if (error?.response?.status === 409) fetchHotelbyId(hotelData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookingSeat = (floorIndex, table, seats) => {
    const floorToShow = floors[floorIndex] || floors[0];
    console.log("chek");

    updateFloors((prev) =>
      prev.map((f) => {
        if (f.floor_id !== floorToShow.floor_id) return f;

        // STEP 1: find the clicked table and preview what seats would be
        const targetTable = f.tables.find((t) => t.table_id === table.table_id);

        const previewSeats = targetTable.seats.map((s) =>
          s.seat_id === seats.seat_id ? { ...s, is_booking: !s.is_booking } : s,
        );

        const bookingCount = previewSeats.filter((s) => s.is_booking).length;
        const fullCount = previewSeats.length;

        // RULE → If all / none booked = no lock; else lock
        const setNotAccess =
          bookingCount === 0 || bookingCount === fullCount ? false : true;

        // STEP 2: update floors
        return {
          ...f,
          tables: f.tables.map((t) => {
            // CURRENT TABLE (clicked)
            if (t.table_id === table.table_id) {
              return {
                ...t,
                seats: t.seats.map((s) =>
                  s.seat_id === seats.seat_id
                    ? {
                        ...s,
                        is_booking: !s.is_booking,
                        notAccess: false,
                      }
                    : { ...s, notAccess: false },
                ),
              };
            }

            // OTHER TABLES
            return {
              ...t,
              seats: t.seats.map((s) =>
                s.is_booking ? s : { ...s, notAccess: setNotAccess },
              ),
            };
          }),
        };
      }),
    );
  };

  const handleSelectAllTable = (floorIndex, table) => {
    const floorToShow = floors[floorIndex] || floors[0];

    updateFloors((prev) =>
      prev.map((f) => {
        if (f.floor_id !== floorToShow.floor_id) return f;

        const targetTable = f.tables.find((t) => t.table_id === table.table_id);
        // Determine eligible seats based on role
        const eligibleSeatIds =
          (targetTable.seats || [])
            .filter((s) =>
              isEditable === true ||
              auth?.details?.role === "Admin" ||
              auth?.details?.is_admin
                ? s.status === 4 || s.status === 1
                : s.status === 4 ||
                  (s.status === 1 && s.user_id === auth?.details?.id),
            )
            .map((s) => s.seat_id) || [];

        if (eligibleSeatIds.length === 0) return f;

        const anyEligibleSelected = (targetTable.seats || []).some(
          (s) => eligibleSeatIds.includes(s.seat_id) && s.is_booking === true,
        );
        const newSelectedState = !anyEligibleSelected;
        // Determine clicked table booking state (booked vs non-booked)
        const clickedTableBooked = (targetTable.seats || []).some(
          (s) => s.status === 1,
        );

        // Build new tables: toggle only clicked table's eligible seats; set notAccess on other tables
        const newTables = f.tables.map((t) => {
          if (t.table_id === table.table_id) {
            return {
              ...t,
              seats: t.seats.map((s) =>
                eligibleSeatIds.includes(s.seat_id)
                  ? { ...s, is_booking: newSelectedState, notAccess: false }
                  : { ...s },
              ),
            };
          }

          // For other tables, compute their booking state
          const otherBooked = (t.seats || []).some((s) => s.status === 1);

          // If selecting (newSelectedState === true), lock tables that have different booking state
          // If deselecting, unlock other tables
          const setNotAccessForOthers = newSelectedState
            ? otherBooked !== clickedTableBooked
            : false;

          return {
            ...t,
            seats: t.seats.map((s) => ({
              ...s,
              notAccess: setNotAccessForOthers,
            })),
          };
        });

        return { ...f, tables: newTables };
      }),
    );
  };

  const handleAdminTableAction = (action, table) => {
    // Minimal handlers - replace with real implementations as needed
    if (action === "seated") {
      showToast({
        message: `Marked ${tableLabel(table)} as Seated`,
        variant: "success",
      });
    } else if (action === "cleaning") {
      showToast({
        message: `Marked ${tableLabel(table)} for Cleaning`,
        variant: "info",
      });
    } else if (action === "completed") {
      showToast({
        message: `Marked ${tableLabel(table)} as Completed`,
        variant: "success",
      });
    } else if (action === "cancel") {
      showToast({
        message: `Cancel Order requested for ${tableLabel(table)}`,
        variant: "warning",
      });
    }
    setOpenAdminPopupTableId(null);
  };

  const updateBookingTableinSeats = async (hotelData) => {
    const getCurretnTime = new Date();
    const seatsToCancel = cancelBookingSeats?.seat_ids;
    setShowCancelBookingSeats(false);
    setLoading(true);
    try {
      if (Array.isArray(seatsToCancel)) {
        // group seats by reservation_id and call updateReservation per reservation
        const groups = seatsToCancel.reduce((acc, s) => {
          const rid = s.reservation_id;
          if (!acc[rid]) acc[rid] = [];
          acc[rid].push(s);
          return acc;
        }, {});

        const results = await Promise.all(
          Object.keys(groups).map(async (reservationId) => {
            const groupSeats = groups[reservationId];
            const cancelSeats = groupSeats.map((s) => ({
              table_id: cancelBookingSeats.table_id,
              seat_ids: [s.seat_id],
            }));
            const body = {
              cancel_seats: cancelSeats,
              cancel_date: dayjs(getCurretnTime).format("YYYY-MM-DD"),
              cancel_time: dayjs(getCurretnTime).format("HH:mm"),
            };
            return updateReservation(reservationId, body);
          }),
        );

        const anySuccess = results.some((r) => r && r.success);
        if (anySuccess) {
          showToast({
            message: "Booked seats cancelled successfully",
            variant: "success",
          });
          fetchHotelbyId(hotelData);
        }
      } else {
        const reservationId = seatsToCancel?.reservation_id;
        const cancelSeats = [
          {
            table_id: cancelBookingSeats.table_id,
            seat_ids: [seatsToCancel.seat_id],
          },
        ];
        const body = {
          cancel_seats: cancelSeats,
          cancel_date: dayjs(getCurretnTime).format("YYYY-MM-DD"),
          cancel_time: dayjs(getCurretnTime).format("HH:mm"),
        };
        const response = await updateReservation(reservationId, body);
        if (response.success) {
          showToast({
            message: response.message || "Booked seats cancelled successfully",
            variant: "success",
          });
          fetchHotelbyId(hotelData);
        }
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelThisSeat = (table, seats) => {
    setShowCancelBookingSeats(!showCancelBookingSeats);
    setCancelBookingSeats({
      table_id: table.table_id,
      seat_ids: seats,
    });
  };

  useEffect(() => {
    const floorToShow = floors[selectedFloorIndex] || floors[0];
    const hasNewSeats = floorToShow?.tables?.some((table) =>
      table.seats?.some((seat) => seat.is_booking === true),
    );

    setEnbaleBoooking(hasNewSeats);
    const bookingSeatsByTable = floorToShow?.tables
      .map((table) => {
        const seatIds = table.seats
          .filter((seat) => seat.is_booking === true)
          .map((seat) => seat.seat_id);

        return seatIds.length > 0
          ? {
              table_id: table.table_id,
              table_number: table.table_number,
              table_code: table.table_code,
              seat_ids: seatIds,
            }
          : null;
      })
      .filter(Boolean);

    const totalBookingSeats = bookingSeatsByTable?.reduce(
      (total, table) => total + table.seat_ids.length,
      0,
    );
    setSeletedSeatCount(totalBookingSeats);
    setSeletedTableCount(bookingSeatsByTable?.length);
  }, [floorToShow, floorsState, floors, selectedFloorIndex]);

  const handlePlaceOrder = async (items) => {
    if (!reservationId) {
      showToast({
        message: "No reservation found to place order",
        variant: "danger",
      });
      return;
    }

    const paramData = {
      reservation_id: reservationId,
      hotel_id: data.id,
      items,
      notes: "Serve hot",
    };

    try {
      setLoading(true);
      const response = await createOrder(paramData);
      if (response && (response.success || response.status)) {
        showToast({
          message: response.message || "Order placed successfully",
          variant: "success",
        });
        // refresh details
        fetchHotelbyId(data);
        setShowMenuPopup(false);
      } else {
        showToast({
          message: response?.message || "Failed to place order",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error("placeOrder error", err);
      showToast({
        message: err?.message || "Failed to place order",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };


  /* ------------------------------------------------------------------
   * Presentation helpers (layout only — booking logic lives above)
   * ------------------------------------------------------------------ */
  const isAdminView =
    isEditable === true ||
    auth?.details?.role === "Admin" ||
    Boolean(auth?.details?.is_admin);

  const seatMeta = (statusId) => {
    const master = seatsStatusList?.data?.find(
      (status) => status.status_id === statusId,
    );
    const fallback = SEAT_FALLBACK[statusId] || SEAT_FALLBACK.unknown;
    const color =
      master?.color_code && master.color_code !== "#000000"
        ? master.color_code
        : fallback.color;
    return { name: master?.name || fallback.name, color };
  };

  const getEligibleSeats = (table) =>
    table.seats?.filter((s) =>
      isAdminView
        ? s.status === 4 || s.status === 1
        : s.status === 4 || (s.status === 1 && s.user_id === auth?.details?.id),
    ) || [];

  /* ------------------------------------------------------------------
   * Guest mode (anyone booking a slot for N guests): the party is
   * seated at one table that fits — enough free seats, but not a much
   * bigger table. A table with only some seats free (e.g. 2 of 4) is fine
   * when the party fits them. People pick a table, not seats.
   * ------------------------------------------------------------------ */
  const guests = Number(slot?.guests) || 0;
  // Users book by party size; admins can pick any free seat or table.
  const guestMode = slotActive && guests > 0 && !isAdminView;
  // Admins with a guest count pick up to that many seats (any table);
  // with no guest count they pick freely.
  const adminSeatCap = isAdminView && !isEditable && slotActive && guests > 0 ? guests : null;
  const selectedOnFloor = () =>
    (floorToShow?.tables || [])
      .flatMap((table) => table.seats || [])
      .filter((seat) => seat.is_booking).length;
  const warnSeatCap = () =>
    showToast({
      message: `${guests} ${guests === 1 ? "seat" : "seats"} already selected for ${guests} ${
        guests === 1 ? "guest" : "guests"
      }. Unselect a seat or change the guest count.`,
      variant: "warning",
    });
  const freeSeatsOf = (table) =>
    (table.seats || []).filter((seat) => seat.status === 4 && !seat.is_new);

  // Per floor: "single" (one table; free seats between guests and
  // maxFree) or "combine" (no table is big enough: join tables).
  const guestPlan = useMemo(() => {
    if (!guestMode) return null;
    const tables = floorToShow?.tables || [];
    const fits = tables.map((table) => freeSeatsOf(table).length).filter((n) => n >= guests);
    if (!fits.length) return { mode: "combine" };
    // Up to one spare seat; if no table is that close, the smallest that fits.
    return { mode: "single", maxFree: Math.max(Math.min(...fits), guests + GUEST_SLACK) };
  }, [guestMode, floorToShow, guests]);

  // Other floors with a table for this party (hint when this floor has none).
  const floorsWithFit = useMemo(() => {
    if (!guestMode) return [];
    return floors
      .map((floor, index) => ({ floor, index }))
      .filter(
        ({ floor, index }) =>
          index !== selectedFloorIndex &&
          (floor.tables || []).some((table) => freeSeatsOf(table).length >= guests),
      );
  }, [guestMode, floors, guests, selectedFloorIndex]);

  const tableFit = (table) => {
    if (!guestPlan) return { ok: true };
    const free = freeSeatsOf(table).length;
    if (free === 0) return { ok: false, reason: "Full" };
    if (guestPlan.mode === "combine") return { ok: true };
    if (free < guests) {
      return { ok: false, reason: `Only ${free} free — not enough for ${guests}` };
    }
    if (free > guestPlan.maxFree) {
      return { ok: false, reason: `${free} seats — too big for ${guests}` };
    }
    return { ok: true };
  };

  // Choose a table for the party: its first free seats, one per guest.
  // Picking it again clears it. "combine" mode adds tables until everyone
  // has a seat.
  const pickTableForGuests = (table) => {
    if (!tableFit(table).ok) return;
    updateFloors((prev) => {
      const selectedNow = prev
        .flatMap((floor) => floor.tables || [])
        .flatMap((t) => t.seats || [])
        .filter((seat) => seat.is_booking).length;
      const thisSelected = (table.seats || []).some((seat) => seat.is_booking);
      const combine = guestPlan?.mode === "combine";
      const needed = combine ? guests - selectedNow : guests;
      if (!thisSelected && combine && needed <= 0) return prev;

      const takeIds = thisSelected
        ? new Set()
        : new Set(
            freeSeatsOf(table)
              .sort((a, b) => Number(a.seat_number) - Number(b.seat_number))
              .slice(0, needed)
              .map((seat) => seat.seat_id),
          );

      return prev.map((floor) => ({
        ...floor,
        tables: (floor.tables || []).map((t) => {
          const isThis = t.table_id === table.table_id;
          // One table per party (unless combining): others are cleared.
          if (!isThis && combine) return t;
          return {
            ...t,
            seats: (t.seats || []).map((seat) => ({
              ...seat,
              is_booking: isThis ? takeIds.has(seat.seat_id) : false,
              notAccess: false,
            })),
          };
        }),
      }));
    });
  };

  // A new party size makes the old selection meaningless.
  useEffect(() => {
    if (guestMode) clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests]);

  const floorStats = useMemo(
    () =>
      floors.map((floor) => {
        const seats = (floor.tables || []).flatMap((table) => table.seats || []);
        return {
          total: seats.length,
          free: seats.filter((seat) => seat.status === 4).length,
        };
      }),
    [floors],
  );

  // Booking: tell the page how many seats are free on this floor at the
  // chosen time (the Guests picker offers up to that many).
  useEffect(() => {
    if (!slotActive || !onFloorFreeSeats) return;
    const stats = floorStats[selectedFloorIndex];
    onFloorFreeSeats(floors.length ? stats?.free ?? 0 : null);
  }, [slotActive, floorStats, selectedFloorIndex, floors.length, onFloorFreeSeats]);

  const selectedTables = useMemo(
    () =>
      (floorToShow?.tables || [])
        .map((table) => ({
          table_number: table.table_number,
          table_code: table.table_code,
          count: (table.seats || []).filter((seat) => seat.is_booking).length,
        }))
        .filter((table) => table.count > 0),
    [floorToShow],
  );

  const clearSelection = () => {
    updateFloors((prev) =>
      prev.map((floor) => ({
        ...floor,
        tables: (floor.tables || []).map((table) => ({
          ...table,
          seats: (table.seats || []).map((seat) => ({
            ...seat,
            is_booking: false,
            notAccess: false,
          })),
        })),
      })),
    );
    setOpenAdminPopupTableId(null);
  };

  // Close the admin table menu when clicking anywhere outside it.
  useEffect(() => {
    if (openAdminPopupTableId == null) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest(".fp-table__select-wrap")) {
        setOpenAdminPopupTableId(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [openAdminPopupTableId]);

  const handleSeatClick = (table, chair) => {
    // Guest mode: tapping a free seat chooses its table for the party.
    if (guestMode && chair.status === 4) {
      pickTableForGuests(table);
      return;
    }
    if (isEditable) {
      handleRemoveThisSeat(table, chair);
    } else if (chair.status === 1 && chair.user_id === auth?.details?.id) {
      handleCancelThisSeat(table, chair);
    } else if (isBooking && chair.status === 4) {
      if (adminSeatCap && !chair.is_booking && selectedOnFloor() >= adminSeatCap) {
        warnSeatCap();
        return;
      }
      handleAddBookingSeat(selectedFloorIndex, table, chair);
    }
  };

  const handleTableSelectClick = (table, eligibleSeats) => {
    const hasBookedSeats = table.seats?.some((s) => s.status === 1);
    const userBookedSeats = table.seats?.filter(
      (s) => s.status === 1 && s.user_id === auth?.details?.id,
    );
    const willSelect = !eligibleSeats.some((s) => s.is_booking === true);

    // A non-admin selecting a table that holds their own booking is asked to
    // cancel that booking instead of toggling the selection.
    if (!isAdminView && willSelect && userBookedSeats?.length > 0) {
      setCancelBookingSeats({
        table_id: table.table_id,
        seat_ids: userBookedSeats,
      });
      setShowCancelBookingSeats(true);
      return;
    }

    // Admin with a guest count: fill only the seats still needed.
    if (adminSeatCap && willSelect && !hasBookedSeats) {
      const remaining = adminSeatCap - selectedOnFloor();
      if (remaining <= 0) {
        warnSeatCap();
        return;
      }
      const freeSeats = eligibleSeats.filter((s) => s.status === 4 && !s.is_booking);
      if (freeSeats.length > remaining) {
        freeSeats
          .slice(0, remaining)
          .forEach((seat) => handleAddBookingSeat(selectedFloorIndex, table, seat));
        return;
      }
    }

    handleSelectAllTable(selectedFloorIndex, table);
    setOpenAdminPopupTableId(
      isAdminView && hasBookedSeats && willSelect ? table.table_id : null,
    );
  };

  const renderSeat = (table, chair) => {
    const isMine = chair.status === 1 && chair.user_id === auth?.details?.id;
    // Guest mode: only free seats of a table that fits the party.
    const canAccessEdit = guestMode
      ? isMine || (chair.status === 4 && tableFit(table).ok)
      : isAdminView || isMine || chair.status === 4;
    const meta = seatMeta(chair.status);
    const state = chair.is_new
      ? "new"
      : chair.is_booking
        ? "selected"
        : chair.status === 4
          ? "available"
          : "taken";
    const label = chair.is_new
      ? "New seat (not saved yet)"
      : chair.is_booking
        ? "Selected"
        : isMine
          ? `${meta.name} by you — click to cancel`
          : meta.name;

    return (
      <button
        key={chair.seat_id}
        type="button"
        className={`fp-seat fp-seat--${state}${isMine ? " is-mine" : ""}`}
        style={{ "--seat-color": meta.color }}
        title={`Seat ${chair.seat_number} · ${label}`}
        aria-label={`Seat ${chair.seat_number}, ${label}`}
        aria-pressed={Boolean(chair.is_booking)}
        disabled={!canAccessEdit}
        onClick={() => handleSeatClick(table, chair)}
      >
        {chair.seat_number}
      </button>
    );
  };

  const legendItems = [
    { key: "available", label: seatMeta(4).name, color: seatMeta(4).color, variant: "available" },
    ...(isBooking ? [{ key: "selected", label: "Selected", variant: "selected" }] : []),
    { key: "booked", label: seatMeta(1).name, color: seatMeta(1).color, variant: "taken" },
    { key: "seated", label: seatMeta(5).name, color: seatMeta(5).color, variant: "taken" },
    { key: "cleaning", label: seatMeta(3).name, color: seatMeta(3).color, variant: "taken" },
  ];

  // In slot mode each guest needs a seat.
  const fewSeats =
    slotActive && Number(slot.guests) > 0 && Number(seletedSeatCount || 0) < Number(slot.guests);

  const modeHint = isEditable
    ? "Edit mode — add seats to a table, or click a saved seat to remove it."
    : guestMode
      ? guestPlan?.mode === "combine"
        ? `No single table seats ${guests} — choose tables one by one until everyone has a seat.`
        : `Showing tables that fit ${guests} ${guests === 1 ? "guest" : "guests"}. Choose a table; we seat you together.`
      : adminSeatCap
        ? `Choose ${guests} ${guests === 1 ? "seat" : "seats"} for ${guests} ${guests === 1 ? "guest" : "guests"} — any free seats, any table.`
      : isBooking
        ? "Tap seats, or use Select to book a whole table."
        : "View only — open this hotel from Book Table to reserve seats.";

  return (
    <Fragment>
      <section
        className={`fp-card${refreshing ? " is-refreshing" : ""}`}
        aria-label="Floor plan"
        aria-busy={refreshing}
      >
        {refreshing && (
          <span className="fp-card__refreshing" role="status">
            Updating tables…
          </span>
        )}
        {/* Floors + legend stay pinned under the top nav while scrolling. */}
        <div className="fp-sticky">
          <div className="fp-toolbar">
            <div className="fp-floors" role="tablist" aria-label="Floors">
              {floors.map((floor, index) => (
                <button
                  key={floor.floor_id || index}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedFloorIndex}
                  className={`fp-floor${index === selectedFloorIndex ? " is-active" : ""}`}
                  onClick={() => setSelectedFloorIndex(index)}
                >
                  <span className="fp-floor__name">
                    Floor {floor.floor_number ?? index + 1}
                  </span>
                  <span className="fp-floor__meta">
                    {floorStats[index]?.free ?? 0}/{floorStats[index]?.total ?? 0} free
                  </span>
                </button>
              ))}
            </div>

            {isEditable && (
              <button
                type="button"
                className="fp-btn fp-btn--primary"
                onClick={() => fetchCreateTable(data)}
                disabled={getloading || !floorToShow}
              >
                <AddRounded fontSize="small" /> Add table
              </button>
            )}
          </div>

          <div className="fp-subbar">
            <ul className="fp-legend" aria-label="Seat colours">
              {legendItems.map((item) => (
                <li key={item.key}>
                  <span
                    className={`fp-seat fp-legend__swatch fp-seat--${item.variant}`}
                    style={item.color ? { "--seat-color": item.color } : undefined}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
            <p className="fp-hint">{modeHint}</p>
          </div>
        </div>

        {/* Guest mode: nothing on this floor fits — point to floors that do. */}
        {guestMode &&
          floorToShow &&
          (floorToShow.tables || []).length > 0 &&
          !(floorToShow.tables || []).some((table) => tableFit(table).ok) && (
            <div className="fp-guest-note" role="status">
              <span>
                No table on this floor is free for {guests} {guests === 1 ? "guest" : "guests"} at
                this time.
              </span>
              {floorsWithFit.length > 0 && (
                <span className="fp-guest-note__floors">
                  Try:
                  {floorsWithFit.map(({ floor, index }) => (
                    <button
                      key={floor.floor_id ?? index}
                      type="button"
                      onClick={() => setSelectedFloorIndex(index)}
                    >
                      Floor {floor.floor_number ?? index + 1}
                    </button>
                  ))}
                </span>
              )}
            </div>
          )}

        {floorToShow && (floorToShow.tables || []).length === 0 && (
          <div className="fp-empty">
            <TableRestaurantOutlined />
            <p>No tables on this floor yet.</p>
            {isEditable && <span>Use “Add table” to create the first one.</span>}
          </div>
        )}

        {/* Booking: tables appear once the party size is chosen. */}
        {slotActive && !guests && !isAdminView && floorToShow && (floorToShow.tables || []).length > 0 && (
          <div className="fp-guest-wait">
            <p>
              <strong>{floorStats[selectedFloorIndex]?.free ?? 0} seats free</strong> on this
              floor at this time.
            </p>
            <span>Choose the number of guests above to see the tables that fit.</span>
          </div>
        )}

        {floorToShow && (floorToShow.tables || []).length > 0 && !(slotActive && !guests && !isAdminView) && (
          <div className="fp-grid">
            {floorToShow.tables.map((table, tIndex) => {
              const chairs = table.seats || [];
              const topRow = [];
              const bottomRow = [];
              chairs.forEach((chair, index) =>
                (index % 2 === 0 ? topRow : bottomRow).push(chair),
              );

              const total = chairs.filter((chair) => !chair.is_new).length;
              const free = chairs.filter((chair) => chair.status === 4 && !chair.is_new).length;
              const selectedCount = chairs.filter((chair) => chair.is_booking).length;
              const hasNewSeats = chairs.some((chair) => chair.is_new === true);
              const eligibleSeats = getEligibleSeats(table);
              const allSelected =
                eligibleSeats.length > 0 &&
                eligibleSeats.every((seat) => seat.is_booking === true);
              const tone =
                total === 0 ? "muted" : free === total ? "free" : free === 0 ? "full" : "partial";
              const chipText =
                total === 0
                  ? "No seats"
                  : free === total
                    ? "All free"
                    : free === 0
                      ? "Full"
                      : `${free} of ${total} free`;
              const showSeatEditor =
                isEditable || (isAdminView && (chairs.length === 0 || hasNewSeats));
              // Guest mode: tables that don't fit the party are greyed out.
              const fit = tableFit(table);
              const blocked = guestMode && !fit.ok;
              const pickedForGuests = guestMode && selectedCount > 0;

              return (
                <article
                  key={table.table_id || tIndex}
                  className={`fp-table fp-table--${tone}${selectedCount ? " is-selected" : ""}${
                    blocked ? " is-blocked" : ""
                  }${guestMode && !blocked ? " is-fit" : ""}`}
                  title={blocked ? fit.reason : undefined}
                >
                  <header className="fp-table__head">
                    <div className="fp-table__title">
                      <h3>{tableLabel(table)}</h3>
                      <span className={`fp-chip fp-chip--${blocked ? "muted" : tone}`}>
                        {blocked ? fit.reason : chipText}
                      </span>
                    </div>

                    {chairs.length > 0 && guestMode ? (
                      // Customers choose a table for the whole party.
                      <div className="fp-table__select-wrap">
                        <button
                          type="button"
                          className={`fp-select${pickedForGuests ? " is-checked" : ""}`}
                          disabled={blocked}
                          aria-pressed={pickedForGuests}
                          onClick={() => pickTableForGuests(table)}
                          title={
                            blocked
                              ? fit.reason
                              : pickedForGuests
                                ? "Click to choose another table"
                                : `Seat ${guests} ${guests === 1 ? "guest" : "guests"} here`
                          }
                        >
                          <span className="fp-select__box" aria-hidden>
                            {pickedForGuests && <CheckRounded />}
                          </span>
                          {pickedForGuests ? "Chosen" : "Choose"}
                        </button>
                      </div>
                    ) : chairs.length > 0 && (isBooking || isAdminView) && (
                      <div className="fp-table__select-wrap">
                        <button
                          type="button"
                          className={`fp-select${allSelected ? " is-checked" : ""}`}
                          disabled={eligibleSeats.length === 0}
                          aria-pressed={allSelected}
                          onClick={() => handleTableSelectClick(table, eligibleSeats)}
                        >
                          <span className="fp-select__box" aria-hidden>
                            {allSelected && <CheckRounded />}
                          </span>
                          Select
                        </button>

                        {openAdminPopupTableId === table.table_id && isAdminView && (
                          <div className="fp-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => handleAdminTableAction("seated", table)}>
                              Seated
                            </button>
                            <button type="button" role="menuitem" onClick={() => handleAdminTableAction("cleaning", table)}>
                              Cleaning
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                handleSelectAllTable(selectedFloorIndex, table);
                                setOpenAdminPopupTableId(null);
                              }}
                            >
                              Toggle select
                            </button>
                            <button type="button" role="menuitem" onClick={() => handleAdminTableAction("completed", table)}>
                              Completed
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="is-danger"
                              onClick={() => handleAdminTableAction("cancel", table)}
                            >
                              Cancel order
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditable && chairs.length === 0 && (
                      <button
                        type="button"
                        className="fp-icon-btn fp-icon-btn--danger"
                        title="Remove this empty table"
                        aria-label={`Remove ${tableLabel(table)}`}
                        onClick={() => setTableToDelete(table)}
                        disabled={getloading}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </button>
                    )}
                  </header>

                  <div className="fp-table__plan">
                    {chairs.length === 0 ? (
                      <p className="fp-table__no-seats">No seats yet</p>
                    ) : (
                      <div className="fp-table__layout">
                        <div className="fp-seat-row fp-seat-row--top">
                          {topRow.map((chair) => renderSeat(table, chair))}
                        </div>
                        {/* The table code is already in the card heading. */}
                        <div className="fp-table__surface" aria-hidden />

                        <div className="fp-seat-row fp-seat-row--bottom">
                          {bottomRow.map((chair) => renderSeat(table, chair))}
                        </div>
                      </div>
                    )}
                  </div>

                  <footer className="fp-table__foot">
                    <span className="fp-table__count">
                      <EventSeatOutlined fontSize="inherit" />
                      {total} {total === 1 ? "seat" : "seats"}
                      {selectedCount > 0 && (
                        <strong className="fp-table__picked">· {selectedCount} selected</strong>
                      )}
                    </span>

                    {showSeatEditor && (
                      <div className="fp-seat-editor">
                        {hasNewSeats && (
                          <button
                            type="button"
                            className="fp-icon-btn"
                            title="Remove the last new seat"
                            aria-label="Remove the last new seat"
                            onClick={() => handleRemoveSeat(selectedFloorIndex, table)}
                          >
                            <RemoveRounded fontSize="small" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="fp-icon-btn"
                          title="Add a seat"
                          aria-label="Add a seat"
                          onClick={() => handleAddSeat(selectedFloorIndex, table)}
                        >
                          <AddRounded fontSize="small" />
                        </button>
                        {hasNewSeats && (
                          <button
                            type="button"
                            className="fp-btn fp-btn--primary fp-btn--sm"
                            onClick={() => fetchAddSeatsInTable(table)}
                            disabled={getloading}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isBooking && enbaleBoooking && (
        <div className="fp-bookbar" role="region" aria-label="Booking summary">
          <div className="fp-bookbar__summary">
            <strong>
              {seletedSeatCount} {seletedSeatCount === 1 ? "seat" : "seats"} on{" "}
              {seletedTableCount} {seletedTableCount === 1 ? "table" : "tables"}
              {slotActive &&
                ` · ${dayjs(slot.date).format("ddd, D MMM")} at ${dayjs(`2000-01-01T${slot.time}`).format("h:mm A")}`}
            </strong>
            <span>
              {fewSeats
                ? `Select ${slot.guests - seletedSeatCount} more ${slot.guests - seletedSeatCount === 1 ? "seat" : "seats"} for ${slot.guests} guests`
                : `Floor ${floorToShow?.floor_number} · ${selectedTables
                    .map((table) => `${tableLabel(table)} (${table.count})`)
                    .join(", ")}`}
            </span>
          </div>
          <div className="fp-bookbar__actions">
            <button type="button" className="fp-btn fp-btn--ghost" onClick={clearSelection}>
              Clear
            </button>
            <button
              type="button"
              className="fp-btn fp-btn--primary"
              onClick={() => createBookingTableinSeats(data)}
              disabled={getloading || fewSeats}
              title={fewSeats ? `Select a seat for each of the ${slot.guests} guests` : undefined}
            >
              Book now
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={Boolean(tableToDelete)}
        title={`Remove ${tableToDelete ? tableLabel(tableToDelete) : "table"}?`}
        message="This empty table will be removed from the floor plan."
        confirmLabel="Remove table"
        onConfirm={() => fetchDeleteTable(tableToDelete)}
        onCancel={() => setTableToDelete(null)}
      />

      <ConfirmDialog
        show={showDeleteSeats}
        title="Remove this seat?"
        message="The seat will be removed from the table."
        confirmLabel="Remove seat"
        onConfirm={() => fetchDeleteSeatsInTable(seletedTableId, seletedSeatId)}
        onCancel={() => {
          setshowDeleteSeats(false);
          setSeletedSeatId(null);
        }}
      />

      <ConfirmDialog
        show={showCancelBookingSeats}
        tone="warning"
        title="Cancel your booking?"
        message="The booked seats will be released for others."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={() => updateBookingTableinSeats(data)}
        onCancel={() => setShowCancelBookingSeats(false)}
      />
      <PopupModal
        show={showMenuPopup}
        onClose={() => setShowMenuPopup(false)}
        header
        title="Order menu"
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog order-dialog"
      >
        <MenuOrderPopup
          menus={menus}
          categories={[]}
          onPlaceOrder={(items) => {
            handlePlaceOrder(items);
            setShowMenuPopup(false);
          }}
          onSkip={() => setShowMenuPopup(false)}
        />
      </PopupModal>
    </Fragment>
  );
};

export default TableDetails;
