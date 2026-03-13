import axiosClient from '../axiosClient';

const systemVoucherService = {
  getAll: async () => await axiosClient.get('/api/vouchers/system'),

  getById: async (id) => await axiosClient.get(`/api/vouchers/system/${id}`),

  create: async (data) => await axiosClient.post('/api/vouchers/system', data),

  update: async (id, data) => await axiosClient.put(`/api/vouchers/system/${id}`, data),

  delete: async (id) => await axiosClient.delete(`/api/vouchers/system/${id}`),
};

export default systemVoucherService;
