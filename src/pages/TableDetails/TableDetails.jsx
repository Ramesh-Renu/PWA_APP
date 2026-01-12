import React, { useState, useEffect, Fragment, useMemo } from "react";
import { Card, Row, Col } from "react-bootstrap";
import {
  chairBooked,
  chairNotBooked,
  cleaningChar,
} from "../../assets/images/index";
import {
  createTable,
  getTablebyid,
  addSeatInTable,
  deleteSeatInTable,
  createReservation,
  updateReservation,
} from "services";
import useToast from "hooks/useToast";
import PopupModal from "components/common/PopupModal";
import useAuth from "hooks/useAuth";
import dayjs from "dayjs";
import { useGlobalContext } from "store/context/GlobalProvider";

const TableDetails = ({ data, onChange, isEditable, isBooking }) => {
  const [{ data: auth }, { setAuth }] = useAuth();
  const { reservationData, dispatch } = useGlobalContext();
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [floorsState, setFloorsState] = useState([]);
  const [getloading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showDeleteSeats, setshowDeleteSeats] = useState(false);
  const [showCancelBookingSeats, setShowCancelBookingSeats] = useState(false);
  const [cancelBookingSeats, setCancelBookingSeats] = useState(null);
  const [seletedSeatId, setSeletedSeatId] = useState(null);
  const [seletedTableId, setSeletedTableId] = useState(null);
  const [enbaleBoooking, setEnbaleBoooking] = useState(false);
  const [seletedSeatCount, setSeletedSeatCount] = useState(null);
  const [seletedTableCount, setSeletedTableCount] = useState(null);

  const fetchHotelbyId = async (hotelData) => {
    try {
      const response = await getTablebyid({ hotel_id: hotelData.id });
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
    }
  };

  useEffect(() => {
    fetchHotelbyId(data);
  }, []);

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
        floorToShow.floor_id
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
    updateFloors((prev) =>
      prev.map((f) => {
        if (f.floor_id !== floorToShow.floor_id) return f;
        const newTables = f.tables.map((t) => {
          if (t.table_id !== table.table_id) return t;
          const seats = t.seats || [];
          const nextId =
            seats.length > 0
              ? seats[seats.length - 1].seat_id + 1
              : seats.length + 1;
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
      })
    );
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
      })
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
    const getCurretnTime = new Date();

    const param = {
      hotel_id: hotelData.id,
      floor_id: floorToShow.floor_id,
      seat_status: bookingSeatsByTable,
      customer_name: auth?.details?.name,
      customer_mobile: auth?.details.mobilenumber,
      booking_date: getCurretnTime,
      dining_date:  getCurretnTime,
      reservation_time: dayjs(getCurretnTime).format("HH:mm"),
    };
    setLoading(true);
    try {
      const response = await createReservation(param);
      if (response.success) {
        showToast({
          message: response.message || "Table created successfully",
          variant: "success",
        });
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

  const handleAddBookingSeat = (floorIndex, table, seats) => {
  const floorToShow = floors[floorIndex] || floors[0];

  updateFloors((prev) =>
    prev.map((f) => {
      if (f.floor_id !== floorToShow.floor_id) return f;

      // STEP 1: find the clicked table and preview what seats would be
      const targetTable = f.tables.find((t) => t.table_id === table.table_id);

      const previewSeats = targetTable.seats.map((s) =>
        s.seat_id === seats.seat_id
          ? { ...s, is_booking: !s.is_booking }
          : s
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
                  : { ...s, notAccess: false }
              ),
            };
          }

          // OTHER TABLES
          return {
            ...t,
            seats: t.seats.map((s) =>
              s.is_booking
                ? s
                : { ...s, notAccess: setNotAccess }
            ),
          };
        }),
      };
    })
  );
};


  const updateBookingTableinSeats = async (hotelData) => {
    const getCurretnTime = new Date();
    const reservationId = cancelBookingSeats.seat_ids.reservation_id;
    const cancelSeats = [
      {
        table_id: cancelBookingSeats.table_id,
        seat_ids: [cancelBookingSeats.seat_ids.seat_id],
      },
    ];
    const body = {
      cancel_seats: cancelSeats,
      cancel_date: dayjs(getCurretnTime).format("YYYY-MM-DD"),
      cancel_time: dayjs(getCurretnTime).format("HH:mm"),
    };

    setShowCancelBookingSeats(false);
    setLoading(true);
    try {
      const response = await updateReservation(body, reservationId);
      if (response.success) {
        showToast({
          message: response.message || "Booked seatscanceld successfully",
          variant: "success",
        });
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
      table.seats?.some((seat) => seat.is_booking === true)
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
              seat_ids: seatIds,
            }
          : null;
      })
      .filter(Boolean);

    const totalBookingSeats = bookingSeatsByTable?.reduce(
      (total, table) => total + table.seat_ids.length,
      0
    );
    setSeletedSeatCount(totalBookingSeats);
    setSeletedTableCount(bookingSeatsByTable?.length);
  }, [floorToShow, floorsState, floors, selectedFloorIndex]);

  console.log('floorsState',floorToShow);

  return (
    <Fragment>
      <Card className="mb-3 table-details-card">
        <Card.Body>
          {floors.length > 1 && (
            <Row className="mb-3">
              <Col>
                <div className="d-flex gap-2">
                  {floors.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn ${
                        i === selectedFloorIndex
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setSelectedFloorIndex(i)}
                    >
                      {`Floor ${f.floor_number}` || `Floor ${i + 1}`}
                    </button>
                  ))}
                </div>
              </Col>
            </Row>
          )}

          {floorToShow && (
            <div className="mb-3">
              <Row className="mb-12 justify-content-between align-items-center w-100">
                <Col xs={6}>
                  <h5 className="mb-2 floor-name">
                    { `Floor ${floorToShow.floor_number}` || `Floor ${selectedFloorIndex + 1}`}
                  </h5>
                </Col>{" "}
                <Col xs={6} className="">
                  {isEditable && (
                    <button
                      className="addNewTable"
                      onClick={() => fetchCreateTable(data)}
                    >
                      + Add New Table
                    </button>
                  )}
                  {isBooking && enbaleBoooking && (
                    <Row className="justify-content-between align-items-center w-100">
                      <Col md={4} xs={12}>
                        <button
                          className="addNewTable"
                          onClick={() => createBookingTableinSeats(data)}
                        >
                          Book Table
                        </button>
                      </Col>
                      <Col md={8} xs={12}>
                        <Row>
                          <Col xs={6} className="mb-2">
                            <Card className="text-center border-0">
                              <Card.Body>
                                <div className="h4 mb-0">
                                  {seletedSeatCount || "-"}
                                </div>
                                <small className="text-muted">Seats</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col xs={6} className="mb-2">
                            <Card className="text-center border-0">
                              <Card.Body>
                                <div className="h4 mb-0">
                                  {seletedTableCount || "-"}
                                </div>
                                <small className="text-muted">Tables</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  )}
                </Col>
              </Row>

              <div className="scroll-inner d-flex flex-row flex-wrap gap-2">
                {Array.isArray(floorToShow.tables) &&
                  floorToShow.tables.map((table, tIndex) => {
                    const chairs = table.seats || [];
                    const hasNewSeats = table.seats?.some(
                      (seat) => seat.is_new === true
                    );
                    let topRow = [];
                    let bottomRow = [];

                    if (chairs.length === 2) {
                      topRow = [chairs[0]];
                      bottomRow = [chairs[1]];
                    } else {
                      chairs.forEach((chair, index) => {
                        if (index % 2 === 0) topRow.push(chair);
                        else bottomRow.push(chair);
                      });
                    }

                    return (
                      <div
                        key={tIndex}
                        className="p-3 m-2 text-center table-box"
                        style={{ minWidth: "200px" }}
                      >
                        {isEditable && (
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex justify-content-between gap-1 align-items-center w-100">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success addseats"
                                onClick={() =>
                                  handleAddSeat(selectedFloorIndex, table)
                                }
                              >
                                +
                              </button>
                              {hasNewSeats && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success save-seats"
                                  onClick={() => fetchAddSeatsInTable(table)}
                                >
                                  Save
                                </button>
                              )}
                              {hasNewSeats && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger removeseats"
                                  onClick={() =>
                                    handleRemoveSeat(selectedFloorIndex, table)
                                  }
                                >
                                  -
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="tables-section">
                          <Row className="top-row mb-2">
                            {topRow.map((chair, cIndex) => (
                              <Col
                                key={cIndex}
                                className="d-flex top-row-chair"
                              >
                                <button
                                  className={`text-center rounded chairs ${
                                    chair.is_booked
                                      ? "chairBooked"
                                      : "chairNotBooked"
                                  }  ${chair.is_new ? "chairNew" : ""}`}
                                  title={
                                    chair.status === 4
                                      ? "Available Seat"
                                      : chair.status === 1
                                      ? "Booked Seat"
                                      : "Seat"
                                  }
                                  disabled={
                                    chair.is_booking !== true &&
                                    ((chair.status === 1 &&
                                      chair.user_id !== auth?.details?.id) ||
                                      chair.notAccess ||
                                      chair.is_new)
                                  }
                                  onClick={() => {
                                    if (isEditable) {
                                      handleRemoveThisSeat(table, chair);
                                    } else if (
                                      chair.status === 1 &&
                                      chair.user_id === auth?.details?.id
                                    ) {
                                      handleCancelThisSeat(table, chair);
                                    } else if (isBooking) {
                                      handleAddBookingSeat(
                                        selectedFloorIndex,
                                        table,
                                        chair
                                      );
                                    }
                                  }}
                                >
                                  <img
                                    className="charsimage"
                                    src={`${
                                      chair.status === 1 || chair.is_booking
                                        ? chairBooked
                                        : chairNotBooked
                                    }`}
                                    alt="char"
                                  />
                                  <span className="char-number">
                                    {chair.seat_number}
                                  </span>
                                </button>
                              </Col>
                            ))}
                          </Row>

                          <div
                            className={`text-white rounded tables ${
                              topRow.some((check) => check.booked) ||
                              bottomRow.some((check) => check.booked)
                                ? "chairBooked"
                                : "chairNotBooked"
                            }`}
                          >
                            <h6 className="table-heading">
                              Table {table.table_number}
                            </h6>
                          </div>

                          <Row className="bottom-row mt-2">
                            {bottomRow.map((chair, cIndex) => (
                              <Col
                                key={cIndex}
                                className="d-flex bottom-row-chair"
                              >
                                <button
                                  className={`text-center rounded chairs ${
                                    chair.is_booked
                                      ? "chairBooked"
                                      : "chairNotBooked"
                                  }  ${chair.is_new ? "chairNew" : ""}`}
                                  title={
                                    chair.status === 4
                                      ? "Available Seat"
                                      : chair.status === 1
                                      ? "Booked Seat"
                                      : "Seat"
                                  }
                                  disabled={
                                    chair.is_booking !== true &&
                                    ((chair.status === 1 &&
                                      chair.user_id !== auth?.details?.id) ||
                                      chair.notAccess ||
                                      chair.is_new)
                                  }
                                  onClick={() => {
                                    if (isEditable) {
                                      handleRemoveThisSeat(table, chair);
                                    } else if (
                                      chair.status === 1 &&
                                      chair.user_id === auth?.details?.id
                                    ) {
                                      handleCancelThisSeat(table, chair);
                                    } else if (isBooking) {
                                      handleAddBookingSeat(
                                        selectedFloorIndex,
                                        table,
                                        chair
                                      );
                                    }
                                  }}
                                >
                                  <img
                                    className="charsimage"
                                    src={`${
                                      chair.status === 1 || chair.is_booking
                                        ? chairBooked
                                        : chairNotBooked
                                    }`}
                                    alt="char"
                                  />
                                  <span className="char-number">
                                    {chair.seat_number}
                                  </span>
                                </button>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <PopupModal
        show={showDeleteSeats}
        onClose={() => setshowDeleteSeats(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Delete this Seat ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() =>
                fetchDeleteSeatsInTable(seletedTableId, seletedSeatId)
              }
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setshowDeleteSeats(false);
                setSeletedSeatId(null);
              }}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>

      <PopupModal
        show={showCancelBookingSeats}
        onClose={() => setShowCancelBookingSeats(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Cancel Booked Seat ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() => updateBookingTableinSeats(data)}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setShowCancelBookingSeats(false);
              }}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>
    </Fragment>
  );
};

export default TableDetails;
