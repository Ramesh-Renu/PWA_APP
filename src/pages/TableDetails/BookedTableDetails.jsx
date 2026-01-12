import React, { useState, useEffect, Fragment } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import useToast from "hooks/useToast";
import PopupModal from "components/common/PopupModal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  getReservationByUser,
  updateDiningStatus,
  deleteReservation,
} from "services";
import Table from "components/common/Table";
import { renderBookingStatus } from "utils/common";
import useGlobalMaster from "hooks/useGlobalMaster";
import * as images from "../../assets/images/index";
import ToolTipPopup from "components/common/ToolTipPopup";

const BookedTableDetails = ({ data }) => {
  const [bookedData, setBookedData] = useState([]);
  const navigate = useNavigate();
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const { showToast } = useToast();
  const [showCancelBookingSeats, setShowCancelBookingSeats] = useState(false);
  const [cancelBookingSeats, setCancelBookingSeats] = useState(null);
  const { diningStatusList, getDiningStatus } = useGlobalMaster();
  const columnHelper = createColumnHelper();
  const [sorting, setSorting] = useState([
    {
      id: "hotel_name",
      desc: false,
    },
  ]);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "orderDate",
    sortOrder: "desc",
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(true);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);

  useEffect(() => {
    if (diningStatusList.data.length === 0) {
      getDiningStatus();
    }
  }, []);

  const allowedStatuses = ["PENDING", "SEATED", "COMPLETED"];

  const fetchHotelbyId = async (hotelData) => {
    setLoadingHotelListApp(true);
    try {
      const response = await getReservationByUser({
        user_id: hotelData.details.id,
      });
      // Optionally, refresh the hotel list or provide user feedback here
      if (response.success) {
        setBookedData(response.data);
        setLoadingHotelListApp(false);
      } else {
        setLoadingHotelListApp(false);
        showToast({
          message: response.message,
          variant: "danger",
        });
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
      setLoadingHotelListApp(false);
    } finally {
      setLoadingHotelListApp(false);
    }
  };

  useEffect(() => {
    fetchHotelbyId(data);
  }, []);

  const updateBookingTableinSeats = async (reservationId) => {
    try {
      const response = await deleteReservation({
        reservation_id: reservationId,
      });
      if (response.success) {
        showToast({
          message: response.message || "Booked seats canceld successfully",
          variant: "success",
        });
        setShowCancelBookingSeats(false);
        fetchHotelbyId(data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      setShowCancelBookingSeats(false);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };

  const updateBookingTableStatus = async (reservationId, statusId) => {
    const body = {
      dining_status: statusId,
    };
    try {
      const response = await updateDiningStatus(reservationId, body);
      if (response.success) {
        showToast({
          message:
            response.message || "Reservation status updated successfully",
          variant: "success",
        });
        setShowCancelBookingSeats(false);
        fetchHotelbyId(data);
      }
    } catch (error) {
      console.error("Error creating hotel:", error);
      setShowCancelBookingSeats(false);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };

  /** HANDLE Status UPDATE VALUE */
  const handleTableStatusUpdate = (e, rowData) => {
    console.log("e", e);
    console.log("rowData", rowData);
    updateBookingTableStatus(rowData.id, e.status_id);
  };

  /** HANDLE EDIT OR DELETE TABLE  VALUE */
  const handleEditDeleteValue = (e, getVal, rowData) => {
    if (
      (rowData?.dining_status > 1 &&
        e.name.props.children.includes("CANCEL")) ||
      rowData?.dining_status === 4
    )
      return;
    if (e.id === 2) {
      deleteConfirmation(getVal);
    } else {
      navigate("/hotel/book-table/details/" + rowData.hotel_id, {
        state: { hotel_id: rowData.hotel_id },
      });
    }
  };

  /** DELETE CONFIRMATION POPUP */
  const deleteConfirmation = (id) => {
    setSelectedId(id);
    setShowCancelBookingSeats(true);
  };
  /** COLUMNS DEFINITION */
  const columns = [
    columnHelper.accessor("booking_date", {
      header: () => <span className="customHeader">Booked Date</span>,
      cell: (info) => {
        // const rowData = info.row.original.booking_date;
        const value = info?.getValue();
        return (
          dayjs(value).format("DD-MM-YYYY") +
          " - " +
          dayjs(value).format("hh:mm A")
        );
      },
    }),
    columnHelper.accessor("dining_date", {
      header: () => <span className="customHeader">Dining Date</span>,
      cell: (info) => {
        const rowData = info.row.original.dining_date;
        return (
          dayjs(rowData).format("DD-MM-YYYY") +
          " - " +
          dayjs(rowData).format("hh:mm A")
        );
      },
    }),
    columnHelper.accessor("hotel", {
      header: () => <span className="customHeader">Hotel Name</span>,
      cell: (info) => {
        return info?.getValue().hotel_name || "N/A";
      },
    }),
    columnHelper.accessor("floor", {
      header: () => <span className="customHeader">Floor Name</span>,
      cell: (info) => {
        return info?.getValue().floor_number || "N/A";
      },
    }),
    columnHelper.accessor("seat_status", {
      id: "table_count",
      header: () => <span className="customHeader">Table Count</span>,
      cell: (info) => {
        const value = info?.getValue();
        return Array.isArray(value) ? value.length : 0;
      },
    }),
    columnHelper.accessor("seat_status", {
      id: "seat_count",
      header: () => <span className="customHeader">Seat Count</span>,
      cell: (info) => {
        const seats = info?.getValue() ?? []; // fallback []
        const totalSeats = Array.isArray(seats)
          ? seats.reduce((sum, item) => sum + (item.seat_ids?.length || 0), 0)
          : 0;

        return totalSeats;
      },
    }),
    columnHelper.accessor("dining_status", {
      id: "dining_status",
      header: () => <span className="customHeader">Status</span>,
      cell: (info) => {
        return (
          <span
            className={"status-name"}
            style={{
              backgroundColor:
                renderBookingStatus(
                  info.getValue(),
                  diningStatusList?.data || []
                )[0]?.color_code || "#000000",
              color: "var(--color-white)",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {console.log(
              "data",
              renderBookingStatus(info.getValue(), diningStatusList?.data || [])
            )}

            {renderBookingStatus(
              info.getValue(),
              diningStatusList?.data || []
            )[0]?.name || "N/A"}
          </span>
        );
      },
    }),
    columnHelper.accessor("dining_status", {
      id: "status_update",
      header: () => <span className="customHeader">Status Update</span>,
      cell: (info) => {
        const rowData = info.row.original;
        const filteredStatuses = diningStatusList.data.filter((s) =>
          allowedStatuses.includes(s.name)
        );
        return (
          <ToolTipPopup
            toolTipDatas={filteredStatuses || []}
            labelField="name"
            valueField="status_id"
            defaultValue={
              renderBookingStatus(
                info.getValue(),
                diningStatusList?.data || []
              )[0]?.name
            }
            getSeletedVal={(e) => handleTableStatusUpdate(e, rowData)}
            canEdit={
              rowData?.dining_status === 3 || rowData?.dining_status === 4
                ? false
                : true
            }
            isCustomFieldswithFilter={false}
            arrow={true}
          />
        );
      },
    }),
    columnHelper.accessor("id", {
      id: "booking_action",
      header: () => <span className="customHeader">Action</span>,
      cell: (info) => {
        const rowData = info.row.original;
        return (
          <ToolTipPopup
            toolTipDatas={[
              {
                name: (
                  <button
                    className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between"
                    disabled={rowData?.dining_status > 1}
                  >
                    EDIT
                    <img src={images.pencilSimpleLine} alt="Edit Hotel" />
                  </button>
                ),
                id: 1,
              },
              {
                name: (
                  <button
                    className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
                    disabled={rowData?.dining_status > 1}
                  >
                    CANCEL
                    <img src={images.trashIcon} alt="Remove Hotel" />
                  </button>
                ),
                id: 2,
              },
            ]}
            labelField="name"
            valueField="id"
            getSeletedVal={(e) =>
              handleEditDeleteValue(e, info.getValue(), rowData)
            }
            customIcon={<img src={images.pencilSimpleLine} alt="Edit Hotel" />}
            canEdit={true}
            isCustomFieldswithFilter={false}
            arrow={true}
          />
        );
      },
    }),
  ];
  /** HANDLE TABLE SORT CHANGE */
  const handleSortChange = (columnId, order) => {
    const sortData = { sortBy: columnId, sortOrder: order };
    setSortConfig(sortData);
    setHasMoreRecords(true);
    // dispatch({
    //   type: "SET_FILTER",
    //   payload: mergedFilters,
    // });
  };

  const handleGoToBookingPage = () => {
    navigate("/hotel/book-table");
  };
  return (
    <Fragment>
      {bookedData?.length > 0 && loadingHotelListApp === false ? (
        <Table
          columns={columns}
          columnData={bookedData || []}
          className={"products__body-table dashboard_table"}
          onSortingChange={handleSortChange}
          sorting={sorting}
          setSorting={setSorting}
          tableName="Order_list"
          noDataContent={"Do not render any no data content while loading"}
          tableHeight={"calc(100vh - 85px)"}
          loading={loadingHotelListApp}
          //onScrollEnd={handleInfiniteScroll}
        />
      ) : (
        <div className="no-booking-found">
          <h1 className="main-head">No Booking Found</h1>
          <p className="sub-head">
            Please select a seat and reserve your dining table!
          </p>
          <button
            className="go-to-booking-page"
            onClick={handleGoToBookingPage}
          >
            Go to Booking
          </button>
        </div>
      )}
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
              onClick={() => updateBookingTableinSeats(selectedId)}
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

export default BookedTableDetails;
