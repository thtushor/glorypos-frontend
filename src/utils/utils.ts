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

export const uploadFile = async (file: File) => {
  // /api/images/upload this is route need to upload file to server as image form data multipart/form-data
  try {
    let accessToken = null;

    if (document.cookie.length > 0) {
      const { access_token } = getCookiesAsObject();
      accessToken = access_token || null;
    }
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(BASE_URL + "/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response?.data?.data?.original;
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
