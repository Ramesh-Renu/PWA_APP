import React, { useState, useEffect } from "react";
import { Card, Row, Col } from "react-bootstrap";
import {
  chairBooked,
  chairNotBooked,
  cleaningChar,
} from "../../assets/images/index";
import { createTable, getTablebyid } from "services";
import useToast from "hooks/useToast";
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
    setLoading(true);
    try {
      const response = await createTable(body, hotelData.id);
      // Optionally, refresh the hotel list or provide user feedback here
      showToast({
        message: response.data.message || "Table created successfully",
        variant: "success",
      });
      if (response) {
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
console.log('floorsState',floorsState);

  const updateFloors = (updater) => {
    setFloorsState((prev) => {
      const next = updater(prev);
      if (typeof onChange === "function") onChange(next);
      return next;
    });
  };

  const handleAddSeat = (floorIndex, tableIndex) => {
    updateFloors((prev) =>
      prev.map((f, fi) => {
        if (fi !== floorIndex) return f;
        const newTables = f.tables.map((t, ti) => {
          if (ti !== tableIndex) return t;
          const chairs = t.seats || [];
          const nextId =
            chairs.length > 0
              ? chairs[chairs.length - 1].chairId + 1
              : chairs.length + 1;
          return {
            ...t,
            chairs: [...chairs, { chairId: nextId, booked: false }],
          };
        });
        return { ...f, tables: newTables };
      })
    );
  };

  const handleRemoveSeat = (floorIndex, tableIndex) => {
    updateFloors((prev) =>
      prev.map((f, fi) => {
        if (fi !== floorIndex) return f;
        const newTables = f.tables.map((t, ti) => {
          if (ti !== tableIndex) return t;
          const chairs = t.seats || [];
          if (chairs.length <= 0) return t;
          return { ...t, chairs: chairs.slice(0, chairs.length - 1) };
        });
        return { ...f, tables: newTables };
      })
    );
  };

  return (
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
                        <div className="d-flex justify-content-between gap-1 w-100">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() =>
                              handleAddSeat(selectedFloorIndex, tIndex)
                            }
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleRemoveSeat(selectedFloorIndex, tIndex)
                            }
                          >
                            -
                          </button>
                        </div>
                      </div>
                      <div className="tables-section">
                        <Row className="top-row mb-2">
                          {topRow.map((chair, cIndex) => (
                            <Col key={cIndex} className="d-flex top-row-chair">
                              <button
                                className={`text-center rounded chairs ${
                                  chair.booked
                                    ? "chairBooked"
                                    : "chairNotBooked"
                                }`}
                                disabled={!!chair.booked}
                              >
                                <img
                                  className="charsimage"
                                  src={`${
                                    chair.booked ? chairBooked : chairNotBooked
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
                          <h6 className="table-heading">Table {table.table_number}</h6>
                        </div>

                        <Row className="bottom-row mt-2">
                          {bottomRow.map((chair, cIndex) => (
                            <Col
                              key={cIndex}
                              className="d-flex bottom-row-chair"
                            >
                              <button
                                className={`text-center rounded chairs ${
                                  chair.booked
                                    ? "chairBooked"
                                    : "chairNotBooked"
                                }`}
                                disabled={!!chair.booked}
                              >
                                <img
                                  className="charsimage"
                                  src={`${
                                    chair.booked ? chairBooked : chairNotBooked
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
  );
};

export default TableDetails;
