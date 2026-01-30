import axiosClient from '../axiosClient';

const systemVoucherService = {
  getAll: async () => {
    return await axiosClient.get('/api/vouchers/system');
  },

  getById: async (id) => {
    return await axiosClient.get(`/api/vouchers/system/${id}`);
  },

  create: async (data) => {
    return await axiosClient.post('/api/vouchers/system', data);
  },

  update: async (id, data) => {
    return await axiosClient.put(`/api/vouchers/system/${id}`, data);
  },

  delete: async (id) => {
    return await axiosClient.delete(`/api/vouchers/system/${id}`);
  },
};

export default systemVoucherService;
