import { api } from '../axiosClient';

const BASE_URL = '/api/seller/combos';

const comboService = {
  // Create combo
  createCombo: async (data) => await api.post(BASE_URL, data),

  // Get combos
  getCombos: async (params) => await api.get(BASE_URL, { params }),

  // Get single combo
  getCombo: async (id) => await api.get(`${BASE_URL}/${id}`),

  // Update combo
  updateCombo: async (id, data) => await api.put(`${BASE_URL}/${id}`, data),

  // Delete combo
  deleteCombo: async (id) => await api.delete(`${BASE_URL}/${id}`),
};

export default comboService;
