import React, {Fragment, useState, useEffect} from "react";
import ReservationMobileList from "./ReservationMobileList";
import useAuth from "hooks/useAuth";
import {
  getReservationByUser,
  updateDiningStatus,
  deleteReservation,
} from "services";
import SkeletonLoading from "components/common/SkeletonLoading";

const ReservationPage = () => {
  const [{ data: auth }] = useAuth();
  const [bookedData, setBookedData] = useState([]);
  const [loadingHotelListApp, setLoadingHotelListApp] = useState(true);
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
      fetchHotelbyId(auth);
    }, []);
  
  /** HANDLE Status UPDATE VALUE */
  const handleTableStatusUpdate = (e, rowData) => {
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
      navigate("/book-table/details/" + rowData.hotel_id, {
        state: { hotel_id: rowData.hotel_id },
      });
    }
  };

  return (
    <Fragment>
      {loadingHotelListApp ?
      <>
      <SkeletonLoading flexDirection="row"
              count={2}
              height="150px"
              width="100%"
              borderRadius="8px"
            /> 
       <SkeletonLoading flexDirection="row"
              count={2}
              height="150px"
              width="100%"
              borderRadius="8px"
            /></> :
        <ReservationMobileList
          reservations={bookedData}
          onEdit={handleEditDeleteValue}
        />
         }
    </Fragment>
  );
};

export default ReservationPage;
