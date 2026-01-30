/**
 * Simple cache utility for storing and retrieving data with TTL (Time To Live)
 * Uses memory cache for session-based caching
 */

class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set cache with key, value, and TTL (in milliseconds)
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get cached value by key
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove specific key from cache
   * @param {string} key - Cache key
   */
  remove(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get all cache keys
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.cache.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const cache = new Cache();

// Run cleanup every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

export default cache;

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
  DASHBOARD_ALL: 'dashboard_all_data',
  DASHBOARD_OVERVIEW: 'dashboard_overview',
  DASHBOARD_TOP_PRODUCTS: 'dashboard_top_products',
  DASHBOARD_RECENT_ORDERS: 'dashboard_recent_orders',
  DASHBOARD_CATEGORY_SALES: 'dashboard_category_sales',
  DASHBOARD_REVENUE_MONTHLY: 'dashboard_revenue_monthly',
  DASHBOARD_REVENUE_YEARLY: 'dashboard_revenue_yearly',
  DASHBOARD_USER_GROWTH_MONTHLY: 'dashboard_user_growth_monthly',
  DASHBOARD_USER_GROWTH_YEARLY: 'dashboard_user_growth_yearly',
  DASHBOARD_QUICK_STATS: 'dashboard_quick_stats',
};

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 10 * 60 * 1000, // 10 minutes
};
