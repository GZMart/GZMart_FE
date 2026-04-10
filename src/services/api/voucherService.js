import { api } from '../axiosClient';

const voucherService = {
  // Create a new voucher
  createVoucher: async (data) => await api.post('/api/vouchers', data),

  // Get all vouchers with filters
  getVouchers: async (params) =>
    // params: { page, limit, status, type }
    await api.get('/api/vouchers', { params }),
  // Get single voucher by ID
  getVoucherById: async (id) => await api.get(`/api/vouchers/${id}`),

  // Update voucher
  updateVoucher: async (id, data) => await api.put(`/api/vouchers/${id}`, data),

  // Delete voucher
  deleteVoucher: async (id) => await api.delete(`/api/vouchers/${id}`),

  // Apply voucher (for buyer - optional for now)
  applyVoucher: async (code, cartTotal) =>
    await api.post('/api/vouchers/apply', { code, cartTotal }),

  // Get applicable vouchers for buyer's current cart (checkout).
  // Pass cartItemIds (Mongo _id strings) when checkout uses a subset of the cart so estimatedSaving matches preview.
  getApplicableVouchers: async (params = {}) => {
    const { cartItemIds } = params;
    const query =
      Array.isArray(cartItemIds) && cartItemIds.length > 0
        ? { cartItemIds: cartItemIds.map((id) => String(id)).join(',') }
        : {};
    return api.get('/api/vouchers/applicable', { params: query });
  },

  // Validate a voucher code manually entered by buyer
  validateCode: async (code) => await api.post('/api/vouchers/validate-code', { code }),

  // Get active public vouchers for a shop (buyer browsing)
  getShopVouchers: async (shopId) => await api.get(`/api/vouchers/shop/${shopId}`),

  // Get shop vouchers with buyer eligibility check (for new_buyer, repeat_buyer, follower)
  getShopVouchersWithEligibility: async (shopId) =>
    await api.get(`/api/vouchers/shop/${shopId}/eligible`),

  // Save/claim a voucher
  saveVoucher: async (id) => await api.post(`/api/vouchers/${id}/save`),

  // Remove saved voucher
  unsaveVoucher: async (id) => await api.delete(`/api/vouchers/${id}/save`),

  // Get all saved voucher IDs for current buyer
  getSavedVoucherIds: async () => await api.get('/api/vouchers/saved/ids'),
};

export default voucherService;
