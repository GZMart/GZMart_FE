import axiosClient from '../axiosClient';

const BASE_URL = '/api/disputes';

const disputeService = {
  // Buyer
  createReport: async (data) => axiosClient.post(`${BASE_URL}/reports`, data),
  getMyReports: async (params = {}) => axiosClient.get(`${BASE_URL}/reports/my`, { params }),
  getReportById: async (id) => axiosClient.get(`${BASE_URL}/reports/${id}`),
  appealReport: async (id, data = {}) => axiosClient.post(`${BASE_URL}/reports/${id}/appeal`, data),

  // Seller
  createSellerReport: async (data) => axiosClient.post(`${BASE_URL}/seller/reports`, data),
  getSellerReports: async (params = {}) =>
    axiosClient.get(`${BASE_URL}/seller/reports`, { params }),
  getSellerReportById: async (id) => axiosClient.get(`${BASE_URL}/seller/reports/${id}`),
  submitCounterReport: async (id, data = {}) =>
    axiosClient.post(`${BASE_URL}/seller/reports/${id}/counter`, data),

  // Admin
  getAdminReports: async (params = {}) => axiosClient.get(`${BASE_URL}/admin/reports`, { params }),
  getAdminReportById: async (id) => axiosClient.get(`${BASE_URL}/admin/reports/${id}`),
  updateReportStatus: async (id, data = {}) =>
    axiosClient.patch(`${BASE_URL}/admin/reports/${id}/status`, data),
  acceptComplaint: async (id, data = {}) =>
    axiosClient.post(`${BASE_URL}/admin/reports/${id}/accept`, data),
};

export default disputeService;
