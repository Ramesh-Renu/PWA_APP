import React, { createContext, useContext, useReducer } from "react";
import { authReducer, initialAuthState } from "../reducers/authReducer";
import { toastReducer, initialToastState } from "../reducers/toastReducer";
import { orderCreationReducer, initialOrderListState } from "../reducers/orderCreationReducer";
import { filterValuesReducer, initialFilterState } from "../reducers/filterValuesReducer";
import { masterDataReducer, masterDataState } from "../reducers/masterDataReducer";
import { initialOrderCountState, getOrderCountReducer } from "../reducers/getOrderCount";
import { notificationReducer, initialNotificationState } from "../reducers/notificationReducer";

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
  masterState: masterDataReducer,
  orderCountState: getOrderCountReducer,
  notificationState: notificationReducer,
});

const initialState = {
  authState: initialAuthState,
  toastState: initialToastState,
  orderListState: initialOrderListState,
  filterState: initialFilterState,
  masterState: masterDataState,
  orderCountState: initialOrderCountState,
  notificationState: initialNotificationState,
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