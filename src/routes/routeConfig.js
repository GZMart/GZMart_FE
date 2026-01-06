import { lazy } from 'react';
import { USER_ROLES } from '@constants';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@pages/buyer/HomePage'));
const ShopPage = lazy(() => import('@pages/buyer/ShopPage'));
const ProductDetailsPage = lazy(() => import('@pages/buyer/ProductDetailsPage'));
const CartPage = lazy(() => import('@pages/buyer/CartPage'));
const CheckoutPage = lazy(() => import('@pages/buyer/CheckoutPage'));
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'));

// Buyer Pages
const BuyerDashboard = lazy(() => import('@pages/buyer/BuyerDashboard'));
const OrdersPage = lazy(() => import('@pages/buyer/OrdersPage'));
const ProfilePage = lazy(() => import('@pages/buyer/ProfilePage'));
const MyWalletPage = lazy(() => import('@pages/buyer/MyWalletPage'));

// Seller Pages (ERP)
const SellerDashboard = lazy(() => import('@pages/seller/SellerDashboard'));
const POListPage = lazy(() => import('@pages/seller/PurchaseOrders/POListPage'));
const POCreatePage = lazy(() => import('@pages/seller/PurchaseOrders/POCreatePage'));
const PODetailsPage = lazy(() => import('@pages/seller/PurchaseOrders/PODetailsPage'));
const InventoryPage = lazy(() => import('@pages/seller/Inventory/InventoryPage'));
const LandedCostPage = lazy(() => import('@pages/seller/LandedCost/LandedCostPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('@pages/admin/UsersPage'));
const SystemConfigPage = lazy(() => import('@pages/admin/SystemConfigPage'));

// Error Pages
const NotFoundPage = lazy(() => import('@pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@pages/errors/UnauthorizedPage'));
const ForbiddenPage = lazy(() => import('@pages/errors/ForbiddenPage'));

/**
 * Route Configuration
 */
export const routeConfig = [
  // Public Routes
  {
    path: '/',
    element: HomePage,
    public: true,
    layout: 'main',
  },
  {
    path: '/shop',
    element: ShopPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/product/:id',
    element: ProductDetailsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/login',
    element: LoginPage,
    public: true,
    restricted: true,
    layout: 'none',
  },
  {
    path: '/register',
    element: RegisterPage,
    public: true,
    restricted: true,
    layout: 'none',
  },

  // Buyer Routes
  {
    path: '/buyer/dashboard',
    element: BuyerDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/cart',
    element: CartPage,
    protected: false,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/checkout',
    element: CheckoutPage,
    protected: false,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/orders',
    element: OrdersPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/profile',
    element: ProfilePage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/wallet',
    element: MyWalletPage,
    protected: false,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },

  // Seller Routes (ERP)
  {
    path: '/seller/dashboard',
    element: SellerDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/purchase-orders',
    element: POListPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/purchase-orders/create',
    element: POCreatePage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/purchase-orders/:id',
    element: PODetailsPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/inventory',
    element: InventoryPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/landed-cost',
    element: LandedCostPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },

  // Admin Routes
  {
    path: '/admin/dashboard',
    element: AdminDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/users',
    element: UsersPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/config',
    element: SystemConfigPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },

  // Error Routes
  {
    path: '/401',
    element: UnauthorizedPage,
    public: true,
    layout: 'none',
  },
  {
    path: '/403',
    element: ForbiddenPage,
    public: true,
    layout: 'none',
  },
  {
    path: '*',
    element: NotFoundPage,
    public: true,
    layout: 'none',
  },
];

export default routeConfig;
