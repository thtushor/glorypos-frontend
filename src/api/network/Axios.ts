import axios from "axios";
import { getCookiesAsObject } from "../../utils/cookies";
import { toast } from "react-toastify";
import { BASE_URL } from "../api";

const AXIOS = axios.create({
  baseURL: BASE_URL,
});

/**
 * Interceptor for all requests
 */
AXIOS.interceptors.request.use(
  async (config) => {
    /**
     * Add your request interceptor logic here: setting headers, authorization etc.
     */
    let accessToken = null;

    if (document.cookie.length > 0) {
      const { access_token } = getCookiesAsObject();
      accessToken = access_token || null;
    }

    config.headers["Content-Type"] = "application/json";
    config.headers["Access-Control-Allow-Origin"] = "*";

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    /**
     * Add your error handlers here
     */
    console.log("api error:", error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor for all responses
 */
AXIOS.interceptors.response.use(
  (response) => {
    /**
     * Add logic for successful response
     */
    return response?.data || {};
  },
  (error) => {
    /**
     * Add logic for any error from backend
     */
    if (error?.response?.status === 401 ||
      error?.response?.data?.status === false &&
      (error?.response?.data?.message === "No token provided" ||
        error?.response?.data?.message === "Invalid or expired token" ||
        error?.response?.data?.message === "Authentication failed" ||
        error?.response?.data?.message === "Authentication required. Please login." ||
        error?.response?.data?.message === "User not is not valid")
    ) {
      toast.error(error?.response?.data?.message);
      window.location.href = "/login";
    }

    console.log("api error:", error);
    return Promise.reject(error?.response?.data);
  }
);

export default AXIOS;
