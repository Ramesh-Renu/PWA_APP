import React, { createContext, useContext, useReducer } from "react";
import { authReducer, initialAuthState } from "../reducers/authReducer";
import { toastReducer, initialToastState } from "../reducers/toastReducer";
import { orderCreationReducer, initialOrderListState } from "../reducers/orderCreationReducer";
import { filterValuesReducer, initialFilterState } from "../reducers/filterValuesReducer";
import { masterDataReducer, masterDataState } from "../reducers/masterDataReducer";
import { initialOrderCountState, getOrderCountReducer } from "../reducers/getOrderCount";
import { workspaceReducer, initialWorkspaceState } from "../reducers/workspaceReducer";
import { notificationReducer, initialNotificationState } from "../reducers/notificationReducer";
import { companySearchReducer, initialCompanySearchState } from "../reducers/companySearchReducer";
import { initialTicketDetailState, getOrderTicketDetailsReducer } from "../reducers/TicketReducers/getOrderTicketDetailsReducer";
import { initialActiveCommentsTabState, activeCommentsTabReducer } from '../reducers/TicketReducers/activeCommentsTabReducer';
import { initialInstrumentState, getInstrumentListReducer } from "../reducers/TicketReducers/getInstrumentListReducer";
import { initialAttachmentState, getAttachmentFileReducer } from "../reducers/TicketReducers/getAttachmentFileReducer";
import { initialWorkSpaceFilterState, workSpaceFilterValuesReducer } from "../reducers/workspaceFilterReducer";
import { initialUserBoardPermission, getUserBoardPermissionReducer } from "../reducers/UserReducers/getUserBoardPermissionReducer";

const GlobalContext = createContext();

const combineReducers = (reducers) => {
  return (state, action) => {
    return Object.keys(reducers).reduce((acc, key) => {
      acc[key] = reducers[key](state[key], action);
      return acc;
    }, {});
  };
};

const rootReducer = combineReducers({
  authState: authReducer,
  toastState: toastReducer,
  orderListState: orderCreationReducer,
  filterState: filterValuesReducer,
  workSpaceFilterState: workSpaceFilterValuesReducer,
  masterState: masterDataReducer,
  orderCountState: getOrderCountReducer,
  workspaceState: workspaceReducer,
  notificationState: notificationReducer,
  companySearchState: companySearchReducer,
  ticketDetails: getOrderTicketDetailsReducer,
  activeCommentsTab: activeCommentsTabReducer,
  instrumentData: getInstrumentListReducer,
  attachmentData: getAttachmentFileReducer,
  userBoardPermission: getUserBoardPermissionReducer
});

const initialState = {
  authState: initialAuthState,
  toastState: initialToastState,
  orderListState: initialOrderListState,
  filterState: initialFilterState,
  workSpaceFilterState: initialWorkSpaceFilterState,
  masterState: masterDataState,
  orderCountState: initialOrderCountState,
  workspaceState: initialWorkspaceState,
  notificationState: initialNotificationState,
  companySearchState: initialCompanySearchState,
  ticketDetails: initialTicketDetailState,
  activeCommentsTab: initialActiveCommentsTabState,
  instrumentData: initialInstrumentState,
  attachmentData:initialAttachmentState,
  userBoardPermission: initialUserBoardPermission,
};

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, initialState);

  return (
    <GlobalContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};


export const useGlobalContext = () => useContext(GlobalContext);