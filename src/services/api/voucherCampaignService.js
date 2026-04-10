import axiosClient from '../axiosClient';

const voucherCampaignService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/voucher-campaigns${query ? `?${query}` : ''}`);
  },

  getById: async (id) => axiosClient.get(`/api/voucher-campaigns/${id}`),

  create: async (data) => axiosClient.post('/api/voucher-campaigns', data),

  update: async (id, data) => axiosClient.put(`/api/voucher-campaigns/${id}`, data),

  delete: async (id) => axiosClient.delete(`/api/voucher-campaigns/${id}`),

  preview: async (id) => axiosClient.post(`/api/voucher-campaigns/${id}/preview`),

  trigger: async (id) => axiosClient.post(`/api/voucher-campaigns/${id}/trigger`),
};

export default voucherCampaignService;
