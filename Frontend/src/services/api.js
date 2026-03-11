import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/accounts/",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Sprint 1: Auth ────────────────────────────────────────────────────────────
export const registerUser   = (data) => API.post("register/", data);
export const loginUser      = (data) => API.post("login/", data);
export const forgotPassword = (data) => API.post("forgot-password/", data);
export const resetPassword  = (data) => API.post("reset-password/", data);

// ── Sprint 1: Profile ─────────────────────────────────────────────────────────
export const getProfile     = ()     => API.get("profile/");
export const updateProfile  = (data) => API.patch("profile/update/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const changePassword = (data) => API.post("profile/change-password/", data);

// ── Sprint 2: Service Categories ──────────────────────────────────────────────
export const getCategories  = ()     => API.get("categories/");
export const getCategory    = (id)   => API.get(`categories/${id}/`);
export const getKarigarsByCategory = (id) => API.get(`categories/${id}/karigars/`);

// ── Sprint 2: Karigar Profile Management ─────────────────────────────────────
export const getMyKarigarProfile    = ()     => API.get("karigar/profile/");
export const createKarigarProfile   = (data) => API.post("karigar/profile/", data);
export const updateKarigarProfile   = (data) => API.patch("karigar/profile/update/", data);
export const uploadGalleryImage     = (data) => API.post("karigar/gallery/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const deleteGalleryImage     = (id)   => API.delete(`karigar/gallery/${id}/`);

// ── Sprint 2: Search & Public Profile ────────────────────────────────────────
export const searchKarigars         = (params) => API.get("karigars/search/", { params });
export const getKarigarPublicProfile = (id)    => API.get(`karigars/${id}/`);