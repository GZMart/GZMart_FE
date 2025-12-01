/**
 * Application Constants
 */

// User Roles
export const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  GUEST: 'guest',
};

// User Role Labels
export const ROLE_LABELS = {
  [USER_ROLES.BUYER]: 'Customer',
  [USER_ROLES.SELLER]: 'Seller',
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.GUEST]: 'Guest',
};

// Authentication
export const AUTH_TOKEN_KEY = 'gzmart_auth_token';
export const REFRESH_TOKEN_KEY = 'gzmart_refresh_token';
export const USER_DATA_KEY = 'gzmart_user_data';

// API Endpoints Base
export const API_VERSION = '/api/v1';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.CONFIRMED]: 'info',
  [ORDER_STATUS.PROCESSING]: 'primary',
  [ORDER_STATUS.SHIPPED]: 'secondary',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger',
  [ORDER_STATUS.REFUNDED]: 'dark',
};

// Purchase Order Status (ERP)
export const PO_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

export const PO_STATUS_LABELS = {
  [PO_STATUS.DRAFT]: 'Draft',
  [PO_STATUS.SUBMITTED]: 'Submitted',
  [PO_STATUS.APPROVED]: 'Approved',
  [PO_STATUS.ORDERED]: 'Ordered',
  [PO_STATUS.PARTIALLY_RECEIVED]: 'Partially Received',
  [PO_STATUS.RECEIVED]: 'Received',
  [PO_STATUS.CLOSED]: 'Closed',
  [PO_STATUS.CANCELLED]: 'Cancelled',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  COD: 'cash_on_delivery',
  BANK_TRANSFER: 'bank_transfer',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHODS.DEBIT_CARD]: 'Debit Card',
  [PAYMENT_METHODS.PAYPAL]: 'PayPal',
  [PAYMENT_METHODS.STRIPE]: 'Stripe',
  [PAYMENT_METHODS.COD]: 'Cash on Delivery',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
};

// Inventory Status
export const INVENTORY_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
};

// Product Categories (Fashion)
export const PRODUCT_CATEGORIES = {
  MENS_WEAR: "men's_wear",
  WOMENS_WEAR: "women's_wear",
  KIDS_WEAR: 'kids_wear',
  ACCESSORIES: 'accessories',
  FOOTWEAR: 'footwear',
  BAGS: 'bags',
  JEWELRY: 'jewelry',
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  NEW_ORDER: 'new_order',
  ORDER_STATUS_UPDATED: 'order_status_updated',
  INVENTORY_UPDATED: 'inventory_updated',
  NEW_MESSAGE: 'new_message',
  NOTIFICATION: 'notification',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  CART: 'gzmart_cart',
  WISHLIST: 'gzmart_wishlist',
  RECENTLY_VIEWED: 'gzmart_recently_viewed',
  THEME: 'gzmart_theme',
  LANGUAGE: 'gzmart_language',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
};

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword'];

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  POSTAL_CODE: /^[0-9]{5,6}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

// Toast Duration
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
};

// Currency
export const DEFAULT_CURRENCY = 'VND';
export const CURRENCY_SYMBOL = '₫';

export default {
  USER_ROLES,
  ROLE_LABELS,
  ORDER_STATUS,
  PO_STATUS,
  PAYMENT_METHODS,
  INVENTORY_STATUS,
  SOCKET_EVENTS,
  STORAGE_KEYS,
  DATE_FORMATS,
};
