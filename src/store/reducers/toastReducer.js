export const initialToastState = {
  title: "",
  message: "",
  hint: "",
  variant: "info",
  showToast: false,
  showTime: null,
};

export const toastReducer = (state, action) => {
  switch (action?.type) {
    case "SHOW_TOAST":
      return {
        ...state,
        title: action.payload.title,
        message: action.payload.message,
        hint: action.payload.hint,
        variant: action.payload.variant || "info",
        showToast: true,
        showTime: action.payload.showTime || null,
      };
    case "HIDE_TOAST":
      return {
        ...initialToastState,
      };
    default:
      return state;
  }
};
