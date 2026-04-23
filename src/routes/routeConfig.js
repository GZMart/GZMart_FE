import { lazy } from 'react';
import { USER_ROLES } from '@constants';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@pages/buyer/HomePage'));
const CategoriesPage = lazy(() => import('@pages/buyer/CategoriesPage'));
const ProductsPage = lazy(() => import('@pages/buyer/ProductsPage'));
const FlashDealsPage = lazy(() => import('@pages/buyer/FlashDealsPage'));
const ProductDetailsPage = lazy(() => import('@pages/buyer/ProductDetailsPage'));
const ImageSearchResultsPage = lazy(() => import('@pages/buyer/ImageSearchResultsPage'));
const CartPage = lazy(() => import('@/pages/buyer/cart/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/buyer/cart/CheckoutPage'));
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/auth/ResetPasswordPage'));
const OTPVerificationPage = lazy(() => import('@pages/auth/OTPVerificationPage'));
const ChangePasswordPage = lazy(() => import('@pages/auth/ChangePasswordPage'));
const ShopProfilePage = lazy(() => import('@pages/buyer/ShopProfilePage'));
const LiveViewerPage = lazy(() => import('@pages/buyer/LiveViewerPage'));
const LiveStreamsBrowsePage = lazy(() => import('@pages/buyer/LiveStreamsBrowsePage'));

const OrderConfirmationPage = lazy(() => import('@/pages/buyer/order/OrderConfirmationPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/buyer/order/PaymentSuccessPage'));
const PaymentCancelledPage = lazy(() => import('@/pages/buyer/order/PaymentCancelledPage'));

// Buyer Pages
// BuyerDashboard removed — buyer does not need a dashboard
// const OrdersPage = lazy(() => import('@pages/buyer/OrdersPage')); // Removed: Use ProfilePage tab=orders
const ProfilePage = lazy(() => import('@pages/buyer/ProfilePage'));
const BuyerDisputesPage = lazy(() => import('@pages/buyer/DisputesPage'));
const NotificationPage = lazy(() => import('@pages/buyer/NotificationPage'));
const MyWalletPage = lazy(() => import('@pages/buyer/MyWalletPage'));
const BuyerReturnStatusPage = lazy(() => import('@/pages/buyer/order/BuyerReturnStatusPage'));
const WishlistPage = lazy(() => import('@pages/buyer/WishlistPage'));
const TrackOrderPage = lazy(() => import('@/pages/buyer/order/TrackOrderPage'));
const TrackOrderDetailsPage = lazy(() => import('@/pages/buyer/order/TrackOrderDetailsPage'));
const MyDealsPage = lazy(() => import('@pages/buyer/MyDealsPage'));
const DealDetailsPage = lazy(() => import('@pages/buyer/DealDetailsPage'));

// ERP Pages (New Mini-ERP/Sourcing Module)
const ERPDashboard = lazy(() => import('@/pages/seller/erp/ERPDashboard'));
const SuppliersPage = lazy(() => import('@/pages/seller/erp/SuppliersPage'));
const SupplierDetailPage = lazy(() => import('@/pages/seller/erp/SupplierDetailPage'));
const PurchaseOrdersPage = lazy(() => import('@/pages/seller/erp/PurchaseOrdersPage'));
const CreatePurchaseOrderPage = lazy(() => import('@/pages/seller/erp/CreatePurchaseOrderPage'));
const PurchaseOrderDetailPage = lazy(() => import('@/pages/seller/erp/PurchaseOrderDetailPage'));
const EditPurchaseOrderPage = lazy(() => import('@/pages/seller/erp/EditPurchaseOrderPage'));

