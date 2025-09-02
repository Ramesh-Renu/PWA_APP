
export const initialCompanySearchState = {
  customerSearchList: [],
};

export const companySearchReducer = (state, action) => {
  switch (action?.type) {
    case "SET_CUSTOMER_SEARCH":
      return {
        ...state,
        customerSearchList: action.payload,
      };
    default:
      return state;
  }
};
