export const initialWorkSpaceFilterState = {
  filterValues: {
    searchTxt: null,
    team: null,
    country: null,
    workspace: null,
    board: null,
    userType: 0,
    designation: null,
    pageOffset: 0,
    pageSize: 10,
    sortBy: "team",
    sortOrder: "desc",
  },
  clearFilterValues: {
    searchTxt: null,
    team: null,
    country: null,
    workspace: null,
    board: null,
    userType: 0,
    designation: null,
    pageOffset: 0,
    pageSize: 10,
    sortBy: "team",
    sortOrder: "desc",
  },
  loading: false,
  error: null,
  showFilter: false,
};

export const workSpaceFilterValuesReducer = (state, action) => {
  switch (action?.type) {
    case "SET_WORKSPACE_FILTER":
      return { ...state, filterValues: action.payload, showFilter: true };
    case "CLEAR_WORKSPACE_FILTER":
      return {
        ...state,
        filterValues: state.clearFilterValues,
        showFilter: false,
      };
    default:
      return state;
  }
};
