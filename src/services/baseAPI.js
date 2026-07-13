import axios from "axios";
import Config from "../config";

const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const axiosBase = axios.create({
  baseURL: Config.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ REQUEST INTERCEPTOR (ADD TOKEN)
axiosBase.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers.Timezone = USER_TIMEZONE;

    // Automatically handle FormData uploads
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR (OPTIONAL)
axiosBase.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// CORE METHODS
export const request = async (method, path, params, body, config = {}) => {
  switch (method) {
    case "GET":
      return axiosBase.get(path, { params, ...config }).then((res) => res.data);

    case "POST":
      return axiosBase
        .post(path, body, { params, ...config })
        .then((res) => res.data);

    case "PUT":
      return axiosBase
        .put(path, body, { params, ...config })
        .then((res) => res.data);

    case "PATCH":
      return axiosBase
        .patch(path, body, { params, ...config })
        .then((res) => res.data);

    case "DELETE":
      return axiosBase
        .delete(path, { data: body, params, ...config })
        .then((res) => res.data);

    default:
      throw new Error("Invalid HTTP method");
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
