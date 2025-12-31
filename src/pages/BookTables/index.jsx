import React, { Fragment, useEffect, useState } from "react";
import SelectDropDown from "components/common/SelectDropDown";
import { Col, Row } from "react-bootstrap";
import {
  getAllHotel,
  searchHotelbyNameLocation,
  deleteHotel,
} from "services";
import useGlobalMaster from "hooks/useGlobalMaster";
import PopupModal from "components/common/PopupModal";
import Table from "components/common/Table";
import TableDetails from "pages/TableDetails/TableDetails";
import { createColumnHelper } from "@tanstack/react-table";
import useToast from "hooks/useToast";
import * as images from "../../assets/images/index";
import { useNavigate } from "react-router-dom";
import ToolTipPopup from "components/common/ToolTipPopup";
import { renderArea, renderLocation } from "utils/common";

const BookTables = () => {
  const [listOfHotel, setListOfHotel] = useState([]);
  const [showDeleteHotel, setShowDeleteHotel] = useState(false);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(false);
  const { areaList, locationList, getAllArea, getAllLocation } =
    useGlobalMaster();
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "orderDate",
    sortOrder: "desc",
  });
  const columnHelper = createColumnHelper();
  const [sorting, setSorting] = useState([
    {
      id: "hotel_name",
      desc: false,
    },
  ]);
  const [seletedHotelId, setSeletedHotelId] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [reloadTable, setReloadTable] = useState(false);

  useEffect(() => {
    if (areaList.data.length === 0) {
      getAllArea();
    }
    if (locationList.data.length === 0) {
      getAllLocation();
    }
  }, []);
  const fetchHotels = async () => {
    setLoadingHotelListApp(true);
    try {
      const hotels = await getAllHotel();
      setListOfHotel(hotels.data); // <-- changed from `value` to `hotels`
      setLoadingHotelListApp(false);
    } catch (err) {
      console.error("fetchHotels error", err);
    }
  };
  useEffect(() => {
    fetchHotels();
    // ...existing code...
  }, []);

  const fetchSearchHotel = async (value) => {
    setLoadingHotelListApp(true);
    try {
      const response = await searchHotelbyNameLocation(value);
      if (response.success) {
        const hotels = response.data;
        setListOfHotel(hotels);
        setLoadingHotelListApp(false);
      }
    } catch (error) {
      console.error("Error updating hotel:", error);
      showToast({
        message: error,
        variant: "danger",
      });
    } finally {
    }
  };
  /** HANDLE HOTEL TABLE VIEW */
  const handleHotelView = (hotelId, hotelData, isEditable=false, isBooking=false) => {
    if (hotelId) {
      navigate(`/hotel/book-table/details/${hotelId}`, {
        state: { hotelData, isEditable, isBooking },
      });
    }
  };

  /** COLUMNS DEFINITION */
  const columns = [
    columnHelper.accessor("hotel_name", {
      header: () => <span className="customHeader">Hotel Name</span>,
      cell: (info) => {
        const rowData = info.row.original;
        return (
          <div
            tabIndex={0}
            className="truncate-2-lines"
            title={info.getValue()}
            onClick={() => handleHotelView(rowData?.id, rowData, false, true)}
          >
            {info.getValue()}
          </div>
        );
      },
    }),
    columnHelper.accessor("location_id", {
      header: () => <span className="customHeader">Location</span>,
      cell: (info) => {
        return (
          renderLocation(info.getValue(), locationList?.data || [])[0]?.name ||
          "N/A"
        );
      },
    }),
    columnHelper.accessor("area_id", {
      header: () => <span className="customHeader">Area</span>,
      cell: (info) => {
        return (
          renderArea(info.getValue(), areaList?.data || [])[0]?.name || "N/A"
        );
      },
    }),
    columnHelper.accessor("address", {
      header: () => <span className="customHeader">Address</span>,
      // cell: (info) => {
      //   return renderArea(info.getValue(), areaList?.data || [])[0]?.name || "N/A";
      // },
    }),
    columnHelper.accessor("floorCount", {
      header: () => <span className="customHeader">Number of Floor</span>,
    }),
    // columnHelper.accessor("tableCount", {
    //   header: () => <span className="customHeader">Table Count</span>,
    // }),
    columnHelper.accessor("tables_per_floor", {
      header: () => <span className="customHeader">Table Per floor</span>,
    }),
    columnHelper.accessor("seatCount", {
      header: () => <span className="customHeader">Seat Count</span>,
    }),
    // columnHelper.accessor("id", {
    //   header: () => <span className="customHeader">Action</span>,
    //   cell: (info) => {
    //     const rowData = info.row.original;
    //     return (
    //       <div className="mx-auto w-100">
    //         <ToolTipPopup
    //           toolTipDatas={[
    //             {
    //               name: (
    //                 <button className="btn btn-0 p-0 border-0 m-0 w-100 d-flex justify-content-between">
    //                   Edit
    //                   <img
    //                     src={images.pencilSimpleLine}
    //                     alt="Edit Hotel"
    //                   />
    //                 </button>
    //               ),
    //               id: 1,
    //             },
    //             {
    //               name: (
    //                 <button
    //                   className="btn btn-0 p-0 m-0 w-100 border-0 text-danger d-flex justify-content-between"
    //                   disabled={rowData?.isProcessOrder}
    //                 >
    //                   Delete
    //                   <img src={images.trashIcon} alt="Remove Hotel" />
    //                 </button>
    //               ),
    //               id: 2,
    //             },
    //           ]}
    //           labelField="name"
    //           valueField="id"
    //           getSeletedVal={(e) =>
    //             handleEditDeleteValue(e, info.getValue(), rowData)
    //           }
    //           canEdit={true}
    //           isCustomFieldswithFilter={false}
    //           arrow={true}
    //         />
    //       </div>
    //     );
    //   },
    //   // cell: (info) => {
    //   //   const getHotelId = info.getValue();
    //   //   const getHotelData = listOfHotel.filter(
    //   //     (hotel) => hotel.id === getHotelId
    //   //   );
    //   //   return (
    //   //     <span
    //   //       className="edit-icon"
    //   //       onClick={() => {
    //   //         handleUpdateHotel(getHotelData);
    //   //         setSeletedHotelId(getHotelData);
    //   //         setUpdateHotel(true);
    //   //       }}
    //   //     >
    //   //       <img src={images.editPencilIcon} alt="Edit" />
    //   //     </span>
    //   //   );
    //   // },
    // }),
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

  const handleSearchHotel = (e) => {
    // Logic to Search hotel
    const getValue = e.target.value;
    if (getValue?.length > 2) {
      fetchSearchHotel(getValue);
    } else if (getValue?.length === 0) {
      fetchHotels();
    }
  };

  /** HANDLE DELETE ORDER */
  const handleDeleteOrder = async (param) => {
    setShowDeleteHotel(false);
    try {
      const response = await deleteHotel({
        ticket_id: param,
      });
      if (response?.status) {
        showToast({
          message: response.data.message,
          variant: "success",
        });
        setReloadTable(true);
      } else {
        showToast({
          message: response.data.message,
          variant: "danger",
        });
      }
    } catch (error) {
      showToast({
        message: error?.message || "Something went wrong",
        variant: "danger",
      });
    }
  };

  return (
    <Fragment>
      <div className="create-hotel-page">
        <div className="create-hotel-page-flex">
          <div className="create-hotel-page-flex-column-one">
            <input
              className="search-hotel"
              onChange={handleSearchHotel}
              placeholder="Search Hotel name/location"
            />
          </div>
          <div className="create-hotel-page-flex-column-two"></div>
        </div>
      </div>
      {seletedHotelId && seletedHotelId.length > 0 && (
        <div className="table-details-preview p-2">
          <TableDetails data={seletedHotelId[0]} />
        </div>
      )}
      {listOfHotel?.length > 0 && (
        <Table
          columns={columns}
          columnData={listOfHotel}
          className={"products__body-table dashboard_table"}
          onSortingChange={handleSortChange}
          sorting={sorting}
          setSorting={setSorting}
          tableName="Order_list"
          noDataContent={"Do not render any no data content while loading"}
          tableHeight={"calc(100vh - 115px)"}
          // loading={loadingHotelListApp}
          //onScrollEnd={handleInfiniteScroll}
        />
      )}
      {/* DELETE CONFIRMATION POPUP */}

      <PopupModal
        show={showDeleteHotel}
        onClose={() => setShowDeleteHotel(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Delete this Hotel ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() => handleDeleteOrder(selectedId)}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setShowDeleteHotel(false);
                setSeletedHotelId(null);
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

export default BookTables;
