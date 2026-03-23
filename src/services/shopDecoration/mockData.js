/**
 * Mock Data for Shop Decoration Preview
 *
 * Mang du lieu placeholder de hien thi ngay khi module moi duoc them,
 * truoc khi nguoi dung upload anh that hoac co du lieu tu server.
 *
 * Tat ca anh deu dung placeholder so x so (khong dung anh that).
 */

export const MOCK_PRODUCTS = [
  { id: 'mock_p1',  name: 'San pham 1', price: 100000, originalPrice: 150000, discount: 33, rating: 4.5, sold: 120, location: 'TP.HCM',  image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p2',  name: 'San pham 2', price: 200000, originalPrice: 280000, discount: 29, rating: 4.7, sold: 340, location: 'Ha Noi',     image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p3',  name: 'San pham 3', price: 350000, originalPrice: 450000, discount: 22, rating: 4.6, sold: 210, location: 'Da Nang',   image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p4',  name: 'San pham 4', price: 500000, originalPrice: 700000, discount: 29, rating: 4.8, sold: 550, location: 'Can Tho',   image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p5',  name: 'San pham 5', price: 75000,  originalPrice: 100000, discount: 25, rating: 4.4, sold: 80,  location: 'Hue',       image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p6',  name: 'San pham 6', price: 420000, originalPrice: 600000, discount: 30, rating: 4.9, sold: 980, location: 'Vung Tau', image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p7',  name: 'San pham 7', price: 150000, originalPrice: 200000, discount: 25, rating: 4.3, sold: 175, location: 'TP.HCM',    image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
  { id: 'mock_p8',  name: 'San pham 8', price: 280000, originalPrice: 350000, discount: 20, rating: 4.6, sold: 420, location: 'Ha Noi',    image: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=400x400' },
];

export const MOCK_BANNERS = [
  { id: 'mock_bn1', url: 'https://placehold.co/1200x400/e2e8f0/94a3b8?text=1200x400', link: '/', alt: 'Banner 1' },
  { id: 'mock_bn2', url: 'https://placehold.co/1200x400/e2e8f0/94a3b8?text=1200x400', link: '/', alt: 'Banner 2' },
  { id: 'mock_bn3', url: 'https://placehold.co/1200x400/e2e8f0/94a3b8?text=1200x400', link: '/', alt: 'Banner 3' },
];

export const MOCK_VOUCHERS = [
  { id: 'mock_v1', code: 'SALE10',    discount: '10%',    maxDiscount: '50K', minOrder: '0',   expires: '31.12.2026', type: 'percent',   remaining: 450, total: 500 },
  { id: 'mock_v2', code: 'FREESHIP', discount: 'Freeship', maxDiscount: '30K', minOrder: '150K', expires: '25.12.2026', type: 'shipping',  remaining: 200, total: 500 },
  { id: 'mock_v3', code: 'GIAM20K',  discount: '20K',    maxDiscount: '20K', minOrder: '200K', expires: '15.12.2026', type: 'fixed',     remaining: 0,   total: 200, disabled: true },
];

export const MOCK_SHOP = {
  name:          'Ten Shop',
  avatar:        'https://placehold.co/200x200/e2e8f0/94a3b8?text=200x200',
  coverImage:    'https://placehold.co/1200x300/e2e8f0/94a3b8?text=1200x300',
  rating:        4.5,
  reviewCount:   120,
  followerCount: 300,
  responseRate:  '95%',
  description:   'Mo ta shop',
  joinedDate:    '2024',
  location:      'TP. Ho Chi Minh',
};

export const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Danh muc 1', icon: 'bi-folder',   count: 10 },
  { id: 'c2', name: 'Danh muc 2', icon: 'bi-folder',   count: 20 },
  { id: 'c3', name: 'Danh muc 3', icon: 'bi-folder',   count: 15 },
  { id: 'c4', name: 'Danh muc 4', icon: 'bi-folder',   count: 8  },
  { id: 'c5', name: 'Danh muc 5', icon: 'bi-folder',   count: 12 },
  { id: 'c6', name: 'Danh muc 6', icon: 'bi-folder',   count: 6  },
];

/** Get N random products from mock data */
export function getMockProducts(count = 4) {
  const shuffled = [...MOCK_PRODUCTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Get N random banners from mock data */
export function getMockBanners(count = 3) {
  return MOCK_BANNERS.slice(0, count);
}

/** Get N random vouchers from mock data */
export function getMockVouchers(count = 3) {
  return MOCK_VOUCHERS.slice(0, count);
}

/** Format price to VND string */
export function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

/** Format sold count */
export function formatSold(sold) {
  if (sold >= 1000) return `${(sold / 1000).toFixed(1)}k`;
  return sold.toString();
}
