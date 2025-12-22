import React, { Fragment, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import dummyList from "../HomePage/dummydata";
const CreateHotel = () => {
  const [selectedHotel, setSelectedHotel] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [listOfLocation, setListOfLocation] = useState([]);
  const [listOfFloor, setListOfFloor] = useState([]);
  const [located, setLocated] = useState([]);

  const selectedFavoriteHotel = (value) => {
    setSelectedHotel(value);
    setSelectedLocation([]);
    setSelectedPersons([]);
    setListOfFloor([]);
    setListOfLocation(
      value?.length > 0
        ? dummyList?.hotelAreas?.filter((loc) => loc.id === value[0]?.id)[0]
            ?.located
        : []
    );
  };

  const selectedHotelLocated = (value) => {
    setSelectedLocation(value);
    setListOfFloor(
      value?.length > 0
        ? dummyList?.floorWithTable?.filter((loc) => loc.id === value[0]?.id)[0]
            ?.floor
        : []
    );
  };

  const selectedLocatedPersons = (value) => {
    setSelectedPersons(value);
  };
  // console.log("listOfFloor", listOfFloor);

  return (
    <Fragment>
      <Row className="p-2 top-content">
        <Row>
          <Col lg={12} md={12} xs={12}>
            <h3> Table Booking</h3>
            {/* Dining */}
          </Col>
        </Row>
        <Col lg={4} md={4} xs={10} className="my-2">
          {/* Hotel Selection */}
          <SelectDropDown
            multi={false}
            options={dummyList.hotelCategories}
            labelField={"name"}
            valueField={"id"}
            values={selectedHotel || []}
            searchable={true}
            placeholder={"Select Favorite Hotel"}
            className="single-select-dropdownRenderer"
            disabled={dummyList.hotelCategories?.length === 0 ? true : false}
            onChange={selectedFavoriteHotel}
            dropdownPosition="auto"
            optionType="radio"
          />
        </Col>
        <Col lg={4} md={4} xs={10} className="my-2">
          {listOfLocation && (
            <SelectDropDown
              multi={false}
              options={listOfLocation || []}
              labelField={"name"}
              valueField={"id"}
              values={selectedLocation || []}
              searchable={true}
              placeholder={"Select Location"}
              className="single-select-dropdownRenderer"
              disabled={listOfLocation?.length === 0 ? true : false}
              onChange={selectedHotelLocated}
              dropdownPosition="auto"
              optionType="radio"
            />
          )}
        </Col>
        <Col lg={4} md={4} xs={10} className="my-2">
          {dummyList.numberOfPersons && (
            <SelectDropDown
              multi={false}
              options={dummyList.numberOfPersons || []}
              labelField={"name"}
              valueField={"id"}
              values={selectedPersons || []}
              searchable={true}
              placeholder={"Select Persons"}
              className="single-select-dropdownRenderer"
              disabled={selectedLocation?.length === 0 ? true : false}
              onChange={selectedLocatedPersons}
              dropdownPosition="auto"
              optionType="radio"
            />
          )}
        </Col>
      </Row>
      <Row className="p-2 body-content">
        {selectedPersons?.length > 0 &&
          listOfFloor?.map((floor, i) => (
            <Col key={i} className="my-2">
              <h4>{floor?.name}</h4>
              <div className="scroll-inner">
                {floor?.tables?.map((table, tIndex) => {
                  const chairs = table.chairs;

                  // Split chairs into "top row" and "bottom row"
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
                      <h6 className="table-heading">Table {table.id}</h6>
                      <div className="tables-section">
                        {/* Top Row */}
                        <Row className="top-row mb-2">
                          {topRow.map((chair, cIndex) => (
                            <Col key={cIndex} className="d-flex top-row-chair">
                              <button
                                className={`text-center rounded ${
                                  chair.booked
                                    ? "chairBooked"
                                    : "chairNotBooked"
                                }`}
                                disabled={chair.booked}
                                style={{
                                  minWidth: "50px",
                                  border: "none",
                                }}
                              >
                                {chair.chairId}
                              </button>
                            </Col>
                          ))}
                        </Row>

                        {/* Table Block */}
                        <div className="my-2 text-white rounded tables">
                          <h6>&#160;</h6>
                        </div>

                        {/* Bottom Row */}
                        <Row className="bottom-row mt-2">
                          {bottomRow.map((chair, cIndex) => (
                            <Col
                              key={cIndex}
                              className="d-flex bottom-row-chair"
                            >
                              <button
                                className={`text-center rounded ${
                                  chair.booked
                                    ? "chairBooked"
                                    : "chairNotBooked"
                                }`}
                                disabled={chair.booked}
                                style={{
                                  minWidth: "50px",
                                  border: "none",
                                }}
                              >
                                {chair.chairId}
                              </button>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
          ))}
      </Row>
    </Fragment>
  );
};

export default CreateHotel;