// Seller Pages (ERP)
const SellerDashboard = lazy(() => import('@pages/seller/SellerDashboard'));
const POListPage = lazy(() => import('@pages/seller/PurchaseOrders/POListPage'));
const POCreatePage = lazy(() => import('@pages/seller/PurchaseOrders/POCreatePage'));
const PODetailsPage = lazy(() => import('@pages/seller/PurchaseOrders/PODetailsPage'));
const InventoryPage = lazy(() => import('@pages/seller/Inventory/InventoryPage'));
const LandedCostPage = lazy(() => import('@pages/seller/LandedCost/LandedCostPage'));
const ListingsPage = lazy(() => import('@pages/seller/ListingsPage'));
const ReturnsPage = lazy(() => import('@pages/seller/ReturnsPage'));
const SellerOrdersPage = lazy(() => import('@/pages/seller/Order/OrdersPage'));
const OrderDetailsPage = lazy(() => import('@pages/seller/OrderDetailsPage'));
const SellerDisputesPage = lazy(() => import('@pages/seller/DisputesPage'));
const CampaignsPage = lazy(() => import('@pages/seller/CampaignsPage'));
const VoucherDashboard = lazy(() => import('@pages/seller/vouchers/VoucherDashboard'));
const VoucherCreatePage = lazy(() => import('@pages/seller/vouchers/VoucherCreatePage'));
const ShopPromotionsPage = lazy(() => import('@pages/seller/promotions/ShopPromotionsPage'));
const ShopProgramForm = lazy(() => import('@pages/seller/promotions/ShopProgramForm'));
const ComboPromotionForm = lazy(() => import('@pages/seller/promotions/ComboPromotionForm'));
const AddOnDealForm = lazy(() => import('@pages/seller/promotions/AddOnDealForm'));
const ChatPage = lazy(() => import('@pages/seller/ChatPage'));
const SellerProfilePage = lazy(() => import('@pages/seller/SellerProfilePage'));
const ShopDecorationPage = lazy(() => import('@pages/seller/ShopDecorationPage'));
const ShopNotificationsPage = lazy(() => import('@pages/seller/ShopNotificationsPage'));
const SellerMyNotificationsPage = lazy(() => import('@pages/buyer/NotificationPage'));
const LiveStreamPage = lazy(() => import('@pages/seller/LiveStreamPage'));
const LiveStreamMobilePage = lazy(() => import('@pages/seller/LiveStreamMobilePage'));
const SellerFinancePage = lazy(() => import('@pages/seller/SellerFinancePage'));
const SellerBannerAdsPage = lazy(() => import('@pages/seller/SellerBannerAdsPage'));

