export const initialOrderCountState = {
  orderCount: null,
  loading: false,
  error: null,
};

export const getOrderCountReducer = (state, action) => {
  switch (action?.type) {
    case "SET_ORDER_COUNT":
      return { ...state, orderCount: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
