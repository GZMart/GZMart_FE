/** Alphabetical order for color presets (Vietnamese-aware). */
export function sortColorOptions(options) {
  if (!options?.length) {
    return [];
  }
  return [...options].sort((a, b) =>
    String(a).localeCompare(String(b), 'vi', { sensitivity: 'base' })
  );
}

// Predefined tier types and their options (like Shopee)
export const TIER_TYPES = {
  COLOR: {
    key: 'COLOR',
    name: 'Màu sắc',
    nameEn: 'Color',
    options: sortColorOptions([
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
    ]),
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

const normalizeTierLabel = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

/**
 * Map a seller listing tier display name to a TIER_TYPES key (COLOR | SIZE | GENDER).
 * PO / ERP tier rows use these keys, not free-text names.
 */
export function resolveTierTypeKey(listingName) {
  const n = normalizeTierLabel(listingName);
  if (!n) {
return '';
}
  for (const key of TIER_TYPE_KEYS) {
    const t = TIER_TYPES[key];
    if (normalizeTierLabel(key) === n) {
return key;
}
    if (normalizeTierLabel(t.name) === n) {
return key;
}
    if (normalizeTierLabel(t.nameEn) === n) {
return key;
}
  }
  if (/\b(color|colour)\b/.test(n) || n.includes('mau')) {
return 'COLOR';
}
  if (n.includes('size') || n.includes('kich co') || n.includes('kick co')) {
return 'SIZE';
}
  if (n.includes('gender') || n.includes('gioi tinh')) {
return 'GENDER';
}
  return '';
}

/**
 * Preset options from TIER_TYPES + values already on this tier (listing import, subset prefill).
 * Keeps <select> usable for values like "Xanh bạc hà" / "S-M" that are not in the global preset list.
 */
export function buildTierSelectOptions(tierDef, tier) {
  if (!tierDef?.options) {
return [];
}
  const preset = [...tierDef.options];
  const seen = new Set(preset);
  const extras = [];
  (tier?.options || []).forEach((o) => {
    const v = o?.value;
    if (v && !seen.has(v)) {
      seen.add(v);
      extras.push(v);
    }
  });
  const combined = [...preset, ...extras];
  if (tierDef.key === 'COLOR') {
    return sortColorOptions(combined);
  }
  return combined;
}

/**
 * Convert API Product.tiers[] entry → PO form tier row (type + options with isCustom).
 * Listing values use isCustom: false so TierRow renders <select>; extra values are merged via buildTierSelectOptions.
 */
export function listingTierToFormState(tier) {
  const rawOpts = (tier?.options || [])
    .map((o) => (typeof o === 'string' ? o.trim() : String(o?.value ?? '').trim()))
    .filter(Boolean);
  const resolved = resolveTierTypeKey(tier?.name);
  const typeKey = resolved || 'SIZE';
  const options =
    rawOpts.length > 0
      ? rawOpts.map((v) => ({ value: v, isCustom: false }))
      : [{ value: '', isCustom: false }];
  return { type: typeKey, options };
}
