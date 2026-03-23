import axiosClient from '../axiosClient';

const BASE_URL = '/api/ai';

export const aiService = {
  /**
   * Get AI price suggestion for a seller product.
   * [Phase 2 - 4.1] modelId added for variant-aware suggestion.
   * [Phase 3 - 5.1] strategy added for Pricing Personas (balanced | penetration | profit | clearance).
   * @param {{ productId?: string, productName: string, sellerId: string, modelId?: string, strategy?: string }} params
   * @returns {Promise<{ success: boolean, suggestedPrice: number, reasoning: string, strategy: string, marketData: object, competitors: object[], product: object, fromCache?: boolean, cachedAt?: string }>}
   */
  getPriceSuggestion: async ({ productId, productName, sellerId, modelId, strategy }) =>
    axiosClient.post(`${BASE_URL}/price-suggest`, { productId, productName, sellerId, modelId, strategy }),
  /**
   * Get AI price suggestion for all variants of a product (batch mode).
   * [Batch] Returns per-variant suggestions + shared market data.
   * [Phase 3 - 5.1] strategy added for Pricing Personas.
   * @param {{ productId?: string, productName: string, sellerId: string, modelIds: string[], strategy?: string }} params
   * @returns {Promise<{ success: boolean, results: ModelSuggestion[], product: object, marketData: object, competitors: object[], strategy: string }>}
   */
  getPriceSuggestionBatch: async ({ productId, productName, sellerId, modelIds, strategy }) =>
    axiosClient.post(`${BASE_URL}/price-suggest-batch`, { productId, productName, sellerId, modelIds, strategy }),
};

export default aiService;
