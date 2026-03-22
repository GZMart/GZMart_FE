import { lazy } from 'react';
import { USER_ROLES } from '@constants';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@pages/buyer/HomePage'));
const CategoriesPage = lazy(() => import('@pages/buyer/CategoriesPage'));
const ProductsPage = lazy(() => import('@pages/buyer/ProductsPage'));
const FlashDealsPage = lazy(() => import('@pages/buyer/FlashDealsPage'));
const ProductDetailsPage = lazy(() => import('@pages/buyer/ProductDetailsPage'));
const ImageSearchResultsPage = lazy(() => import('@pages/buyer/ImageSearchResultsPage'));
const CartPage = lazy(() => import('@pages/buyer/CartPage'));
const CheckoutPage = lazy(() => import('@pages/buyer/CheckoutPage'));
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/auth/ResetPasswordPage'));
const OTPVerificationPage = lazy(() => import('@pages/auth/OTPVerificationPage'));
const ChangePasswordPage = lazy(() => import('@pages/auth/ChangePasswordPage'));
const ShopProfilePage = lazy(() => import('@pages/buyer/ShopProfilePage'));

const OrderConfirmationPage = lazy(() => import('@pages/buyer/OrderConfirmationPage'));
const PaymentSuccessPage = lazy(() => import('@pages/buyer/PaymentSuccessPage'));
const PaymentCancelledPage = lazy(() => import('@pages/buyer/PaymentCancelledPage'));

// Buyer Pages
// BuyerDashboard removed — buyer does not need a dashboard
// const OrdersPage = lazy(() => import('@pages/buyer/OrdersPage')); // Removed: Use ProfilePage tab=orders
const ProfilePage = lazy(() => import('@pages/buyer/ProfilePage'));
const NotificationPage = lazy(() => import('@pages/buyer/NotificationPage'));
const MyWalletPage = lazy(() => import('@pages/buyer/MyWalletPage'));
const BuyerReturnStatusPage = lazy(() => import('@pages/buyer/BuyerReturnStatusPage'));
const WishlistPage = lazy(() => import('@pages/buyer/WishlistPage'));
const TrackOrderPage = lazy(() => import('@pages/buyer/TrackOrderPage'));
const TrackOrderDetailsPage = lazy(() => import('@pages/buyer/TrackOrderDetailsPage'));
const MyDealsPage = lazy(() => import('@pages/buyer/MyDealsPage'));
const DealDetailsPage = lazy(() => import('@pages/buyer/DealDetailsPage'));

// ERP Pages (New Mini-ERP/Sourcing Module)
const ERPDashboard = lazy(() => import('@pages/erp/ERPDashboard'));
const SuppliersPage = lazy(() => import('@pages/erp/SuppliersPage'));
const SupplierDetailPage = lazy(() => import('@pages/erp/SupplierDetailPage'));
const PurchaseOrdersPage = lazy(() => import('@pages/erp/PurchaseOrdersPage'));
const CreatePurchaseOrderPage = lazy(() => import('@pages/erp/CreatePurchaseOrderPage'));
const PurchaseOrderDetailPage = lazy(() => import('@pages/erp/PurchaseOrderDetailPage'));
const EditPurchaseOrderPage = lazy(() => import('@pages/erp/EditPurchaseOrderPage'));

// Seller Pages (ERP)
const SellerDashboard = lazy(() => import('@pages/seller/SellerDashboard'));
const POListPage = lazy(() => import('@pages/seller/PurchaseOrders/POListPage'));
const POCreatePage = lazy(() => import('@pages/seller/PurchaseOrders/POCreatePage'));
const PODetailsPage = lazy(() => import('@pages/seller/PurchaseOrders/PODetailsPage'));
const InventoryPage = lazy(() => import('@pages/seller/Inventory/InventoryPage'));
const LandedCostPage = lazy(() => import('@pages/seller/LandedCost/LandedCostPage'));
const ListingsPage = lazy(() => import('@pages/seller/ListingsPage'));
const ReturnsPage = lazy(() => import('@pages/seller/ReturnsPage'));
const SellerOrdersPage = lazy(() => import('@pages/seller/OrdersPage'));
const OrderDetailsPage = lazy(() => import('@pages/seller/OrderDetailsPage'));
const FlashSalesPage = lazy(() => import('@pages/seller/FlashSalesPage'));
const VoucherDashboard = lazy(() => import('@pages/seller/vouchers/VoucherDashboard'));
const VoucherCreatePage = lazy(() => import('@pages/seller/vouchers/VoucherCreatePage'));
const ShopPromotionsPage = lazy(() => import('@pages/seller/promotions/ShopPromotionsPage'));
const ShopProgramForm = lazy(() => import('@pages/seller/promotions/ShopProgramForm'));
const ComboPromotionForm = lazy(() => import('@pages/seller/promotions/ComboPromotionForm'));
const AddOnDealForm = lazy(() => import('@pages/seller/promotions/AddOnDealForm'));
const ChatPage = lazy(() => import('@pages/seller/ChatPage'));
const SellerProfilePage = lazy(() => import('@pages/seller/SellerProfilePage'));
const ShopNotificationsPage = lazy(() => import('@pages/seller/ShopNotificationsPage'));

