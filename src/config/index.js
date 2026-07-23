
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// A relative base URL keeps browser requests on the current origin. In
// development Vite proxies /api and /master to the local API server, avoiding
// browser CORS errors. Production should provide an absolute API URL.
const apiBaseUrl = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, "") || "/"
  : "/";

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  console.warn(
    "VITE_API_BASE_URL is not configured. API requests will use the current origin.",
  );
}

export const isApiBaseUrlConfigured = Boolean(configuredApiBaseUrl);

export default {
  apiBaseUrl,
  isApiBaseUrlConfigured,
  trackHttpResponseInConsole: false,
};
