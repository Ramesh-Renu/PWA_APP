export const initialAttachmentState = {
  data: [],
  confidentialData: [],
  orderId: null,
  loading: false,
  error: null,
};

export const getAttachmentFileReducer = (state, action) => {
  switch (action?.type) {
    case "SET_ATTACHMENT_DATA":
      return { ...state, data: action.payload };
    case "SET_CONFIDENTIAL_DATA":
      return { ...state, confidentialData: action.payload };
    case "SET_ATTACHMENT_ORDERID":
      return { ...state, orderId: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
