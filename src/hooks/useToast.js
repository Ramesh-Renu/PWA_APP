import { useGlobalContext } from "store/context/GlobalProvider";

const useToast = () => {
  const { toastState, dispatch } = useGlobalContext();

  const getToastMessage = (message) => {
    if (typeof message === "string") {
      return message;
    }

    if (message?.response?.data?.message) {
      return message.response.data.message;
    }

    if (message?.message) {
      return message.message;
    }

    if (message == null) {
      return "";
    }

    return "Something went wrong";
  };

  const showToast = (payload) => {
    dispatch({
      type: "SHOW_TOAST",
      payload: {
        ...payload,
        message: getToastMessage(payload?.message),
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