// Buyer - Seller Application
const SellerApplicationPage = lazy(() => import('@pages/buyer/SellerApplicationPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('@pages/admin/UsersPage'));
const AdminDisputesPage = lazy(() => import('@pages/admin/DisputesPage'));
const SellerApplicationsPage = lazy(() => import('@pages/admin/SellerApplicationsPage'));
const SystemConfigPage = lazy(() => import('@pages/admin/SystemConfigPage'));
const AdminCategoriesPage = lazy(() => import('@pages/admin/CategoriesPage'));
const AttributesPage = lazy(() => import('@pages/admin/AttributesPage'));
const SystemVouchersPage = lazy(() => import('@pages/admin/marketing/SystemVouchersPage'));
const SystemVoucherForm = lazy(() => import('@pages/admin/marketing/SystemVoucherForm'));
const VoucherCampaignsPage = lazy(() => import('@pages/admin/marketing/VoucherCampaignsPage'));
const VoucherCampaignForm = lazy(() => import('@pages/admin/marketing/VoucherCampaignForm'));
const AdminFlashCampaignsPage = lazy(() => import('@pages/admin/marketing/AdminFlashCampaignsPage'));
const AdminBannerAdsPage = lazy(() => import('@pages/admin/AdminBannerAdsPage'));
const AdminPlatformOrdersPage = lazy(() => import('@pages/admin/AdminPlatformOrdersPage'));
const AdminRewardWithdrawalsPage = lazy(() => import('@pages/admin/AdminRewardWithdrawalsPage'));
const AdminRmaQueuePage = lazy(() => import('@pages/admin/AdminRmaQueuePage'));
const AdminCoinToolsPage = lazy(() => import('@pages/admin/AdminCoinToolsPage'));
const TestMapPage = lazy(() => import('@pages/admin/TestMapPage'));

// Error Pages
const NotFoundPage = lazy(() => import('@pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@pages/errors/UnauthorizedPage'));
const ForbiddenPage = lazy(() => import('@pages/errors/ForbiddenPage'));

//Footer Pages
const TermsOfServicePage = lazy(() => import('@/pages/buyer/footerlink/TermsOfService'));
const PrivacyPolicyPage = lazy(() => import('@/pages/buyer/footerlink/PrivacyPolicy'));
const RefundPolicyPage = lazy(() => import('@/pages/buyer/footerlink/RefundPolicy'));
const ShippingPolicyPage = lazy(() => import('@/pages/buyer/footerlink/ShippingPolicy'));
const FrequentlyAskedQuestionsPage = lazy(
  () => import('@/pages/buyer/footerlink/FrequentlyAskedQuestions')
);
const HowWeCanHelpYouPage = lazy(() => import('@/pages/buyer/footerlink/HowWeCanHelpYou'));

/**
 * Seller portal: child paths for nested route `path="/seller/*"`.
 * Same order as former flat routes — static paths before dynamic params where needed.
 */
export const sellerErpChildRoutes = [
  { path: 'dashboard', element: SellerDashboard },
  { path: 'profile', element: SellerProfilePage },
  { path: 'live', element: LiveStreamPage },
  { path: 'live/mobile', element: LiveStreamMobilePage },
  { path: 'shop-decoration', element: ShopDecorationPage },
  { path: 'erp/dashboard', element: ERPDashboard },
  { path: 'erp/suppliers', element: SuppliersPage },
  { path: 'erp/suppliers/:id', element: SupplierDetailPage },
  { path: 'erp/purchase-orders', element: PurchaseOrdersPage },
  { path: 'erp/purchase-orders/create', element: CreatePurchaseOrderPage },
  { path: 'erp/purchase-orders/:id/edit', element: EditPurchaseOrderPage },
  { path: 'erp/purchase-orders/:id', element: PurchaseOrderDetailPage },
  { path: 'purchase-orders', element: POListPage },
  { path: 'purchase-orders/create', element: POCreatePage },
  { path: 'purchase-orders/:id', element: PODetailsPage },
  { path: 'inventory', element: InventoryPage },
  { path: 'landed-cost', element: LandedCostPage },
  { path: 'products', element: ListingsPage },
  { path: 'returns', element: ReturnsPage },
  { path: 'orders', element: SellerOrdersPage },
  { path: 'orders/:id', element: OrderDetailsPage },
  { path: 'disputes', element: SellerDisputesPage },
  { path: 'messages', element: ChatPage },
  { path: 'campaigns', element: CampaignsPage },
  { path: 'vouchers', element: VoucherDashboard },
  { path: 'vouchers/create/:type', element: VoucherCreatePage },
  { path: 'vouchers/edit/:id', element: VoucherCreatePage },
  { path: 'vouchers/view/:id', element: VoucherCreatePage },
  { path: 'promotions', element: ShopPromotionsPage },
  { path: 'promotions/create/shop', element: ShopProgramForm },
  { path: 'promotions/create/combo', element: ComboPromotionForm },
  { path: 'promotions/create/addon', element: AddOnDealForm },
  { path: 'promotions/view/shop/:id', element: ShopProgramForm },
  { path: 'promotions/view/combo/:id', element: ComboPromotionForm },
  { path: 'promotions/view/addon/:id', element: AddOnDealForm },
  { path: 'promotions/edit/shop/:id', element: ShopProgramForm },
  { path: 'promotions/edit/combo/:id', element: ComboPromotionForm },
  { path: 'promotions/edit/addon/:id', element: AddOnDealForm },
  { path: 'notifications', element: ShopNotificationsPage },
  { path: 'my-notifications', element: SellerMyNotificationsPage },
  { path: 'banner-ads', element: SellerBannerAdsPage },
  { path: 'finance', element: SellerFinancePage },
];

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
    path: '/categories',
    element: CategoriesPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/products',
    element: ProductsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/deals',
    element: FlashDealsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/live',
    element: LiveStreamsBrowsePage,
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
    path: '/search/image',
    element: ImageSearchResultsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/shop/:id',
    element: ShopProfilePage,
    public: true,
    layout: 'main',
  },
  {
    path: '/shop/:shopId/live/:sessionId',
    element: LiveViewerPage,
    public: true,
    layout: 'none',
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
  {
    path: '/otp-verification',
    element: OTPVerificationPage,
    public: true,
    restricted: true,
    layout: 'none',
  },
  {
    path: '/forgot-password',
    element: ForgotPasswordPage,
    public: true,
    restricted: true,
    layout: 'none',
  },
  {
    path: '/reset-password',
    element: ResetPasswordPage,
    public: true,
    restricted: true,
    layout: 'none',
  },
  {
    path: '/change-password',
    element: ChangePasswordPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER, USER_ROLES.SELLER, USER_ROLES.ADMIN],
    layout: 'none',
  },
  {
    path: '/buyer/wishlist',
    element: WishlistPage,
    public: false,
    layout: 'main',
  },
  {
    path: '/track-order',
    element: TrackOrderPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/track-order-details/:orderId',
    element: TrackOrderDetailsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/my-deals',
    element: MyDealsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/deal/:dealId',
    element: DealDetailsPage,
    public: true,
    layout: 'main',
  },

  // Buyer Routes
  // /buyer/dashboard removed — buyer does not need a dashboard
  {
    path: '/buyer/cart',
    element: CartPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/checkout',
    element: CheckoutPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/order-confirmation/:orderId',
    element: OrderConfirmationPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/payment/success',
    element: PaymentSuccessPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/payment/cancelled',
    element: PaymentCancelledPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  // Removed: Use /buyer/profile?tab=orders instead (BUYER_ROUTES.ORDERS)
  // {
  //   path: '/buyer/orders',
  //   element: OrdersPage,
  //   protected: true,
  //   allowedRoles: [USER_ROLES.BUYER],
  //   layout: 'main',
  // },
  {
    path: '/buyer/orders/:orderId',
    element: TrackOrderDetailsPage,
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
    path: '/buyer/disputes',
    element: BuyerDisputesPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/notifications',
    element: NotificationPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/wallet',
    element: MyWalletPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/returns/:requestId',
    element: BuyerReturnStatusPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },
  {
    path: '/buyer/seller-application',
    element: SellerApplicationPage,
    protected: true,
    allowedRoles: [USER_ROLES.BUYER],
    layout: 'main',
  },

  // Seller (ERP) — expanded in App.jsx as nested /seller/* so ERPLayout is not unmounted
  { _sellerErp: true },

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
    path: '/admin/disputes',
    element: AdminDisputesPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/orders',
    element: AdminPlatformOrdersPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/reward-withdrawals',
    element: AdminRewardWithdrawalsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/rma',
    element: AdminRmaQueuePage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/coin-tools',
    element: AdminCoinToolsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/seller-applications',
    element: SellerApplicationsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/banner-ads',
    element: AdminBannerAdsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/categories',
    element: AdminCategoriesPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/attributes',
    element: AttributesPage,
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
  {
    path: '/admin/system-vouchers',
    element: SystemVouchersPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/system-vouchers/create',
    element: SystemVoucherForm,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/system-vouchers/:id/edit',
    element: SystemVoucherForm,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/flash-campaigns',
    element: AdminFlashCampaignsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/voucher-campaigns',
    element: VoucherCampaignsPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/voucher-campaigns/create',
    element: VoucherCampaignForm,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },
  {
    path: '/admin/voucher-campaigns/:id/edit',
    element: VoucherCampaignForm,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN],
    layout: 'admin',
  },

  // Test Routes (Public - No Authentication)
  {
    path: '/admin/test-map',
    element: TestMapPage,
    public: true,
    layout: 'none',
  },
  {
    path: '/admin/notifications',
    element: NotificationPage,
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

  // Footer Routes
  {
    path: '/terms-of-service',
    element: TermsOfServicePage,
    public: true,
    layout: 'main',
  },
  {
    path: '/privacy-policy',
    element: PrivacyPolicyPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/refund-policy',
    element: RefundPolicyPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/shipping-policy',
    element: ShippingPolicyPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/frequently-asked-questions',
    element: FrequentlyAskedQuestionsPage,
    public: true,
    layout: 'main',
  },
  {
    path: '/how-we-can-help-you',
    element: HowWeCanHelpYouPage,
    public: true,
    layout: 'main',
  },
];

export default routeConfig;
