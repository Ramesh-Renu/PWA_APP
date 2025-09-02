/** This component created by Ramesh R ***/
import React, { Fragment, useEffect, useState, useRef } from "react";
import LogoAvatarShowLetter from "./LogoAvatarShowLetter";
import { editIcon, unChecked, checkedIcon, searchIcon } from "assets/images/index";

const ToolTipPopup = ({
  toolTipDatas,
  isSingleEntry,
  customClass,
  customIcon,
  closePoup,
  getSeletedVal,
  labelField,
  valueField,
  defaultValue,
  searchToolTip = false,
  isCustomFieldswithFilter,
  searchPlaceholder,
  canEdit = true,
  auth,
  setClearFilter,
  arrow = false,
  customRender,
  customTop,
  customWidth,
  customRight,
  ...props
}) => {
  // const {
  //   list: filteredListDatas,
  //   filterlabel: getfilterLabel,
  //   sortBy,
  // } = useSelector((state) => state?.kanban.board.filterDataList);

  const popupRef = useRef(null);
  const [showToolTip, setShowToolTip] = useState(false);
  const [filterLabel, setfilterLabel] = useState([]);
  const [participantList, setParticipantList] = useState([]);
  const [labelListId, setLabelListId] = useState([]);
  const [searchInput, setSearchInput] = useState();
  const [filteredData, setFilteredData] = useState([]);
  const [apiFilteredData, setApiFilteredData] = useState({
    search_ticket_name: null,
    assign_to: null,
    over_due_date: false,
    due_date_next_day: false,
    due_date_next_week: false,
    due_date_next_month: false,
    no_due_date: false,
    participantids: [],
    labelId: null,
  });
  const [divHeight, setDivHeight] = useState(window.innerHeight);
  const [showAdditionalLabels, setShowAdditionalLabels] = useState(false);

  const [filteredToolTipDatas, setFilteredToolTipDatas] = useState(
    toolTipDatas ? toolTipDatas : []
  );
  const [searchToolInput, setSearchToolInput] = useState("");
  useEffect(() => {
    setFilteredToolTipDatas(toolTipDatas);
  }, [toolTipDatas]);
  // console.log('toolTipDatas',toolTipDatas);

  useEffect(() => {
    setShowToolTip(closePoup);
    setSearchToolInput("");
  }, [closePoup]);

  useEffect(() => {
    if (isCustomFieldswithFilter) {
      getSeletedVal({ apiCall: false });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDivHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the popup, close it
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        event.target.id !== "show_more_labels1" &&
        event.target.id !== "show_less_labels2"
      ) {
        setShowToolTip(false);
        setSearchToolInput("");
      }
    };
    // Attach the event listener to the document body
    document.addEventListener("click", handleClickOutside);

    // Cleanup the event listener when the component is unmounted
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSearchToolTipInput = (val) => {
    setSearchToolInput(val);
    setFilteredToolTipDatas(
      toolTipDatas !== null
        ? toolTipDatas.filter((user) =>
            user?.[labelField]
              .toLocaleLowerCase()
              .includes(val.toLocaleLowerCase())
          )
        : []
    );
    toolTipDatas.filter((user) => {
      user?.[labelField].toLocaleLowerCase().includes(val.toLocaleLowerCase());
    });
  };
  const addTaskStatus = (e) => {
    const showPopup = showToolTip ? !showToolTip : true;
    if (e.type === "click" || e.key === "Enter") {
      setShowToolTip(showPopup);
    }
  };

  const selectEntry = (val, subVal) => {
    const setData = subVal === true || subVal === "true" ? false : true;
    setShowToolTip(false);
    if (getSeletedVal) {
      getSeletedVal(val, val?.subEntry === true && setData);
    } else return;
  };

  const addLabel = (id, entry) => {
    const parsedId = id;
    if (!filterLabel.includes(parsedId)) {
      setfilterLabel([...filterLabel, parsedId]);
      setFilteredData([...filteredData, entry]);
      if (entry.key === "label_id") {
        // Only add parsedId to participantList if it doesn't already exist
        if (!labelListId.includes(parsedId)) {
          setLabelListId([...labelListId, entry.labelId]);
          setApiFilteredData({
            ...apiFilteredData,
            labelId: [...labelListId, entry.labelId],
          });
        }
      }
      if (entry.key === "participantids") {
        // Only add parsedId to participantList if it doesn't already exist
        if (!participantList.includes(parsedId)) {
          setParticipantList([...participantList, parsedId]);
          setApiFilteredData({
            ...apiFilteredData,
            participantids: [...participantList, parsedId],
          });
        }
      }
      if (entry.key !== "label_id" && entry.key !== "participantids") {
        setApiFilteredData({
          ...apiFilteredData,
          [entry.key]: entry.value,
        });
      }
    } else {
      const updatedfilterLabel = filterLabel.filter(
        (labelId) => labelId !== parsedId
      );
      const updatedfilteredData = filteredData.filter(
        (filterItem) => filterItem.filter_id !== entry.filter_id
      );
      setfilterLabel(updatedfilterLabel);
      setFilteredData(updatedfilteredData);
      if (entry.key === "label_id") {
        // Function to filter out a specific ID from labelListId
        const filteredIds = labelListId.filter(
          (labelId) => labelId !== entry.labelId
        );
        setLabelListId(filteredIds);
        setApiFilteredData({
          ...apiFilteredData,
          labelId: filteredIds?.length > 0 ? filteredIds : null,
        });
      }
      if (entry.key === "participantids") {
        // Function to filter out a specific ID from labelListId
        const filteredIds = participantList.filter(
          (labelId) => labelId !== entry.filter_id
        );
        setParticipantList(filteredIds);
        setApiFilteredData({
          ...apiFilteredData,
          participantids: filteredIds,
        });
      }
      if (entry.key !== "label_id" && entry.key !== "participantids") {
        setApiFilteredData({
          ...apiFilteredData,
          [entry.key]: false,
        });
      }
    }
  };

  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  const searchSeletedValue = (val) => {
    setShowToolTip(false);
    setShowAdditionalLabels(false);
    if (getSeletedVal && filteredData) {
      const fdata = [
        {
          ...apiFilteredData,
          search_ticket_name: searchInput ? searchInput : null,
        },
      ];
      // Check if "1" should be added or removed from filterLabel
      const updatedFilterLabel = searchInput
        ? [...new Set([...filterLabel, "1"])] // Add "1" if searchInput is not null
        : filterLabel.filter((label) => label !== "1"); // Remove "1" if searchInput is null

      setfilterLabel(updatedFilterLabel);
      getSeletedVal(fdata, updatedFilterLabel, { apiCall: true });
    } else return;
  };

  const clearFilter = () => {
    setfilterLabel([]);
    setFilteredData([]);
    getSeletedVal([], [], { apiCall: false });
    setSearchInput("");
    setParticipantList([]);
    setLabelListId([]);
    setApiFilteredData({
      search_ticket_name: null,
      assign_to: null,
      over_due_date: false,
      due_date_next_day: false,
      due_date_next_week: false,
      due_date_next_month: false,
      no_due_date: false,
      participantids: [],
      labelId: null,
    });
  };

  const heightValue =
    (divHeight > 900 ? 800 : divHeight > 600 ? divHeight : divHeight + 80) -
    210;
  const toolsDivStyle = {
    height: `${heightValue}px`,
    top: customTop,
    minWidth: customWidth || "auto",
  };
  const noneToolsDivStyle = {
    height: `auto`,
    top: customTop,
  };
  const customPopupHeight = {
    height: `${heightValue - 230}px`,
  };
  const handleShowMore = (e) => {
    setShowToolTip(true);
    if ((e = "show_more_labels")) {
      setShowAdditionalLabels(!showAdditionalLabels);
      setShowToolTip(true);
    } else if ((e = "show_less_labels")) {
      setShowAdditionalLabels(showAdditionalLabels);
      setShowToolTip(true);
    }
  };
  useEffect(() => {
    if (setClearFilter) {
      setfilterLabel([]);
      setFilteredData([]);
      getSeletedVal([], [], { apiCall: false });
      setSearchInput("");
      setParticipantList([]);
      setLabelListId([]);
      setApiFilteredData({
        search_ticket_name: null,
        assign_to: null,
        over_due_date: false,
        due_date_next_day: false,
        due_date_next_week: false,
        due_date_next_month: false,
        no_due_date: false,
        participantids: [],
        labelId: null,
      });
    }
  }, [setClearFilter]);

  return (
    <Fragment>
      <div
        className={`showToolTip ${customClass ? customClass : ""} ${
          isCustomFieldswithFilter ? "isCustomField" : ""
        }`}
        ref={popupRef}
      >
        <button
          className={`update-status`}
          onClick={(e) => addTaskStatus(e)}
          onKeyDown={(e) => addTaskStatus(e)}
          disabled={canEdit ? false : true}
        >
          {typeof customIcon === "string" && customIcon.length > 0 && (
            <img src={customIcon ? customIcon : editIcon} alt="editIcon" />
          )}
          {React.isValidElement(customIcon) && (
            <Fragment>
              {/* <span
                className={`${customIcon?.props?.className} ${
                  showToolTip ? "active" : ""
                }`}
              ></span> */}
              {customIcon}
            </Fragment>
          )}
          {!customIcon && (
            <img
              src={editIcon}
              className={showToolTip ? "active" : ""}
              alt="editIcon"
            />
          )}
        </button>
        {showToolTip && (
          <div
            className="popup-content"
            style={
              isCustomFieldswithFilter
                ? {
                    ...toolsDivStyle,
                    minWidth: customWidth || "auto",
                    right: customRight && customRight,
                  }
                : {
                    ...noneToolsDivStyle,
                    minWidth: customWidth || "auto",
                    right: customRight && customRight,
                  }
            }
          >
            {customClass === "module-status-popup" && (
              <span className="arrow-before"></span>
            )}
            {arrow && <span className="arrow-bottom-right"></span>}

            {isSingleEntry && !isCustomFieldswithFilter && (
              <div className={`showPopup`}>
                <p className="tip-entry">
                  {filteredToolTipDatas
                    ? filteredToolTipDatas
                    : "No Data Available"}
                </p>
              </div>
            )}
            {searchToolTip && (
              <div className="toollist_search">
                <input
                  onChange={(e) => handleSearchToolTipInput(e.target.value)}
                  className={`search-label-input`}
                  placeholder={searchPlaceholder ? searchPlaceholder : "Search"}
                  value={searchToolInput ? searchToolInput : ""}
                />
                <img className="searchIcon" src={searchIcon} alt="searchIcon" />
              </div>
            )}
            {!isSingleEntry && !isCustomFieldswithFilter && (
              <div className="showPopup">
                <ul className="tip-entry-main">
                  {filteredToolTipDatas?.length > 0
                    ? filteredToolTipDatas?.map((list, i) => {
                        return (
                          <li
                            className={`tip-entry ${
                              defaultValue === list?.[labelField]
                                ? "active"
                                : ""
                            } ${list?.disabled ? "disabled" : ""}`}
                            key={
                              list[valueField]
                                ? `${list[valueField]}_${i}`
                                : `fallback_${i}`
                            }
                            onClick={() =>
                              selectEntry(
                                list,
                                (list?.subEntry &&
                                  props?.subEntry &&
                                  props?.subEntryData?.filter(
                                    (sub) =>
                                      sub?.statusName == list?.[labelField]
                                  )[0]?.qaPssChangeRequest) ||
                                  undefined
                              )
                            }
                            id={list[valueField]}
                          >
                            {list?.subEntry && (
                              <span className="sub-entry">
                                <img
                                  src={
                                    props?.subEntry &&
                                    (props?.subEntryData?.filter(
                                      (sub) =>
                                        sub?.statusName === list?.[labelField]
                                    )[0]?.qaPssChangeRequest === true ||
                                      props?.subEntryData?.filter(
                                        (sub) =>
                                          sub?.statusName === list?.[labelField]
                                      )[0]?.qaPssChangeRequest === "true")
                                      ? checkedIcon
                                      : props?.subEntryData?.filter(
                                          (sub) =>
                                            sub?.statusName ===
                                            list?.[labelField]
                                        )[0]?.qaPssChangeRequest === false ||
                                        props?.subEntryData?.filter(
                                          (sub) =>
                                            sub?.statusName ===
                                            list?.[labelField]
                                        )[0]?.qaPssChangeRequest === "false"
                                      ? unChecked
                                      : unChecked
                                  }
                                  alt="checkedIcon"
                                  width={15}
                                />
                              </span>
                            )}
                            {labelField ? list[labelField] : list?.name}
                          </li>
                        );
                      })
                    : !customRender && (
                        <li className="tip-entry error-message" key="noentry">
                          No Data Available
                        </li>
                      )}
                </ul>
              </div>
            )}
            {customRender && customRender}

            {isCustomFieldswithFilter && (
              <div className="custom-popup-content">
                <header>
                  <h1 className="main-header">
                    {"Filter"}{" "}
                    <span
                      onClick={() => setShowToolTip(false)}
                      className="icon-close"
                      tabIndex="1"
                    ></span>
                  </h1>
                </header>
                {
                  <div className="search-label">
                    <h4 className="header-text">{"Keyword"}</h4>
                    <input
                      onChange={handleSearchInputChange}
                      className={`search-label-input ${
                        searchInput?.length > 0 ? "active" : ""
                      }`}
                      placeholder={
                        searchPlaceholder ? searchPlaceholder : "Search"
                      }
                      // disabled={boardData.data.length === 0 ? true : false}
                      value={searchInput ? searchInput : ""}
                    />
                    {/* <img
                    className="search-icon"
                    src={searchIcon}
                    alt="searchIcon"
                  /> */}
                    {/* , Members, Labels and more */}
                    <label>Search card/ticket name</label>
                  </div>
                }
                <div className="customList" style={customPopupHeight}>
                  {filteredToolTipDatas?.map((header, k) => {
                    if (header?.headerName === "Participants") {
                      return (
                        <Fragment key={k}>
                          <h4 className="header-text">{header?.headerName}</h4>
                          <ul
                            className={`customList-names ${
                              header?.headerName
                                ? header?.headerName
                                    .toString()
                                    .toLocaleLowerCase()
                                    .replaceAll(" ", "-")
                                : ""
                            }`}
                            key={header + 1}
                          >
                            {header?.searchList?.map((l, i) => {
                              return (
                                <li
                                  onClick={() => addLabel(l[valueField], l)}
                                  key={
                                    l[valueField] && !isNaN(l[valueField])
                                      ? `${l[valueField]}_${i}`
                                      : `fallback_${i}`
                                  }
                                  id={"filter_id-" + l[valueField]}
                                  className="user-selection "
                                >
                                  <div className="list__checkbox">
                                    <img
                                      src={
                                        filterLabel.includes(l[valueField])
                                          ? checkedIcon
                                          : unChecked
                                      }
                                      alt="checkedIcon"
                                    />
                                  </div>
                                  <LogoAvatarShowLetter
                                    genaralData={l}
                                    profileName={"displayName"}
                                    outerClassName={"data_section_list_image"}
                                    innerClassName={"userNull-image"}
                                  ></LogoAvatarShowLetter>
                                  <div className="participants-details">
                                    <p className="participants-name">
                                      {l.displayName}
                                    </p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </Fragment>
                      );
                    }
                    if (
                      header?.headerName !== "Keyword" &&
                      header?.headerName !== "Participants"
                    ) {
                      return (
                        <Fragment key={k}>
                          <h4 className="header-text">{header?.headerName}</h4>
                          <ul
                            className={`customList-names ${
                              header?.headerName
                                ? header?.headerName
                                    .toString()
                                    .toLocaleLowerCase()
                                    .replaceAll(" ", "-")
                                : ""
                            }`}
                            key={header?.headerName + 1}
                          >
                            {header?.searchList?.map((l, i) => {
                              if (
                                header?.headerName !== "Labels" ||
                                i < 3 ||
                                showAdditionalLabels
                              ) {
                                return (
                                  <li
                                    onClick={() =>
                                      addLabel(parseInt(l[valueField]), l)
                                    }
                                    key={
                                      l[valueField] && !isNaN(l[valueField])
                                        ? `${l[valueField]}_${i}`
                                        : `fallback_${i}`
                                    }
                                    id={"filter_id-" + l[valueField]}
                                  >
                                    <img
                                      src={
                                        filterLabel.includes(
                                          parseInt(l[valueField])
                                        )
                                          ? checkedIcon
                                          : unChecked
                                      }
                                      alt="checkbox"
                                    />
                                    <span
                                      style={{ backgroundColor: l?.colorcode }}
                                      className="color-box"
                                    >
                                      {l[labelField]}
                                    </span>
                                  </li>
                                );
                              } else if (i === 3) {
                                return (
                                  <li
                                    onClick={handleShowMore}
                                    key="show_more_labels"
                                    id="show_more_labels1"
                                    className="show_more_labels"
                                  >
                                    Show more labels
                                  </li>
                                );
                              }
                              return null;
                            })}
                            {showAdditionalLabels &&
                              header?.headerName == "Labels" && (
                                <li
                                  onClick={handleShowMore}
                                  key="show_less_labels"
                                  className="show_less_labels"
                                  id="show_less_labels2"
                                >
                                  Show less labels
                                </li>
                              )}
                          </ul>
                        </Fragment>
                      );
                    }
                  })}
                </div>
                <div className="buttons">
                  <button className="clear-cancel-btn" onClick={clearFilter}>
                    Clear Filter
                  </button>
                  <button
                    className="save-label-btn"
                    onClick={searchSeletedValue}
                  >
                    Search
                  </button>
                </div>
              </div>
            )}
            {customClass === "module-status-popup" && (
              <span className="arrow-after"></span>
            )}
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default ToolTipPopup;
