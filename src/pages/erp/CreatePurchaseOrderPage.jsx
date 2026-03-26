import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchSuppliers,
  createPurchaseOrder,
  fetchMyProducts,
  fetchExchangeRate,
} from '../../store/slices/erpSlice';
import inventoryService from '../../services/api/inventoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/CreatePurchaseOrderPage.module.css';
import {
  TIER_TYPES,
  TIER_TYPE_KEYS,
  CUSTOM_OPTION,
  listingTierToFormState,
  buildTierSelectOptions,
} from '../../constants/tierTypes';

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
 * so the classification UI matches the variant table (not full listing 4×4 vs 2 rows).
 */
const subsetTiersToMatchVariantTierIndexes = (tiersForm, variants) => {
  if (!Array.isArray(tiersForm) || tiersForm.length === 0 || !Array.isArray(variants) || variants.length === 0) {
    return tiersForm;
  }
  const withIdx = variants.filter(
    (v) => Array.isArray(v._tierIndex) && v._tierIndex.length > 0,
  );
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
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
  // Only tiers with at least one filled option
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

const TierRow = ({ tier, usedTypes, onChangeType, onChangeOptions, onRemove, styles }) => {
  const tierDef = TIER_TYPES[tier.type];
  const selectOptions = useMemo(() => buildTierSelectOptions(tierDef, tier), [tierDef, tier]);
  // Show all type keys that are either this tier's current type OR not already used
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
    <div className={styles.tierRow}>
      {/* Tier type selector */}
      <div className={styles.tierNameRow}>
        <select
          className={styles.tierTypeSelect}
          value={tier.type}
          onChange={(e) => onChangeType(e.target.value)}
        >
          <option value="">-- Select classification type --</option>
          {availableTypes.map((k) => (
            <option key={k} value={k}>
              {TIER_TYPES[k].nameEn} ({TIER_TYPES[k].name})
            </option>
          ))}
        </select>
        <button type="button" className={styles.btnRemoveTier} onClick={onRemove}>
          ✕
        </button>
      </div>

      {/* Options list — only shown once a tier type is selected */}
      {tier.type && tierDef && (
        <div className={styles.tierOptionsList}>
          {tier.options.map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              {opt.isCustom ? (
                <input
                  className={styles.customOptionInput}
                  type="text"
                  placeholder="Enter custom value"
                  value={opt.value}
                  onChange={(e) => handleCustomInput(i, e.target.value)}
                />
              ) : (
                <select
                  className={styles.optionSelect}
                  value={opt.value}
                  onChange={(e) => handleOptionSelect(i, e.target.value)}
                >
                  <option value="">-- Select {tierDef.nameEn.toLowerCase()} --</option>
                  {selectOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>✏️ Other (manual entry)</option>
                </select>
              )}
              {tier.options.length > 1 && (
                <button
                  type="button"
                  className={styles.btnRemoveOpt}
                  onClick={() => removeOption(i)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {tier.options.length < MAX_OPTIONS && (
            <button type="button" className={styles.btnAddOption} onClick={addOption}>
              + Add option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTING PICKER MODAL
// Let seller pick variants from their existing product listings
// ─────────────────────────────────────────────────────────────────────────────
const ListingPickerModal = ({ products, loading, onSelect, onClose, exchangeRate = 3500 }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { productId, product }
  const [checkedModels, setCheckedModels] = useState({}); // modelId → bool

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
    // Pre-check all models
    const initial = {};
    (product.models || []).forEach((m) => {
      initial[m._id] = true;
    });
    setCheckedModels(initial);
  };

  const buildVariantLabel = (product, model) =>
    variantLabelFromRawTiers(product.tiers, model?.tierIndex || []);

  const handleConfirm = () => {
    if (!selected) {
      return;
    }
    const pickedModels = (selected.models || []).filter((m) => checkedModels[m._id]);
    if (!pickedModels.length) {
      return;
    }

    const rate = Number(exchangeRate) || 3500;

    // One group per product, variants = all picked models
    const group = {
      _id: Math.random().toString(36).slice(2),
      productName: selected.name,
      productId: selected._id,
      tiers: listingTiersToPoFormTiers(selected.tiers),
      variants: pickedModels.map((model) => ({
        _variantLabel: buildVariantLabel(selected, model),
        sku: model.sku,
        quantity: 1,
        unitPriceCny:
          vndToCnyHint(model.costPrice, rate) || vndToCnyHint(model.price, rate),
        _productId: selected._id,
        _modelId: model._id,
      })),
    };
    onSelect([group]);
    onClose();
  };

  return (
    <div style={pickerOverlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={pickerPanelStyle}>
        {/* Header */}
        <div style={pickerHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={pickerIconBadgeStyle}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                Select product from listing
              </div>
              {selected && (
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                  {selected.name}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={pickerCloseBtnStyle} title="Close">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selected ? (
          <>
            {/* Search */}
            <div style={pickerSearchWrapStyle}>
              <svg
                style={pickerSearchIconStyle}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={pickerSearchStyle}
              />
            </div>

            {/* Product list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: 13 }}>
                Loading list...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: 13 }}>
                No products found
              </div>
            ) : (
              <div style={pickerListStyle}>
                {filtered.map((p) => (
                  <div
                    key={p._id}
                    style={pickerItemStyle}
                    onClick={() => handleSelectProduct(p)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.background = '#fafbff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={pickerChipStyle}>{p.models?.length || 0} variants</span>
                      {p.models?.[0] && (
                        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                          SKU: {p.models[0].sku}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back */}
            <button onClick={() => setSelected(null)} style={pickerBackBtnStyle}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>

            {/* Select all */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '8px 0 6px',
              }}
            >
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Select variants to add:</p>
              <button
                onClick={() => {
                  const allChecked = (selected.models || []).every((m) => checkedModels[m._id]);
                  const next = {};
                  (selected.models || []).forEach((m) => {
                    next[m._id] = !allChecked;
                  });
                  setCheckedModels(next);
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6366f1',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {(selected.models || []).every((m) => checkedModels[m._id])
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            </div>

            {/* Variant list */}
            <div style={pickerListStyle}>
              {(selected.models || []).map((model) => (
                <label
                  key={model._id}
                  style={{
                    ...pickerVariantRowStyle,
                    ...(checkedModels[model._id] ? pickerVariantCheckedStyle : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!checkedModels[model._id]) {
                      e.currentTarget.style.borderColor = '#6366f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!checkedModels[model._id]) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedModels[model._id]}
                    onChange={() => toggleModel(model._id)}
                    style={{
                      width: 15,
                      height: 15,
                      accentColor: '#6366f1',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#4338ca',
                      fontWeight: 600,
                      minWidth: 90,
                    }}
                  >
                    {model.sku}
                  </span>
                  <span style={{ color: '#475569', fontSize: 13, flex: 1 }}>
                    {buildVariantLabel(selected, model) || (
                      <em style={{ color: '#cbd5e1' }}>No classification</em>
                    )}
                  </span>
                  {model.weight > 0 && <span style={pickerWeightBadgeStyle}>{model.weight}kg</span>}
                </label>
              ))}
            </div>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={!Object.values(checkedModels).some(Boolean)}
              style={pickerConfirmBtnStyle}
            >
              Add to Order
              {Object.values(checkedModels).filter(Boolean).length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: 999,
                    padding: '1px 7px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {Object.values(checkedModels).filter(Boolean).length}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Listing Picker Styles (light ERP theme) ──────────────────────────────────
const pickerOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};
const pickerPanelStyle = {
  background: '#ffffff',
  borderRadius: 16,
  padding: '24px 24px 20px',
  width: '90%',
  maxWidth: 540,
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
};
const pickerHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  paddingBottom: 14,
  borderBottom: '1px solid #f1f5f9',
};
const pickerIconBadgeStyle = {
  width: 34,
  height: 34,
  background: '#eef2ff',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6366f1',
};
const pickerCloseBtnStyle = {
  background: '#f1f5f9',
  border: 'none',
  color: '#64748b',
  width: 30,
  height: 30,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s',
  flexShrink: 0,
};
const pickerSearchWrapStyle = {
  position: 'relative',
  marginBottom: 12,
};
const pickerSearchIconStyle = {
  position: 'absolute',
  left: 11,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#94a3b8',
  pointerEvents: 'none',
};
const pickerSearchStyle = {
  width: '100%',
  padding: '9px 12px 9px 36px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};
const pickerListStyle = {
  overflowY: 'auto',
  flex: 1,
  maxHeight: 360,
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  paddingRight: 2,
};
const pickerItemStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  background: '#ffffff',
  border: '1.5px solid #e2e8f0',
  transition: 'border-color 0.15s, background 0.15s',
};
const pickerChipStyle = {
  display: 'inline-block',
  background: '#eef2ff',
  color: '#6366f1',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  padding: '1px 7px',
};
const pickerVariantRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  borderRadius: 8,
  background: '#ffffff',
  border: '1.5px solid #e2e8f0',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'border-color 0.15s, background 0.15s',
};
const pickerVariantCheckedStyle = {
  background: '#f0f4ff',
  borderColor: '#6366f1',
};
const pickerWeightBadgeStyle = {
  fontSize: 11,
  color: '#64748b',
  background: '#f1f5f9',
  borderRadius: 6,
  padding: '1px 6px',
  fontWeight: 500,
};
const pickerBackBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#6366f1',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 2,
};
const pickerConfirmBtnStyle = {
  marginTop: 14,
  width: '100%',
  padding: '11px 0',
  borderRadius: 10,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

const EMPTY_TIER = () => ({ type: '', options: [{ value: '', isCustom: false }] });

const ProductGroup = ({ group, index, onUpdate, onRemove, exchangeRate, onPickerSelect }) => {
  const dispatch = useDispatch();
  const { myProducts, myProductsLoading } = useSelector((state) => state.erp);
  const { productName, tiers, variants } = group;
  const [showPicker, setShowPicker] = useState(false);
  const [bulkQty, setBulkQty] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [warnings, setWarnings] = useState({});

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
        } catch (err) {
          // ignore error (probably not found)
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

  // Handle groups coming from the Listing Picker
  const handlePickerSelect = (pickedGroups) => {
    if (pickedGroups.length === 1) {
      // Simple case: replace this group's content
      onUpdate({ ...group, ...pickedGroups[0] });
    } else {
      // Multiple groups: replace this group with first, merge rest via parent
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
    const newVariants = variants.map((v, idx) => (idx === vi ? { ...v, [field]: value } : v));
    onUpdate({ ...group, variants: newVariants });
  };

  const bulkUpdateVariants = (field, value) => {
    if (value === '' || value == null) {
return;
}
    const parsed = field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : parseFloat(value) || 0;
    const newVariants = variants.map((v) => ({ ...v, [field]: parsed }));
    onUpdate({ ...group, variants: newVariants });
  };

  return (
    <div className={styles.productGroup}>
      {/* Picker Modal */}
      {showPicker && (
        <ListingPickerModal
          products={myProducts}
          loading={myProductsLoading}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          exchangeRate={exchangeRate}
        />
      )}

      {/* Header */}
      <div className={styles.pgHeader}>
        <h3 className={styles.pgTitle}>📦 Product #{index + 1}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={openPicker}
            style={{ fontSize: 13, padding: '4px 12px' }}
          >
            📋 Select from listing
          </button>
          <button type="button" className={styles.btnRemove} onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>

      {/* Product name */}
      <div className={styles.formGroup} style={{ marginBottom: 16 }}>
        <label>
          Product Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Guangzhou Fashion Leather Backpack"
          value={productName}
          onChange={(e) => updateProductName(e.target.value)}
        />
      </div>

      {/* Tiers */}
      <div className={styles.tiersSection}>
        <div className={styles.tiersSectionHeader}>
          <span className={styles.tiersLabel}>🏷️ Classification (optional)</span>
          {tiers.length < 3 && (
            <button type="button" className={styles.btnAddTier} onClick={addTier}>
              + Add Classification
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

      {/* Variants Table */}
      <div className={styles.variantsSection}>
        <div className={styles.variantHintRow}>
          <p className={styles.variantHint}>
            {tiers.length === 0
              ? 'Product has no classification — enter information below'
              : `${variants.length} variants auto-generated from classification`}
          </p>
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
                onKeyDown={(e) => e.key === 'Enter' && (bulkUpdateVariants('quantity', bulkQty), setBulkQty(''))}
              />
              <button
                type="button"
                className={styles.bulkBtn}
                onClick={() => {
                  bulkUpdateVariants('quantity', bulkQty);
                  setBulkQty('');
                }}
              >
                Apply Qty
              </button>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="¥ Price"
                className={styles.bulkInput}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (bulkUpdateVariants('unitPriceCny', bulkPrice), setBulkPrice(''))}
              />
              <button
                type="button"
                className={styles.bulkBtn}
                onClick={() => {
                  bulkUpdateVariants('unitPriceCny', bulkPrice);
                  setBulkPrice('');
                }}
              >
                Apply Price
              </button>
            </div>
          )}
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.variantTable}>
            <thead>
              <tr>
                <th>Classification</th>
                <th>
                  SKU <span className={styles.autoTag}>auto</span>
                </th>
                <th>Qty</th>
                <th>Unit Price (¥)</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, vi) => {
                const warn = warnings[v.sku];
                const hasWarning = warn && !warn.empty && warn.totalRemaining > 0;
                
                return (
                  <React.Fragment key={vi}>
                    <tr>
                      <td className={styles.variantLabel}>
                        {v._variantLabel || <em style={{ color: '#aaa' }}>—</em>}
                      </td>
                      <td>
                        <input
                          className={styles.skuInput}
                          value={v.sku}
                          onChange={(e) => updateVariant(vi, 'sku', e.target.value.toUpperCase())}
                          placeholder="AUTO"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className={styles.numInput}
                          value={v.quantity}
                          onChange={(e) => updateVariant(vi, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className={styles.numInput}
                          value={v.unitPriceCny}
                          onChange={(e) => updateVariant(vi, 'unitPriceCny', e.target.value)}
                        />
                      </td>
                      <td className={styles.calcCell}>
                        {fmt(Number(v.unitPriceCny) * exchangeRate * Number(v.quantity))} ₫
                      </td>
                    </tr>
                    {hasWarning && (
                      <tr>
                        <td colSpan="5" style={{ padding: '8px 12px', background: '#fffbeb', color: '#b45309', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                          ⚠️ <strong>Cảnh báo tồn kho:</strong> SKU này đang còn tồn <strong>{warn.totalRemaining}</strong> sản phẩm từ lô cũ 
                          {warn.lots?.length > 0 && ` (giá vốn: ${warn.lots.map((l) => `${fmt(l.costPrice)  }đ`).join(', ')})`}.
                          Xin lưu ý khi định giá mua mới.
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const CreatePurchaseOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    suppliers,
    loading,
    exchangeRate: liveRate,
  } = useSelector((state) => state.erp);

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

      // Group by normalized product name: dashboard may return multiple Product docs
      // (different _id) for the same listing title; they should be one PO line group.
      const grouped = new Map();
      products.forEach((p) => {
        if (!p || !p.name) {
return;
}
        const groupKey = normNameKey(p.name);

        if (!grouped.has(groupKey)) {
          // All docs with the same name share the same tier def; prefer first non-empty
          const productTiers = Array.isArray(p.tiers) && p.tiers.length > 0
            ? p.tiers.map((t) => listingTierToFormState(t))
            : [];
          grouped.set(groupKey, {
            _id: Math.random().toString(36).slice(2),
            productName: p.name.trim(),
            tiers: productTiers,
            variants: [],
          });
        } else {
          // Fill in tiers if the first doc didn't have them
          const existing = grouped.get(groupKey);
          if (existing.tiers.length === 0 && Array.isArray(p.tiers) && p.tiers.length > 0) {
            existing.tiers = p.tiers.map((t) => listingTierToFormState(t));
          }
        }
        const g = grouped.get(groupKey);

        // Only the model that triggered the low-stock warning (lowestStockModel)
        const model = p.lowestStockModel;
        if (model && (model.sku || model._id)) {
          const mid = model._id ? String(model._id) : '';
          const sku = model.sku ? String(model.sku) : '';
          const isDup = g.variants.some(
            (v) =>
              (mid && String(v._modelId) === mid) ||
              (sku && v.sku === sku),
          );
          if (!isDup) {
            const variantLabel = variantLabelFromFormTiers(g.tiers, model.tierIndex || []);
            g.variants.push({
              _variantLabel: variantLabel,
              sku: model.sku || '',
              quantity: 1,
              unitPriceCny:
                vndToCnyHint(model.costPrice, prefillRate) || vndToCnyHint(model.price, prefillRate),
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
      // ignore malformed param
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [formData, setFormData] = useState({
    supplierId: supplierIdFromUrl,
    expectedDeliveryDate: '',
    notes: '',
  });

  // Pre-fill supplier when navigating from supplier detail page
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

  // Auto-fill exchange rate from live cron data when component mounts
  // Only overrides if the user has the default value (hasn't manually customised)
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

  // Save import config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('gz_import_config', JSON.stringify(importConfig));
    } catch { /* persist failures are non-critical */ }
  }, [importConfig]);

  // Flatten all variants for Stage 1 cost basis
  const flatItems = useMemo(
    () => groups.flatMap((g) => g.variants.map((v) => ({ ...v, _groupId: g._id }))),
    [groups]
  );

  const costBasis = useMemo(
    () => computeStage1CostBasis(flatItems, importConfig),
    [flatItems, importConfig]
  );

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

  /** Merge all groups that share the same productName into one group */
  const mergeGroupsByName = (groupList) => {
    const seen = new Map(); // productName (lowercased) → index in merged array
    const merged = [];
    groupList.forEach((g) => {
      const key = g.productName.trim().toLowerCase();
      if (!key) {
        merged.push(g);
        return;
      }
      if (seen.has(key)) {
        // Merge variants into the existing group
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
    }
  };

  const addGroup = () => setGroups((p) => [...p, EMPTY_GROUP()]);

  /** Called when ListingPicker returns 1+ groups — merge duplicates */
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
          errs[`qty_${gi}_${vi}`] = 'Qty ≥ 1';
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
      toast.success('Saved as draft. Status: Pending submit. You can edit and Submit Order later.', {
        autoClose: 4000,
      });
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
      toast.success('Order created and submitted. Status: Ordered.', {
        autoClose: 4000,
      });
      navigate('/seller/erp/purchase-orders');
    } catch (err) {
      console.error('Failed:', err);
      toast.error(err?.error || err?.message || 'Failed to create purchase order');
    }
  };

  if (loading && !suppliers.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Create Purchase Order</h1>
        </div>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate('/seller/erp/purchase-orders')}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleCreateAndSubmit}>
        {/* ─── Section 1: Order Info ─────────────────────────── */}
        <div className={styles.section}>
          <h2>Order Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Supplier <span className={styles.required}>*</span>
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleFormChange}
                className={errors.supplierId ? styles.error : ''}
              >
                <option value="">-- Select supplier --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <span className={styles.errorText}>{errors.supplierId}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>
                Expected Delivery Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleFormChange}
                className={errors.expectedDeliveryDate ? styles.error : ''}
              />
              {errors.expectedDeliveryDate && (
                <span className={styles.errorText}>{errors.expectedDeliveryDate}</span>
              )}
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={2}
                placeholder="Order notes..."
              />
            </div>
          </div>
        </div>

        {/* ─── Section 2: Import Config (Stage 1 — Goods Value & Buying Fee) ───────────────────────────────── */}
        <div className={styles.configSection}>
          <h2>
            Import Configuration
            <span className={styles.savedBadge}>✓ Auto-saved</span>
          </h2>
          <p className={styles.configHint}>
            Shipping and fixed costs are entered when goods arrive (Stage 2).
          </p>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                <LabelWithTooltip tooltip="Exchange rate 1 ¥ (CNY) to VND. Used to convert goods value to VND.">
                  Exchange Rate (VND / ¥)
                </LabelWithTooltip>
              </label>
              <input
                type="number"
                name="exchangeRate"
                value={importConfig.exchangeRate}
                onChange={handleConfigChange}
                min="1"
                step="any"
                placeholder="3500"
              />
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
                      ↻ Use
                    </button>
                  )}
                </span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>
                <LabelWithTooltip tooltip="Buying service fee (%). Applied to total goods value in VND. E.g. 5% = 0.05.">
                  Buying Service Fee (%)
                </LabelWithTooltip>
              </label>
              <input
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
              />
            </div>
          </div>
        </div>

        {/* ─── Section 3: Products ──────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Products List</h2>
            <button type="button" className={styles.btnAdd} onClick={addGroup}>
              + Add Product
            </button>
          </div>
          <div className={styles.itemsContainer}>
            {groups.map((g, gi) => (
              <ProductGroup
                key={g._id}
                group={g}
                index={gi}
                onUpdate={(updated) => updateGroup(gi, updated)}
                onRemove={() => removeGroup(gi)}
                exchangeRate={importConfig.exchangeRate || 3500}
                onPickerSelect={addGroupsFromPicker}
              />
            ))}
          </div>
        </div>

        {/* ─── Section 4: Cost Basis (Stage 1 — Goods Value + Buying Fee only) ───────────────── */}
        <div className={styles.section}>
          <h2>Cost Basis</h2>
          <p className={styles.configHint}>
            Landed cost will be calculated when goods arrive (Stage 2).
          </p>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Classification</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>¥ CNY</th>
                  <th style={{ textAlign: 'right' }}>Amount (VND)</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) =>
                  g.variants.map((v, vi) => {
                    const rate = importConfig.exchangeRate || 3500;
                    const amountVnd = Number(v.unitPriceCny) * rate * Number(v.quantity);
                    const isFirst = vi === 0;
                    return (
                      <tr
                        key={g._id + vi}
                        style={
                          isFirst && g.variants.length > 1 ? { borderTop: '2px solid #e2e8f0' } : {}
                        }
                      >
                        {isFirst && (
                          <td
                            rowSpan={g.variants.length}
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: '#0f172a',
                              verticalAlign: 'top',
                              paddingTop: '0.65rem',
                              borderRight: '1px solid #f1f5f9',
                              background: '#fafbff',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {g.productName || '—'}
                          </td>
                        )}
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {v._variantLabel || <em style={{ color: '#cbd5e1' }}>—</em>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.sku || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{v.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{fmtCny(v.unitPriceCny)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                          {fmt(amountVnd)} ₫
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary — Stage 1: Goods Value + Buying Fee only */}
          <div className={styles.summary} style={{ marginTop: 16 }}>
            <div className={styles.summaryRow}>
              <span>
                <LabelWithTooltip tooltip="Total goods value = Σ(Unit Price ¥ × Qty × Exchange Rate). Excludes fees.">
                  Total Goods Value:
                </LabelWithTooltip>
              </span>
              <span>
                {fmt(costBasis.totalValueVnd)} ₫ ({fmtCny(costBasis.totalValueCny)})
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span>
                <LabelWithTooltip tooltip="Buying fee = Total Goods Value × Buying Fee (%).">
                  Total Buying Service Fee:
                </LabelWithTooltip>
              </span>
              <span style={{ color: '#2563eb' }}>{fmt(costBasis.buyingFeeVnd)} ₫</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>
                <LabelWithTooltip tooltip="Stage 1 cost basis = Goods Value + Buying Fee. Full landed cost calculated when goods arrive (Stage 2).">
                  Cost Basis (Goods + Fee):
                </LabelWithTooltip>
              </span>
              <strong style={{ color: '#059669', fontSize: 18 }}>
                {fmt(costBasis.costBasisVnd)} ₫
              </strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/seller/erp/purchase-orders')}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSaveAsDraft}
          >
            Save as Draft
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Create & Submit Order
          </button>
        </div>
      </form>
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
