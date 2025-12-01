# GZMart Frontend - Project Structure

## 📁 Complete Directory Tree

```
GZMart_FE/
├── public/                         # Static assets
│   └── vite.svg                   # Vite logo (auto-generated)
│
├── src/
│   ├── assets/                    # Media files
│   │   ├── images/               # Images (logos, banners, etc.)
│   │   ├── icons/                # Custom icons
│   │   └── fonts/                # Custom fonts
│   │
│   ├── components/                # Reusable components
│   │   ├── common/               # Shared components across all modules
│   │   │   ├── LoadingSpinner.jsx ✅
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Breadcrumb.jsx
│   │   │
│   │   ├── buyer/                # Buyer-specific components
│   │   │   ├── ProductCard.jsx
│   │   │   ├── CartItem.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── ReviewCard.jsx
│   │   │
│   │   ├── seller/               # Seller/ERP components
│   │   │   ├── POForm.jsx
│   │   │   ├── POTable.jsx
│   │   │   ├── InventoryTable.jsx
│   │   │   ├── LandedCostForm.jsx
│   │   │   ├── StockAlert.jsx
│   │   │   └── SupplierCard.jsx
│   │   │
│   │   └── admin/                # Admin components
│   │       ├── UserTable.jsx
│   │       ├── SystemStats.jsx
│   │       └── ConfigForm.jsx
│   │
│   ├── layouts/                   # Layout wrappers
│   │   ├── MainLayout.jsx        ✅ Buyer/E-commerce layout
│   │   ├── ERPLayout.jsx         ✅ Seller/ERP layout
│   │   └── AdminLayout.jsx       ✅ Admin layout
│   │
│   ├── pages/                     # Page components
│   │   ├── buyer/                # E-commerce pages
│   │   │   ├── HomePage.jsx                ✅
│   │   │   ├── ShopPage.jsx                ✅
│   │   │   ├── ProductDetailsPage.jsx      ✅
│   │   │   ├── CartPage.jsx                ✅
│   │   │   ├── CheckoutPage.jsx            ✅
│   │   │   ├── BuyerDashboard.jsx          ✅
│   │   │   ├── OrdersPage.jsx              ✅
│   │   │   └── ProfilePage.jsx             ✅
│   │   │
│   │   ├── seller/               # ERP pages
│   │   │   ├── SellerDashboard.jsx         ✅
│   │   │   ├── PurchaseOrders/
│   │   │   │   ├── POListPage.jsx          ✅
│   │   │   │   ├── POCreatePage.jsx        ✅
│   │   │   │   ├── PODetailsPage.jsx       ✅
│   │   │   │   └── POEditPage.jsx
│   │   │   ├── Inventory/
│   │   │   │   ├── InventoryPage.jsx       ✅
│   │   │   │   ├── StockMovements.jsx
│   │   │   │   └── LowStockAlerts.jsx
│   │   │   ├── LandedCost/
│   │   │   │   ├── LandedCostPage.jsx      ✅
│   │   │   │   └── CalculationHistory.jsx
│   │   │   ├── Products/
│   │   │   │   ├── ProductsPage.jsx
│   │   │   │   ├── ProductCreate.jsx
│   │   │   │   └── ProductEdit.jsx
│   │   │   └── Reports/
│   │   │       ├── SalesReport.jsx
│   │   │       ├── InventoryReport.jsx
│   │   │       └── POReport.jsx
│   │   │
│   │   ├── admin/                # Admin pages
│   │   │   ├── AdminDashboard.jsx          ✅
│   │   │   ├── UsersPage.jsx               ✅
│   │   │   ├── SystemConfigPage.jsx        ✅
│   │   │   └── Logs/
│   │   │       ├── ActivityLogs.jsx
│   │   │       └── ErrorLogs.jsx
│   │   │
│   │   ├── auth/                 # Authentication pages
│   │   │   ├── LoginPage.jsx               ✅
│   │   │   ├── RegisterPage.jsx            ✅
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   └── errors/               # Error pages
│   │       ├── NotFoundPage.jsx            ✅
│   │       ├── UnauthorizedPage.jsx        ✅
│   │       └── ForbiddenPage.jsx           ✅
│   │
│   ├── services/                  # API & External Services
│   │   ├── axiosClient.js        ✅ Axios instance with interceptors
│   │   ├── api/                  # API endpoint services
│   │   │   ├── index.js                    ✅
│   │   │   ├── authService.js              ✅
│   │   │   ├── productService.js           ✅
│   │   │   ├── purchaseOrderService.js     ✅
│   │   │   ├── inventoryService.js         ✅
│   │   │   ├── landedCostService.js        ✅
│   │   │   ├── orderService.js
│   │   │   ├── userService.js
│   │   │   ├── categoryService.js
│   │   │   ├── supplierService.js
│   │   │   └── reportService.js
│   │   │
│   │   ├── ai/                   # AI integrations
│   │   │   ├── index.js                    ✅
│   │   │   ├── googleVisionService.js      ✅
│   │   │   ├── openAIService.js            ✅
│   │   │   └── geminiService.js            ✅
│   │   │
│   │   └── socket/               # WebSocket
│   │       └── socketService.js            ✅
│   │
│   ├── store/                     # Redux store
│   │   ├── store.js              ✅ Store configuration
│   │   └── slices/               # Redux slices
│   │       ├── authSlice.js                ✅
│   │       ├── cartSlice.js                ✅
│   │       ├── purchaseOrderSlice.js       ✅
│   │       ├── inventorySlice.js           ✅
│   │       ├── productsSlice.js
│   │       ├── ordersSlice.js
│   │       └── notificationsSlice.js
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useDebounce.js
│   │   ├── useLocalStorage.js
│   │   ├── useSocket.js
│   │   └── usePagination.js
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── ThemeContext.jsx
│   │   ├── LanguageContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── routes/                    # Routing configuration
│   │   ├── PrivateRoute.jsx      ✅ Protected route wrapper
│   │   ├── PublicRoute.jsx       ✅ Public route wrapper
│   │   └── routeConfig.js        ✅ Route definitions
│   │
│   ├── utils/                     # Utility functions
│   │   ├── formatters.js         ✅ Date, currency, text formatters
│   │   ├── validators.js         ✅ Input validation functions
│   │   ├── helpers.js            ✅ General helper functions
│   │   └── storage.js            ✅ LocalStorage management
│   │
│   ├── constants/                 # Constants & configs
│   │   ├── index.js              ✅ Main constants
│   │   └── routes.js             ✅ Route paths
│   │
│   ├── App.jsx                   ✅ Main app component
│   ├── main.jsx                  ✅ Entry point
│   └── index.css                 ✅ Global styles
│
├── .env.example                  ✅ Environment variables template
├── .gitignore                    ✅ Git ignore rules
├── .editorconfig                 ✅ Editor configuration
├── .eslintrc.cjs                 ✅ ESLint configuration
├── .prettierrc                   ✅ Prettier configuration
├── index.html                    ✅ HTML entry
├── jsconfig.json                 ✅ Path aliases
├── package.json                  ✅ Dependencies
├── vite.config.js                ✅ Vite configuration
├── README.md                     ✅ Project documentation
└── PROJECT_STRUCTURE.md          📄 This file
```

