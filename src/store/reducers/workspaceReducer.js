export const initialWorkspaceState = {
  activeWorkSpace: null,
  activeBoard: null,
  activeDepartmentPermission: null,
};

export const workspaceReducer = (state, action) => {
  switch (action?.type) {
    case "SET_ACTIVE_WORKSPACE":
      return { ...state, activeWorkSpace: action.payload };
    case "SET_ACTIVE_BOARD":
      return { ...state, activeBoard: action.payload };
    case "SET_ACTIVE_DEPARTMENT_PERMISSION":
      return { ...state, activeDepartmentPermission: action.payload };
    default:
      return state;
  }
};
