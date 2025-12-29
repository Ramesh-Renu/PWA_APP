import React, { useState, useEffect, Fragment } from "react";
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
} from "services";
import useToast from "hooks/useToast";
import PopupModal from "components/common/PopupModal";

const buildFromCounts = (data) => {
  const floorCount = parseInt(data.floor ?? data.floorCount ?? 1, 10) || 1;
  const tablesPerFloor =
    parseInt(data.tables_per_floor ?? data.tableCount ?? 1, 10) || 1;
  const chairsPerTable =
    parseInt(data.chairs_per_table ?? data.chairsPerTable ?? 4, 10) || 4;

  return Array.from({ length: floorCount }, (_, fi) => ({
    name: `Floor ${fi + 1}`,
    tables: Array.from({ length: tablesPerFloor }, (_, ti) => ({
      id: ti + 1,
      chairs: Array.from({ length: chairsPerTable }, (_, ci) => ({
        chairId: ci + 1,
        booked: false,
      })),
    })),
  }));
};

const normalizeFloors = (data) => {
  // Try common keys returned by API
  const possible =
    data?.floors ||
    data?.floorWithTable ||
    data?.floorList ||
    data?.floor ||
    data?.floor_details ||
    data?.floor_list ||
    null;

  if (Array.isArray(possible) && possible.length > 0) return possible;

  // if possible is an object with numeric keys, try to convert
  if (possible && typeof possible === "object") {
    return Object.values(possible);
  }

  // Fallback: build from numeric counts
  return buildFromCounts(data || {});
};

const TableDetails = ({ data, onChange }) => {
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [floorsState, setFloorsState] = useState([]);
  const [getloading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showDeleteSeats, setshowDeleteSeats] = useState(false);
  const [seletedSeatId, setSeletedSeatId] = useState(null);
  const [seletedTableId, setSeletedTableId] = useState(null);

  const fetchHotelbyId = async (hotelData) => {
    try {
      const response = await getTablebyid({ hotel_id: hotelData.id });
      // Optionally, refresh the hotel list or provide user feedback here
      if (response) {
        console.log("setLoading(false);", response);
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
    console.log("selectedFloorIndex", floorToShow);

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

  if (!data) return null;

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

  const handleAddSeat = (floorIndex, table) => {
    // fetchAddSeatsInTable();
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
                      {f.name || `Floor ${i + 1}`}
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
                    {floorToShow.name || `Floor ${selectedFloorIndex + 1}`}
                  </h5>
                </Col>{" "}
                <Col xs={6} className="">
                  <button
                    className="addNewTable"
                    onClick={() => fetchCreateTable(data)}
                  >
                    + Add New Table
                  </button>
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
                                    chair.is_new
                                      ? "Save seats before removing"
                                      : "Remove seat"
                                  }
                                  disabled={chair.is_booked || chair.is_new}
                                  onClick={() =>
                                    handleRemoveThisSeat(table, chair)
                                  }
                                >
                                  <img
                                    className="charsimage"
                                    src={`${
                                      chair.is_booked
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
                                    chair.is_new
                                      ? "Save seats before removing"
                                      : "Remove seat"
                                  }
                                  disabled={chair.is_booked || chair.is_new}
                                  onClick={() =>
                                    handleRemoveThisSeat(table, chair)
                                  }
                                >
                                  <img
                                    className="charsimage"
                                    src={`${
                                      chair.is_booked
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
    </Fragment>
  );
};

export default TableDetails;
