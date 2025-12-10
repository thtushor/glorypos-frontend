import { BASE_URL } from "@/api/api";

import axios from "axios";
import { toast } from "react-toastify";
import { getCookiesAsObject } from "./cookies";

export const successToast = (
  message: string,
  type: "success" | "error" | "warn"
) => {
  toast[type](message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const uploadFile = async (file: File | File[]) => {
  // /api/images/upload this is route need to upload file to server as image form data multipart/form-data
  try {
    let accessToken = null;

    if (document.cookie.length > 0) {
      const { access_token } = getCookiesAsObject();
      accessToken = access_token || null;
    }
    const isMultiple = Array.isArray(file);
    const formData = new FormData();

    // Append file(s) with correct key name
    if (isMultiple) {
      file.forEach((f) => {
        formData.append("images", f);
      });
    } else {
      formData.append("image", file);
    }

    const pathSingle = "/images/upload";
    const pathMultiple = "/images/upload-multiple";
    const path = isMultiple ? pathMultiple : pathSingle;

    const response = await axios.post(BASE_URL + path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Return array if multiple files, single value if single file
    if (isMultiple) {
      return response?.data?.data?.original || response?.data?.data || [];
    }
    return response?.data?.data?.original || response?.data?.data;
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("An unknown error occurred");
    }
    return null;
  }
};

export const generateOrderId = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV${timestamp}${random}`;
};

export const generateVerificationCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getExpiryDate = (date: string) => {
  const purchaseDate = new Date(date);
  purchaseDate.setDate(purchaseDate.getDate() + 30);
  return purchaseDate.toLocaleString();
};

export const formatCurrency = (value: number | string): number => {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  return Math.round(numValue * 100) / 100; // Round to 2 decimal places
};

export const getNumericValue = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return "";
  const numValue = typeof value === "string" ? parseFloat(value) || "" : value;
  if (numValue === 0) return "0";
  return numValue.toString();
};

// Helper to filter input to only allow numeric characters and one decimal point
export const filterNumericInput = (value: string): string => {
  // Remove any non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, "");
  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
};

export const parseCurrencyInput = (value: string): number => {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, "");
  // Handle multiple decimal points
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return Number(parts[0] + "." + parts.slice(1).join("")) || 0;
  }
  const numValue = Number(cleaned) || 0;
  // Round to 2 decimal places
  return Math.round(numValue * 100) / 100;
};
