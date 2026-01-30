import { api } from '../axiosClient';

const BASE_URL = '/api/seller/shop-programs';

const shopProgramService = {
  // ==================== PROGRAM CRUD ====================

  // Create a new shop program
  createProgram: async (data) => await api.post(BASE_URL, data),

  // Get all programs for seller
  getPrograms: async (params) => await api.get(BASE_URL, { params }),

  // Get single program with products
  getProgram: async (id) => await api.get(`${BASE_URL}/${id}`),

  // Update program
  updateProgram: async (id, data) => await api.put(`${BASE_URL}/${id}`, data),

  // Delete program
  deleteProgram: async (id) => await api.delete(`${BASE_URL}/${id}`),

  // Cancel program
  cancelProgram: async (id) => await api.post(`${BASE_URL}/${id}/cancel`),

  // ==================== PROGRAM PRODUCTS ====================

  // Add products to program
  addProducts: async (programId, productIds) =>
    await api.post(`${BASE_URL}/${programId}/products`, { productIds }),

  // Update product variants
  updateProductVariants: async (programId, productId, variants) =>
    await api.put(`${BASE_URL}/${programId}/products/${productId}`, { variants }),

  // Remove product from program
  removeProduct: async (programId, productId) =>
    await api.delete(`${BASE_URL}/${programId}/products/${productId}`),

  // ==================== BATCH OPERATIONS ====================

  // Batch update variants
  batchUpdateVariants: async (programId, variantIds, settings) =>
    await api.put(`${BASE_URL}/${programId}/products/batch`, { variantIds, settings }),

  // Batch remove products
  batchRemoveProducts: async (programId, productIds) =>
    await api.delete(`${BASE_URL}/${programId}/products/batch`, { data: { productIds } }),
};

export default shopProgramService;