## 🎯 Module Separation Strategy

### **Buyer Module** (E-commerce)

- **Route Prefix:** `/`, `/buyer/*`
- **Layout:** MainLayout
- **Features:** Product browsing, Cart, Checkout, Orders, Profile
- **State:** Cart, Wishlist, Recently Viewed
- **Real-time:** Order status updates, Chat notifications

### **Seller Module** (Mini-ERP)

- **Route Prefix:** `/seller/*`
- **Layout:** ERPLayout
- **Features:** PO Management, Inventory, Landed-cost, Products, Reports
- **State:** Purchase Orders (with draft support), Inventory, Suppliers
- **Real-time:** Inventory alerts, PO approvals, Order notifications

### **Admin Module**

- **Route Prefix:** `/admin/*`
- **Layout:** AdminLayout
- **Features:** User management, System config, Logs, Monitoring
- **State:** Users, System settings
- **Real-time:** System alerts, Activity monitoring

## 🔑 Key Architectural Decisions

### 1. **State Management**

- **Redux Toolkit** for complex state (Auth, Cart, PO, Inventory)
- **Redux Persist** for offline support (Auth, Cart only)
- **Async Thunks** for API integration
- **Normalized state** for efficient updates

### 2. **Code Splitting**

- Lazy loading for all pages using `React.lazy()`
- Route-based code splitting via `routeConfig.js`
- Vendor chunk separation (React, Redux, Bootstrap)

