import axiosClient from '../axiosClient';

const BASE_URL = '/api/seller/orders';

/**
 * Order Seller API Service
 * Handles all seller-related order operations
 */
export const orderSellerService = {
  /**
   * Create a new order (Seller creates for Buyer)
   * @param {object} orderData - Order data
   * @param {string} orderData.userId - Buyer user ID
   * @param {number} orderData.subtotal - Subtotal amount
   * @param {number} orderData.shippingCost - Shipping cost
   * @param {number} orderData.tax - Tax amount
   * @param {number} orderData.discount - Discount amount
   * @param {number} orderData.totalPrice - Total price
   * @param {string} orderData.shippingAddress - Shipping address
   * @param {string} orderData.shippingMethod - Shipping method (standard, express, next_day, store)
   * @param {string} orderData.paymentMethod - Payment method (vnpay, cash_on_delivery, payos)
   * @param {string} [orderData.discountCode] - Discount code (optional)
   * @param {string} [orderData.notes] - Delivery notes (optional)
   * @param {array} orderData.items - Order items
   * @param {string} orderData.items[].productId - Product ID
   * @param {string} orderData.items[].modelId - Model ID
   * @param {string} orderData.items[].sku - Product SKU
   * @param {number} orderData.items[].quantity - Quantity
   * @param {number} orderData.items[].price - Item price
   * @param {object} orderData.items[].tierSelections - Tier selections (color, size, etc.)
   * @param {number} orderData.items[].subtotal - Item subtotal
   * @param {number} orderData.items[].originalPrice - Original price before discount
   * @param {boolean} orderData.items[].isFlashSale - Is flash sale item
   * @returns {Promise} Created order object
   */
  create: async (orderData) => await axiosClient.post(BASE_URL, orderData),

  /**
   * Get all seller orders with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.status] - Filter by status (pending, processing, shipped, delivered, ...)
   * @param {string} [params.sortBy] - Sort field (createdAt, newest-first, oldest-first, total-high, total-low)
   * @param {boolean|string} [params.hasPreOrder] - Only orders with at least one pre-order line (seller SKUs)
   * @param {boolean|string} [params.preOrderSlaBreached] - Only orders past estimatedShipBy on pre-order lines, not yet shipped
   * @returns {Promise} Orders list with pagination info
   */
  getAll: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Admin — list all marketplace orders
   * @param {object} params - page, limit, status, sortBy, orderNumber, userId, sellerId
   */
  getAdminPlatformOrders: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/admin/platform-orders`, { params }),

  /**
   * Get orders by status with pagination
   * @param {string} status - Order status (pending, processing, shipped, delivered, delivered_pending_confirmation, completed, cancelled, refunded, refund_pending, under_investigation)
   * @param {object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise} Orders with pagination and status counts
   */
  getByStatus: async (status, params = {}) =>
    await axiosClient.get(`${BASE_URL}/status/${status}`, { params }),

  /**
   * Get order details by ID
   * @param {string} orderId - Order ID
   * @returns {Promise} Order details object
   */
  getById: async (orderId) => await axiosClient.get(`${BASE_URL}/${orderId}`),

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {object} statusData - Status update data
   * @param {string} statusData.newStatus - New status
   * @param {string} [statusData.trackingNumber] - Tracking number (optional)
   * @param {string} [statusData.estimatedDelivery] - Estimated delivery date (optional)
   * @param {string} [statusData.notes] - Notes (optional)
   * @param {string} [statusData.reason] - Reason for status change (optional)
   * @returns {Promise} Updated order object
   */
  updateStatus: async (orderId, statusData) =>
    await axiosClient.put(`${BASE_URL}/${orderId}/status`, statusData),

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {object} cancelData - Cancellation data
   * @param {string} cancelData.cancellationReason - Reason for cancellation
   * @returns {Promise} Cancelled order object
   */
  cancel: async (orderId, cancelData) =>
    await axiosClient.put(`${BASE_URL}/${orderId}/cancel`, cancelData),

  /**
   * Get order status history/audit log
   * @param {string} orderId - Order ID
   * @returns {Promise} Order history with status changes
   */
  getHistory: async (orderId) => await axiosClient.get(`${BASE_URL}/${orderId}/status-history`),

  /**
   * Get delivery note (PDF/HTML)
   * @param {string} orderId - Order ID
   * @returns {Promise} Delivery note HTML content
   */
  getDeliveryNote: async (orderId) => await axiosClient.get(`${BASE_URL}/${orderId}/delivery-note`),

  /**
   * Legacy method - alias for getById
   */
  getOrderById: async (orderId) => await axiosClient.get(`${BASE_URL}/${orderId}`),

  /**
   * Legacy method - alias for getAll
   */
  getOrders: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Legacy method - alias for getByStatus
   */
  getOrdersByStatus: async (status, params = {}) =>
    await axiosClient.get(`${BASE_URL}/status/${status}`, { params }),

  /**
   * Legacy method - alias for cancel
   */
  cancelOrder: async (orderId, cancelData) =>
    await axiosClient.put(`${BASE_URL}/${orderId}/cancel`, cancelData),

  /**
   * Legacy method - alias for updateStatus
   */
  updateOrderStatus: async (orderId, statusData) =>
    await axiosClient.put(`${BASE_URL}/${orderId}/status`, statusData),

  /**
   * Legacy method - alias for getHistory
   */
  getOrderHistory: async (orderId) => await axiosClient.get(`${BASE_URL}/${orderId}/history`),

  /**
   * Start shipping / dispatch order (packing → shipping)
   * Initiates GPS delivery tracking timer
   * @param {string} orderId - Order ID
   * @param {object} [coordinates] - Optional GPS coordinates { seller: {lat,lng}, buyer: {lat,lng} }
   * @returns {Promise} Updated order with tracking info
   */
  startShipping: async (orderId, coordinates = null) =>
    await axiosClient.put(
      `${BASE_URL}/${orderId}/start-shipping`,
      coordinates ? { coordinates } : {},
    ),
};

export default orderSellerService;
