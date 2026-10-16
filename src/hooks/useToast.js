import { isValidElement } from "react";
import { useGlobalContext } from "store/context/GlobalProvider";
import { getApiErrorDetails } from "utils/apiError";

const useToast = () => {
  const { toastState, dispatch } = useGlobalContext();

  const showToast = (payload) => {
    // A JSX message (e.g. with highlighted times) is shown as it is.
    const rich = isValidElement(payload?.message);
    const details = rich ? {} : getApiErrorDetails(payload?.message);

    dispatch({
      type: "SHOW_TOAST",
      payload: {
        ...payload,
        title:
          payload?.title ||
          (payload?.variant === "success" ? "Success" : details.title) ||
          "Request failed",
        message: rich ? payload.message : details.message,
        hint: payload?.hint || details.hint,
        variant: payload?.variant || details.variant || "danger",
      },
    });
  };

  const hideToast = () => {
    dispatch({ type: "HIDE_TOAST" });
  };

  return {
    toastState,
    showToast,
    hideToast,
  };
};

export default useToast;
