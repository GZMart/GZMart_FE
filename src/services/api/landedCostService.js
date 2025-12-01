import { api } from '../axiosClient';
import { API_VERSION } from '@constants';

const BASE_URL = `${API_VERSION}/landed-cost`;

/**
 * Landed Cost Calculator API Service (ERP Module)
 * For complex cross-border e-commerce cost calculations
 */
export const landedCostService = {
  /**
   * Calculate landed cost for a shipment
   * @param {object} calculationData - Calculation input data
   * @returns {Promise} Calculated landed cost breakdown
   */
  calculateLandedCost: async (calculationData) => {
    return api.post(`${BASE_URL}/calculate`, calculationData);
  },

  /**
   * Save landed cost calculation
   * @param {object} calculationData - Calculation data to save
   * @returns {Promise} Saved calculation
   */
  saveCalculation: async (calculationData) => {
    return api.post(`${BASE_URL}/save`, calculationData);
  },

  /**
   * Get saved calculations history
   * @param {object} params - Query parameters
   * @returns {Promise} Calculation history
   */
  getCalculationHistory: async (params = {}) => {
    return api.get(`${BASE_URL}/history`, { params });
  },

  /**
   * Get saved calculation by ID
   * @param {string} id - Calculation ID
   * @returns {Promise} Calculation details
   */
  getCalculationById: async (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  /**
   * Get duty rates by country and product category
   * @param {object} params - { countryCode, hsCode }
   * @returns {Promise} Duty rate information
   */
  getDutyRates: async (params) => {
    return api.get(`${BASE_URL}/duty-rates`, { params });
  },

  /**
   * Get shipping rates
   * @param {object} params - Shipping calculation parameters
   * @returns {Promise} Shipping rate options
   */
  getShippingRates: async (params) => {
    return api.get(`${BASE_URL}/shipping-rates`, { params });
  },

  /**
   * Get tax rates by country
   * @param {string} countryCode - Country code
   * @returns {Promise} Tax rates (VAT, GST, etc.)
   */
  getTaxRates: async (countryCode) => {
    return api.get(`${BASE_URL}/tax-rates/${countryCode}`);
  },

  /**
   * Get exchange rates
   * @param {object} params - { from, to, date }
   * @returns {Promise} Exchange rate data
   */
  getExchangeRates: async (params = {}) => {
    return api.get(`${BASE_URL}/exchange-rates`, { params });
  },

  /**
   * Update calculation
   * @param {string} id - Calculation ID
   * @param {object} calculationData - Updated calculation data
   * @returns {Promise} Updated calculation
   */
  updateCalculation: async (id, calculationData) => {
    return api.put(`${BASE_URL}/${id}`, calculationData);
  },

  /**
   * Delete calculation
   * @param {string} id - Calculation ID
   * @returns {Promise} Deletion response
   */
  deleteCalculation: async (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Export calculation to PDF
   * @param {string} id - Calculation ID
   * @returns {Promise} PDF file
   */
  exportToPDF: async (id) => {
    return api.get(`${BASE_URL}/${id}/export/pdf`, {
      responseType: 'blob',
    });
  },

  /**
   * Get cost breakdown summary
   * @param {object} params - Query parameters (date range, etc.)
   * @returns {Promise} Cost breakdown statistics
   */
  getCostBreakdownSummary: async (params = {}) => {
    return api.get(`${BASE_URL}/summary`, { params });
  },
};

export default landedCostService;
