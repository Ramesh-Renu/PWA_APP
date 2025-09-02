/** This component created by Ramesh R ***/
import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import DateTime from "react-datetime";
import "react-datetime/css/react-datetime.css"; // Import the default styling
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import moment from "moment";

const DateTimeCalendar = ({
  value,
  dateFormat,
  placeholder,
  getDateTime,
  assignDueDateValidation,
  orderDateValidation,
  dueDateValidation,
  isDueDate,
  isOrderDate,
  timeFormat,
  customRenderInput,
  className,
  calendarPosition,
  customCancel,
  iconShow,
  ...rest
}) => {
  dayjs.extend(utc);
  dayjs.utc(false); // Set dayjs to use local time
  const [selectedDate, setSelectedDate] = useState(
    value?.length > 0
      ? dayjs.utc(value).local().format(dateFormat)
      : timeFormat
      ? dayjs.utc(new Date()).local().format(dateFormat)
      : ""
  );
  const [dateTimeEdited, setDateTimeEdited] = useState(false);
  const [showContent, setShowContent] = useState("");
  const dateTimeRef = useRef(null);
  const handleChange = (date) => {
    setSelectedDate(date);
    setDateTimeEdited(true);
    setShowContent("");
  };
  useEffect(() => {
    if (value) {
      setDateTimeEdited(false);
    } else {
      setDateTimeEdited(true);
    }
    if (value?.length == 0) {
      handleCancel();
    }
    setSelectedDate(
      value?.length > 0
        ? dayjs.utc(value).local().format(dateFormat)
        : timeFormat
        ? dayjs.utc(new Date()).local().format(dateFormat)
        : ""
    );
  }, [value]);

  const handleOK = () => {
    // Handle OK button click action here
    if (dateTimeRef.current && dateTimeEdited) {
      getDateTime(selectedDate);
      dateTimeRef.current._closeCalendar(); // Close the calendar popover
      setShowContent("");
    } else {
      dateTimeRef.current._closeCalendar(); // Close the calendar popover
      setShowContent("");
    }
  };

  const handleCancel = () => {
    // Handle Cancel button click action here
    setSelectedDate("");
    if (dateTimeRef.current) {
      dateTimeRef.current.state.inputValue = value
        ? dayjs.utc(value).local().format("DD/MM/YYYY")
        : "";
      setSelectedDate(
        value ? dayjs.utc(value).local().format("DD/MM/YYYY") : ""
      );
      setShowContent("");
      dateTimeRef.current._closeCalendar(); // Close the calendar popover
    }
    if (customCancel) {
      customCancel();
    }
  };

  /**  Function to validate if a date is valid or not**/
  const isValidDate = (current) => {
    if (orderDateValidation) {
      // Disable dates before isDueDate
      if (isDueDate) {
        return current.isBefore(moment(isDueDate).subtract(0, "day"));
      } else {
        return current.isBefore(moment().subtract(0, "day"));
      }
    }
    if (dueDateValidation) {
      // Disable dates After isOrderDate
      // return current.isSameOrAfter(isOrderDate);
      return current.isAfter(moment().subtract(1, "day"));
    }
    if (assignDueDateValidation) {
      if (isDueDate) {
        // Restrict to dates before `isDueDate` and before the current date
        // current.isBefore(moment(isDueDate).subtract(0, "day")) &&
        return (
          current.isAfter(moment().subtract(1, "day")) &&
          current.isBefore(moment(isDueDate).subtract(-1, "day"))
        );
      } else {
        // Restrict to dates After the current date only
        return current.isAfter(moment().subtract(1, "day"));
      }
    }
    return true;
  };

  const customRenderer = (viewMode, renderDefault) => {
    return (
      <div className="wrapper">
        <div className="calendar-wrapper">{renderDefault()}</div>
        <div className="time-picker-wrapper">
          <div className="button-container">
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleOK}>OK</button>
          </div>
        </div>
      </div>
    );
  };
  const handleShowPopup = (id) => {
    setShowContent(id);
  };

  // Function to render each day cell
  const renderDay = (props, currentDate, selectedDate) => {
    const { className, ...otherProps } = props;
    const disabled = className && className.includes("rdtDisabled");
    if (disabled && dueDateValidation) {
      return (
        <td
          {...otherProps}
          className={className}
          onClick={() => handleShowPopup(currentDate?._d)}
        >
          {currentDate.date()}
          {currentDate?._d.toString() == showContent.toString() && (
            <div className="disabled-date-error-show">
              {/* Due Date and Time can't be lesser than Order Date and Time */}
              Select a date which is greater than the ticket’s created date
            </div>
          )}
        </td>
      );
    } else if (
      (disabled && orderDateValidation && isDueDate) ||
      (disabled && assignDueDateValidation && isDueDate)
    ) {
      return (
        <td
          {...otherProps}
          className={className}
          onClick={() => handleShowPopup(currentDate?._d)}
        >
          {currentDate.date()}
          {currentDate?._d.toString() == showContent.toString() && (
            <div className="disabled-date-error-show">
              {assignDueDateValidation
                ? "Select a date which is lesser than the ticket’s due date" //"Due Date can't be greater than Ticket Due Date and less than Current Date"
                : "Order Date and Time can't be greater than Due Date and Time"}
            </div>
          )}
        </td>
      );
    } else {
      return (
        <td
          {...props}
          // className={`rdtDay ${
          //   currentDate.isSame(dayjs(value), "day") ? "rdtActive rdtToday" : ""
          // }`}
        >
          {currentDate.date()}
        </td>
      );
    }
  };

  let inputProps = {
    placeholder: placeholder || "Select the Date",
    readOnly: true,
  };

  const handleToggleCalendar = () => {
    if (dateTimeRef.current?.state?.open) {
      dateTimeRef.current._closeCalendar?.();
    } else {
      dateTimeRef.current._openCalendar?.();
    }
  };

  return (
    <>
      {customRenderInput ? (
        <DateTime
          value={selectedDate}
          onChange={handleChange}
          inputProps={{ ...inputProps, disabled: rest.disabled }}
          renderView={customRenderer}
          updateOnView={"days"}
          dateFormat={dateFormat ? dateFormat : "YYYY-MM-DD"}
          isValidDate={isValidDate}
          ref={dateTimeRef}
          utc={false} // Display time in system's local time format
          renderDay={renderDay}
          timeFormat={timeFormat ? timeFormat : false}
          renderInput={(props, openCalendar) => (
            <div onClick={openCalendar} style={{ cursor: "pointer" }}>
              {customRenderInput}
            </div>
          )}
          {...rest}
          className={className}
        ></DateTime>
      ) : (
        <>
          <DateTime
            value={selectedDate}
            onChange={handleChange}
            inputProps={{ ...inputProps, disabled: rest.disabled }}
            renderView={customRenderer}
            updateOnView={"days"}
            dateFormat={dateFormat ? dateFormat : "YYYY-MM-DD"}
            onFocus={(event) => {
              event.target.click(); // Open the calendar on focus
            }}
            isValidDate={isValidDate}
            ref={dateTimeRef}
            utc={false} // Display time in system's local time format
            renderDay={renderDay}
            timeFormat={timeFormat ? timeFormat : false}
            className={`${
              className || ""
            } calendar-position-${calendarPosition}`}
            calendarPosition={"top"}
            {...rest}
          ></DateTime>
          {iconShow && (
            <span
              className="icon-ss-calendar"
              onClick={!rest.disabled ? handleToggleCalendar : undefined}
              style={{ cursor: "pointer" }}
            ></span>
          )}
        </>
      )}
    </>
  );
};

export default DateTimeCalendar;
