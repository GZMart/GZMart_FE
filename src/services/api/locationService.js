import axios from 'axios';

const BASE_URL = 'https://provinces.open-api.vn/api/v2';

const locationService = {
  getProvinces: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/p/`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  // v2 has no districts, wards are direct children of province
  getWards: async (provinceCode) => {
    try {
      const response = await axios.get(`${BASE_URL}/p/${provinceCode}?depth=2`);
      return response.data.wards || response.data.data?.wards || [];
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  },
};

export default locationService;
