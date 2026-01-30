import axiosClient from '../axiosClient';

const addOnDealService = {
  // Create new add-on deal
  createAddOn: (data) => axiosClient.post('/api/seller/addons', data),

  // Get all add-on deals
  getAddOns: (params) => axiosClient.get('/api/seller/addons', { params }),

  // Get single add-on deal details
  getAddOn: (id) => axiosClient.get(`/api/seller/addons/${id}`),

  // Update add-on deal
  updateAddOn: (id, data) => axiosClient.put(`/api/seller/addons/${id}`, data),

  // Delete add-on deal
  deleteAddOn: (id) => axiosClient.delete(`/api/seller/addons/${id}`),
};

export default addOnDealService;
