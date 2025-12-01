import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY, STORAGE_KEYS } from '@constants';

/**
 * Storage utility with error handling
 */

// Auth Token Management
export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const setRefreshToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

// User Data Management
export const getUserData = () => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const setUserData = (userData) => {
  try {
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_DATA_KEY);
    }
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

// Clear all auth data
export const clearAuthData = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Generic Storage Operations
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
  }
};

export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Cart Management
export const getCart = () => getItem(STORAGE_KEYS.CART) || [];

export const setCart = (cart) => setItem(STORAGE_KEYS.CART, cart);

export const clearCart = () => removeItem(STORAGE_KEYS.CART);

// Wishlist Management
export const getWishlist = () => getItem(STORAGE_KEYS.WISHLIST) || [];

export const setWishlist = (wishlist) => setItem(STORAGE_KEYS.WISHLIST, wishlist);

export const clearWishlist = () => removeItem(STORAGE_KEYS.WISHLIST);

// Recently Viewed
export const getRecentlyViewed = () => getItem(STORAGE_KEYS.RECENTLY_VIEWED) || [];

export const addToRecentlyViewed = (productId, maxItems = 10) => {
  const recentlyViewed = getRecentlyViewed();
  const filtered = recentlyViewed.filter((id) => id !== productId);
  const updated = [productId, ...filtered].slice(0, maxItems);
  setItem(STORAGE_KEYS.RECENTLY_VIEWED, updated);
};

export const clearRecentlyViewed = () => removeItem(STORAGE_KEYS.RECENTLY_VIEWED);

export default {
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  getUserData,
  setUserData,
  clearAuthData,
  getItem,
  setItem,
  removeItem,
  clearStorage,
  getCart,
  setCart,
  clearCart,
  getWishlist,
  setWishlist,
  clearWishlist,
  getRecentlyViewed,
  addToRecentlyViewed,
  clearRecentlyViewed,
};
