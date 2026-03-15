import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/accounts/",
});

// ── Request interceptor: attach access token ──────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh expired token (401) ───────────────────
let isRefreshing   = false;
let failedQueue    = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and we haven't already tried refreshing for this request
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem("refresh_token");

      // No refresh token → force logout
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }

      original._retry  = true;
      isRefreshing      = true;

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/accounts/token/refresh/",
          { refresh: refreshToken }
        );
        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        API.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return API(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Sprint 1: Auth ────────────────────────────────────────────────────────────
export const registerUser   = (data) => API.post("register/", data);
export const loginUser      = (data) => API.post("login/", data);
export const forgotPassword = (data) => API.post("password-reset/request/", data);
export const resetPassword  = (data) => API.post("password-reset/confirm/", data);

// ── Sprint 1: Profile ─────────────────────────────────────────────────────────
export const getProfile          = ()     => API.get("profile/");
export const updateProfile       = (data) => API.patch("profile/update/", data);
export const uploadProfileImage  = (data) => API.post("profile/upload-image/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});

// ── Sprint 2: Service Categories ──────────────────────────────────────────────
export const getCategories         = ()    => API.get("categories/");
export const getCategory           = (id)  => API.get(`categories/${id}/`);
export const getKarigarsByCategory = (id)  => API.get(`categories/${id}/karigars/`);

// ── Sprint 2: Karigar Dashboard ───────────────────────────────────────────────
export const getMyKarigarProfile  = ()     => API.get("karigar-dashboard/");
export const createKarigarProfile = (data) => API.patch("karigar-dashboard/update/", data);
export const updateKarigarProfile = (data) => API.patch("karigar-dashboard/update/", data);
export const uploadGalleryImage   = (data) => API.post("karigar-dashboard/gallery/upload/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const deleteGalleryImage   = (id)   => API.delete(`karigar-dashboard/gallery/${id}/delete/`);

// ── Sprint 2: Search & Public Profile ────────────────────────────────────────
export const listKarigars            = (params) => API.get("karigars/", { params });
export const searchKarigars          = (params) => API.get("karigars/search/", { params });
export const getKarigarPublicProfile = (id)     => API.get(`karigars/${id}/`);

// ── Sprint 3: Bookings ────────────────────────────────────────────────────────
export const createBooking        = (data) => API.post("bookings/", data);
export const listBookings         = (params) => API.get("bookings/list/", { params });
export const getBooking           = (id)   => API.get(`bookings/${id}/`);
export const cancelBooking        = (id)   => API.post(`bookings/${id}/cancel/`);
export const respondBooking       = (id, data) => API.post(`bookings/${id}/respond/`, data);

// ── Sprint 3: Bargaining ──────────────────────────────────────────────────────
export const bargainOffer         = (id, data) => API.post(`bookings/${id}/bargain/offer/`, data);
export const bargainCounter       = (id, data) => API.post(`bookings/${id}/bargain/counter/`, data);
export const bargainAcceptCounter = (id)       => API.post(`bookings/${id}/bargain/accept/`);

// ── Sprint 4: Admin ───────────────────────────────────────────────────────────
export const adminGetStats      = ()       => API.get("admin/stats/");
export const adminListUsers     = (params) => API.get("admin/users/", { params });
export const adminToggleUser    = (id)     => API.post(`admin/users/${id}/toggle-active/`);
export const adminListKarigars  = (params) => API.get("admin/karigars/", { params });
export const adminVerifyKarigar = (id)     => API.post(`admin/karigars/${id}/verify/`);
export const adminListBookings  = (params) => API.get("admin/bookings/", { params });

// ── Sprint 5: Reviews ─────────────────────────────────────────────────────────
export const submitReview       = (bookingId, data) => API.post(`bookings/${bookingId}/review/`, data);
export const checkReviewable    = (bookingId)       => API.get(`bookings/${bookingId}/reviewable/`);
export const listKarigarReviews = (profileId, params) => API.get(`karigars/${profileId}/reviews/`, { params });
export const editReview         = (reviewId, data)  => API.put(`reviews/${reviewId}/`, data);
export const deleteReview       = (reviewId)        => API.delete(`reviews/${reviewId}/delete/`);

// ── Karigar Application ──────────────────────────────────────────────────────
export const submitKarigarApplication  = (data)   => API.post("karigar-application/submit/", data, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const checkApplicationStatus   = (userId)  => API.get("karigar-application/status/", {
  params: { user_id: userId }
});

// ── Admin: Applications ───────────────────────────────────────────────────────
export const adminListApplications     = (params) => API.get("admin/applications/", { params });
export const adminApproveApplication   = (id, data) => API.post(`admin/applications/${id}/approve/`, data);
export const adminRejectApplication    = (id, data) => API.post(`admin/applications/${id}/reject/`, data);

// ── Improvements ─────────────────────────────────────────────────────────────
export const markBookingComplete = (pk)   => API.post(`bookings/${pk}/complete/`);
export const changePassword      = (data) => API.post("change-password/", data);
export const getNotifications    = ()     => API.get("notifications/");