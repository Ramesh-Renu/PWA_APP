// context/authReducer.js

import { logDOM } from "@testing-library/dom";

export const initialAuthState = {
  activeUser: {
    data: {
      accessToken: null,
      details: null,
      restrictions: null,
      activePermission: null
    },
    loading: false,
    error: null,
  },
  logout: {
    loading: false,
    error: null,
  },
  userDetailsById: {
    data: [],
    loading: false,
    error: null,
  },
};

export const authReducer = (state, action) => {
  switch (action?.type) {
    case "SET_AUTH":
      return {
        ...state,
        activeUser: {
          ...state.activeUser,
          data: {
            ...state.activeUser.data,
            accessToken: action.payload,
          },
        },
      };

    case "SET_ACTIVE_USER_INFO":      
      return {
        ...state,
        activeUser: {
          ...state.activeUser,
          data: {
            ...state.activeUser.data,
            details: action.payload,
          },
        },
      };
    case "LOGOUT":
      return initialAuthState;

    default:
      return state;
  }
};
