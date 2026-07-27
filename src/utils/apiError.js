import axios from "axios";

const getResponseMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.detail;

const isCrossOriginRequest = (error) => {
  if (typeof window === "undefined") return false;

  try {
    const requestUrl = new URL(
      error?.config?.baseURL || error?.config?.url,
      window.location.origin,
    );
    return requestUrl.origin !== window.location.origin;
  } catch {
    return false;
  }
};

export const getApiErrorDetails = (error) => {
  if (!error) {
    return {
      title: "Request failed",
      message: "Something went wrong. Please try again.",
      hint: "",
      variant: "danger",
    };
  }

  if (typeof error === "string") {
    if (/network error|failed to fetch|cors|proxy/i.test(error)) {
      return {
        title: "API connection blocked",
        message: "The browser could not complete the API request.",
        hint: "This may be a CORS/proxy or API URL configuration problem.",
        variant: "danger",
      };
    }

    if (/timeout|timed out/i.test(error)) {
      return {
        title: "Connection timeout",
        message: "The server took too long to respond.",
        hint: "Check the API server and try again.",
        variant: "warning",
      };
    }

    return {
      title: "Request failed",
      message: error,
      hint: "",
      variant: "danger",
    };
  }

  const status = error.response?.status;
  const responseMessage = getResponseMessage(error);

  if (axios.isCancel(error)) {
    return {
      title: "Request cancelled",
      message: "The request was cancelled. Please try again.",
      hint: "",
      variant: "warning",
    };
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return {
      title: "Connection timeout",
      message: "The server took too long to respond.",
      hint: "Check the API server and try again.",
      variant: "warning",
    };
  }

  if (
    axios.isAxiosError(error) &&
    !error.response &&
    (error.code === "ERR_NETWORK" || error.request)
  ) {
    const crossOrigin = isCrossOriginRequest(error);
    return {
      title: crossOrigin ? "API connection blocked" : "Cannot reach API",
      message: crossOrigin
        ? "The browser could not complete the API request."
        : "We couldn't connect to the server.",
      hint: crossOrigin
        ? "This may be a CORS/proxy or API URL configuration problem."
        : "Check your internet connection and confirm the API server is running.",
      variant: "danger",
    };
  }

  if (status === 401) {
    return {
      title: "Session expired",
      message: responseMessage || "Please sign in again.",
      hint: "",
      variant: "warning",
    };
  }

  if (status === 403) {
    return {
      title: "Access denied",
      message: responseMessage || "You do not have permission for this action.",
      hint: "",
      variant: "danger",
    };
  }

  if (status === 404) {
    return {
      title: "API endpoint not found",
      message: responseMessage || "The requested API endpoint was not found.",
      hint: "Verify VITE_API_BASE_URL and the endpoint path.",
      variant: "danger",
    };
  }

  if (status >= 500) {
    return {
      title: "API server error",
      message: responseMessage || "The API server is unavailable right now.",
      hint: "Please try again in a moment.",
      variant: "danger",
    };
  }

  return {
    title: "Request failed",
    message: responseMessage || error.message || "Something went wrong.",
    hint: "",
    variant: "danger",
  };
};

export const getApiErrorMessage = (error) =>
  getApiErrorDetails(error).message;
