import axiosClient from '../axiosClient';

const BASE = '/api/platform-settings';

export const platformSettingsService = {
  get: () => axiosClient.get(BASE),
  update: (data) => axiosClient.put(BASE, data),
};

export default platformSettingsService;
