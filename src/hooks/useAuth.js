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
        const refreshToken = response.data.refreshToken;
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        dispatch({ type: "SET_AUTH", payload: token });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error });
        // ✅ RETURN BACKEND RESPONSE
        return error.response; // ⭐⭐⭐ THIS FIXES IT
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [dispatch]
  );

  const getUserInfoData = useCallback(
    async (params) => {
      dispatch({ type: "SET_LOADING" });
      try {
        const response = await getUserInfo(params);
        const data = response.user;
        localStorage.setItem("userInfo", JSON.stringify(data));
        dispatch({ type: "SET_ACTIVE_USER_INFO", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error });
        localStorage.setItem("token" , null);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [dispatch]
  );
  // 🚪 LOGOUT
  const logoutUser = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
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
      getUserInfoData,
    },
  ];
};

export default useAuth;
