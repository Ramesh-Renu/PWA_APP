import { useCallback, useEffect } from "react";
import { useGlobalContext } from "store/context/GlobalProvider";
import { getLogin, logout, getUserInfo } from "services";

const useAuth = () => {
  const { authState, dispatch } = useGlobalContext();

  // 🔐 LOGIN
  const getAuth = useCallback(
    async (params) => {
      dispatch({ type: "SET_LOADING" });
      try {
        const response = await getLogin(params);
        const token = response.data.accessToken;

        localStorage.setItem("token", token);
        dispatch({ type: "SET_AUTH", payload: token });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error });
      }
    },
    [dispatch]
  );
  // 🔄 AUTO LOGIN (RUN ONCE)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch({ type: "SET_AUTH", payload: token });
    }
  }, [dispatch]);

  // const getUserInfoData = useCallback(
  //   async (params) => {
  //     dispatch({ type: "SET_LOADING" });
  //     try {
  //       const response = await getUserInfo(params);
  //       const token = response.data.accessToken;

  //       localStorage.setItem("token", token);
  //       dispatch({ type: "SET_AUTH", payload: token });
  //     } catch (error) {
  //       dispatch({ type: "SET_ERROR", payload: error });
  //     }
  //   },
  //   [dispatch]
  // );
  // 🚪 LOGOUT
  const logoutUser = useCallback(() => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  }, [dispatch]);

  return [
    {
      data: authState?.activeUser?.data,
      loading: authState.loading,
      error: authState.error,
      logoutError: authState.logoutError,
      logoutLoading: authState.logoutLoading,
    },
    {
      getAuth,
      logoutUser,
      // getUserInfoData
    },
  ];
};

export default useAuth;