// Buyer - Seller Application
const SellerApplicationPage = lazy(() => import('@pages/buyer/SellerApplicationPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('@pages/admin/UsersPage'));
const SellerApplicationsPage = lazy(() => import('@pages/admin/SellerApplicationsPage'));
const SystemConfigPage = lazy(() => import('@pages/admin/SystemConfigPage'));
const AdminCategoriesPage = lazy(() => import('@pages/admin/CategoriesPage'));
const AttributesPage = lazy(() => import('@pages/admin/AttributesPage'));
const SystemVouchersPage = lazy(() => import('@pages/admin/marketing/SystemVouchersPage'));
const SystemVoucherForm = lazy(() => import('@pages/admin/marketing/SystemVoucherForm'));

// Error Pages
const NotFoundPage = lazy(() => import('@pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@pages/errors/UnauthorizedPage'));
const ForbiddenPage = lazy(() => import('@pages/errors/ForbiddenPage'));

//Footer Pages
const TermsOfServicePage = lazy(() => import('@pages/footerLink/TermsOfService'));
const PrivacyPolicyPage = lazy(() => import('@pages/footerLink/PrivacyPolicy'));
const RefundPolicyPage = lazy(() => import('@pages/footerLink/RefundPolicy'));
const ShippingPolicyPage = lazy(() => import('@pages/footerLink/ShippingPolicy'));
const FrequentlyAskedQuestionsPage = lazy(
  () => import('@pages/footerLink/FrequentlyAskedQuestions')
);
const HowWeCanHelpYouPage = lazy(() => import('@pages/footerLink/HowWeCanHelpYou'));

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

  // Seller Routes (ERP)
  {
    path: '/seller/dashboard',
    element: SellerDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/profile',
    element: SellerProfilePage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },

  // ERP Routes (Mini-ERP/Sourcing Module) - Admin & Seller only
  {
    path: '/seller/erp/dashboard',
    element: ERPDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/suppliers',
    element: SuppliersPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/suppliers/:id',
    element: SupplierDetailPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/purchase-orders',
    element: PurchaseOrdersPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/purchase-orders/create',
    element: CreatePurchaseOrderPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/purchase-orders/:id/edit',
    element: EditPurchaseOrderPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/erp/purchase-orders/:id',
    element: PurchaseOrderDetailPage,
    protected: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SELLER],
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
  {
    path: '/seller/products',
    element: ListingsPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/returns',
    element: ReturnsPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/orders',
    element: SellerOrdersPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/orders/:id',
    element: OrderDetailsPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/messages',
    element: ChatPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/flash-sales',
    element: FlashSalesPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/vouchers',
    element: VoucherDashboard,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/vouchers/create/:type',
    element: VoucherCreatePage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/vouchers/edit/:id',
    element: VoucherCreatePage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/vouchers/view/:id',
    element: VoucherCreatePage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions',
    element: ShopPromotionsPage,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/create/shop',
    element: ShopProgramForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/create/combo',
    element: ComboPromotionForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/create/addon',
    element: AddOnDealForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/view/shop/:id',
    element: ShopProgramForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/view/combo/:id',
    element: ComboPromotionForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/view/addon/:id',
    element: AddOnDealForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/edit/shop/:id',
    element: ShopProgramForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/edit/combo/:id',
    element: ComboPromotionForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/promotions/edit/addon/:id',
    element: AddOnDealForm,
    protected: true,
    allowedRoles: [USER_ROLES.SELLER],
    layout: 'erp',
  },
  {
    path: '/seller/notifications',
    element: ShopNotificationsPage,
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
    path: '/admin/seller-applications',
    element: SellerApplicationsPage,
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
