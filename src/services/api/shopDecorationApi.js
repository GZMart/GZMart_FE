import axiosClient from '../axiosClient';

const BASE_URL = '/api/seller/shop-decoration';

/**
 * Shop Decoration API (seller only)
 */
export const shopDecorationApi = {
  /** GET / — full decoration config (draft modules + widgets) */
  getDecoration: async () => {
    const res = await axiosClient.get(BASE_URL);
    return res.data?.data ?? res.data ?? {};
  },

  /** PUT /draft — save draft modules + widgets for a version */
  saveDraft: async ({ version, modules, widgets }) => {
    const res = await axiosClient.put(`${BASE_URL}/draft`, { version, modules, widgets });
    return res.data;
  },

  /** POST /publish — publish draft to live */
  publish: async ({ version }) => {
    const res = await axiosClient.post(`${BASE_URL}/publish`, { version });
    return res.data;
  },

  /** PUT /active-version — set active storefront version */
  setActiveVersion: async ({ version }) => {
    const res = await axiosClient.put(`${BASE_URL}/active-version`, { version });
    return res.data;
  },

  /**
   * GET /counts — widget counts for editor
   * @returns {{ featuredProducts, featuredCategories, bestSelling, newProducts, categoryList, flashDeals, addonDeals, comboPromos }}
   */
  getWidgetCounts: async () => {
    const res = await axiosClient.get(`${BASE_URL}/counts`);
    return res.data?.data ?? res.data ?? {};
  },
};

export default shopDecorationApi;
