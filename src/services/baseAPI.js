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
export const request = async (method, path, params, body) => {
  switch (method) {
    case "GET":
      return axiosBase.get(path, { params }).then((res) => res.data);

    case "POST":
      return axiosBase.post(path, body, { params }).then((res) => res.data);

    case "PUT":
      return axiosBase.put(path, body, { params }).then((res) => res.data);

    case "PATCH":                                                // ⭐ NEW
      return axiosBase.patch(path, body, { params }).then((res) => res.data);

    case "DELETE":
      return axiosBase
        .delete(path, { data: body, params })
        .then((res) => res.data);

    default:
      throw new Error("Invalid HTTP method");
  }
};


export default {
  GET: (path, params) => request("GET", path, params),
  POST: (path, body, params) => request("POST", path, params, body),
  PUT: (path, body, params) => request("PUT", path, params, body),
  PATCH: (path, body, params) => request("PATCH", path, params, body),  // ⭐ NEW
  DELETE: (path, body, params) => request("DELETE", path, params, body),
};
