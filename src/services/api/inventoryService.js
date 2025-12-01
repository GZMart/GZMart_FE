import { api } from '../axiosClient';
import { API_VERSION } from '@constants';

const BASE_URL = `${API_VERSION}/inventory`;

/**
 * Inventory API Service (ERP Module)
 */
export const inventoryService = {
  /**
   * Get all inventory items
   * @param {object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise} Inventory items list
   */
  getInventoryItems: async (params = {}) => {
    return api.get(BASE_URL, { params });
  },

  /**
   * Get single inventory item by ID
   * @param {string} id - Inventory item ID
   * @returns {Promise} Inventory item details
   */
  getInventoryItemById: async (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  /**
   * Create new inventory item
   * @param {object} itemData - Inventory item data
   * @returns {Promise} Created inventory item
   */
  createInventoryItem: async (itemData) => {
    return api.post(BASE_URL, itemData);
  },

  /**
   * Update inventory item
   * @param {string} id - Inventory item ID
   * @param {object} itemData - Updated item data
   * @returns {Promise} Updated inventory item
   */
  updateInventoryItem: async (id, itemData) => {
    return api.put(`${BASE_URL}/${id}`, itemData);
  },

  /**
   * Delete inventory item
   * @param {string} id - Inventory item ID
   * @returns {Promise} Deletion response
   */
  deleteInventoryItem: async (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Adjust inventory quantity
   * @param {string} id - Inventory item ID
   * @param {object} adjustmentData - { quantity, reason, notes }
   * @returns {Promise} Adjustment response
   */
  adjustQuantity: async (id, adjustmentData) => {
    return api.post(`${BASE_URL}/${id}/adjust`, adjustmentData);
  },

  /**
   * Get stock movements/history
   * @param {string} itemId - Inventory item ID
   * @param {object} params - Query parameters
   * @returns {Promise} Stock movements
   */
  getStockMovements: async (itemId, params = {}) => {
    return api.get(`${BASE_URL}/${itemId}/movements`, { params });
  },

  /**
   * Get low stock alerts
   * @param {object} params - Query parameters
   * @returns {Promise} Low stock items
   */
  getLowStockAlerts: async (params = {}) => {
    return api.get(`${BASE_URL}/alerts/low-stock`, { params });
  },

  /**
   * Get out of stock items
   * @param {object} params - Query parameters
   * @returns {Promise} Out of stock items
   */
  getOutOfStockItems: async (params = {}) => {
    return api.get(`${BASE_URL}/alerts/out-of-stock`, { params });
  },

  /**
   * Perform stock count/audit
   * @param {object} countData - Stock count data
   * @returns {Promise} Stock count response
   */
  performStockCount: async (countData) => {
    return api.post(`${BASE_URL}/stock-count`, countData);
  },

  /**
   * Get inventory statistics
   * @param {object} params - Query parameters
   * @returns {Promise} Inventory statistics
   */
  getStatistics: async (params = {}) => {
    return api.get(`${BASE_URL}/statistics`, { params });
  },

  /**
   * Get inventory valuation
   * @param {object} params - Query parameters
   * @returns {Promise} Inventory valuation data
   */
  getInventoryValuation: async (params = {}) => {
    return api.get(`${BASE_URL}/valuation`, { params });
  },

  /**
   * Export inventory to CSV/Excel
   * @param {object} params - Export parameters
   * @returns {Promise} Export file
   */
  exportInventory: async (params = {}) => {
    return api.get(`${BASE_URL}/export`, {
      params,
      responseType: 'blob',
    });
  },

  /**
   * Bulk import inventory
   * @param {FormData} formData - CSV/Excel file
   * @returns {Promise} Import response
   */
  importInventory: async (formData) => {
    return api.post(`${BASE_URL}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default inventoryService;
