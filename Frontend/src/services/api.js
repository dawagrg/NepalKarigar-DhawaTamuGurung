import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/accounts/",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 2.2.1 Auth
export const registerUser   = (data) => API.post("register/", data);
export const loginUser      = (data) => API.post("login/", data);

// 2.2.2 Forgot / Reset Password
export const forgotPassword = (data) => API.post("forgot-password/", data);
export const resetPassword  = (data) => API.post("reset-password/", data);

// 2.3 Profile
export const getProfile     = ()     => API.get("profile/");
export const updateProfile  = (data) => API.patch("profile/update/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const changePassword = (data) => API.post("profile/change-password/", data);