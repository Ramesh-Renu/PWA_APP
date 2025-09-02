export const initialOrderListState = {
  orderList: [],
  totalCount: null,
  loading: false,
  is_ticket: null,
  error: null,
};

export const orderCreationReducer = (state, action)=> {
  switch (action?.type) {
    case 'SET_ORDER_DATA':
      return { ...state, orderList: action.payload.orderItems, totalCount: action.payload.totalCount, is_ticket: action.payload.is_ticket };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
