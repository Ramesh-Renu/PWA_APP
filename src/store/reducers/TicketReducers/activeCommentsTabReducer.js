export const initialActiveCommentsTabState = {
  activityType: { type: 1, year: '' },
  showActivity: false,
};

export const activeCommentsTabReducer = (state, action) => {
  switch (action?.type) {
    case 'SHOW_ACTIVE_COMMENTS_TAB':
      return {
        activityType: action.payload.activityType,
        showActivity: !!action.payload.showFilter,
      };
    case 'CLEAR_ACTIVE_COMMENTS_TAB':
      return initialActiveCommentsTabState;
    default:
      return state;
  }
};