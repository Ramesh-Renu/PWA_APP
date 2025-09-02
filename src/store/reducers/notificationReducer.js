export const initialNotificationState = {
  recentNotifications: [],
};

export const notificationReducer = (state, action) => {
  switch (action?.type) {
    case "SET_RECENT_NOTIFICATIONS":
      return {
        ...state,
        recentNotifications: action.payload,
      };
    default:
      return state;
  }
};
