import { useGlobalContext } from "store/context/GlobalProvider";

const useToast = () => {
  const { toastState, dispatch } = useGlobalContext();

  const showToast = (payload) => {
    dispatch({ type: "SHOW_TOAST", payload });
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
