import axiosClient from '../axiosClient';

const followService = {
  toggleFollow: (shopId) => axiosClient.post(`/api/follows/${shopId}`),

  checkFollowStatus: (shopId) => axiosClient.get(`/api/follows/${shopId}/status`),
};

export default followService;
