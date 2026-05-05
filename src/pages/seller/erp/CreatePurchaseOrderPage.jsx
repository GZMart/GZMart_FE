import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchSuppliers,
  createPurchaseOrder,
  fetchMyProducts,
  fetchExchangeRate,
} from '../../../store/slices/erpSlice';
import inventoryService from '../../../services/api/inventoryService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import styles from '@assets/styles/seller/erp/CreatePurchaseOrderPage.module.css';
import {
  TIER_TYPES,
  TIER_TYPE_KEYS,
  CUSTOM_OPTION,
  listingTierToFormState,
  buildTierSelectOptions,
  getVariantImageGroupTierIndex,
} from '../../../constants/tierTypes';

import {
  Package,
  ChevronRight,
  Info,
  Settings,
  Layers,
  Trash2,
  Pencil,
  Plus,
  X,
  List,
  Tag,
  Search,
  ChevronLeft,
  Send,
  RefreshCw,
  Box,
  AlertTriangle,
  Check,
  Inbox,
  HelpCircle,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0));
const fmtCny = (n) => `¥${(Number(n) || 0).toFixed(2)}`;

/** tierIndex → human label; API Product.tiers with string[] options */
const variantLabelFromRawTiers = (tiers, tierIndex) => {
  if (!Array.isArray(tiers) || !Array.isArray(tierIndex) || tierIndex.length === 0) {
    return '';
  }
  const parts = [];
  for (let axis = 0; axis < Math.min(tiers.length, tierIndex.length); axis++) {
    const idx = Number(tierIndex[axis]);
    if (Number.isNaN(idx)) {
      continue;
    }
    const opt = tiers[axis]?.options?.[idx];
    const s = opt == null ? '' : typeof opt === 'string' ? opt : String(opt?.value ?? '');
    if (s) {
      parts.push(s);
    }
  }
  return parts.join(' / ');
};

/** PO form tiers: options are { value, isCustom } */
const variantLabelFromFormTiers = (tiersForm, tierIndex) => {
  if (!Array.isArray(tiersForm) || !Array.isArray(tierIndex) || tierIndex.length === 0) {
    return '';
  }
  const parts = [];
  for (let axis = 0; axis < Math.min(tiersForm.length, tierIndex.length); axis++) {
    const idx = Number(tierIndex[axis]);
    if (Number.isNaN(idx)) {
      continue;
    }
    const o = tiersForm[axis]?.options?.[idx];
    const s = !o ? '' : typeof o === 'string' ? o : String(o.value ?? '');
    if (s) {
      parts.push(s);
    }
  }
  return parts.join(' / ');
};

const listingTiersToPoFormTiers = (listingTiers = []) =>
  (listingTiers || []).map((t) => listingTierToFormState(t));

const vndToCnyHint = (vnd, rate) => {
  const r = Number(rate) || 0;
  const v = Number(vnd) || 0;
  if (r <= 0 || v <= 0) {
    return 0;
  }
  return Math.round((v / r) * 100) / 100;
};

/**
 * Low-stock URL prefill: keep only tier option rows used by the prefilled SKU(s),
 * so the classification UI matches the variant table (not full listing 4x4 vs 2 rows).
 */
const subsetTiersToMatchVariantTierIndexes = (tiersForm, variants) => {
  if (
    !Array.isArray(tiersForm) ||
    tiersForm.length === 0 ||
    !Array.isArray(variants) ||
    variants.length === 0
  ) {
    return tiersForm;
  }
  const withIdx = variants.filter((v) => Array.isArray(v._tierIndex) && v._tierIndex.length > 0);
  if (withIdx.length === 0) {
    return tiersForm;
  }

  return tiersForm.map((tier, axis) => {
    const idxSet = new Set();
    withIdx.forEach((v) => {
      const idx = Number(v._tierIndex[axis]);
      if (!Number.isNaN(idx) && idx >= 0) {
        idxSet.add(idx);
      }
    });
    if (idxSet.size === 0) {
      return tier;
    }
    const sorted = [...idxSet].sort((a, b) => a - b);
    const newOptions = sorted.map((i) => tier.options[i]).filter((o) => o != null);
    if (newOptions.length === 0) {
      return tier;
    }
    return { ...tier, options: newOptions };
  });
};

/** Label with tooltip icon — hover to see fee explanation */
const LabelWithTooltip = ({ children, tooltip }) => (
  <span className={styles.labelWithTooltip}>
    {children}
    <span className={styles.tooltipIcon} title={tooltip}>
      <HelpCircle size={14} />
    </span>
  </span>
);

/** Auto-generate SKU from product name + variant label */
const genSKU = (productName, variantLabel) => {
  const slug = (str) =>
    str
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Đ/g, 'D')
      .replace(/đ/g, 'D')
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 12);
  const base = slug(productName || 'SP');
  const suffix = variantLabel ? `-${slug(variantLabel).slice(0, 8)}` : '';
  return base + suffix;
};

/** Cartesian product of arrays */
const cartesian = (...arrays) =>
  arrays.reduce((acc, arr) => acc.flatMap((x) => arr.map((y) => [...x, y])), [[]]);

/** Generate variant rows from tiers */
const generateVariants = (tiers, existingVariants = [], productName = '') => {
  const validTiers = tiers
    .map((t) => ({ ...t, options: t.options.filter((o) => o.value && o.value.trim()) }))
    .filter((t) => t.type && t.options.length > 0);

  if (validTiers.length === 0) {
    return [existingVariants[0] || makeVariant('', productName)];
  }

  const combos = cartesian(...validTiers.map((t) => t.options.map((o) => o.value)));
  return combos.map((combo) => {
    const label = combo.join(' / ');
    const existing = existingVariants.find((v) => v._variantLabel === label);
    return existing || makeVariant(label, productName);
  });
};

