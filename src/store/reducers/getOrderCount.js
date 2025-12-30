export const initialReservationData = {
  data: [],
  loading: false,
  error: null,
};

export const getReservationDataReducer = (state, action) => {
  switch (action?.type) {
    case "SET_RESERVATION_DATA":
      return { ...state, data: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
