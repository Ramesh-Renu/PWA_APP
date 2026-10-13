import React, { useEffect, useState } from "react";
import PopupModal from "components/common/PopupModal";
import SelectDropDown from "components/common/SelectDropDown";
import MenuOrderPopup from "pages/MenuOrderPopup/MenuOrderPopup";
import useToast from "hooks/useToast";
import { createOrder, getAllHotel, getAllMenu } from "services";
import { notifyOrdersChanged } from "utils/orderEvents";

const unwrapList = (response) => {
  const value = response?.rows ?? response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

// Admin places an order for a hotel without a table booking (takeaway,
// walk-in, phone order). It then shows up on the Orders board.
// Opened from a hotel card (hotelId given) the hotel is fixed and named in the
// title; from the Orders board the admin picks it.
const CreateOrderDialog = ({
  show,
  hotelId: initialHotelId = "",
  hotelName = "",
  // Booking the order is for (Reservations page); omitted = no table booking.
  reservationId = null,
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const hotelFixed = Boolean(initialHotelId);

  useEffect(() => {
    if (!show) return;
    setHotelId(initialHotelId ? String(initialHotelId) : "");
    setNotes("");
    if (initialHotelId) return; // no hotel picker needed
    getAllHotel()
      .then((response) => setHotels(unwrapList(response)))
      .catch(() => setHotels([]));
  }, [show, initialHotelId]);

  useEffect(() => {
    if (!show || !hotelId) {
      setMenus([]);
      return undefined;
    }
    let active = true;
    setMenusLoading(true);
    getAllMenu({ hotel_id: hotelId, limit: 500 }) // API default is 10
      .then((response) => {
        if (!active) return;
        // The API refuses unavailable dishes, so don't offer them.
        setMenus(unwrapList(response).filter((menu) => menu.is_available !== false));
      })
      .catch(() => active && setMenus([]))
      .finally(() => active && setMenusLoading(false));
    return () => {
      active = false;
    };
  }, [show, hotelId]);

  const close = () => {
    if (!placing) onClose();
  };

  const handlePlaceOrder = async (items) => {
    if (!hotelId || !items.length) return;

    setPlacing(true);
    try {
      const response = await createOrder({
        hotel_id: Number(hotelId),
        ...(reservationId ? { reservation_id: Number(reservationId) } : {}),
        items,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      if (response && (response.success || response.status)) {
        showToast({
          message: response.message || "Order placed successfully",
          variant: "success",
        });
        notifyOrdersChanged();
        onCreated?.(response.data);
        onClose();
      } else {
        showToast({
          message: response?.message || "Failed to place order",
          variant: "danger",
        });
      }
    } catch (error) {
      showToast({
        message: error?.message || "Failed to place order",
        variant: "danger",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <PopupModal
      show={show}
      onClose={close}
      header
      title={
        reservationId
          ? `New order · Booking #${reservationId}`
          : hotelFixed && hotelName
            ? `Create order · ${hotelName}`
            : "Create order"
      }
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog order-dialog"
    >
      <div
        className={`hotel-form__grid order-create__fields${hotelFixed ? " is-single" : ""}`}
      >
        {!hotelFixed && (
          <div className="hotel-form__field">
            <span className="hotel-form__label">
              Hotel <sup>*</sup>
            </span>
            {/* Type to filter hotels by name. */}
            <SelectDropDown
              multi={false}
              options={hotels}
              labelField="hotel_name"
              valueField="id"
              searchBy="hotel_name"
              values={hotels.filter((hotel) => String(hotel.id) === hotelId)}
              searchable
              placeholder="Search hotel"
              className="single-select-dropdownRenderer hotel-form__select"
              disabled={placing}
              onChange={(selected) =>
                setHotelId(selected?.[0] ? String(selected[0].id) : "")
              }
              dropdownPosition="bottom"
              dropdownHeight="240px"
              optionType="radio"
            />
          </div>
        )}
        <div className="hotel-form__field">
          <label className="hotel-form__label" htmlFor="order-notes">
            Notes
          </label>
          <input
            id="order-notes"
            className="hotel-form__input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={reservationId ? "e.g. Less spicy, serve together" : "e.g. Takeaway, less spicy"}
            disabled={placing}
          />
        </div>
      </div>

      {!hotelId ? (
        <p className="menu-dishes__empty order-create__hint">
          Select a hotel to see its menu.
        </p>
      ) : menusLoading ? (
        <p className="menu-dishes__empty order-create__hint">Loading menu…</p>
      ) : (
        // Re-mount per hotel so quantities from another hotel's menu reset.
        <MenuOrderPopup
          key={hotelId}
          menus={menus}
          onPlaceOrder={handlePlaceOrder}
          onSkip={close}
          skipLabel="Cancel"
          placing={placing}
        />
      )}
    </PopupModal>
  );
};

export default CreateOrderDialog;
