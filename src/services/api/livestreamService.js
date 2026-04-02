import axiosClient from '../axiosClient';

const BASE = '/api/livestream';

export const livestreamService = {
  createSession: (data) => axiosClient.post(`${BASE}/session`, data),
  startSession: (sessionId) => axiosClient.post(`${BASE}/session/${sessionId}/start`),
  getViewerToken: (sessionId) => axiosClient.post(`${BASE}/session/${sessionId}/token`),
  endSession: (sessionId) => axiosClient.post(`${BASE}/session/${sessionId}/end`),
  getActiveByShop: (shopId) => axiosClient.get(`${BASE}/active`, { params: { shopId } }),
  getSession: (sessionId) => axiosClient.get(`${BASE}/session/${sessionId}`),
  getSessionProducts: (sessionId) => axiosClient.get(`${BASE}/session/${sessionId}/products`),
  addProductsToSession: (sessionId, productIds) =>
    axiosClient.post(`${BASE}/session/${sessionId}/products`, { productIds }),
  removeProductFromSession: (sessionId, productId) =>
    axiosClient.delete(`${BASE}/session/${sessionId}/products/${productId}`),
  pinProduct: (sessionId, productId) =>
    axiosClient.post(`${BASE}/session/${sessionId}/pin`, { productId }),
  unpinProduct: (sessionId) =>
    axiosClient.post(`${BASE}/session/${sessionId}/unpin`),
  getSessionMessages: (sessionId, limit = 50) =>
    axiosClient.get(`${BASE}/session/${sessionId}/messages`, { params: { limit } }),
  likeSession: (sessionId) => axiosClient.post(`${BASE}/session/${sessionId}/like`),
  getSessionVouchers: (sessionId) => axiosClient.get(`${BASE}/session/${sessionId}/vouchers`),
  addVouchersToSession: (sessionId, voucherIds) =>
    axiosClient.post(`${BASE}/session/${sessionId}/vouchers`, { voucherIds }),
  removeVoucherFromSession: (sessionId, voucherId) =>
    axiosClient.delete(`${BASE}/session/${sessionId}/vouchers/${voucherId}`),
  updateSession: (sessionId, data) =>
    axiosClient.put(`${BASE}/session/${sessionId}`, data),
  getSessionConfig: (sessionId) =>
    axiosClient.get(`${BASE}/session/${sessionId}/config`),
  // Get a fresh LiveKit token for the current session (used after F5 restore)
  getSessionToken: (sessionId) =>
    axiosClient.post(`${BASE}/session/${sessionId}/token`),
};

export default livestreamService;
