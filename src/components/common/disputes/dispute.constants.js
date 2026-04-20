import { REPORT_TYPES } from '@constants/common/disputes/reportForm.schema';

export const STATUS_META = {
  pending: { label: 'Pending', color: 'gold' },
  waiting_for_seller: { label: 'Waiting for Seller', color: 'geekblue' },
  investigating: { label: 'Investigating', color: 'blue' },
  resolved_refunded: { label: 'Resolved / Refunded', color: 'green' },
  resolved_rejected: { label: 'Resolved / Rejected', color: 'red' },
  appealed: { label: 'Appealed', color: 'purple' },
};

export const TYPE_META = {
  [REPORT_TYPES.ORDER]: { label: 'Order', color: 'cyan' },
  [REPORT_TYPES.PRODUCT]: { label: 'Product', color: 'volcano' },
  [REPORT_TYPES.SELLER]: { label: 'Seller', color: 'magenta' },
  [REPORT_TYPES.SYSTEM_BUG]: { label: 'System Bug', color: 'orange' },
};

export const ADMIN_STATUS_OPTIONS = [
  'pending',
  'waiting_for_seller',
  'investigating',
  'resolved_refunded',
  'resolved_rejected',
  'appealed',
];

export const REPORT_STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'waiting_for_seller', label: 'Waiting Seller' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved_refunded', label: 'Resolved/Refunded' },
  { key: 'resolved_rejected', label: 'Resolved/Rejected' },
  { key: 'appealed', label: 'Appealed' },
];

export const MAX_MEDIA_FILES = 5;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
