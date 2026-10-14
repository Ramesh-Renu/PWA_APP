import React, { useEffect, useState } from "react";
import PopupModal from "components/common/PopupModal";
import SelectDropDown from "components/common/SelectDropDown";
import { getAllHotel } from "services";

const unwrapList = (response) => {
  const value = response?.rows ?? response?.data ?? response;
  return Array.isArray(value) ? value : [];
};

/**
 * Front desk: start a booking for a guest (phone or walk-in). Picks the hotel
 * and who the table is for, then opens that hotel's booking page (time slot →
 * seats) with the guest attached.
 */
const NewReservationDialog = ({ show, onClose, onContinue }) => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!show) return;
    setHotelId("");
    setName("");
    setMobile("");
    setTouched(false);
    getAllHotel()
      .then((response) => setHotels(unwrapList(response)))
      .catch(() => setHotels([]));
  }, [show]);

  const errors = {
    hotel: !hotelId ? "Choose a hotel" : "",
    name: !name.trim() ? "Enter the guest's name" : "",
    // Mobile is optional; when given it must be a full number.
    mobile: mobile && mobile.length !== 10 ? "Enter a 10-digit mobile number" : "",
  };
  const valid = !errors.hotel && !errors.name && !errors.mobile;

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!valid) return;
    const hotel = hotels.find((row) => String(row.id) === hotelId);
    onContinue({ hotel, guest: { name: name.trim(), mobile } });
  };

  return (
    <PopupModal
      show={show}
      onClose={onClose}
      header
      title="New reservation"
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
    >
      <form className="hotel-form" onSubmit={submit} noValidate>
        <p className="new-reservation__intro">
          Book a table for a guest who called or walked in. Next you'll pick the time
          and seats.
        </p>

        <div className="hotel-form__field">
          <span className="hotel-form__label">
            Hotel <sup>*</sup>
          </span>
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
            onChange={(selected) => setHotelId(selected?.[0] ? String(selected[0].id) : "")}
            dropdownHeight="240px"
            dropdownPosition="bottom"
            optionType="radio"
          />
          {touched && errors.hotel && <small className="hotel-form__error">{errors.hotel}</small>}
        </div>

        <div className="hotel-form__grid">
          <div className="hotel-form__field">
            <label className="hotel-form__label" htmlFor="guest-name">
              Guest name <sup>*</sup>
            </label>
            <input
              id="guest-name"
              className="hotel-form__input"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Priya"
              autoComplete="off"
            />
            {touched && errors.name && <small className="hotel-form__error">{errors.name}</small>}
          </div>
          <div className="hotel-form__field">
            <label className="hotel-form__label" htmlFor="guest-mobile">
              Mobile <span className="cx-optional">optional</span>
            </label>
            <input
              id="guest-mobile"
              className="hotel-form__input"
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit number"
              autoComplete="off"
            />
            {touched && errors.mobile && (
              <small className="hotel-form__error">{errors.mobile}</small>
            )}
          </div>
        </div>

        <div className="hotel-form__actions">
          <button type="button" className="hotel-form__btn hotel-form__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="hotel-form__btn hotel-form__btn--primary">
            Choose time &amp; seats
          </button>
        </div>
      </form>
    </PopupModal>
  );
};

export default NewReservationDialog;
