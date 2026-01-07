// Predefined tier types and their options (like Shopee)
export const TIER_TYPES = {
  COLOR: {
    key: 'COLOR',
    name: 'Màu sắc',
    nameEn: 'Color',
    options: [
      'Đỏ',
      'Xanh matcha',
      'Bạc ánh kim',
      'Xanh cốm',
      'Nâu trà',
      'Nâu rêu',
      'Xám lông chuột',
      'Hồng nude',
      'Trắng đục',
      'Xám nhạt pastel',
      'Xanh lông công',
      'Hồng vỏ đỗ',
      'Hồng phấn',
      'Bach kim',
      'Đỏ mận',
      'Hồng đất',
      'Nâu đất',
      'Đỏ đỏ',
      'Hồng rước',
      'Đỏ hoa hồng',
      'Xám khói',
      'Xanh dá',
      'Hồng dâu',
      'Đen da lộn',
      'Tím khoai môn',
      'Xanh tosca',
      'Trắng trong',
      'Xanh ngọc',
      'Xanh dương',
      'Xanh lá',
      'Vàng',
      'Cam',
      'Tím',
      'Hồng',
      'Nâu',
      'Xám',
      'Đen',
      'Trắng',
      'Be',
      'Kem',
    ],
  },
  SIZE: {
    key: 'SIZE',
    name: 'Kích cỡ',
    nameEn: 'Size',
    options: [
      'XS',
      'S',
      'M',
      'L',
      'XL',
      'XXL',
      'XXXL',
      '4XL',
      '5XL',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      'Free Size',
      'One Size',
    ],
  },
  GENDER: {
    key: 'GENDER',
    name: 'Giới tính',
    nameEn: 'Gender',
    options: ['Nam', 'Nữ', 'Unisex', 'Bé trai', 'Bé gái'],
  },
};

// Array of tier type keys for iteration
export const TIER_TYPE_KEYS = Object.keys(TIER_TYPES);

// Get tier type by key
export const getTierType = (key) => TIER_TYPES[key];

// Get all tier types as array
export const getAllTierTypes = () => TIER_TYPE_KEYS.map((key) => TIER_TYPES[key]);

// Special option for custom input
export const CUSTOM_OPTION = 'Other';
