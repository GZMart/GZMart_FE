import axiosClient from '../axiosClient';

const BASE = '/api/bulk-upload';

export const bulkUploadService = {
  /**
   * @param {'single'|'variant'|'mixed'} type
   * @param {'xlsx'|'csv'} format — xlsx: mẫu có tô header & viền; csv thuần
   * @returns {Promise<Blob>}
   */
  downloadTemplate: async (type = 'single', format = 'xlsx') =>
    axiosClient.get(`${BASE}/template`, {
      params: { type, format },
      responseType: 'blob',
    }),

  /**
   * Parse file + gợi ý danh mục (embedding). Không tạo SP.
   * @param {File} file
   */
  preview: async (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return axiosClient.post(`${BASE}/preview`, formData);
  },

  /**
   * Tạo sản phẩm sau khi user xác nhận danh mục từng dòng.
   * @param {Array<{ index: number, categoryId: string, product: object }>} items
   */
  confirm: async (items) => axiosClient.post(`${BASE}/confirm`, { items }),

  /**
   * @param {File} file — .csv, .xlsx, .xls (legacy: tạo SP trực tiếp)
   */
  uploadProducts: async (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return axiosClient.post(`${BASE}/products`, formData);
  },
};

export default bulkUploadService;
