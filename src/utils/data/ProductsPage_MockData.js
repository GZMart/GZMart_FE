/**
 * Mock Data for ProductsPage
 */

export const breadcrumbItems = [
  { label: 'Home', path: '/', icon: 'bi-house' },
  { label: 'Categories', path: '/categories' },
  { label: 'All Products' },
];

export const sizes = [
  { id: 's', name: 'Small' },
  { id: 'm', name: 'Medium' },
  { id: 'l', name: 'Large' },
  { id: 'xl', name: 'X-Large' },
];

export const locations = [
  { id: 'hanoi', name: 'Hà Nội' },
  { id: 'hcm', name: 'Hồ Chí Minh' },
  { id: 'danang', name: 'Đà Nẵng' },
  { id: 'haiphong', name: 'Hải Phòng' },
  { id: 'cantho', name: 'Cần Thơ' },
];

export const shippingUnits = [
  { id: 'ghn', name: 'Giao Hàng Nhanh' },
  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm' },
  { id: 'viettel', name: 'Viettel Post' },
  { id: 'vnpost', name: 'VNPost' },
  { id: 'jt', name: 'J&T Express' },
];

export const shopTypes = [
  { id: 'mall', name: 'Shop Mall' },
  { id: 'preferred', name: 'Shop Ưu Đãi' },
  { id: 'verified', name: 'Shop Đã Xác Minh' },
];

export const conditions = [
  { id: 'new', name: 'Hàng Mới' },
  { id: 'used', name: 'Hàng Đã Sử Dụng' },
];

export const paymentOptions = [
  { id: 'cod', name: 'Thanh Toán Khi Nhận Hàng' },
  { id: 'credit', name: 'Thẻ Tín Dụng/Ghi Nợ' },
  { id: 'banking', name: 'Chuyển Khoản Ngân Hàng' },
  { id: 'ewallet', name: 'Ví Điện Tử' },
];

export const ratings = [
  { id: '5', name: '5 sao', value: 5 },
  { id: '4', name: '4 sao', value: 4 },
  { id: '3', name: '3 sao', value: 3 },
];

export const services = [
  { id: 'freeship', name: 'Miễn Phí Vận Chuyển' },
  { id: 'discount', name: 'Giảm Giá' },
  { id: 'voucher', name: 'Có Voucher' },
  { id: 'combo', name: 'Ưu Đãi Combo' },
];

export const priceRanges = [
  { id: 'under1m', name: 'Dưới 1,000,000₫', min: 0, max: 1000000 },
  { id: '1m-5m', name: '1,000,000₫ - 5,000,000₫', min: 1000000, max: 5000000 },
  { id: '5m-10m', name: '5,000,000₫ - 10,000,000₫', min: 5000000, max: 10000000 },
  { id: 'above10m', name: 'Trên 10,000,000₫', min: 10000000, max: Infinity },
];

export const discounts = [
  { id: '10', name: '10% or more', value: 10 },
  { id: '20', name: '20% or more', value: 20 },
  { id: '30', name: '30% or more', value: 30 },
  { id: '50', name: '50% or more', value: 50 },
];

export const availabilityOptions = [
  { id: 'inStock', name: 'In Stock' },
  { id: 'outOfStock', name: 'Out of Stock' },
];

// Shared shipping methods (same for all products)
export const shippingMethods = [
  {
    icon: 'bi-geo-alt-fill',
    name: 'Courier',
    description: '2 - 4 days, free shipping',
  },
  {
    icon: 'bi-box-seam',
    name: 'Local Shipping',
    description: 'Up to one week, ₫20,000',
  },
  {
    icon: 'bi-truck',
    name: 'UPS Ground Shipping',
    description: '4 - 6 days, ₫50,000',
  },
  {
    icon: 'bi-clock-history',
    name: 'Unishop Global Export',
    description: '3 - 4 days, ₫100,000',
  },
];

