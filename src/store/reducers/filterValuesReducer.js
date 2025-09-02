export const initialFilterState = {
  filterValues: {
    allUser: 0,
    searchTxt: null,
    orderStatus: [],
    orderLabels: [],
    dueDateRange: {
      thisWeek: false,
      thisMonth: false,
      overDue: false,
      customDate: false,
      customDateRange: {
        from: "",
        to: "",
      },
    },
    orderCategory: [],
    orderType: [],
    assignee: [],
    orderDateRange: {
      thisWeek: false,
      thisMonth: false,
      customDate: false,
      customDateRange: {
        from: "",
        to: "",
      },
    },
    pageOffSet: 0,
    pageSize: 20,
    sortBy: "orderDate",
    sortOrder: "desc",
  },
  clearFilterValues: {
    allUser: 0,
    searchTxt: null,
    orderStatus: [],
    orderLabels: [],
    dueDateRange: {
      thisWeek: false,
      thisMonth: false,
      overDue: false,
      customDate: false,
      customDateRange: {
        from: "",
        to: "",
      },
    },
    orderCategory: [],
    orderType: [],
    assignee: [],
    orderDateRange: {
      thisWeek: false,
      thisMonth: false,
      customDate: false,
      customDateRange: {
        from: "",
        to: "",
      },
    },
    pageOffSet: 0,
    pageSize: 20,
    sortBy: "orderDate",
    sortOrder: "desc",
  },
  loading: false,
  error: null,
  showFilter: false,
};

export const filterValuesReducer = (state, action) => {
  switch (action?.type) {
    case "SET_FILTER":
      return {
        ...state,
        filterValues: action.payload,
        showFilter: true,
      };
    case "CLEAR_FILTER":
      return {
        ...state,
        filterValues: state.clearFilterValues,
        showFilter: false,
        allOrders: 0,
      };
    default:
      return state;
  }
};
