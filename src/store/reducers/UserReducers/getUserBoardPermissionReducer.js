export const initialUserBoardPermission = {
  userBoards: null,
  loading: false,
  error: null,
};

export const getUserBoardPermissionReducer = (state, action) => {
  switch (action?.type) {
    case "SET_USER_BOARD_PERMISSION":
      return { ...state, userBoards: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
