/**
 * Route paths for the application
 */

// Public Routes (Guest/Buyer)
export const PUBLIC_ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  PRODUCT_DETAILS: '/product/:id',
  SEARCH: '/search',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_CONDITIONS: '/terms-conditions',
  FAQ: '/faq',
};

// Buyer Protected Routes
export const BUYER_ROUTES = {
  DASHBOARD: '/buyer/dashboard',
  PROFILE: '/buyer/profile',
  ORDERS: '/buyer/orders',
  ORDER_DETAILS: '/buyer/orders/:id',
  WISHLIST: '/buyer/wishlist',
  CART: '/buyer/cart',
  CHECKOUT: '/buyer/checkout',
  PAYMENT: '/buyer/payment',
  ORDER_CONFIRMATION: '/buyer/order-confirmation/:orderId',
  ADDRESSES: '/buyer/addresses',
  PAYMENT_METHODS: '/buyer/payment-methods',
  NOTIFICATIONS: '/buyer/notifications',
};

// Seller (ERP) Routes
export const SELLER_ROUTES = {
  DASHBOARD: '/seller/dashboard',
  PROFILE: '/seller/profile',

  // Purchase Orders
  PO_LIST: '/seller/purchase-orders',
  PO_CREATE: '/seller/purchase-orders/create',
  PO_DETAILS: '/seller/purchase-orders/:id',
  PO_EDIT: '/seller/purchase-orders/:id/edit',

  // Landed Cost
  LANDED_COST_CALCULATOR: '/seller/landed-cost',
  LANDED_COST_HISTORY: '/seller/landed-cost/history',

  // Inventory
  INVENTORY: '/seller/inventory',
  INVENTORY_ADD: '/seller/inventory/add',
  INVENTORY_EDIT: '/seller/inventory/:id/edit',
  STOCK_MOVEMENTS: '/seller/inventory/movements',
  LOW_STOCK_ALERTS: '/seller/inventory/alerts',

  // Products
  PRODUCTS: '/seller/products',
  PRODUCT_CREATE: '/seller/products/create',
  PRODUCT_EDIT: '/seller/products/:id/edit',

  // Orders
  ORDERS: '/seller/orders',
  ORDER_DETAILS: '/seller/orders/:id',

  // Suppliers
  SUPPLIERS: '/seller/suppliers',
  SUPPLIER_CREATE: '/seller/suppliers/create',
  SUPPLIER_EDIT: '/seller/suppliers/:id/edit',

  // Reports & Analytics
  REPORTS: '/seller/reports',
  ANALYTICS: '/seller/analytics',
  SALES_REPORT: '/seller/reports/sales',
  INVENTORY_REPORT: '/seller/reports/inventory',
  PO_REPORT: '/seller/reports/purchase-orders',

  // Settings
  SETTINGS: '/seller/settings',
  NOTIFICATIONS: '/seller/notifications',
};

// Admin Routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  PROFILE: '/admin/profile',

  // User Management
  USERS: '/admin/users',
  USER_CREATE: '/admin/users/create',
  USER_EDIT: '/admin/users/:id/edit',
  USER_DETAILS: '/admin/users/:id',

  // System Configuration
  SYSTEM_CONFIG: '/admin/config',
  SITE_SETTINGS: '/admin/settings/site',
  EMAIL_SETTINGS: '/admin/settings/email',
  PAYMENT_SETTINGS: '/admin/settings/payment',
  SHIPPING_SETTINGS: '/admin/settings/shipping',

  // Content Management
  PAGES: '/admin/pages',
  PAGE_EDIT: '/admin/pages/:id/edit',
  BANNERS: '/admin/banners',
  PROMOTIONS: '/admin/promotions',

  // Logs & Monitoring
  ACTIVITY_LOGS: '/admin/logs/activity',
  ERROR_LOGS: '/admin/logs/errors',
  SYSTEM_HEALTH: '/admin/system/health',

  // Reports
  REPORTS: '/admin/reports',
  USER_REPORT: '/admin/reports/users',
  SALES_REPORT: '/admin/reports/sales',
  SYSTEM_REPORT: '/admin/reports/system',
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
    buyer: BUYER_ROUTES.DASHBOARD,
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