const makeVariant = (label, productName) => ({
  _variantLabel: label,
  sku: genSKU(productName, label),
  quantity: 1,
  unitPriceCny: 0,
});

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 COST BASIS (Goods Value + Buying Fee only)
// Landed cost is calculated in Stage 2 when goods arrive
// ─────────────────────────────────────────────────────────────────────────────
function computeStage1CostBasis(flatItems, importConfig = {}) {
  const rate = importConfig.exchangeRate || 3500;
  const buyingFeeRate = importConfig.buyingServiceFeeRate || 0;

  const totalValueCny = flatItems.reduce((s, item) => {
    const qty = Number(item.quantity) || 0;
    const priceCny = Number(item.unitPriceCny) || 0;
    return s + priceCny * qty;
  }, 0);

  const totalValueVnd = totalValueCny * rate;
  const buyingFeeVnd = totalValueVnd * buyingFeeRate;
  const costBasisVnd = totalValueVnd + buyingFeeVnd;

  return {
    totalValueCny: Math.round(totalValueCny * 100) / 100,
    totalValueVnd: Math.round(totalValueVnd),
    buyingFeeVnd: Math.round(buyingFeeVnd),
    costBasisVnd: Math.round(costBasisVnd),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER ROW — select-based, mirrors seller/listings TiersEditor
// ─────────────────────────────────────────────────────────────────────────────
const MAX_OPTIONS = 20;

const TierRow = ({ tier, usedTypes, onChangeType, onChangeOptions, onRemove, styles: s, disabled }) => {
  const tierDef = TIER_TYPES[tier.type];
  const selectOptions = useMemo(() => buildTierSelectOptions(tierDef, tier), [tierDef, tier]);
  const availableTypes = TIER_TYPE_KEYS.filter((k) => k === tier.type || !usedTypes.includes(k));

  const addOption = () => {
    if (tier.options.length >= MAX_OPTIONS) {
      return;
    }
    onChangeOptions([...tier.options, { value: '', isCustom: false }]);
  };

  const removeOption = (i) => onChangeOptions(tier.options.filter((_, idx) => idx !== i));

  const handleOptionSelect = (i, val) => {
    const newOpts = [...tier.options];
    if (val === CUSTOM_OPTION) {
      newOpts[i] = { value: '', isCustom: true };
    } else {
      newOpts[i] = { value: val, isCustom: false };
    }
    onChangeOptions(newOpts);
  };

  const handleCustomInput = (i, val) => {
    const newOpts = [...tier.options];
    newOpts[i] = { value: val, isCustom: true };
    onChangeOptions(newOpts);
  };

  return (
    <div className={s.tierRow}>
      <div className={s.tierNameRow}>
        <select
          className={s.tierTypeSelect}
          value={tier.type}
          onChange={(e) => onChangeType(e.target.value)}
          disabled={disabled}
        >
          <option value="">-- Select classification type --</option>
          {availableTypes.map((k) => (
            <option key={k} value={k}>
              {TIER_TYPES[k].nameEn} ({TIER_TYPES[k].name})
            </option>
          ))}
        </select>
        <button
          type="button"
          className={s.btnRemoveTier}
          onClick={onRemove}
          aria-label="Remove classification"
          disabled={disabled}
        >
          <X />
        </button>
      </div>

      {tier.type && tierDef && (
        <div className={s.tierOptionsList}>
          {tier.options.map((opt, i) => (
            <div key={i} className={s.optionRow}>
              {opt.isCustom ? (
                <input
                  className={s.customOptionInput}
                  type="text"
                  placeholder="Enter custom value"
                  value={opt.value}
                  onChange={(e) => handleCustomInput(i, e.target.value)}
                  disabled={disabled}
                />
              ) : (
                <select
                  className={s.optionSelect}
                  value={opt.value}
                  onChange={(e) => handleOptionSelect(i, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">-- Select {tierDef.nameEn.toLowerCase()} --</option>
                  {selectOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>Other (manual entry)</option>
                </select>
              )}
              {tier.options.length > 1 && (
                <button
                  type="button"
                  className={s.btnRemoveOpt}
                  onClick={() => removeOption(i)}
                  aria-label="Remove option"
                  disabled={disabled}
                >
                  <X />
                </button>
              )}
            </div>
          ))}
          {tier.options.length < MAX_OPTIONS && (
            <button type="button" className={s.btnAddOption} onClick={addOption} disabled={disabled}>
              + Add option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTING PICKER MODAL — grouped variants by tier-0 (like VariantsTable)
// ─────────────────────────────────────────────────────────────────────────────
const ListingPickerModal = ({ products, loading, onSelect, onClose, exchangeRate = 3500 }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [checkedModels, setCheckedModels] = useState({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.models || []).some((m) => m.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const toggleModel = (modelId) =>
    setCheckedModels((prev) => ({ ...prev, [modelId]: !prev[modelId] }));

  const handleSelectProduct = (product) => {
    setSelected(product);
    const initial = {};
    (product.models || []).forEach((m) => {
      initial[m._id] = true;
    });
    setCheckedModels(initial);
  };

  const buildVariantLabel = (product, model) =>
    variantLabelFromRawTiers(product.tiers, model?.tierIndex || []);

  /** Group by image tier (Color ưu tiên) — cùng logic VariantsTable */
  const tier0Groups = useMemo(() => {
    if (!selected || !Array.isArray(selected.models)) {
      return [];
    }
    const st = selected.tiers || [];
    const primaryIdx = getVariantImageGroupTierIndex(
      st.map((t) => ({ type: t.type, name: t.name, options: t.options || [] }))
    );
    const groupMap = new Map();
    selected.models.forEach((model) => {
      const t0Idx = model.tierIndex?.[primaryIdx] ?? 0;
      if (!groupMap.has(t0Idx)) {
        const optRaw = st[primaryIdx]?.options?.[t0Idx];
        const optLabel =
          typeof optRaw === 'string'
            ? optRaw
            : (optRaw?.value ?? optRaw?.name ?? `Option ${t0Idx + 1}`);
        groupMap.set(t0Idx, {
          tier0Index: t0Idx,
          tier0Label: optLabel,
          tier0Image: model.image || null,
          models: [],
        });
      }
      groupMap.get(t0Idx).models.push(model);
    });
    return Array.from(groupMap.values()).sort((a, b) => a.tier0Index - b.tier0Index);
  }, [selected]);

  /** Các tier còn lại (không gồm cột nhóm ảnh) */
  const getSecondaryLabel = (model, hasMultiTier) => {
    if (!hasMultiTier || !model.tierIndex || !selected?.tiers) {
      return null;
    }
    const st = selected.tiers;
    const primaryIdx = getVariantImageGroupTierIndex(
      st.map((t) => ({ type: t.type, name: t.name, options: t.options || [] }))
    );
    const parts = [];
    for (let i = 0; i < st.length; i += 1) {
      if (i === primaryIdx) {
continue;
}
      const idx = model.tierIndex[i];
      const optRaw = st[i]?.options?.[idx];
      const val =
        typeof optRaw === 'string'
          ? optRaw
          : (optRaw?.value ?? optRaw?.name ?? '?');
      parts.push(val);
    }
    return parts.join(' / ');
  };

  const hasMultiTier = selected && selected.tiers && selected.tiers.length >= 2;

  const handleConfirm = () => {
    if (!selected) {
return;
}
    const pickedModels = (selected.models || []).filter((m) => checkedModels[m._id]);
    if (!pickedModels.length) {
return;
}

    const rate = Number(exchangeRate) || 3500;

    const group = {
      _id: Math.random().toString(36).slice(2),
      productName: selected.name,
      productId: selected._id,
      tiers: listingTiersToPoFormTiers(selected.tiers),
      variants: pickedModels.map((model) => {
        const tIdx = model.tierIndex || [];
        const tier0Label = selected.tiers?.[0]?.options?.[tIdx[0]] || '';
        const tier1Label = selected.tiers?.[1]?.options?.[tIdx[1]] || '';
        return {
          _variantLabel: buildVariantLabel(selected, model),
          _tier0Label: typeof tier0Label === 'string' ? tier0Label : tier0Label?.value || '',
          _tier1Label: typeof tier1Label === 'string' ? tier1Label : tier1Label?.value || '',
          _image: model.image || null,
          sku: model.sku,
          quantity: 1,
          unitPriceCny: vndToCnyHint(model.costPrice, rate) || vndToCnyHint(model.price, rate),
          _productId: selected._id,
          _modelId: model._id,
        };
      }),
    };
    onSelect([group]);
    onClose();
  };

  const selectedCount = Object.values(checkedModels).filter(Boolean).length;

  return (
    <div
      className={styles.pickerOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.pickerPanel}>
        <div className={styles.pickerHeader}>
          <div className={styles.pickerHeaderLeft}>
            <div className={styles.pickerIconBadge}>
              <Box />
            </div>
            <div>
              <div className={styles.pickerTitle}>Select product from listing</div>
              {selected && <div className={styles.pickerSubtitle}>{selected.name}</div>}
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.pickerCloseBtn}
            title="Close"
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        {!selected ? (
          <>
            <div className={styles.pickerSearchWrap}>
              <span className={styles.pickerSearchIcon}>
                <Search />
              </span>
              <input
                autoFocus
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.pickerSearch}
              />
            </div>

            {loading ? (
              <div className={styles.pickerLoading}>Loading list...</div>
            ) : filtered.length === 0 ? (
              <div className={styles.pickerEmpty}>No products found</div>
            ) : (
              <div className={styles.pickerList}>
                {filtered.map((p) => (
                  <div
                    key={p._id}
                    className={styles.pickerItem}
                    onClick={() => handleSelectProduct(p)}
                  >
                    <div className={styles.pickerItemName}>{p.name}</div>
                    <div className={styles.pickerItemMeta}>
                      <span className={styles.pickerChip}>{p.models?.length || 0} variants</span>
                      {p.models?.[0] && (
                        <span className={styles.pickerSku}>SKU: {p.models[0].sku}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setSelected(null)} className={styles.pickerBackBtn}>
              <ChevronLeft />
              Back
            </button>

            <div className={styles.pickerSelectAllRow}>
              <p className={styles.pickerSelectAll}>
                {selected.models?.length || 0} variants · select variants to add:
              </p>
              <button
                onClick={() => {
                  const allChecked = (selected.models || []).every((m) => checkedModels[m._id]);
                  const next = {};
                  (selected.models || []).forEach((m) => {
                    next[m._id] = !allChecked;
                  });
                  setCheckedModels(next);
                }}
                className={styles.pickerSelectAllBtn}
              >
                {(selected.models || []).every((m) => checkedModels[m._id])
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            </div>

            {/* Grouped variant list — mirrors VariantsTable tier-0 grouping */}
            <div className={styles.pickerList}>
              {tier0Groups.map((group) => (
                <div key={group.tier0Index} className={styles.pickerTier0Group}>
                  {/* Group header: tier-0 label + image */}
                  <div className={styles.pickerTier0Header}>
                    {group.tier0Image ? (
                      <img
                        src={group.tier0Image}
                        alt={group.tier0Label}
                        className={styles.pickerTier0Img}
                      />
                    ) : (
                      <div className={styles.pickerTier0ImgPlaceholder}>
                        <Box size={16} />
                      </div>
                    )}
                    <span className={styles.pickerTier0Label}>{group.tier0Label}</span>
                    <span className={styles.pickerTier0Count}>
                      {group.models.length} variant{group.models.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Variant sub-rows */}
                  {group.models.map((model) => {
                    const secondary = getSecondaryLabel(model, hasMultiTier);
                    return (
                      <label
                        key={model._id}
                        className={`${styles.pickerVariantRow} ${checkedModels[model._id] ? styles.pickerVariantChecked : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedModels[model._id]}
                          onChange={() => toggleModel(model._id)}
                          className={styles.pickerCheckbox}
                        />
                        {hasMultiTier && secondary && (
                          <span className={styles.pickerSecondaryLabel}>{secondary}</span>
                        )}
                        <span className={styles.pickerSkuText}>{model.sku}</span>
                        {model.weight > 0 && (
                          <span className={styles.pickerWeight}>{model.weight}kg</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={styles.pickerConfirmBtn}
            >
              Add to Order
              {selectedCount > 0 && (
                <span className={styles.pickerConfirmBadge}>{selectedCount}</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ProductsEmptyState = ({ onAddProduct }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyStateIcon}>
      <Inbox />
    </div>
    <h4 className={styles.emptyStateTitle}>No Products Configured</h4>
    <p className={styles.emptyStateDesc}>
      Begin building your purchase order by importing from your catalog or manually adding items.
    </p>
    <button className={styles.btnAdd} onClick={onAddProduct}>
      <Plus />
      Add Your First Product
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT GROUP CARD — redesigned with card layout
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_TIER = () => ({ type: '', options: [{ value: '', isCustom: false }] });

const ProductGroup = ({ group, index, onUpdate, onRemove, exchangeRate, onPickerSelect }) => {
  const dispatch = useDispatch();
  const { myProducts, myProductsLoading } = useSelector((state) => state.erp);
  const { productId, productName, tiers, variants } = group;
  const [showPicker, setShowPicker] = useState(false);
  const [bulkQty, setBulkQty] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [warnings, setWarnings] = useState({});
  const [isExiting, setIsExiting] = useState(false);

  // Chỉ cho phép tương tác khi đã chọn product từ list
  const hasSelectedProduct = !!productId;

  useEffect(() => {
    const fetchWarnings = async () => {
      const newWarnings = { ...warnings };
      let updated = false;

      for (const v of variants) {
        if (!v.sku || v.sku.length < 3) {
continue;
}
        if (newWarnings[v.sku]) {
continue;
}

        try {
          const res = await inventoryService.getLotBreakdown(v.sku);
          if (res && res.totalRemaining > 0) {
            newWarnings[v.sku] = res;
            updated = true;
          } else {
            newWarnings[v.sku] = { empty: true };
            updated = true;
          }
        } catch {
          // ignore
        }
      }

      if (updated) {
        setWarnings(newWarnings);
      }
    };

    const timer = setTimeout(fetchWarnings, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  const openPicker = useCallback(() => {
    dispatch(fetchMyProducts({ limit: 200, status: 'active' }));
    setShowPicker(true);
  }, [dispatch]);

  const updateProductName = (name) => {
    const newVariants = variants.map((v) => ({
      ...v,
      sku: genSKU(name, v._variantLabel),
    }));
    onUpdate({ ...group, productName: name, variants: newVariants });
  };

  const handlePickerSelect = (pickedGroups) => {
    if (pickedGroups.length === 1) {
      onUpdate({ ...group, ...pickedGroups[0] });
    } else {
      onUpdate({ ...group, ...pickedGroups[0] });
      if (onPickerSelect) {
        onPickerSelect(pickedGroups.slice(1));
      }
    }
  };

  const updateTiers = (newTiers) => {
    const newVariants = generateVariants(newTiers, variants, productName);
    onUpdate({ ...group, tiers: newTiers, variants: newVariants });
  };

  const addTier = () => updateTiers([...tiers, EMPTY_TIER()]);

  const updateTier = (i, patch) => {
    const newTiers = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    updateTiers(newTiers);
  };

  const removeTier = (i) => updateTiers(tiers.filter((_, idx) => idx !== i));

  const updateVariant = (vi, field, value) => {
    if (value === '' || value == null) {
      const newVariants = variants.map((v, idx) => (idx === vi ? { ...v, [field]: '' } : v));
      onUpdate({ ...group, variants: newVariants });
      return;
    }
    const parsed = field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : parseFloat(value);
    const newVariants = variants.map((v, idx) => (idx === vi ? { ...v, [field]: parsed } : v));
    onUpdate({ ...group, variants: newVariants });
  };

  const bulkUpdateVariants = (field, value) => {
    if (value === '' || value == null) {
return;
}
    const parsed =
      field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : parseFloat(value) || 0;
    const newVariants = variants.map((v) => ({ ...v, [field]: parsed }));
    onUpdate({ ...group, variants: newVariants });
  };

  // P1: Animated exit when removing
  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove();
    }, 200);
  };

  const totalVariants = variants.length;
  const totalQty = variants.reduce((s, v) => s + Number(v.quantity || 0), 0);

  return (
    <div className={`${styles.productGroup}${isExiting ? ` ${styles.isExiting}` : ''}`}>
      {/* P0: ListingPickerModal — rendered via portal to escape overflow:hidden */}
      {showPicker && createPortal(
        <ListingPickerModal
          products={myProducts}
          loading={myProductsLoading}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          exchangeRate={exchangeRate}
        />,
        document.body
      )}

      {/* Card Header */}
      <div className={styles.pgCardHeader}>
        <div className={styles.pgCardHeaderLeft}>
          <div className={styles.pgCardIcon}>
            <span className={styles.pgIconColor}>
              <Layers />
            </span>
          </div>
          <div className={styles.pgCardInfo}>
            <div className={styles.pgCardName}>
              {productName || <span className={styles.pgUnnamedText}>Untitled Product</span>}
            </div>
            <div className={styles.pgCardMeta}>
              <span>
                {totalVariants} variant{totalVariants !== 1 ? 's' : ''}
              </span>
              {totalQty > 0 && (
                <>
                  <span className={styles.pgMetaDot} />
                  <span>
                    {totalQty} unit{totalQty !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* P0: Card actions */}
        <div className={styles.pgCardActions}>
          <button
            type="button"
            className={styles.btnSecondaryOutline}
            onClick={openPicker}
            aria-label="Select from listing"
          >
            <List />
            From Listing
          </button>
          <button
            type="button"
            className={styles.btnCardIcon}
            onClick={openPicker}
            aria-label="Edit product"
          >
            <Pencil />
          </button>
          <button
            type="button"
            className={`${styles.btnCardIcon} ${styles.btnCardIconDanger}`}
            onClick={handleRemove}
            aria-label="Remove product"
          >
            <Trash2 />
          </button>
        </div>
      </div>

      {/* Product name — locked: phải chọn từ listing */}
      <div className={styles.pgProductNameInputWrap}>
        <div className={`${styles.pgFormGroupNoMargin} ${!hasSelectedProduct ? styles.lockedGroup : ''}`}>
          <label htmlFor={`productName-${index}`} className={styles.pgProductNameLabel}>
            Product Name <span className={styles.required}>*</span>
            {!hasSelectedProduct && (
              <span className={styles.lockedBadge}>
                <List size={10} />
                Select from Listing
              </span>
            )}
          </label>
          <div className={styles.lockedInputWrap}>
            {hasSelectedProduct ? (
              <input
                id={`productName-${index}`}
                type="text"
                value={productName}
                readOnly
                className={styles.pgProductNameInput}
              />
            ) : (
              <>
                <span className={styles.lockedInputIcon}>
                  <Package size={15} />
                </span>
                <input
                  id={`productName-${index}`}
                  type="text"
                  placeholder="Click 'From Listing' above to select a product..."
                  value=""
                  readOnly
                  disabled
                  className={styles.lockedInput}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <div className={styles.pgVariantsWrap}>
        <div className={styles.pgVariantsOverflow}>
          <table className={styles.variantTable}>
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Classification</th>
                <th>
                  SKU <span className={styles.autoTag}>auto</span>
                </th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, vi) => {
                const warn = warnings[v.sku];
                const hasWarning = warn && !warn.empty && warn.totalRemaining > 0;
                const tier0 = v._tier0Label || '';
                const tier1 = v._tier1Label || '';
                const hasImage = v._image;

                return (
                  <React.Fragment key={vi}>
                    <tr>
                      <td className={styles.classificationCell}>
                        {hasImage && (
                          <img
                            src={v._image}
                            alt={tier0 || 'variant'}
                            className={styles.classificationImg}
                          />
                        )}
                        {!hasImage && (
                          <div className={styles.classificationImgPlaceholder}>
                            <Box size={14} />
                          </div>
                        )}
                        <div className={styles.classificationLabels}>
                          {tier0 ? (
                            <>
                              <span className={styles.classificationTier0}>{tier0}</span>
                              {tier1 && (
                                <>
                                  <span className={styles.classificationSlash}>/</span>
                                  <span className={styles.classificationTier1}>{tier1}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <span className={styles.variantLabelText}>
                              {v._variantLabel || <em className={styles.variantLabelEmpty}>—</em>}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          className={styles.skuInput}
                          value={v.sku}
                          onChange={(e) => updateVariant(vi, 'sku', e.target.value.toUpperCase())}
                          placeholder="AUTO"
                          readOnly={!hasSelectedProduct}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className={styles.numInput}
                          value={v.quantity}
                          onChange={(e) => updateVariant(vi, 'quantity', e.target.value)}
                          disabled={!hasSelectedProduct}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={styles.numInput}
                          value={v.unitPriceCny}
                          onChange={(e) => updateVariant(vi, 'unitPriceCny', e.target.value)}
                          disabled={!hasSelectedProduct}
                        />
                      </td>
                      <td>
                        <span className={styles.calcCell}>
                          {fmt(Number(v.unitPriceCny) * exchangeRate * Number(v.quantity))} ₫
                          <span className={styles.calcCellCny}>
                            {fmtCny(Number(v.unitPriceCny) * Number(v.quantity))}
                          </span>
                        </span>
                      </td>
                    </tr>
                    {/* P1: Stock warning */}
                    {hasWarning && (
                      <tr>
                        <td colSpan="5" className={styles.stockWarning}>
                          <AlertTriangle className={styles.stockAlertIcon} />
                          <strong>Cảnh báo tồn kho:</strong> SKU này đang còn tồn{' '}
                          <strong>{warn.totalRemaining}</strong> sản phẩm từ lô cũ
                          {warn.lots?.length > 0 &&
                            ` (giá vốn: ${warn.lots.map((l) => `${fmt(l.costPrice)}đ`).join(', ')})`}
                          . Xin lưu ý khi định giá mua mới.
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bulk Edit Bar */}
        {variants.length >= 1 && (
          <div className={styles.bulkEditBar}>
            <span className={styles.bulkLabel}>Bulk:</span>
            <input
              type="number"
              min="1"
              placeholder="Qty"
              className={styles.bulkInput}
              value={bulkQty}
              onChange={(e) => setBulkQty(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && hasSelectedProduct && (bulkUpdateVariants('quantity', bulkQty), setBulkQty(''))
              }
              disabled={!hasSelectedProduct}
            />
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => {
                bulkUpdateVariants('quantity', bulkQty);
                setBulkQty('');
              }}
              disabled={!hasSelectedProduct}
            >
              Apply
            </button>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="¥"
              className={styles.bulkInput}
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && hasSelectedProduct &&
                (bulkUpdateVariants('unitPriceCny', bulkPrice), setBulkPrice(''))
              }
              disabled={!hasSelectedProduct}
            />
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => {
                bulkUpdateVariants('unitPriceCny', bulkPrice);
                setBulkPrice('');
              }}
              disabled={!hasSelectedProduct}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Tiers Section — chỉ hiển thị khi đã chọn product từ list */}
      {hasSelectedProduct && (tiers.length > 0 || tiers.length < 3) ? (
        <div className={styles.tiersSection}>
          <div className={styles.tiersSectionHeader}>
            <span className={styles.tiersLabel}>
              <Tag className={styles.tiersLabelIcon} />
              Classification
            </span>
            {tiers.length < 3 && (
              <button type="button" className={styles.btnAddTier} onClick={addTier}>
                <Plus className={styles.btnAddTierIcon} />
                Add
              </button>
            )}
          </div>
          {tiers.map((tier, i) => {
            const usedTypes = tiers.map((t) => t.type).filter(Boolean);
            return (
              <TierRow
                key={i}
                tier={tier}
                usedTypes={usedTypes}
                styles={styles}
                disabled={!hasSelectedProduct}
                onChangeType={(type) => {
                  const tierDef = TIER_TYPES[type];
                  updateTier(i, {
                    type,
                    name: tierDef ? tierDef.name : '',
                    options: [{ value: '', isCustom: false }],
                  });
                }}
                onChangeOptions={(options) => updateTier(i, { options })}
                onRemove={() => removeTier(i)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY GROUP
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_GROUP = () => ({
  _id: Math.random().toString(36).slice(2),
  productName: '',
  tiers: [],
  variants: [makeVariant('', '')],
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE — redesigned 2-column layout
// ─────────────────────────────────────────────────────────────────────────────
const CreatePurchaseOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { suppliers, loading, exchangeRate: liveRate } = useSelector((state) => state.erp);

  const [searchParams] = useSearchParams();
  const supplierIdFromUrl = searchParams.get('supplierId') || '';

  // Pre-fill products from URL params (?products=...)
  useEffect(() => {
    const raw = searchParams.get('products');
    if (!raw) {
return;
}
    try {
      const decoded = JSON.parse(decodeURIComponent(raw));
      const products = Array.isArray(decoded) ? decoded : [decoded];

      let prefillRate = 3500;
      try {
        const saved = JSON.parse(localStorage.getItem('gz_import_config') || '{}');
        if (saved?.exchangeRate != null) {
          prefillRate = Number(saved.exchangeRate) || 3500;
        }
      } catch {
        /* ignore */
      }

      const normNameKey = (name) =>
        String(name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ');

      const grouped = new Map();
      products.forEach((p) => {
        if (!p || !p.name) {
return;
}
        const groupKey = normNameKey(p.name);

        if (!grouped.has(groupKey)) {
          const productTiers =
            Array.isArray(p.tiers) && p.tiers.length > 0
              ? p.tiers.map((t) => listingTierToFormState(t))
              : [];
          grouped.set(groupKey, {
            _id: Math.random().toString(36).slice(2),
            productName: p.name.trim(),
            tiers: productTiers,
            variants: [],
          });
        } else {
          const existing = grouped.get(groupKey);
          if (existing.tiers.length === 0 && Array.isArray(p.tiers) && p.tiers.length > 0) {
            existing.tiers = p.tiers.map((t) => listingTierToFormState(t));
          }
        }
        const g = grouped.get(groupKey);
        const model = p.lowestStockModel;
        if (model && (model.sku || model._id)) {
          const mid = model._id ? String(model._id) : '';
          const sku = model.sku ? String(model.sku) : '';
          const isDup = g.variants.some(
            (v) => (mid && String(v._modelId) === mid) || (sku && v.sku === sku)
          );
          if (!isDup) {
            const variantLabel = variantLabelFromFormTiers(g.tiers, model.tierIndex || []);
            g.variants.push({
              _variantLabel: variantLabel,
              _image: model.image || null,
              sku: model.sku || '',
              quantity: 1,
              unitPriceCny:
                vndToCnyHint(model.costPrice, prefillRate) ||
                vndToCnyHint(model.price, prefillRate),
              _productId: p._id || p.productId || '',
              _modelId: model._id || '',
              _tierIndex: Array.isArray(model.tierIndex) ? [...model.tierIndex] : [],
            });
          }
        }
      });

      const prefilled = Array.from(grouped.values()).map((g) => {
        const tiers = subsetTiersToMatchVariantTierIndexes(g.tiers, g.variants);
        const variants = g.variants.map((v) => {
          // eslint-disable-next-line no-unused-vars
          const { _tierIndex, ...rest } = v;
          return rest;
        });
        return { ...g, tiers, variants };
      });

      if (prefilled.length > 0) {
        setGroups(prefilled);
        toast.success(`Đã điền sẵn ${prefilled.length} sản phẩm sắp hết hàng`);
      }
    } catch {
      /* ignore malformed param */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [formData, setFormData] = useState({
    supplierId: supplierIdFromUrl,
    expectedDeliveryDate: '',
    notes: '',
  });

  useEffect(() => {
    if (supplierIdFromUrl) {
      setFormData((p) => ({ ...p, supplierId: supplierIdFromUrl }));
    }
  }, [supplierIdFromUrl]);

  const DEFAULT_IMPORT_CONFIG = {
    exchangeRate: 3500,
    buyingServiceFeeRate: 0.05,
  };

  const [importConfig, setImportConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gz_import_config'));
      return saved ? { ...DEFAULT_IMPORT_CONFIG, ...saved } : DEFAULT_IMPORT_CONFIG;
    } catch {
      return DEFAULT_IMPORT_CONFIG;
    }
  });

  const [groups, setGroups] = useState([EMPTY_GROUP()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchSuppliers({ limit: 100 }));
    dispatch(fetchExchangeRate());
  }, [dispatch]);

  useEffect(() => {
    if (!liveRate?.rate) {
return;
}
    setImportConfig((prev) => {
      if (Number(prev.exchangeRate) === DEFAULT_IMPORT_CONFIG.exchangeRate) {
        return { ...prev, exchangeRate: liveRate.rate };
      }
      return prev;
    });
  }, [liveRate?.rate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem('gz_import_config', JSON.stringify(importConfig));
    } catch {
      /* persist failures are non-critical */
    }
  }, [importConfig]);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.variants.map((v) => ({ ...v, _groupId: g._id }))),
    [groups]
  );

  const costBasis = useMemo(
    () => computeStage1CostBasis(flatItems, importConfig),
    [flatItems, importConfig]
  );

  // P2: Summary stats for sticky bar
  const totalItemCount = flatItems.reduce((s, v) => s + Number(v.quantity || 0), 0);
  const totalProductCount = groups.filter((g) => g.productName.trim()).length;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((p) => ({ ...p, [name]: '' }));
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setImportConfig((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
  };

  const mergeGroupsByName = (groupList) => {
    const seen = new Map();
    const merged = [];
    groupList.forEach((g) => {
      const key = g.productName.trim().toLowerCase();
      if (!key) {
        merged.push(g);
        return;
      }
      if (seen.has(key)) {
        const idx = seen.get(key);
        merged[idx] = {
          ...merged[idx],
          variants: [...merged[idx].variants, ...g.variants],
        };
      } else {
        seen.set(key, merged.length);
        merged.push(g);
      }
    });
    return merged;
  };

  const updateGroup = (i, updated) => {
    setGroups((prev) => {
      const next = prev.map((g, idx) => (idx === i ? updated : g));
      return mergeGroupsByName(next);
    });
  };

  const removeGroup = (i) => {
    if (groups.length > 1) {
      setGroups((p) => p.filter((_, idx) => idx !== i));
    } else {
      // Reset instead of removing last group
      setGroups([EMPTY_GROUP()]);
    }
  };

  const addGroup = () => setGroups((p) => [...p, EMPTY_GROUP()]);

  const addGroupsFromPicker = (pickerGroups) => {
    setGroups((prev) =>
      mergeGroupsByName([...prev.filter((g) => g.productName.trim()), ...pickerGroups])
    );
  };

  const validate = () => {
    const errs = {};
    if (!formData.supplierId) {
      errs.supplierId = 'Please select a supplier';
    }
    if (!formData.expectedDeliveryDate) {
      errs.expectedDeliveryDate = 'Please select a delivery date';
    }
    groups.forEach((g, gi) => {
      if (!g.productName.trim()) {
        errs[`pname_${gi}`] = 'Product name is required';
      }
      g.variants.forEach((v, vi) => {
        if (!v.sku) {
          errs[`sku_${gi}_${vi}`] = 'SKU is required';
        }
        if (Number(v.quantity) < 1) {
          errs[`qty_${gi}_${vi}`] = 'Qty >= 1';
        }
        if (Number(v.unitPriceCny) <= 0) {
          errs[`price_${gi}_${vi}`] = 'Price > 0';
        }
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildOrderData = (status) => {
    const rate = parseFloat(importConfig.exchangeRate) || 3500;
    const items = groups.flatMap((g) =>
      g.variants.map((v) => ({
        ...(v._productId ? { productId: v._productId, modelId: v._modelId } : {}),
        sku: v.sku || genSKU(g.productName, v._variantLabel),
        productName: g.productName,
        variantName: v._variantLabel || '',
        quantity: parseInt(v.quantity) || 1,
        unitPriceCny: parseFloat(v.unitPriceCny),
        unitPrice: parseFloat(v.unitPriceCny) * rate,
        totalPrice: parseFloat(v.unitPriceCny) * rate * (parseInt(v.quantity) || 1),
        weightKg: 0,
        dimLength: 0,
        dimWidth: 0,
        dimHeight: 0,
      }))
    );
    return {
      supplierId: formData.supplierId,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      notes: formData.notes || '',
      status,
      importConfig: {
        exchangeRate: rate,
        buyingServiceFeeRate: parseFloat(importConfig.buyingServiceFeeRate),
        shippingRatePerKg: 0,
        useVolumetricShipping: true,
      },
      totalWeightKg: 0,
      fixedCosts: {
        cnDomesticShippingCny: 0,
        packagingCostVnd: 0,
        vnDomesticShippingVnd: 0,
      },
      items,
    };
  };

  const handleSaveAsDraft = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please check the form and fix errors');
      return;
    }
    try {
      await dispatch(createPurchaseOrder(buildOrderData('Draft'))).unwrap();
      toast.success(
        'Saved as draft. Status: Pending submit. You can edit and Submit Order later.',
        {
          autoClose: 4000,
        }
      );
      navigate('/seller/erp/purchase-orders');
    } catch (err) {
      console.error('Failed:', err);
      toast.error(err?.error || err?.message || 'Failed to save draft');
    }
  };

  const handleCreateAndSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please check the form and fix errors');
      return;
    }
    try {
      await dispatch(createPurchaseOrder(buildOrderData('ORDERED'))).unwrap();
      toast.success('Order created and submitted. Status: Ordered.', { autoClose: 4000 });
      navigate('/seller/erp/purchase-orders');
    } catch (err) {
      console.error('Failed:', err);
      toast.error(err?.error || err?.message || 'Failed to create purchase order');
    }
  };

  if (loading && !suppliers.length) {
    return <LoadingSpinner />;
  }

  // P2: Generate doc ID
  const docId = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}-ALPHA`;

  return (
    <div className={styles.container}>
      {/* P1: Redesigned page header with breadcrumb */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>Orders</span>
          <span className={styles.breadcrumbSep}>
            <ChevronRight />
          </span>
          <span>New Purchase Order</span>
        </nav>
        <div className={styles.pageTitleRow}>
          <div>
            <h1 className={styles.pageTitle}>Create Purchase Order</h1>
            <p className={styles.pageSubtitle}>
              Initiate a formal inventory requisition from verified suppliers.
            </p>
          </div>
          <div className={styles.docIdBadge}>
            <span className={styles.docIdLabel}>Document ID</span>
            <span className={styles.docIdValue}>{docId}</span>
          </div>
        </div>
      </div>

      {/* P1: 2-column grid layout */}
      <form onSubmit={handleCreateAndSubmit}>
        <div className={styles.pageGrid}>
          {/* Left Column: Core Data */}
          <div className={styles.leftColumn}>
            {/* P0: Order Information */}
            <div className={styles.sectionOrderInfo}>
              <div className={styles.sectionAccentBar} />
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconPrimary}`}>
                  <Info />
                </div>
                <h2 className={styles.sectionTitle}>Order Information</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="supplierId">
                    Supplier <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="supplierId"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleFormChange}
                    className={errors.supplierId ? styles.error : ''}
                    aria-invalid={!!errors.supplierId}
                  >
                    <option value="">-- Select supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <span className={styles.errorText}>
                      <AlertTriangle />
                      {errors.supplierId}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="expectedDeliveryDate">
                    Delivery Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="expectedDeliveryDate"
                    type="date"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleFormChange}
                    className={errors.expectedDeliveryDate ? styles.error : ''}
                    aria-invalid={!!errors.expectedDeliveryDate}
                  />
                  {errors.expectedDeliveryDate && (
                    <span className={styles.errorText}>
                      <AlertTriangle />
                      {errors.expectedDeliveryDate}
                    </span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="notes">Internal Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={2}
                    placeholder="Specify logistics constraints or handling requirements..."
                  />
                </div>
              </div>
            </div>

            {/* P1: Products List */}
            <div className={styles.sectionProducts}>
              <div className={styles.sectionAccentBar} />
              <div className={styles.productsHeader}>
                <div className={styles.productsHeaderLeft}>
                  <div className={`${styles.sectionIcon} ${styles.sectionIconSecondary}`}>
                    <Package />
                  </div>
                  <h2 className={styles.sectionTitle}>Products List</h2>
                </div>
                <button type="button" className={styles.btnAdd} onClick={addGroup}>
                  <Plus />
                  Add Product
                </button>
              </div>

              <div className={styles.productsBody}>
                {groups.length === 0 ||
                (groups.length === 1 &&
                  !groups[0].productName.trim() &&
                  groups[0].variants.length === 1 &&
                  !groups[0].variants[0].sku) ? (
                  <ProductsEmptyState onAddProduct={addGroup} />
                ) : (
                  groups.map((g, gi) => (
                    <ProductGroup
                      key={g._id}
                      group={g}
                      index={gi}
                      onUpdate={(updated) => updateGroup(gi, updated)}
                      onRemove={() => removeGroup(gi)}
                      exchangeRate={importConfig.exchangeRate || 3500}
                      onPickerSelect={addGroupsFromPicker}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className={styles.sidebarSticky}>
            {/* P0: Import Configuration */}
            <div className={styles.sectionImportConfig}>
              <div className={styles.inventoryConfigHeader}>
                <div className={styles.inventoryConfigIcon}>
                  <Settings />
                </div>
                <div>
                  <h3 className={styles.inventoryConfigTitle}>Import Config</h3>
                </div>
              </div>

              <p className={styles.configNote}>
                Shipping and fixed costs are entered when goods arrive (Stage 2).
              </p>

              <div className={styles.configGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="exchangeRate">
                    <LabelWithTooltip tooltip="Exchange rate 1 ¥ (CNY) to VND. Used to convert goods value to VND.">
                      Exchange Rate
                    </LabelWithTooltip>
                  </label>
                  <div className={styles.configInputWrap}>
                    <span className={styles.configPrefixIcon}>$</span>
                    <input
                      id="exchangeRate"
                      type="number"
                      name="exchangeRate"
                      value={importConfig.exchangeRate}
                      onChange={handleConfigChange}
                      min="1"
                      step="any"
                      placeholder="3500"
                      className={`${styles.configSection} ${styles.configInputPrefix}`}
                    />
                  </div>
                  {liveRate?.rate && (
                    <span className={styles.rateHint}>
                      Live: <strong>{Number(liveRate.rate).toLocaleString('vi-VN')}</strong> ₫/¥
                      {Number(importConfig.exchangeRate) !== liveRate.rate && (
                        <button
                          type="button"
                          className={styles.rateSyncBtn}
                          onClick={() =>
                            setImportConfig((p) => ({ ...p, exchangeRate: liveRate.rate }))
                          }
                          title="Apply live exchange rate"
                        >
                          <RefreshCw className={styles.rateSyncBtnIcon} />
                          Use
                        </button>
                      )}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="buyingFee">
                    <LabelWithTooltip tooltip="Buying service fee (%). Applied to total goods value in VND. E.g. 5% = 0.05.">
                      Service Fee
                    </LabelWithTooltip>
                  </label>
                  <div className={styles.configInputWrap}>
                    <input
                      id="buyingFee"
                      type="number"
                      value={(importConfig.buyingServiceFeeRate * 100).toFixed(1)}
                      onChange={(e) =>
                        setImportConfig((p) => ({
                          ...p,
                          buyingServiceFeeRate: parseFloat(e.target.value || 0) / 100,
                        }))
                      }
                      min="0"
                      max="30"
                      step="0.5"
                      className={`${styles.configSection} ${styles.configInputSuffix}`}
                    />
                    <span className={styles.configSuffixIcon}>%</span>
                  </div>
                </div>
              </div>

              <div className={styles.autoApplyRow}>
                <span className={styles.autoApplyLabel}>Auto-Apply Rules</span>
                <span className={styles.autoApplyBadge}>
                  <Check className={styles.autoApplyBadgeIcon} />
                  Enabled
                </span>
              </div>
            </div>

            {/* P0: Cost Basis Summary (sidebar) */}
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryCardTitle}>Order Summary</h3>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Total Goods</span>
                  <span className={styles.summaryValue}>{fmt(costBasis.totalValueVnd)} ₫</span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    <LabelWithTooltip tooltip="Buying fee = Total Goods Value x Buying Fee (%)">
                      Service Fee
                    </LabelWithTooltip>
                  </span>
                  <span className={`${styles.summaryValue} ${styles.summaryGreen}`}>
                    {fmt(costBasis.buyingFeeVnd)} ₫
                  </span>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryTotalRow}>
                  <div className={styles.summaryTotalLabel}>
                    <span>Total Commitment</span>
                    <span className={styles.summaryVndBase}>VND BASE</span>
                  </div>
                  <div className={styles.summaryTotalAmount}>
                    <span className={styles.summaryTotalCurrency}>₫</span>
                    {fmt(costBasis.costBasisVnd)}
                  </div>
                  {costBasis.totalValueCny > 0 && (
                    <div className={styles.summaryCny}>{fmtCny(costBasis.totalValueCny)} CNY</div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>

      {/* P0: Sticky Action Bar with summary */}
      <div className={styles.stickyActions}>
        <div className={styles.stickyActionsInner}>
          <div className={styles.actionSummary}>
            <span className={styles.actionSummaryText}>
              {totalProductCount > 0
                ? `${totalProductCount} product${totalProductCount !== 1 ? 's' : ''} · ${totalItemCount} unit${totalItemCount !== 1 ? 's' : ''}`
                : 'No products added'}
            </span>
            {costBasis.costBasisVnd > 0 && (
              <span className={styles.actionSummaryAmount}>
                Total: <span>₫</span>
                {fmt(costBasis.costBasisVnd)}
              </span>
            )}
          </div>

          <button
            type="button"
            className={styles.actionCancel}
            onClick={() => navigate('/seller/erp/purchase-orders')}
          >
            Cancel
          </button>

          <button type="button" className={styles.actionDraft} onClick={handleSaveAsDraft}>
            Save as Draft
          </button>

          <button type="submit" className={styles.actionSubmit} onClick={handleCreateAndSubmit}>
            <Send />
            Create & Submit Order
          </button>
        </div>
      </div>
    </div>
  );
};

LabelWithTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  tooltip: PropTypes.string.isRequired,
};

TierRow.propTypes = {
  tier: PropTypes.shape({
    type: PropTypes.string,
    options: PropTypes.array.isRequired,
  }).isRequired,
  usedTypes: PropTypes.array.isRequired,
  onChangeType: PropTypes.func.isRequired,
  onChangeOptions: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

ListingPickerModal.propTypes = {
  products: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  exchangeRate: PropTypes.number,
};

ProductGroup.propTypes = {
  group: PropTypes.shape({
    productName: PropTypes.string,
    tiers: PropTypes.array,
    variants: PropTypes.array.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  exchangeRate: PropTypes.number.isRequired,
  onPickerSelect: PropTypes.func,
};

export default CreatePurchaseOrderPage;