### 3. **API Layer**

- Centralized Axios client with interceptors
- Service-based API organization
- Automatic token refresh on 401
- Request/Response logging in development

### 4. **Routing Strategy**

- Role-based route protection
- Separate layouts per module
- Dynamic route configuration
- Redirect logic based on authentication state

### 5. **Real-time Features**

- Socket.io client for WebSocket connections
- Event-based subscription model
- Reconnection logic with retry
- Room-based notifications (per user/role)

## 📦 Team Collaboration Structure

### **Recommended Task Assignment:**

| Team Member | Responsibility                       | Files/Folders                                                           |
| ----------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Developer 1 | **Authentication & User Management** | `pages/auth/*`, `authSlice.js`, `authService.js`                        |
| Developer 2 | **E-commerce (Buyer)**               | `pages/buyer/*`, `components/buyer/*`, `cartSlice.js`                   |
| Developer 3 | **Purchase Orders (ERP)**            | `pages/seller/PurchaseOrders/*`, `purchaseOrderSlice.js`                |
| Developer 4 | **Inventory & Landed Cost**          | `pages/seller/Inventory/*`, `inventorySlice.js`, `landedCostService.js` |
| Developer 5 | **Admin & Infrastructure**           | `pages/admin/*`, shared components, utilities                           |

### **Conflict Prevention:**

- Each developer works in separate page directories
- Shared components documented with PropTypes
- API services are read-only after initial setup
- Redux slices are module-specific

## 🚀 Next Steps for Development

### Phase 1: Foundation (Week 1-2)

- [ ] Complete authentication flow
- [ ] Implement product listing & details
- [ ] Build shopping cart functionality
- [ ] Setup socket.io connection

### Phase 2: Core Features (Week 3-4)

- [ ] Purchase Order CRUD operations
- [ ] Inventory management UI
- [ ] Landed cost calculator
- [ ] Order checkout & payment

### Phase 3: Advanced Features (Week 5-6)

- [ ] AI chatbot integration
- [ ] Image recognition for products
- [ ] Real-time notifications
- [ ] Reports & analytics

### Phase 4: Polish (Week 7-8)

- [ ] Admin panel completion
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Documentation

## 📚 Important Files Reference

### **Configuration Files**

- `vite.config.js` - Build & dev server config, path aliases
- `.eslintrc.cjs` - Code quality rules
- `.prettierrc` - Code formatting rules
- `jsconfig.json` - IDE intellisense for path aliases

### **Core Application Files**

- `src/App.jsx` - Main component with routing
- `src/main.jsx` - React entry point
- `src/store/store.js` - Redux store setup

### **Key Services**

- `src/services/axiosClient.js` - HTTP client
- `src/services/socket/socketService.js` - WebSocket client

### **Utilities**

- `src/utils/formatters.js` - Date, currency formatting
- `src/utils/validators.js` - Form validation
- `src/utils/storage.js` - LocalStorage wrapper

## ⚙️ Environment Variables

Required variables (see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_VISION_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
```

## 🎨 Styling Approach

- **Bootstrap 5** via `react-bootstrap` for components
- **Bootstrap Icons** for icon library
- **Custom CSS** in `index.css` for global styles
- **SCSS** (optional) for Bootstrap customization

---

**Last Updated:** December 2024  
**Project:** GZMart Capstone - Frontend Architecture  
**Status:** ✅ Initial Setup Complete
