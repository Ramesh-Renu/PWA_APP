import React, { useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Breadcrumb,
  Row,
  Col,
  Badge,
  Card,
  Image,
} from "react-bootstrap";
import TableDetails from "pages/TableDetails/TableDetails";
import BreadcrumbArrow from "components/common/BreadcrumbArrow";
import { renderLocation } from "utils/common";
import useGlobalMaster from "hooks/useGlobalMaster";
import { useEffect } from "react";
import { getHotelbyid } from "services";
import { hotelPlaceholderImage } from "assets/images";

const HotelDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hotelData, setHotelData] = useState(location.state?.hotelData || null);
  const [isEditable, setIsEditable] = useState(false);
  const [isBooking, setIsBooking] =useState(false);
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

  useEffect(() => {
    if (location?.state?.isEditable) {
      setIsEditable(true);
    }
    if(location?.state?.isBooking) {
      setIsBooking(true);
    }
  }, [location?.state]);

  const fetchHotelDetailsbyId = async (param) => {
    try {
      const response = await getHotelbyid(param);
      if (response.success) {
        setHotelData(response.data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
    } finally {
    }
  };

  useEffect(() => {
    if (hotelData === null && location.state.hotel_id) {
      fetchHotelDetailsbyId({ hotel_id: location.state.hotel_id });
    }
  }, [hotelData]);

  const computeTotals = (hd) => {
    const floorCount = parseInt(hd?.floorCount ?? hd?.floorCount ?? 0, 10) || 0;
    const tables_per_floor =
      parseInt(hd?.tables_per_floor ?? hd?.chairs_per_table ?? 0, 10) || 0;
    const totalTables =
      floorCount && tables_per_floor
        ? floorCount * tables_per_floor
        : hd?.tableCount || 0;
    const seatCount = hd?.seatCount || 0;
    return { floorCount, tables_per_floor, totalTables, seatCount };
  };
  console.log("location", location);

  const stats = computeTotals(hotelData || {});

  return (
    <div className="p-3">
      <div className="mb-3">
        <Breadcrumb className="mb-1 p-0">
          <Breadcrumb.Item onClick={() => navigate("/hotel/book-table")}>
            Hotel Table
          </Breadcrumb.Item>
          <span className="breadcrumb-item-divider">
            <BreadcrumbArrow />
          </span>
          <Breadcrumb.Item active>{hotelData?.hotel_name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3} className="text-center mb-3 mb-md-0">
              <Image
                src={hotelPlaceholderImage}
                rounded
                fluid
                style={{ maxHeight: 120, objectFit: "contain" }}
              />
            </Col>
            <Col md={6}>
              <h2 className="mb-1">{hotelData?.hotel_name || `--`}</h2>
              <div className="mb-2">
                <Badge bg="info" className="me-2">
                  {renderLocation(hotelData?.location_id, locationList?.data)[0]
                    ?.name ||
                    hotelData?.location_name ||
                    "Location"}
                </Badge>
                <Badge bg="secondary">
                  {hotelData?.area_name || hotelData?.area || "Area"}
                </Badge>
              </div>
              <p className="mb-1 text-muted">
                {hotelData?.address || "Address not available"}
              </p>
              {location?.state?.isEditable && (
                <div className="d-flex gap-2 mt-2">
                  <Button variant="primary" onClick={() => navigate(-1)}>
                    Back
                  </Button>
                  <Button variant="outline-primary">Edit</Button>
                  <Button variant="outline-secondary">Export</Button>
                </div>
              )}
            </Col>
            <Col md={3} xs={12}>
              <Row>
                <Col xs={6} className="mb-2">
                  <Card className="text-center border-0">
                    <Card.Body>
                      <div className="h4 mb-0">{stats.floorCount || "-"}</div>
                      <small className="text-muted">Floors</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} className="mb-2">
                  <Card className="text-center border-0">
                    <Card.Body>
                      <div className="h4 mb-0">{stats.totalTables || "-"}</div>
                      <small className="text-muted">Tables</small>
                    </Card.Body>
                  </Card>
                </Col>
                {/* <Col xs={6} className="mb-2">
                  <Card className="text-center border-0">
                    <Card.Body>
                      <div className="h4 mb-0">{stats.tables_per_floor || "-"}</div>
                      <small className="text-muted">Table / Floor</small>
                    </Card.Body>
                  </Card>
                </Col> */}
                <Col xs={6} className="mb-2">
                  <Card className="text-center border-0">
                    <Card.Body>
                      <div className="h4 mb-0">{stats.seatCount || "-"}</div>
                      <small className="text-muted">Total Seats</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <TableDetails
        data={hotelData || { id }}
        isEditable={isEditable}
        isBooking={isBooking}
      />
    </div>
  );
};

export default HotelDetails;
