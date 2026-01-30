import { api } from '../axiosClient';

const voucherService = {
  // Create a new voucher
  createVoucher: async (data) => await api.post('/api/vouchers', data),

  // Get all vouchers with filters
  getVouchers: async (params) => 
    // params: { page, limit, status, type }
     await api.get('/api/vouchers', { params })
  ,

  // Get single voucher by ID
  getVoucherById: async (id) => await api.get(`/api/vouchers/${id}`),

  // Update voucher
  updateVoucher: async (id, data) => await api.put(`/api/vouchers/${id}`, data),

  // Delete voucher
  deleteVoucher: async (id) => await api.delete(`/api/vouchers/${id}`),

  // Apply voucher (for buyer - optional for now)
  applyVoucher: async (code, cartTotal) => await api.post('/api/vouchers/apply', { code, cartTotal }),
};

export default voucherService;
