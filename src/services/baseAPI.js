import axios from "axios";
import Config from "../config";
import { API } from "constant/service";

const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const axiosBase = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

// Refresh requests must not use the interceptor client. Otherwise an expired
// access token is attached to the refresh request and a failed refresh can
// trigger another refresh attempt.
const refreshClient = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const getStoredToken = (key) => {
  const value = localStorage.getItem(key);
  return value && value !== "null" && value !== "undefined"
    ? value
    : null;
};

// ✅ REQUEST INTERCEPTOR (ADD TOKEN)
axiosBase.interceptors.request.use(
  (config) => {
    const token = getStoredToken("token");
    const headers = config.headers || {};

    if (token && !config.skipAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    // This header is used by the API for date/time calculations. Axios sets
    // Content-Type for JSON bodies only; FormData must set its own boundary.
    headers.Timezone = USER_TIMEZONE;

    if (config.data instanceof FormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR (OPTIONAL)
const getRefreshedTokens = (response) => response?.data?.data || response?.data || {};

axiosBase.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const refreshToken = getStoredToken("refreshToken");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== API.GET_REFRESH_TOCKEN &&
      refreshToken &&
      refreshToken !== "null"
    ) {
      originalRequest._retry = true;

      try {
        const response = await refreshClient.post(API.GET_REFRESH_TOCKEN, {
          refreshToken,
        });
        const tokens = getRefreshedTokens(response);

        if (tokens?.accessToken) {
          localStorage.setItem("token", tokens.accessToken);

          if (tokens.refreshToken) {
            localStorage.setItem("refreshToken", tokens.refreshToken);
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return axiosBase(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// CORE METHODS
export const request = async (method, path, params, body, config = {}) => {
  const requestConfig = { ...config, params };

  switch (method) {
    case "GET":
      return axiosBase.get(path, requestConfig).then((res) => res.data);

    case "POST":
      return axiosBase.post(path, body, requestConfig).then((res) => res.data);

    case "PUT":
      return axiosBase.put(path, body, requestConfig).then((res) => res.data);

    case "PATCH":
      return axiosBase.patch(path, body, requestConfig).then((res) => res.data);

    case "DELETE":
      return axiosBase
        .delete(path, { ...requestConfig, data: body })
        .then((res) => res.data);

    default:
      throw new Error(`Invalid HTTP method: ${method}`);
  }
};

export default {
  GET: (path, params, config) =>
    request("GET", path, params, null, config),

  POST: (path, body, params, config) =>
    request("POST", path, params, body, config),

  PUT: (path, body, params, config) =>
    request("PUT", path, params, body, config),

  PATCH: (path, body, params, config) =>
    request("PATCH", path, params, body, config),

  DELETE: (path, body, params, config) =>
    request("DELETE", path, params, body, config),
};
