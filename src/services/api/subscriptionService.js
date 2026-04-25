import axiosClient from '../axiosClient';

const BASE = '/api/subscription';

const subscriptionService = {
  createCheckout: async (returnPath) => {
    // Interceptor đã unwrap — trả về cả body { success, data }
    return await axiosClient.post(`${BASE}/checkout`, { returnPath });
  },
  getMine: async () => {
    return await axiosClient.get(`${BASE}/me`);
  },
};

export default subscriptionService;
