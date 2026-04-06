/**
 * Module Templates — Factory functions de tao module voi mock data
 *
 * Moi khi mot module moi duoc them vao canvas (addModule action),
 * ham nay se tra ve module object da duoc inject mock data tu dong,
 * de nguoi dung thay ngay "thanh pham" thay vi mot khung trong.
 */

import { MODULE_TYPES, generateModuleId } from '@services/api/shopDecorationService';
import {
  MOCK_PRODUCTS,
  MOCK_BANNERS,
  MOCK_VOUCHERS,
  MOCK_SHOP,
} from './mockData';

function genId() {
  return generateModuleId();
}

/**
 * Tra ve module object voi mock data tuong ung voi type.
 * Neu module da co du lieu (props co gia tri thuc), giu nguyen.
 */
export function getModuleTemplate(type, existingProps = {}) {
  const hasRealData = hasPlaceholderData(existingProps, type);
  if (hasRealData) {
    return {
      id: existingProps._id || genId(),
      type,
      props: existingProps,
      isEnabled: true,
      sortOrder: 0,
    };
  }

  const templates = {
    [MODULE_TYPES.BANNER_CAROUSEL]: () => ({
      id: genId(),
      type,
      props: {
        images: MOCK_BANNERS.map((b) => ({ url: b.url, link: b.link })),
        autoplay: true,
        interval: 4000,
        aspectRatio: '2:1',
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.BANNER_MULTI]: () => ({
      id: genId(),
      type,
      props: {
        images: MOCK_BANNERS.slice(0, 4).map((b) => ({ url: b.url, link: b.link })),
        columns: 2,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.BANNER_SINGLE]: () => ({
      id: genId(),
      type,
      props: {
        image: MOCK_BANNERS[0]?.url || '',
        link: '/',
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.BANNER_HOTSPOT]: () => ({
      id: genId(),
      type,
      props: {
        image: MOCK_BANNERS[0]?.url || '',
        hotspots: [
          { x: 25, y: 40, link: '/', label: 'San pham 1' },
          { x: 65, y: 60, link: '/', label: 'San pham 2' },
        ],
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.VOUCHER]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Ma Giam Gia',
        layout: 'bento',
        source: 'auto',
        voucherIds: [],
        displayLimit: 5,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.FLASH_DEALS]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Uu Dai Khung',
        layout: 'standard',
        hideTitle: false,
        dropShadow: true,
        bgColor: '#fff',
        displayLimit: 20,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.ADDON_DEALS]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Mua Kem Deal Soc',
        layout: 'standard',
        hideTitle: false,
        displayLimit: 20,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.COMBO_PROMOS]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Combo Khuyen Mai',
        layout: 'standard',
        hideTitle: false,
        displayLimit: 20,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.FEATURED_PRODUCTS]: () => ({
      id: genId(),
      type,
      props: {
        title: 'San Pham Noi Bat',
        layout: 'bento',
        hideTitle: false,
        dropShadow: true,
        bgColor: '#fff',
        source: 'auto',
        productIds: [],
        displayLimit: 10,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.FEATURED_CATEGORIES]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Danh Muc Noi Bat',
        hideTitle: false,
        displayLimit: 10,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.BEST_SELLING]: () => ({
      id: genId(),
      type,
      props: {
        title: 'San Pham Ban Chay',
        layout: 'bento',
        hideTitle: false,
        dropShadow: true,
        bgColor: '#fff',
        displayLimit: 10,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.NEW_PRODUCTS]: () => ({
      id: genId(),
      type,
      props: {
        title: 'San Pham Moi',
        layout: 'standard',
        hideTitle: false,
        displayLimit: 10,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.CATEGORY_LIST]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Danh Sach Nganh Hang',
        hideTitle: false,
        displayLimit: 20,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.TEXT]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Tieu de van ban',
        content: 'Noi dung van ban mau. Nhap noi dung tuy chinh cua ban vao day.',
        align: 'left',
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.IMAGE_TEXT]: () => ({
      id: genId(),
      type,
      props: {
        image: MOCK_BANNERS[1]?.url || '',
        title: 'Tieu de bai viet',
        content: 'Noi dung bai viet voi hinh anh. Mo ta chi tiet san pham,uu dai hoac thong tin khuyen mai.',
        position: 'left',
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.SHOP_INFO]: () => ({
      id: genId(),
      type,
      props: {
        title: 'Thong Tin Shop',
        avatar: MOCK_SHOP.avatar,
        coverImage: MOCK_SHOP.coverImage,
        shopName: MOCK_SHOP.name,
        description: MOCK_SHOP.description,
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.DISCOUNT]: () => ({
      id: genId(),
      type,
      props: {
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),

    [MODULE_TYPES.SUGGESTED_FOR_YOU]: () => ({
      id: genId(),
      type,
      props: {
        ...existingProps,
      },
      isEnabled: true,
      sortOrder: 0,
    }),
  };

  const factory = templates[type];
  if (!factory) {
    return {
      id: genId(),
      type,
      props: existingProps,
      isEnabled: true,
      sortOrder: 0,
    };
  }
  return factory();
}

/**
 * Kiem tra xem props co chua du lieu thuc (placeholder) hay chua.
 */
function hasPlaceholderData(props, type) {
  if (!props) {
return false;
}
  switch (type) {
    case MODULE_TYPES.BANNER_CAROUSEL:
    case MODULE_TYPES.BANNER_MULTI:
      return Array.isArray(props.images) && props.images.length > 0 && typeof props.images[0] === 'object' && props.images[0].url && !props.images[0].url.includes('unsplash.com/photo');
    case MODULE_TYPES.BANNER_SINGLE:
    case MODULE_TYPES.BANNER_HOTSPOT:
      return !!props.image && !props.image.includes('unsplash.com/photo');
    case MODULE_TYPES.SHOP_INFO:
      return !!props.shopName && props.shopName !== MOCK_SHOP.name;
    case MODULE_TYPES.TEXT:
    case MODULE_TYPES.IMAGE_TEXT:
      return !!props.title && props.title !== 'Tieu de van ban' && props.title !== 'Tieu de bai viet';
    default:
      return false;
  }
}

/**
 * Tra ve danh sach products (thuc hoac mock) cho mot module.
 */
export function getModuleProducts(module, limit = 5) {
  if (!module) {
 return []; 
}
  const { type } = module;

  // Neu la module co productIds thi tra ve product theo id, nguoc lai tra ve mock
  const isProductModule = [
    MODULE_TYPES.FEATURED_PRODUCTS,
    MODULE_TYPES.BEST_SELLING,
    MODULE_TYPES.NEW_PRODUCTS,
  ].includes(type);

  if (isProductModule) {
    return MOCK_PRODUCTS.slice(0, limit);
  }
  return [];
}

/**
 * Tra ve danh sach banners (thuc hoac mock) cho mot module.
 */
export function getModuleBanners(module) {
  if (!module) {
 return []; 
}
  const { type, props = {} } = module;

  switch (type) {
    case MODULE_TYPES.BANNER_CAROUSEL:
    case MODULE_TYPES.BANNER_MULTI:
      if (Array.isArray(props.images) && props.images.length > 0) {
        return props.images.map((img) => (typeof img === 'string' ? { url: img, link: '' } : img));
      }
      return MOCK_BANNERS;
    case MODULE_TYPES.BANNER_SINGLE:
      return props.image ? [{ url: props.image, link: props.link || '' }] : [];
    case MODULE_TYPES.BANNER_HOTSPOT:
      return props.image ? [{ url: props.image }] : [];
    default:
      return [];
  }
}

/**
 * Tra ve danh sach vouchers (thuc hoac mock) cho mot module.
 */
export function getModuleVouchers(module, limit = 3) {
  return MOCK_VOUCHERS.slice(0, limit);
}

/**
 * Tra ve shop info (thuc hoac mock) cho SHOP_INFO module.
 */
export function getModuleShopInfo(module) {
  if (!module) {
 return MOCK_SHOP; 
}
  const { props = {} } = module;
  return {
    name: props.shopName || MOCK_SHOP.name,
    avatar: props.avatar || MOCK_SHOP.avatar,
    coverImage: props.coverImage || MOCK_SHOP.coverImage,
    rating: MOCK_SHOP.rating,
    reviewCount: MOCK_SHOP.reviewCount,
    followerCount: MOCK_SHOP.followerCount,
    description: props.description || MOCK_SHOP.description,
    location: MOCK_SHOP.location,
  };
}
