/**
 * Route paths for the application
 */

// Public Routes (Guest/Buyer)
export const PUBLIC_ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  CATEGORIES: '/categories',
  CATEGORY_PRODUCTS: '/categories/:categoryId/products',
  PRODUCTS: '/products',
  /** Buyer: browse all live sessions */
  LIVE_STREAMS: '/live',
  DEALS: '/deals',
  PRODUCT_DETAILS: '/product/:id',
  SEARCH: '/search',
  IMAGE_SEARCH: '/search/image',
  LOGIN: '/login',
  REGISTER: '/register',
  OTP_VERIFICATION: '/otp-verification',
  WISHLIST: '/wishlist',
  TRACK_ORDER: '/track-order',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  REFUND_POLICY: '/refund-policy',
  SHIPPING_POLICY: '/shipping-policy',
  FAQ: '/frequently-asked-questions',
  HOW_WE_CAN_HELP: '/how-we-can-help-you',
};

// Buyer Protected Routes
export const BUYER_ROUTES = {
  DASHBOARD: '/buyer/dashboard',
  PROFILE: '/buyer/profile?tab=account',
  DISPUTES: '/buyer/disputes',
  ORDERS: '/buyer/profile?tab=orders',
  ORDER_DETAILS: '/buyer/profile?tab=orders',
  WISHLIST: '/buyer/wishlist',
  CART: '/buyer/cart',
  CHECKOUT: '/buyer/checkout',
  PAYMENT: '/buyer/payment',
  PAYMENT_SUCCESS: '/buyer/payment/success',
  PAYMENT_CANCELLED: '/buyer/payment/cancelled',
  ORDER_CONFIRMATION: '/buyer/order-confirmation/:orderId',
  ADDRESSES: '/buyer/addresses',
  PAYMENT_METHODS: '/buyer/payment-methods',
  WALLET: '/buyer/wallet',
  NOTIFICATIONS: '/buyer/notifications',
  SELLER_APPLICATION: '/buyer/seller-application',
};

// Seller (ERP) Routes
export const SELLER_ROUTES = {
  DASHBOARD: '/seller/dashboard',
  PROFILE: '/seller/profile',
  SHOP_DECORATION: '/seller/shop-decoration',
  ORDERS: '/seller/orders',
  DISPUTES: '/seller/disputes',

  // Purchase Orders
  PO_LIST: '/seller/purchase-orders',
  PO_CREATE: '/seller/purchase-orders/create',
  PO_DETAILS: '/seller/purchase-orders/:id',

  // Landed Cost
  LANDED_COST: '/seller/landed-cost',

  // Inventory
  INVENTORY: '/seller/inventory',

  // Products
  PRODUCTS: '/seller/products',

  // Returns
  RETURNS: '/seller/returns',

  // Campaigns
  CAMPAIGNS: '/seller/campaigns',
  // Banner Ads
  BANNER_ADS: '/seller/banner-ads',

  // Live stream (seller studio)
  LIVE: '/seller/live',
  /** Continue live on phone (handoff link lands here) */
  LIVE_MOBILE: '/seller/live/mobile',

  // Finance & Topup
  FINANCE: '/seller/finance',
};

// Admin Routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  PROFILE: '/admin/profile',
  DISPUTES: '/admin/disputes',

  // User Management
  USERS: '/admin/users',
  SELLER_APPLICATIONS: '/admin/seller-applications',
  USER_DETAILS: '/admin/users/:id',
  USER_CREATE: '/admin/users/create',
  USER_EDIT: '/admin/users/:id/edit',

  // Catalog Management
  CATEGORIES: '/admin/categories',
  ATTRIBUTES: '/admin/attributes',

  // System Configuration
  SYSTEM_CONFIG: '/admin/config',
  /** Đơn hàng toàn sàn — tra cứu / hỗ trợ */
  PLATFORM_ORDERS: '/admin/orders',
  /** Rút reward point — duyệt */
  REWARD_WITHDRAWALS: '/admin/reward-withdrawals',
  /** RMA — hàng chờ admin */
  RMA_QUEUE: '/admin/rma',
  /** GZCoin — công cụ admin */
  COIN_TOOLS: '/admin/coin-tools',
  SITE_SETTINGS: '/admin/site-settings',
  PAYMENT_SETTINGS: '/admin/payment-settings',

  // Marketing
  SYSTEM_VOUCHERS: '/admin/system-vouchers',
  SYSTEM_VOUCHER_CREATE: '/admin/system-vouchers/create',
  SYSTEM_VOUCHER_EDIT: '/admin/system-vouchers/:id/edit',
  VOUCHER_CAMPAIGNS: '/admin/voucher-campaigns',
  VOUCHER_CAMPAIGN_CREATE: '/admin/voucher-campaigns/create',
  VOUCHER_CAMPAIGN_EDIT: '/admin/voucher-campaigns/:id/edit',
  /** Flash Sale / Deal — moderation toàn hệ thống */
  FLASH_CAMPAIGNS: '/admin/flash-campaigns',

  // Content
  PAGES: '/admin/pages',
  BANNERS: '/admin/banners',

  // Monitoring
  ACTIVITY_LOGS: '/admin/activity-logs',
  SYSTEM_HEALTH: '/admin/system-health',

  // Banner Ads Management
  BANNER_ADS: '/admin/banner-ads',
};

// Error Routes
export const ERROR_ROUTES = {
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
};

// Get role-based home route
export const getRoleHomePath = (role) => {
  const roleRoutes = {
    buyer: PUBLIC_ROUTES.HOME,
    seller: SELLER_ROUTES.DASHBOARD,
    admin: ADMIN_ROUTES.DASHBOARD,
    guest: PUBLIC_ROUTES.HOME,
  };
  return roleRoutes[role] || PUBLIC_ROUTES.HOME;
};

export default {
  PUBLIC_ROUTES,
  BUYER_ROUTES,
  SELLER_ROUTES,
  ADMIN_ROUTES,
  ERROR_ROUTES,
  getRoleHomePath,
};