// Deals Mock Data
export const deals = [
  {
    id: 1,
    productId: 1,
    dealType: 'flash', // flash, daily, weekend, clearance
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-11T23:59:59Z',
    dealQuantityLimit: 100,
    dealSoldCount: 67,
    dealStatus: 'active', // active, expired, upcoming
    dealPriority: 1, // Higher number = higher priority
    isHotDeal: true,
    isFeatured: true,
  },
  {
    id: 2,
    productId: 2,
    dealType: 'flash',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-11T23:59:59Z',
    dealQuantityLimit: 50,
    dealSoldCount: 32,
    dealStatus: 'active',
    dealPriority: 2,
    isHotDeal: true,
    isFeatured: false,
  },
  {
    id: 3,
    productId: 3,
    dealType: 'flash',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-11T23:59:59Z',
    dealQuantityLimit: 30,
    dealSoldCount: 18,
    dealStatus: 'active',
    dealPriority: 3,
    isHotDeal: true,
    isFeatured: true,
  },
  {
    id: 4,
    productId: 4,
    dealType: 'daily',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-12T23:59:59Z',
    dealQuantityLimit: 200,
    dealSoldCount: 145,
    dealStatus: 'active',
    dealPriority: 4,
    isHotDeal: false,
    isFeatured: true,
  },
  {
    id: 5,
    productId: 5,
    dealType: 'weekend',
    dealStartDate: '2025-12-13T00:00:00Z',
    dealEndDate: '2025-12-15T23:59:59Z',
    dealQuantityLimit: 150,
    dealSoldCount: 89,
    dealStatus: 'active',
    dealPriority: 5,
    isHotDeal: false,
    isFeatured: false,
  },
  {
    id: 6,
    productId: 6,
    dealType: 'clearance',
    dealStartDate: '2025-12-01T00:00:00Z',
    dealEndDate: '2025-12-31T23:59:59Z',
    dealQuantityLimit: 75,
    dealSoldCount: 45,
    dealStatus: 'active',
    dealPriority: 6,
    isHotDeal: false,
    isFeatured: false,
  },
  {
    id: 7,
    productId: 7,
    dealType: 'flash',
    dealStartDate: '2025-12-10T00:00:00Z',
    dealEndDate: '2025-12-10T23:59:59Z',
    dealQuantityLimit: 40,
    dealSoldCount: 40,
    dealStatus: 'expired',
    dealPriority: 0,
    isHotDeal: false,
    isFeatured: false,
  },
  {
    id: 8,
    productId: 8,
    dealType: 'daily',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-11T23:59:59Z',
    dealQuantityLimit: 80,
    dealSoldCount: 56,
    dealStatus: 'active',
    dealPriority: 7,
    isHotDeal: true,
    isFeatured: true,
  },
  {
    id: 9,
    productId: 9,
    dealType: 'clearance',
    dealStartDate: '2025-12-01T00:00:00Z',
    dealEndDate: '2025-12-31T23:59:59Z',
    dealQuantityLimit: 120,
    dealSoldCount: 78,
    dealStatus: 'active',
    dealPriority: 8,
    isHotDeal: false,
    isFeatured: false,
  },
  {
    id: 10,
    productId: 10,
    dealType: 'weekend',
    dealStartDate: '2025-12-13T00:00:00Z',
    dealEndDate: '2025-12-15T23:59:59Z',
    dealQuantityLimit: 200,
    dealSoldCount: 134,
    dealStatus: 'active',
    dealPriority: 9,
    isHotDeal: false,
    isFeatured: false,
  },
  {
    id: 11,
    productId: 11,
    dealType: 'daily',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-12T23:59:59Z',
    dealQuantityLimit: 60,
    dealSoldCount: 42,
    dealStatus: 'active',
    dealPriority: 10,
    isHotDeal: false,
    isFeatured: true,
  },
  {
    id: 12,
    productId: 12,
    dealType: 'flash',
    dealStartDate: '2025-12-11T00:00:00Z',
    dealEndDate: '2025-12-11T23:59:59Z',
    dealQuantityLimit: 45,
    dealSoldCount: 38,
    dealStatus: 'active',
    dealPriority: 11,
    isHotDeal: true,
    isFeatured: true,
  },
];

export const brands = [
  { id: 'nike', name: 'Nike' },
  { id: 'reebok', name: 'Reebok' },
  { id: 'zara', name: 'Zara' },
  { id: 'casio', name: 'Casio' },
  { id: 'indi', name: 'Indi' },
  { id: 'aei', name: 'Aei' },
  { id: 'lulu', name: 'Lulu' },
  { id: 'gearo', name: 'Gearo' },
  { id: 'beast', name: 'Beast' },
];

