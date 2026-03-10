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
  DEALS: '/deals',
  PRODUCT_DETAILS: '/product/:id',
  SEARCH: '/search',
  LOGIN: '/login',
  REGISTER: '/register',
  OTP_VERIFICATION: '/otp-verification',
  FAVOURITES: '/favourites',
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
  ORDERS: '/buyer/profile?tab=orders',
  ORDER_DETAILS: '/buyer/orders/:id',
  FAVOURITES: '/buyer/favourites',
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
};

// Seller (ERP) Routes
export const SELLER_ROUTES = {
  DASHBOARD: '/seller/dashboard',
  PROFILE: '/seller/profile',
  ORDERS: '/seller/orders',

  // Purchase Orders
  PO_LIST: '/seller/purchase-orders',
  PO_CREATE: '/seller/purchase-orders/create',
  PO_DETAILS: '/seller/purchase-orders/:id',

  // Landed Cost
  LANDED_COST: '/seller/landed-cost',

  // Inventory
  INVENTORY: '/seller/inventory',

  // Products
  LISTINGS: '/seller/listings',

  // Returns
  RETURNS: '/seller/returns',
};

// Admin Routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  PROFILE: '/admin/profile',

  // User Management
  USERS: '/admin/users',
  USER_DETAILS: '/admin/users/:id',
  USER_CREATE: '/admin/users/create',
  USER_EDIT: '/admin/users/:id/edit',

  // Catalog Management
  CATEGORIES: '/admin/categories',
  ATTRIBUTES: '/admin/attributes',

  // System Configuration
  SYSTEM_CONFIG: '/admin/config',
  SITE_SETTINGS: '/admin/site-settings',
  PAYMENT_SETTINGS: '/admin/payment-settings',

  // Marketing
  SYSTEM_VOUCHERS: '/admin/system-vouchers',
  SYSTEM_VOUCHER_CREATE: '/admin/system-vouchers/create',
  SYSTEM_VOUCHER_EDIT: '/admin/system-vouchers/:id/edit',

  // Content
  PAGES: '/admin/pages',
  BANNERS: '/admin/banners',

  // Monitoring
  ACTIVITY_LOGS: '/admin/activity-logs',
  SYSTEM_HEALTH: '/admin/system-health',
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
