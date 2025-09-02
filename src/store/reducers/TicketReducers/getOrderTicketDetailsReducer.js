

export const initialTicketDetailState = {
  orderTicketDetails: null,
  loading: false,
  error: null,
};

export const getOrderTicketDetailsReducer = (state, action) => {
  switch (action?.type) {
    case "SET_TICKET_DETAILS":
      return { ...state, orderTicketDetails: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