export const products = [
  {
    id: 1,
    sku: 'ZARA-BLZ-001', // Product SKU (from DB)
    name: 'ZARA Suit Blazer Midnight Black Cotton',
    description: 'Premium quality suit blazer for business formal occasions',
    price: 1250000, // Base price (min price from models)
    originalPrice: 2500000,
    discount: 50,
    rating: 4.7,
    reviews: 5671,
    brand: 'ZARA', // Brand name (from DB)
    inStock: true,
    category: 'Fashion', // Category name (from DB - categories table)
    dealId: 1,

    // UNIFIED ATTRIBUTES (All attributes including fixed fields - from DB)
    // Fixed attributes (type: 'fixed') will be rendered at the top
    // Custom attributes (type: 'custom') will be rendered below
    attributes: [
      // Fixed attributes (always present, order matters)
      { key: 'sku', label: 'SKU', value: 'ZARA-BLZ-001', type: 'fixed', order: 1 },
      { key: 'brand', label: 'Brand', value: 'ZARA', type: 'fixed', order: 2 },
      { key: 'category', label: 'Category', value: 'Fashion', type: 'fixed', order: 3 },
      { key: 'availability', label: 'Availability', value: 'In Stock', type: 'fixed', order: 4 },
      // Custom/Dynamic attributes (from dynamic_attributes table)
      {
        key: 'material',
        label: 'Material',
        value: 'Premium Cotton Blend',
        type: 'custom',
        order: 5,
      },
      { key: 'fit', label: 'Fit Type', value: 'Slim Fit', type: 'custom', order: 6 },
      { key: 'style', label: 'Style', value: 'Business Formal', type: 'custom', order: 7 },
      {
        key: 'occasion',
        label: 'Occasion',
        value: 'Office, Business Meeting, Formal Event',
        type: 'custom',
        order: 8,
      },
      {
        key: 'careInstructions',
        label: 'Care Instructions',
        value: 'Machine wash cold, tumble dry low',
        type: 'custom',
        order: 9,
      },
      { key: 'origin', label: 'Origin', value: 'Vietnam', type: 'custom', order: 10 },
    ],

    // SHOPEE-STYLE: TIER VARIATIONS (Định nghĩa phân loại)
    tier_variations: [
      {
        name: 'Color',
        options: ['Midnight Black', 'Navy Blue', 'Charcoal Gray'],
        images: [
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1598808503491-9e9e91e2c1f9?w=600&h=600&fit=crop',
        ],
      },
      {
        name: 'Size',
        options: ['M', 'L', 'XL'],
        images: [], // Size thường không có ảnh riêng
      },
    ],

    // SHOPEE-STYLE: MODELS/SKUs (Các biến thể thực tế với index mapping)
    models: [
      { tier_index: [0, 0], price: 1250000, stock: 10, sku: 'ZARA-BLZ-BLK-M' }, // Black + M
      { tier_index: [0, 1], price: 1250000, stock: 15, sku: 'ZARA-BLZ-BLK-L' }, // Black + L
      { tier_index: [0, 2], price: 1250000, stock: 8, sku: 'ZARA-BLZ-BLK-XL' }, // Black + XL
      { tier_index: [1, 0], price: 1350000, stock: 5, sku: 'ZARA-BLZ-NVY-M' }, // Navy + M
      { tier_index: [1, 1], price: 1350000, stock: 12, sku: 'ZARA-BLZ-NVY-L' }, // Navy + L
      { tier_index: [1, 2], price: 1350000, stock: 7, sku: 'ZARA-BLZ-NVY-XL' }, // Navy + XL
      { tier_index: [2, 0], price: 1300000, stock: 6, sku: 'ZARA-BLZ-GRY-M' }, // Gray + M
      { tier_index: [2, 1], price: 1300000, stock: 9, sku: 'ZARA-BLZ-GRY-L' }, // Gray + L
      { tier_index: [2, 2], price: 1300000, stock: 4, sku: 'ZARA-BLZ-GRY-XL' }, // Gray + XL
    ],

    // DYNAMIC ATTRIBUTES - MOVED TO attributes ARRAY ABOVE
    // (Kept for backward compatibility, but should use attributes array)

    // MATERIAL COMPOSITION (Fashion specific)
    materialComposition: {
      cotton: 60,
      polyester: 35,
      spandex: 5,
    },

    // SIZE CHART (Shopee-style: Image or Table)
    sizeChart: {
      type: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=600&fit=crop',
      table: {
        unit: 'cm',
        measurements: [
          { size: 'M', chest: 96, waist: 80, shoulder: 44, length: 68 },
          { size: 'L', chest: 100, waist: 84, shoulder: 46, length: 70 },
          { size: 'XL', chest: 104, waist: 88, shoulder: 48, length: 72 },
        ],
      },
    },

    // MODEL INFO (For fashion products)
    modelInfo: {
      height: 185,
      weight: 75,
      chest: 96,
      waist: 80,
      wearingSize: 'M',
    },

    // WHOLESALE PRICING (Mua nhiều giảm giá - Shopee feature)
    wholesale_tiers: [
      { min_count: 5, max_count: 10, unit_price: 1100000 },
      { min_count: 11, max_count: 50, unit_price: 1000000 },
    ],

    // SHIPPING INFO
    shipping_info: {
      weight: 500, // grams
      dimension: { length: 30, width: 25, height: 5 }, // cm
    },

    // PRODUCT DETAILS (Embedded data)
    descriptionText: [
      "The most powerful ZARA Suit Blazer ever. With the breakthrough performance and capabilities, it's a game-changer for your daily life and work. Experience unmatched quality and style with this premium product.",
      "From the latest design trends to practical functionality, this product combines everything you need. Whether you're looking for style, comfort, or durability, you'll find it all here.",
    ],
    features: [
      'Premium Quality Materials',
      '100% Genuine Product',
      'Free Shipping & Fast Delivery',
      'Easy Return & Exchange',
      '24/7 Customer Support',
      'Secure Payment Options',
    ],
    productReviews: [
      {
        id: 1,
        author: 'John Doe',
        date: '2 days ago',
        rating: 5,
        comment:
          'Excellent product! Highly recommended. The quality is outstanding and delivery was very fast.',
      },
    ],

    // COMPUTED FIELDS (Tính toán từ models)
    price_min: 1250000,
    price_max: 1350000,
    total_stock: 76, // Tổng stock từ tất cả models
    sold: 324, // Số lượng đã bán
  },
  {
    id: 2,
    sku: 'ZARA-SG-002', // Product SKU (from DB)
    name: 'ZARA Black SunGlasses Anti Dust Resistant',
    description: 'Stylish sunglasses with UV protection and anti-dust coating',
    price: 450000,
    originalPrice: 900000,
    discount: 50,
    rating: 4.7,
    reviews: 5671,
    brand: 'ZARA', // Brand name (from DB)
    inStock: true,
    category: 'Accessories', // Category name (from DB - categories table)
    dealId: 2,

    // TIER VARIATIONS (1 tier only - Color)
    tier_variations: [
      {
        name: 'Color',
        options: ['Matte Black', 'Tortoise Brown'],
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
        ],
      },
    ],

    // MODELS/SKUs
    models: [
      { tier_index: [0], price: 450000, stock: 25, sku: 'ZARA-SG-BLK' }, // Matte Black
      { tier_index: [1], price: 480000, stock: 18, sku: 'ZARA-SG-BRN' }, // Tortoise Brown
    ],

    // ATTRIBUTES
    attributes: [
      { key: 'material', label: 'Material', value: 'Plastic Frame, Polycarbonate Lens' },
      { key: 'uvProtection', label: 'UV Protection', value: 'UV400' },
      { key: 'style', label: 'Style', value: 'Aviator' },
      { key: 'occasion', label: 'Occasion', value: 'Outdoor, Beach, Casual, Sports' },
      { key: 'careInstructions', label: 'Care', value: 'Clean with microfiber cloth' },
      { key: 'origin', label: 'Origin', value: 'Vietnam' },
    ],

    // SHIPPING INFO
    shipping_info: {
      weight: 50, // grams
      dimension: { length: 15, width: 6, height: 5 },
    },

    descriptionText: [
      'Stylish ZARA Black SunGlasses with anti-dust coating. Perfect for protecting your eyes while maintaining a fashionable look.',
      'Durable frame construction with UV protection and scratch-resistant lenses.',
    ],
    features: [
      'UV400 Protection',
      'Anti-Dust Coating',
      'Lightweight Frame',
      'Fashion Design',
      '1 Year Warranty',
      'Protective Case Included',
    ],
    productReviews: [],

    price_min: 450000,
    price_max: 480000,
    total_stock: 43,
    sold: 189,
  },
  {
    id: 3,
    sku: 'NIKE-BT-003', // Product SKU (from DB)
    name: 'Nike Black Boots with Glossy Finishing Travel',
    description: 'Premium leather boots with glossy finish for travel and daily wear',
    price: 2800000,
    originalPrice: 4200000,
    discount: 33,
    rating: 4.7,
    reviews: 2673,
    brand: 'Nike', // Brand name (from DB)
    inStock: true,
    category: 'Shoes', // Category name (from DB - categories table)
    dealId: 3,

    // TIER VARIATIONS (2 tiers)
    tier_variations: [
      {
        name: 'Color',
        options: ['Glossy Black', 'Chestnut Brown'],
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop',
        ],
      },
      {
        name: 'EU Size',
        options: ['40', '41', '42', '43'],
        images: [],
      },
    ],

    // MODELS/SKUs
    models: [
      { tier_index: [0, 0], price: 2800000, stock: 5, sku: 'NIKE-BT-BLK-40' }, // Black + 40
      { tier_index: [0, 1], price: 2800000, stock: 8, sku: 'NIKE-BT-BLK-41' }, // Black + 41
      { tier_index: [0, 2], price: 2800000, stock: 10, sku: 'NIKE-BT-BLK-42' }, // Black + 42
      { tier_index: [0, 3], price: 2800000, stock: 6, sku: 'NIKE-BT-BLK-43' }, // Black + 43
      { tier_index: [1, 0], price: 2900000, stock: 4, sku: 'NIKE-BT-BRN-40' }, // Brown + 40
      { tier_index: [1, 1], price: 2900000, stock: 7, sku: 'NIKE-BT-BRN-41' }, // Brown + 41
      { tier_index: [1, 2], price: 2900000, stock: 9, sku: 'NIKE-BT-BRN-42' }, // Brown + 42
      { tier_index: [1, 3], price: 2900000, stock: 5, sku: 'NIKE-BT-BRN-43' }, // Brown + 43
    ],

    // ATTRIBUTES
    attributes: [
      { key: 'material', label: 'Material', value: 'Genuine Leather' },
      { key: 'fit', label: 'Fit Type', value: 'Regular Fit' },
      { key: 'style', label: 'Style', value: 'Chelsea Boots' },
      { key: 'occasion', label: 'Occasion', value: 'Travel, Business Casual, Daily Wear' },
      { key: 'waterResistant', label: 'Water Resistant', value: 'Yes' },
      { key: 'careInstructions', label: 'Care', value: 'Wipe with damp cloth' },
      { key: 'origin', label: 'Origin', value: 'Vietnam' },
    ],

    // MATERIAL COMPOSITION
    materialComposition: {
      leather: 100,
    },

    // SIZE CHART
    sizeChart: {
      type: 'table',
      imageUrl: null,
      table: {
        unit: 'EU',
        measurements: [
          { size: '40', eu: 40, us: 7, uk: 6.5, footLength: 25.5 },
          { size: '41', eu: 41, us: 7.5, uk: 7, footLength: 26 },
          { size: '42', eu: 42, us: 8.5, uk: 8, footLength: 26.5 },
          { size: '43', eu: 43, us: 9, uk: 8.5, footLength: 27 },
        ],
      },
    },

    // WHOLESALE PRICING
    wholesale_tiers: [
      { min_count: 3, max_count: 5, unit_price: 2600000 },
      { min_count: 6, max_count: 20, unit_price: 2400000 },
    ],

    // SHIPPING INFO
    shipping_info: {
      weight: 1200, // grams
      dimension: { length: 32, width: 28, height: 12 },
    },

    descriptionText: [
      'Premium Nike Black Boots featuring glossy finishing. Designed for both travel and everyday wear with superior comfort.',
      'Combining style with functionality, these boots are built to last with high-quality materials.',
    ],
    features: [
      'Premium Leather Material',
      'Glossy Finish',
      'Comfortable Cushioning',
      'Non-Slip Sole',
      'Water Resistant',
      'Travel Friendly Design',
    ],
    productReviews: [],

    price_min: 2800000,
    price_max: 2900000,
    total_stock: 54,
    sold: 267,
  },
  {
    id: 4,
    sku: 'REDMI-N12P-004',
    name: 'Redmi Note 12 Pro 5G Smartphone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    price: 6500000,
    originalPrice: 8500000,
    discount: 24,
    rating: 4.7,
    reviews: 5671,
    brand: 'Redmi',
    size: ['s'],
    inStock: true,
    category: 'Electronics',
    dealId: 4,
  },
  {
    id: 5,
    sku: 'POCO-M6P-005',
    name: 'POCO M6 Pro 5G Smartphone',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    price: 5200000,
    originalPrice: 7800000,
    discount: 33,
    rating: 4.5,
    reviews: 3421,
    brand: 'POCO',
    size: ['s', 'm'],
    inStock: true,
    category: 'Electronics',
    dealId: 5,
  },
  {
    id: 6,
    sku: 'RBK-RS-006',
    name: 'Reebok Running Shoes Pro Series',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop',
    price: 3200000,
    originalPrice: 6400000,
    discount: 50,
    rating: 4.8,
    reviews: 4123,
    brand: 'Reebok',
    size: ['m', 'l', 'xl'],
    inStock: true,
    category: 'Shoes',
    dealId: 6,
  },
  {
    id: 7,
    sku: 'LULU-WCH-007',
    name: 'Lulu Fashion Watch Classic Edition',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop',
    price: 850000,
    originalPrice: 1700000,
    discount: 50,
    rating: 4.6,
    reviews: 2134,
    brand: 'Lulu',
    size: ['s', 'm'],
    inStock: false,
    category: 'Accessories',
    dealId: 7,
  },
  {
    id: 8,
    sku: 'AEI-HP-008',
    name: 'Aei Wireless Headphones Premium',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    price: 1900000,
    originalPrice: 3800000,
    discount: 50,
    rating: 4.9,
    reviews: 6234,
    brand: 'Aei',
    size: ['s'],
    inStock: true,
    category: 'Electronics',
    dealId: 8,
  },
  {
    id: 9,
    sku: 'GEARO-BP-009',
    name: 'Gearo Laptop Backpack Waterproof',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    price: 680000,
    originalPrice: 1360000,
    discount: 50,
    rating: 4.4,
    reviews: 1523,
    brand: 'Gearo',
    size: ['m', 'l'],
    inStock: true,
    category: 'Accessories',
    dealId: 9,
  },
  {
    id: 10,
    sku: 'BEAST-PP-010',
    name: 'Beast Protein Powder 2kg Pack',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
    price: 1200000,
    originalPrice: 1600000,
    discount: 25,
    rating: 4.7,
    reviews: 3421,
    brand: 'Beast',
    size: ['l', 'xl'],
    inStock: true,
    category: 'Health',
    dealId: 10,
  },
  {
    id: 11,
    sku: 'CASIO-GS-011',
    name: 'Casio Digital Watch G-Shock',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&h=400&fit=crop',
    price: 4500000,
    originalPrice: 6000000,
    discount: 25,
    rating: 4.8,
    reviews: 5234,
    brand: 'Casio',
    size: ['s', 'm'],
    inStock: true,
    category: 'Accessories',
    dealId: 11,
  },
  {
    id: 12,
    sku: 'NIKE-AM-012',
    name: 'Nike Air Max Running Shoes',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop',
    price: 3800000,
    originalPrice: 7600000,
    discount: 50,
    rating: 4.9,
    reviews: 7821,
    brand: 'Nike',
    size: ['m', 'l', 'xl'],
    inStock: true,
    category: 'Shoes',
    dealId: 12,
  },
];

