/**
 * Centralized API Services Export
 * Import all services here for easy access throughout the application
 */

export { default as authService } from './authService';
export { default as productService } from './productService';
export { default as categoryService } from './categoryService';
export { default as homeService } from './homeService';
export { default as dealService } from './dealService';
export { campaignService } from './campaignService';
export { default as brandService } from './brandService';
export { default as searchService } from './searchService';
export { default as purchaseOrderService } from './purchaseOrderService';
export { default as inventoryService } from './inventoryService';
export { default as landedCostService } from './landedCostService';
export { default as reviewService } from './reviewService';
export { default as followService } from './follow.service';
export { default as uploadService } from './uploadService';
export { default as livestreamService } from './livestreamService';
export { default as disputeService } from './disputeService';
export {
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
} from './shopDecorationService';
export { shopDecorationApi } from './shopDecorationApi';
export * as sellerApplicationService from './sellerApplicationService';
export { default as notificationAPI } from './notificationAPI';
export { default as bannerAdsService } from './bannerAdsService';

// TODO: Add more services as needed
// export { default as orderService } from './orderService';
// export { default as userService } from './userService';
// export { default as supplierService } from './supplierService';
// export { default as reportService } from './reportService';
// export { default as notificationService } from './notificationService';
