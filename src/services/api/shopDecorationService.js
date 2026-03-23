/**
 * Shop Decoration — FE constants & helpers
 *
 * JSON Schema:
 * {
 *   version: "desktop" | "mobile",
 *   modules: Module[],         // ordered array in display order
 *   widgets: WidgetConfig{},
 * }
 *
 * Module:
 * {
 *   id: string,                // unique id
 *   type: MODULE_TYPES.*,
 *   props: object,             // type-specific config
 *   isEnabled: boolean,
 *   sortOrder: number,
 * }
 *
 * WidgetConfig:
 * {
 *   featuredProducts: { enabled, limit, source, productIds },
 *   featuredCategories: { enabled, limit },
 *   bestSelling: { enabled, limit },
 *   newProducts: { enabled, limit },
 *   categoryList: { enabled, limit },
 *   flashDeals: { enabled, limit },
 *   addonDeals: { enabled, limit },
 *   comboPromos: { enabled, limit },
 * }
 */

// ─── Module Types ─────────────────────────────────────────────────────────
export const MODULE_TYPES = {
  // A. Visuals
  BANNER_CAROUSEL: 'banner_carousel',
  BANNER_MULTI: 'banner_multi',
  BANNER_SINGLE: 'banner_single',
  BANNER_HOTSPOT: 'banner_hotspot',
  // B. Marketing (auto)
  VOUCHER: 'voucher',
  FLASH_DEALS: 'flash_deals',
  ADDON_DEALS: 'addon_deals',
  COMBO_PROMOS: 'combo_promos',
  // C. Products & Category
  FEATURED_PRODUCTS: 'featured_products',
  FEATURED_CATEGORIES: 'featured_categories',
  BEST_SELLING: 'best_selling',
  NEW_PRODUCTS: 'new_products',
  CATEGORY_LIST: 'category_list',
  // D. Information
  TEXT: 'text',
  IMAGE_TEXT: 'image_text',
  SHOP_INFO: 'shop_info',
  // E. Mandatory sections
  DISCOUNT: 'discount',
  SUGGESTED_FOR_YOU: 'suggested_for_you',
};

export const MODULE_LABELS = {
  [MODULE_TYPES.BANNER_CAROUSEL]: 'Carousel Banner',
  [MODULE_TYPES.BANNER_MULTI]: 'Banner – Multiple Images',
  [MODULE_TYPES.BANNER_SINGLE]: 'Banner – Single Image',
  [MODULE_TYPES.BANNER_HOTSPOT]: 'Banner Hotspot',
  [MODULE_TYPES.VOUCHER]: 'Discount Code',
  [MODULE_TYPES.FLASH_DEALS]: 'Flash Deals',
  [MODULE_TYPES.ADDON_DEALS]: 'Add-on Deals',
  [MODULE_TYPES.COMBO_PROMOS]: 'Combo Promotions',
  [MODULE_TYPES.FEATURED_PRODUCTS]: 'Featured Products',
  [MODULE_TYPES.FEATURED_CATEGORIES]: 'Featured Categories',
  [MODULE_TYPES.BEST_SELLING]: 'Best Selling Products',
  [MODULE_TYPES.NEW_PRODUCTS]: 'New Products',
  [MODULE_TYPES.CATEGORY_LIST]: 'Category List',
  [MODULE_TYPES.TEXT]: 'Text',
  [MODULE_TYPES.IMAGE_TEXT]: 'Image & Text',
  [MODULE_TYPES.SHOP_INFO]: 'Shop Info',
  [MODULE_TYPES.DISCOUNT]: 'Discount',
  [MODULE_TYPES.SUGGESTED_FOR_YOU]: 'SUGGESTED FOR YOU',
};