/**
 * HELPER FUNCTIONS FOR SHOPEE-STYLE TIER VARIATIONS
 */

/**
 * Get model name from tier_index
 * Example: tier_index [0, 1] -> "Midnight Black - L"
 */
export const getModelName = (product, tier_index) => {
  if (!product.tier_variations || !tier_index) {
return '';
}

  return tier_index.map((index, tier) => product.tier_variations[tier].options[index]).join(' - ');
};

/**
 * Get model image from tier_index (từ tier đầu tiên có ảnh)
 */
export const getModelImage = (product, tier_index) => {
  if (!product.tier_variations || !tier_index) {
return null;
}

  // Lấy ảnh từ tier đầu tiên (thường là Color)
  const firstTierIndex = tier_index[0];
  const firstTier = product.tier_variations[0];

  if (firstTier.images && firstTier.images[firstTierIndex]) {
    return firstTier.images[firstTierIndex];
  }

  return null;
};

/**
 * Get all unique images from tier_variations (for gallery)
 */
export const getProductImages = (product) => {
  if (!product.tier_variations) {
return [];
}

  const images = [];
  product.tier_variations.forEach((tier) => {
    if (tier.images && tier.images.length > 0) {
      images.push(...tier.images);
    }
  });

  return images;
};

/**
 * Find model by tier_index
 */
