import React, { Fragment, useState } from "react";
import Select from "react-dropdown-select";
import {
  checkedIcon,
  unChecked,
  radioChecked,
  radioUnChecked,
  tick,
  tickeCheck,
} from "../../assets/images/index";
import { Form } from "react-bootstrap";

const SelectDropDown = ({ options, ...props }) => {
  const [searchValue, setSearchValue] = useState("");

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  };

  /** CUSTOMIZED SINGLE SELECT DROPDOWN */
  const singleSelectDropdown = ({ props, state, methods }) => {
    const regexp = new RegExp(escapeRegExp(state.search), "i");
    if (state.values.length === 0) {
      state.searchResults = props?.options?.filter(
        (item) =>
          regexp.test(item[props?.labelField]) ||
          regexp.test(item[props?.valueField])
      );
    }
    if (state.values.length === 1) {
      state.search = "";
    }

    return (
      <div className="dropdwonList-main" key={`dropdown-main-${props.title}`}>
        {props.title && <p className="dropdwonList-head">{props.title}</p>}
        <div
          className="dropdwonLists single"
          key={`dropdown-list-${props.title}-single`}
        >
          {props.options
            .filter((item) =>
              regexp.test(item[props.searchBy] || item[props.labelField])
            )
            .map((option, i) => (
              <Fragment key={i}>
                <p
                  className={
                    option.disabled
                      ? "dropdwonLists-label disabled"
                      : "dropdwonLists-label"
                  }
                  onClick={() => methods.addItem(option)}
                  disabled={option.disabled}
                >
                  {props.optionType && props.optionType == "radio" && (
                    <img
                      onChange={() => methods.addItem(option)}
                      className="checkbox-img"
                      src={
                        state.values.filter(
                          (o) =>
                            o[props.valueField] === option[props.valueField]
                        ).length > 0
                          ? radioUnChecked
                          : radioChecked
                      }
                      alt=""
                    />
                  )}
                  {props.optionType && props.optionType === "tick" && (
                    <img
                      onChange={() => methods.addItem(option)}
                      className="checkbox-img"
                      src={option.status === "close" ? tickeCheck : tick}
                      alt=""
                    />
                  )}
                  <label>{option[props.labelField]}</label>
                </p>
              </Fragment>
            ))}
          {state?.searchResults?.length === 0 &&
            state.search?.trim() &&
            (props.isCanAddNew ? (
              <div className="p-2">
                <div className="d-flex flex-row justify-content-between align-items-center mt-2">
                  <div className="text-muted ">
                    Do you want add this {props?.labelValue} ?
                  </div>
                  <button
                    className="btn addButton border-0"
                    onClick={() => {
                      const newItem = {
                        [props?.valueField]: 0,
                        [props?.keyValue]: state.search.trim(),
                      };
                      methods.addItem(newItem);
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="text-center text-danger fs-12 text-capitalize py-3">
                  {props.options.length > 0 &&
                    (props?.notFoundText || `${props?.keyValue} Not found`)}
                </div>
              </div>
            ) : (
              <p className="error-show">Name not found</p>
            ))}
          {props.options.length === 0 &&
            state.search?.trim()?.length === 0 &&
            props.isCanAddNew && (
              <div className="p-2">
                <div className="d-flex flex-row align-items-center mt-2">
                  <div className="text-muted text-center m-auto">
                    Enter and Add the {props?.labelValue}
                  </div>
                </div>
                <div className="text-center text-danger fs-12 text-capitalize py-3">
                  {`No ${props?.labelValue} List`}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const multiSelectDropdown = ({ props, state, methods }) => {
    const regexp = new RegExp(escapeRegExp(searchValue || ""), "i");

    state.searchResults = props?.options?.filter(
      (item) =>
        regexp.test(item[props?.labelField]) ||
        regexp.test(item[props?.valueField])
    );
    const setOptionValue = (option) => {
      methods.addItem(option);
    };

    return (
      <div className="dropdwonList-main" key={`dropdown-main-${props.title}`}>
        {props.title && <p className="dropdwonList-head">{props.title}</p>}
        {props.customSearch && (
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  // Prevent dropdown library from clearing selected values
                  e.stopPropagation();
                }
              }}
              className="dropdwonList-search"
            />
          </div>
        )}
        <div
          className="dropdwonLists"
          key={`dropdown-list-${props.title}-multiple`}
        >
          {props.options
            .filter((item) =>
              regexp.test(item[props.searchBy] || item[props.labelField])
            )
            .map((option, i) => (
              <div
                tabIndex={0}
                className={`
                ${
                  option.disabled
                    ? "dropdwonLists-label disabled"
                    : "dropdwonLists-label"
                }
                `}
                key={i}
                onClick={() => setOptionValue(option)}
                disabled={option.disabled}
              >
                {props.optionType && props.optionType == "checkbox" && (
                  <img
                    onChange={() => methods.addItem(option)}
                    className="checkbox-img"
                    src={
                      state?.values?.filter(
                        (o) => o[props.valueField] === option[props.valueField]
                      ).length > 0
                        ? checkedIcon
                        : unChecked
                    }
                    alt=""
                  />
                )}
                <label>{option[props.labelField]}</label>
              </div>
            ))}
          {state?.searchResults?.length === 0 && (
            <p className="error-show">Name not found</p>
          )}
        </div>
      </div>
    );
  };

  /** CUSTOMIZED DROPDOWN RENDER - Lested List */
  const nestedListCustomDropdownRenderer = ({ props, state, methods }) => {
    return (
      <div className="dropdwonList-main" key={`dropdown-main-${props.title}`}>
        {props.title && <p className="dropdwonList-head">{props.title}</p>}
        <div
          className="dropdwonLists"
          key={`dropdown-list-${props.title}-custom`}
        >
          {props.options.map((option, i) => (
            <Fragment key={`dropdown-option-${i + "1"}`}>
              {option.countryList && (
                <p className="dropdwonList-subhead">{option.name}</p>
              )}
              {option.countryList &&
                option.countryList.map((opt, k) => {
                  return (
                    <Fragment key={`dropdown-option-${k + "2"}`}>
                      <p
                        className={
                          option.disabled
                            ? "dropdwonLists-label sub-list disabled"
                            : "dropdwonLists-label sub-list"
                        }
                        disabled={option.disabled}
                        key={opt.countryId}
                        onClick={() => methods.addItem(opt)}
                      >
                        <img
                          onChange={() => methods.addItem(opt)}
                          className="checkbox-img"
                          src={
                            state?.values?.find(
                              (o) => o.countryId === opt.countryId
                            )
                              ? checkedIcon
                              : unChecked
                          }
                          alt=""
                        />
                        <label>{opt.name + " (" + opt.code + ")"}</label>
                      </p>
                    </Fragment>
                  );
                })}
            </Fragment>
          ))}
        </div>
      </div>
    );
  };  
  return (
    <>
      <Select
        options={options}
        {...props}
        dropdownRenderer={
          props.nestedList && props.multi === true
            ? nestedListCustomDropdownRenderer
            : props.multi
            ? multiSelectDropdown
            : singleSelectDropdown
        }
        contentRenderer={props.contentRenderer}
        disabled={props.disabled}
      ></Select>
      {props?.isInvalid && (
        <Form.Text className="text-danger">{props?.errorMsg}</Form.Text>
      )}
    </>
  );
};

export default SelectDropDown;
