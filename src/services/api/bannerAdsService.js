/**
 * Banner Ads Service
 * Handles all seller ad campaigns and admin management for homepage banners
 */
import axiosClient from "../axiosClient";

const bannerAdsService = {
  // ─── PUBLIC ────────────────────────────────────────────────────────────────

  /** Get active banners for homepage (public) */
  getActiveBanners: () => axiosClient.get("/api/banners/active").then((r) => r.data),

  /** Track banner click (public) */
  trackClick: (bannerId) =>
    axiosClient.post(`/api/banners/${bannerId}/click`).then((r) => r.data),

  // ─── SELLER ────────────────────────────────────────────────────────────────

  /**
   * Get 60-day slot availability calendar
   * Returns { calendar: { 'YYYY-MM-DD': { bookedSlots, availableSlots, isFull, status } }, pricePerDay, maxSlots }
   */
  getCalendar: () => axiosClient.get("/api/banners/calendar").then((r) => r.data),

  /**
   * Check availability and get pricing for a date range
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   */
  checkSlots: (startDate, endDate) =>
    axiosClient.post("/api/banners/check-slots", { startDate, endDate }).then((r) => r.data),

  /**
   * Submit a banner ad request
   * @param {Object} data - { title, subtitle, image, productId, startDate, endDate, link, linkType }
   */
  createRequest: (data) =>
    axiosClient.post("/api/banners/seller/request", data).then((r) => r.data),

  /** Get seller's own banner requests ({ banners, pagination } on response root — not nested in `data`). */
  getMyRequests: (params = {}) => axiosClient.get("/api/banners/seller/my-requests", { params }),

  /**
   * Cancel a pending banner request (refunds coins)
   * @param {string} bannerId
   */
  cancelRequest: (bannerId) =>
    axiosClient.delete(`/api/banners/seller/${bannerId}`).then((r) => r.data),

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  /** Get slot config and pricing */
  getAdminConfig: () => axiosClient.get("/api/banners/admin/config").then((r) => r.data),

  /** Admin: list all banners (same response shape as getMyRequests). */
  adminGetAll: (params = {}) => axiosClient.get("/api/banners/admin", { params }),

  /** Admin: create a system (ADMIN) banner */
  adminCreate: (data) => axiosClient.post("/api/banners/admin", data).then((r) => r.data),

  /** Admin: update a banner */
  adminUpdate: (bannerId, data) =>
    axiosClient.put(`/api/banners/admin/${bannerId}`, data).then((r) => r.data),

  /**
   * Admin: approve a seller banner request
   * @param {string} bannerId
   */
  adminApprove: (bannerId) =>
    axiosClient.post(`/api/banners/admin/${bannerId}/approve`).then((r) => r.data),

  /**
   * Admin: reject a seller banner request (auto-refunds coins)
   * @param {string} bannerId
   * @param {string} rejectionReason - Required, min 5 chars
   */
  adminReject: (bannerId, rejectionReason) =>
    axiosClient
      .post(`/api/banners/admin/${bannerId}/reject`, { rejectionReason })
      .then((r) => r.data),

  /** Admin: delete a banner */
  adminDelete: (bannerId) =>
    axiosClient.delete(`/api/banners/admin/${bannerId}`).then((r) => r.data),

  /** Admin: bulk reorder banners */
  adminReorder: (banners) =>
    axiosClient.put("/api/banners/admin/reorder", { banners }).then((r) => r.data),
};

export default bannerAdsService;
