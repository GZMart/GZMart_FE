import axiosClient from '../axiosClient';

const followService = {
  toggleFollow: (shopId) => {
    return axiosClient.post(`/api/follows/${shopId}`);
  },
  
  checkFollowStatus: (shopId) => {
    return axiosClient.get(`/api/follows/${shopId}/status`);
  }
};

export default followService;
