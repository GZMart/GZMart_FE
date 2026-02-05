import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import purchaseOrderReducer from './slices/purchaseOrderSlice';
import inventoryReducer from './slices/inventorySlice';
import erpReducer from './slices/erpSlice';

// Persist configuration
const persistConfig = {
  key: 'gzmart-root',
  version: 1,
  storage,
  whitelist: ['auth', 'cart'], // Only persist auth and cart
};

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated'], // Only persist user and auth status
};

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items'], // Only persist cart items
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);

/**
 * Redux Store Configuration
 */
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    cart: persistedCartReducer,
    purchaseOrder: purchaseOrderReducer,
    inventory: inventoryReducer,
    erp: erpReducer,
    // Add more reducers as needed:
    // products: productsReducer,
    // orders: ordersReducer,
    // users: usersReducer,
    // notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development
});

export const persistor = persistStore(store);

export default store;
