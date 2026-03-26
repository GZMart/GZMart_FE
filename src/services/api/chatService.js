import axiosClient from '../axiosClient';

const BASE_URL = '/api/chat';

export const chatService = {
  /**
   * Find or create a conversation between current user and another user
   * @param {string} shopId - The other participant's user ID (buyer or seller)
   * @returns {Promise} Conversation object with _id, participants, isNew
   */
  findOrCreateConversation: async (shopId) =>
    await axiosClient.post(`${BASE_URL}/conversation`, { shopId }),

  /**
   * Get all conversations for the current user
   * @returns {Promise} Array of conversation objects
   */
  getConversations: async () => await axiosClient.get(`${BASE_URL}/conversations`),

  /**
   * Count unread messages (messages received but not read yet)
   * @returns {Promise} { count: number }
   */
  getUnreadCount: async () => await axiosClient.get(`${BASE_URL}/unread/count`),
};

export default chatService;
