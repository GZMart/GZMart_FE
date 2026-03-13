import axiosClient from '../axiosClient';

// ── Buyer endpoints ──

export const createSellerApplication = async (profileData = {}) => {
  const response = await axiosClient.post('/api/seller-applications', profileData);
  return response.data || response;
};

export const getMySellerApplications = async () => {
  const response = await axiosClient.get('/api/seller-applications/me');
  return response.data || response;
};

// ── Admin endpoints ──

export const listSellerApplications = async (params = {}) => {
  const response = await axiosClient.get('/api/seller-applications/admin', { params });
  return response.data || response;
};

export const getSellerApplicationDetail = async (id) => {
  const response = await axiosClient.get(`/api/seller-applications/admin/${id}`);
  return response.data || response;
};

export const approveSellerApplication = async (id, reviewNote) => {
  const response = await axiosClient.post(`/api/seller-applications/admin/${id}/approve`, { reviewNote });
  return response.data || response;
};

export const rejectSellerApplication = async (id, reviewNote) => {
  const response = await axiosClient.post(`/api/seller-applications/admin/${id}/reject`, { reviewNote });
  return response.data || response;
};