export const findModel = (product, tier_index) => {
  if (!product.models || !tier_index) {
return null;
}

  return product.models.find(
    (model) => JSON.stringify(model.tier_index) === JSON.stringify(tier_index)
  );
};

/**
 * Get total stock across all models
 */
export const getTotalStock = (product) => {
  if (!product.models) {
return 0;
}
  return product.models.reduce((sum, model) => sum + model.stock, 0);
};

/**
 * Get price range from models
 */
export const getPriceRange = (product) => {
  if (!product.models || product.models.length === 0) {
    return { min: product.price, max: product.price };
  }

  const prices = product.models.map((m) => m.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Check if product has any stock available
 */
export const isInStock = (product) => {
  if (!product.models) {
return product.inStock;
}
  return product.models.some((model) => model.stock > 0);
};

/**
 * Get deal information by dealId
 */
export const getDealById = (dealId) => deals.find((deal) => deal.id === dealId);

/**
 * Get product with deal information
 */
export const getProductWithDeal = (product) => {
  if (!product.dealId) {
return product;
}

  const deal = getDealById(product.dealId);
  if (!deal) {
return product;
}

  // Generate badge based on deal type and status
  let badge = '';
  let badgeColor = 'primary';

  if (deal.dealStatus === 'active') {
    const now = new Date();
    const endDate = new Date(deal.dealEndDate);
    const hoursRemaining = Math.floor((endDate - now) / (1000 * 60 * 60));

    switch (deal.dealType) {
      case 'flash':
        if (hoursRemaining <= 3) {
          badge = `Flash Deal Ends in ${hoursRemaining}h !`;
          badgeColor = 'danger';
        } else if (hoursRemaining <= 6) {
          badge = `Flash Deal Ends in ${hoursRemaining}h !`;
          badgeColor = 'warning';
        } else {
          badge = 'Flash Deal';
          badgeColor = 'danger';
        }
        break;
      case 'daily':
        badge = 'Daily Deal';
        badgeColor = 'primary';
        break;
      case 'weekend':
        badge = 'Weekend Special';
        badgeColor = 'info';
        break;
      case 'clearance':
        badge = `Clearance ${deal.discount || product.discount}% OFF`;
        badgeColor = 'warning';
        break;
      default:
        badge = 'Special Deal';
        badgeColor = 'primary';
    }
  } else if (deal.dealStatus === 'expired') {
    badge = 'Deal Ended';
    badgeColor = 'secondary';
  }

  return {
    ...product,
    badge,
    badgeColor,
    // Merge deal information into product
    dealType: deal.dealType,
    dealStartDate: deal.dealStartDate,
    dealEndDate: deal.dealEndDate,
    dealQuantityLimit: deal.dealQuantityLimit,
    dealSoldCount: deal.dealSoldCount,
    dealStatus: deal.dealStatus,
    dealPriority: deal.dealPriority,
    isHotDeal: deal.isHotDeal,
    isFeatured: deal.isFeatured,
  };
};

/**
 * Generate all products by repeating base products
 */
export const generateAllProducts = () => {
  const baseProducts = [...products];
  const allProducts = [];

  for (let i = 0; i < 120; i++) {
    const baseProduct = baseProducts[i % baseProducts.length];
    const productWithId = {
      ...baseProduct,
      id: i + 1,
    };
    // Merge with deal data if dealId exists
    allProducts.push(getProductWithDeal(productWithId));
  }

  return allProducts;
};

export default {
  breadcrumbItems,
  products,
  deals,
  getDealById,
  getProductWithDeal,
  generateAllProducts,
  sizes,
  locations,
  shippingUnits,
  brands,
  shopTypes,
  conditions,
  paymentOptions,
  ratings,
  services,
  priceRanges,
  discounts,
  availabilityOptions,
};
