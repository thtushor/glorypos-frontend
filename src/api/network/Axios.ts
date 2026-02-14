import axios from "axios";
import { getCookiesAsObject } from "../../utils/cookies";
import { toast } from "react-toastify";
import { BASE_URL } from "../api";

const AXIOS = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Utility to clear authentication cookies
 */
const clearAuthCookies = (): void => {
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
  document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
  localStorage.removeItem("user");
};

/**
 * Convert local date string (YYYY-MM-DD) to UTC format (YYYY-MM-DD)
 * Takes a date in local timezone and returns the equivalent UTC date
 */
const convertLocalDateToUTC = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string') return dateString;

  // Check if the string matches YYYY-MM-DD format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateString)) return dateString;

  // Parse the date as local timezone
  const localDate = new Date(dateString + 'T00:00:00');

  // Get UTC components
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Convert date parameters in request params to UTC
 */
const convertDateParamsToUTC = (params: any): any => {
  if (!params || typeof params !== 'object') return params;

  const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime', 'date', 'fromDate', 'toDate'];
  const convertedParams = { ...params };

  dateKeys.forEach(key => {
    if (convertedParams[key]) {
      convertedParams[key] = convertLocalDateToUTC(convertedParams[key]);
    }
  });

  return convertedParams;
};

/**
 * Interceptor for all requests
 */
AXIOS.interceptors.request.use(
  (config) => {
    // Get access token from cookies
    const { access_token } = getCookiesAsObject();

    // Add authorization header if token exists
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }

    // Convert date parameters to UTC
    if (config.params) {
      config.params = convertDateParamsToUTC(config.params);
    }

    return config;
  },
  (error) => {
    console.error("[Axios Request Error]:", {
      message: error.message,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

/**
 * Interceptor for all responses
 */
AXIOS.interceptors.response.use(
  (response) => {
    // Return response data directly
    return response?.data || {};
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("[Network Error]:", error.message);
      toast.error("Network error. Please check your connection.", {
        toastId: "network_error",
      });
      return Promise.reject({
        message: "Network error. Please check your connection.",
        error: error.message,
      });
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized
    if (status === 401) {
      const isLoginPage = window.location.pathname === "/login";

      if (!isLoginPage) {
        const errorMessage = data?.message || "Session expired. Please login again.";
        toast.error(errorMessage);

        // Clear authentication cookies
        clearAuthCookies();

        // Redirect to login
        window.location.reload();
        window.location.href = "/login";

      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast.error(data?.message || "You don't have permission to perform this action.");
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.warn("[404 Not Found]:", error.config?.url);
    }

    // Handle 500 Server Error
    if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    // Log error details for debugging
    console.error("[Axios Response Error]:", {
      status,
      message: data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject(data || { message: error.message });
  }
);

export default AXIOS;