/** Group definitions for the module library panel */
/* All product modules (formerly widgets) are now part of the module system */
/* DISCOUNT and SUGGESTED_FOR_YOU are mandatory modules that always appear first */
export const MODULE_GROUPS = [
  {
    label: 'Images',
    items: [
      { type: MODULE_TYPES.BANNER_CAROUSEL, icon: 'bi-images' },
      { type: MODULE_TYPES.BANNER_MULTI, icon: 'bi-grid-3x3-gap' },
      { type: MODULE_TYPES.BANNER_SINGLE, icon: 'bi-image' },
      { type: MODULE_TYPES.BANNER_HOTSPOT, icon: 'bi-pin-map' },
    ],
  },
  {
    label: 'Products',
    items: [
      { type: MODULE_TYPES.FEATURED_PRODUCTS, icon: 'bi-star-fill' },
      { type: MODULE_TYPES.BEST_SELLING, icon: 'bi-trophy-fill' },
      { type: MODULE_TYPES.NEW_PRODUCTS, icon: 'bi-clock-fill' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { type: MODULE_TYPES.FLASH_DEALS, icon: 'bi-lightning-charge-fill' },
      { type: MODULE_TYPES.ADDON_DEALS, icon: 'bi-plus-circle-fill' },
      { type: MODULE_TYPES.COMBO_PROMOS, icon: 'bi-box-seam-fill' },
    ],
  },
  {
    label: 'Categories',
    items: [
      { type: MODULE_TYPES.FEATURED_CATEGORIES, icon: 'bi-grid-3x2-gap-fill' },
      { type: MODULE_TYPES.CATEGORY_LIST, icon: 'bi-list-ul' },
    ],
  },
  {
    label: 'Information',
    items: [
      { type: MODULE_TYPES.TEXT, icon: 'bi-text-paragraph' },
      { type: MODULE_TYPES.IMAGE_TEXT, icon: 'bi-card-image' },
    ],
  },
];

// ─── Widget Keys & Config ────────────────────────────────────────────────
export const WIDGET_KEYS = {
  FEATURED_PRODUCTS: 'featuredProducts',
  FEATURED_CATEGORIES: 'featuredCategories',
  BEST_SELLING: 'bestSelling',
  NEW_PRODUCTS: 'newProducts',
  CATEGORY_LIST: 'categoryList',
  FLASH_DEALS: 'flashDeals',
  ADDON_DEALS: 'addonDeals',
  COMBO_PROMOS: 'comboPromos',
};

export const WIDGET_LABELS = {
  [WIDGET_KEYS.FEATURED_PRODUCTS]: 'Featured Products',
  [WIDGET_KEYS.FEATURED_CATEGORIES]: 'Featured Categories',
  [WIDGET_KEYS.BEST_SELLING]: 'Best Selling Products',
  [WIDGET_KEYS.NEW_PRODUCTS]: 'New Products',
  [WIDGET_KEYS.CATEGORY_LIST]: 'Category List',
  [WIDGET_KEYS.FLASH_DEALS]: 'Flash Deals',
  [WIDGET_KEYS.ADDON_DEALS]: 'Add-on Deals',
  [WIDGET_KEYS.COMBO_PROMOS]: 'Combo Promotions',
};

/** Modules that use "Tự động" badge (no manual config needed) */
export const WIDGET_AUTO_KEYS = [
  WIDGET_KEYS.FLASH_DEALS,
  WIDGET_KEYS.ADDON_DEALS,
  WIDGET_KEYS.COMBO_PROMOS,
  WIDGET_KEYS.FEATURED_PRODUCTS,
  WIDGET_KEYS.FEATURED_CATEGORIES,
  WIDGET_KEYS.CATEGORY_LIST,
];

/** Widget display limits (max on storefront) */
export const WIDGET_MAX = {
  [WIDGET_KEYS.FEATURED_PRODUCTS]: 20,
  [WIDGET_KEYS.FEATURED_CATEGORIES]: 20,
  [WIDGET_KEYS.BEST_SELLING]: 10,
  [WIDGET_KEYS.NEW_PRODUCTS]: 10,
  [WIDGET_KEYS.CATEGORY_LIST]: 20,
  [WIDGET_KEYS.FLASH_DEALS]: 20,
  [WIDGET_KEYS.ADDON_DEALS]: 20,
  [WIDGET_KEYS.COMBO_PROMOS]: 20,
};

/** Default widget config: chỉ bật Sản phẩm nổi bật + Danh mục nổi bật; widget khác seller bật trong Cấu hình Widget. */
export const getDefaultWidgets = () => ({
  [WIDGET_KEYS.FEATURED_PRODUCTS]: { enabled: true, limit: 10, source: 'auto', productIds: [] },
  [WIDGET_KEYS.FEATURED_CATEGORIES]: { enabled: true, limit: 10 },
  [WIDGET_KEYS.BEST_SELLING]: { enabled: false, limit: 2 },
  [WIDGET_KEYS.NEW_PRODUCTS]: { enabled: false, limit: 1 },
  [WIDGET_KEYS.CATEGORY_LIST]: { enabled: false, limit: 5 },
  [WIDGET_KEYS.FLASH_DEALS]: { enabled: false, limit: 5 },
  [WIDGET_KEYS.ADDON_DEALS]: { enabled: false, limit: 3 },
  [WIDGET_KEYS.COMBO_PROMOS]: { enabled: false, limit: 3 },
});

// ─── Shared Utilities ────────────────────────────────────────────────────────

/**
 * Consistent module ID format — single source of truth across shop decoration FE.
 * Previously duplicated between shopDecorationService.js and moduleTemplates.js.
 */
export function generateModuleId() {
  return `mod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Module Factory ────────────────────────────────────────────────────────
const MODULE_DEFAULTS = {
  [MODULE_TYPES.BANNER_CAROUSEL]: {
    images: [],
    autoplay: true,
    interval: 4000,
    aspectRatio: '2:1',
  },
  [MODULE_TYPES.BANNER_MULTI]: { images: [], columns: 2 },
  [MODULE_TYPES.BANNER_SINGLE]: { image: '', link: '' },
  [MODULE_TYPES.BANNER_HOTSPOT]: { image: '', hotspots: [] },
  [MODULE_TYPES.TEXT]: { title: '', content: '', align: 'left' },
  [MODULE_TYPES.IMAGE_TEXT]: { image: '', title: '', content: '', position: 'left' },
  [MODULE_TYPES.SHOP_INFO]: { title: 'Shop Info', content: '' },
  [MODULE_TYPES.DISCOUNT]: {},
  [MODULE_TYPES.SUGGESTED_FOR_YOU]: {},
};

export function createModule(type, overrides = {}) {
  return {
    id: generateModuleId(),
    type,
    props: { ...(MODULE_DEFAULTS[type] || {}), ...(overrides.props || {}) },
    isEnabled: true,
    sortOrder: 0,
    ...overrides,
  };
}

// ─── Reorder modules ──────────────────────────────────────────────────────
export function reorderModules(modules, fromIndex, toIndex) {
  const result = [...modules];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((m, i) => ({ ...m, sortOrder: i }));
}

// ─── Default full decoration config ─────────────────────────────────────
export const getDefaultConfig = () => ({
  version: 'desktop',
  modules: [],
  widgets: getDefaultWidgets(),
});

export default {
  MODULE_TYPES,
  MODULE_LABELS,
  MODULE_GROUPS,
  WIDGET_KEYS,
  WIDGET_LABELS,
  WIDGET_AUTO_KEYS,
  WIDGET_MAX,
  getDefaultWidgets,
  getDefaultConfig,
  createModule,
  reorderModules,
  generateModuleId,
};
