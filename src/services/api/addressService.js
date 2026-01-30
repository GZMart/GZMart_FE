import { api } from '../axiosClient';

const addressService = {
  getAddresses: async () => {
    const response = await api.get('/api/addresses');
    return response;
  },

  createAddress: async (data) => {
    const response = await api.post('/api/addresses', data);
    return response;
  },

  updateAddress: async (id, data) => {
    const response = await api.put(`/api/addresses/${id}`, data);
    return response;
  },

  deleteAddress: async (id) => {
    const response = await api.delete(`/api/addresses/${id}`);
    return response;
  },

  setDefaultAddress: async (id) => {
    const response = await api.put(`/api/addresses/${id}/default`);
    return response;
  },
};

export default addressService;
