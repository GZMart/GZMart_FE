import axiosClient from '../axiosClient';

const dailyCheckinService = {
  /**
   * Get daily check-in status (streak, week data, etc.)
   * @returns {Promise} Check-in status data
   */
  getCheckinStatus: () => axiosClient.get('/api/daily-checkin/status'),

  /**
   * Perform daily check-in
   * @returns {Promise} Check-in result with coins earned
   */
  performCheckin: () => axiosClient.post('/api/daily-checkin'),
};

export default dailyCheckinService;
