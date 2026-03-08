import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSuppliers, createPurchaseOrder, fetchMyProducts } from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/CreatePurchaseOrderPage.module.css';
import { TIER_TYPES, TIER_TYPE_KEYS, CUSTOM_OPTION } from '../../constants/tierTypes';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0));
const fmtCny = (n) => `¥${(Number(n) || 0).toFixed(2)}`;

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
  const suffix = variantLabel ? '-' + slug(variantLabel).slice(0, 8) : '';
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
  weightKg: 0,
  dimLength: 0,
  dimWidth: 0,
  dimHeight: 0,
});

// ─────────────────────────────────────────────────────────────────────────────
// LANDED COST ENGINE (mirrors backend computeLandedCost)
// ─────────────────────────────────────────────────────────────────────────────
function computeLandedCost(flatItems, importConfig = {}, fixedCosts = {}, taxAmount = 0, otherCost = 0) {
  const rate           = importConfig.exchangeRate         || 3500;
  const buyingFeeRate  = importConfig.buyingServiceFeeRate || 0;
  const shippingRateKg = importConfig.shippingRatePerKg    || 0;
  const useVolumetric  = importConfig.useVolumetricShipping !== false;

  const enriched = flatItems.map((item) => {
    const qty          = Number(item.quantity)    || 0;
    const priceCny     = Number(item.unitPriceCny) || 0;
    const priceVnd     = priceCny * rate;
    const valueCnyLine = priceCny * qty;
    const valueVndLine = priceVnd * qty;
    const volKg        = ((item.dimLength || 0) * (item.dimWidth || 0) * (item.dimHeight || 0)) / 6000;
    const actual       = Number(item.weightKg) || 0;
    const chargePerUnit = useVolumetric ? Math.max(actual, volKg) : actual;
    return { ...item, priceCny, priceVnd, valueCnyLine, valueVndLine,
      chargeableWeightKg: chargePerUnit * qty, qty };
  });

  const totalValueCny     = enriched.reduce((s, i) => s + i.valueCnyLine, 0);
  const totalValueVnd     = enriched.reduce((s, i) => s + i.valueVndLine, 0);
  const totalChargeableKg = enriched.reduce((s, i) => s + i.chargeableWeightKg, 0);

  const buyingFeeVnd   = totalValueVnd * buyingFeeRate;
  const cnDomesticVnd  = (fixedCosts.cnDomesticShippingCny || 0) * rate;
  const packagingVnd   = fixedCosts.packagingCostVnd      || 0;
  const vnDomesticVnd  = fixedCosts.vnDomesticShippingVnd || 0;
  const valueCostPool  = buyingFeeVnd + cnDomesticVnd + packagingVnd + taxAmount + (otherCost * 0.5);
  const intlShippingVnd= totalChargeableKg * shippingRateKg;
  const weightCostPool = intlShippingVnd + vnDomesticVnd + (otherCost * 0.5);

  const itemsWithLC = enriched.map((item) => {
    const valueRatio  = totalValueCny  > 0 ? item.valueCnyLine       / totalValueCny      : 0;
    const weightRatio = totalChargeableKg > 0 ? item.chargeableWeightKg / totalChargeableKg : 0;
    const totalAlloc  = valueCostPool * valueRatio + weightCostPool * weightRatio;
    const landedCostUnit = item.qty > 0 ? (item.valueVndLine + totalAlloc) / item.qty : item.priceVnd;
    return { ...item, landedCostUnit: Math.round(landedCostUnit) };
  });

  return {
    itemsWithLC,
    summary: {
      totalValueCny:    Math.round(totalValueCny * 100) / 100,
      totalValueVnd:    Math.round(totalValueVnd),
      totalChargeableKg: Math.round(totalChargeableKg * 1000) / 1000,
      intlShippingVnd:  Math.round(intlShippingVnd),
      buyingFeeVnd:     Math.round(buyingFeeVnd),
      cnDomesticVnd:    Math.round(cnDomesticVnd),
      packagingVnd:     Math.round(packagingVnd),
      vnDomesticVnd:    Math.round(vnDomesticVnd),
      finalAmount:      Math.round(totalValueVnd + valueCostPool + weightCostPool),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER ROW — select-based, mirrors seller/listings TiersEditor
// ─────────────────────────────────────────────────────────────────────────────
const MAX_OPTIONS = 20;

const TierRow = ({ tier, usedTypes, onChangeType, onChangeOptions, onRemove, styles }) => {
  const tierDef = TIER_TYPES[tier.type];
  // Show all type keys that are either this tier's current type OR not already used
  const availableTypes = TIER_TYPE_KEYS.filter(
    (k) => k === tier.type || !usedTypes.includes(k)
  );

  const addOption = () => {
    if (tier.options.length >= MAX_OPTIONS) return;
    onChangeOptions([...tier.options, { value: '', isCustom: false }]);
  };

  const removeOption = (i) =>
    onChangeOptions(tier.options.filter((_, idx) => idx !== i));

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
        <button type="button" className={styles.btnRemoveTier} onClick={onRemove}>✕</button>
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
                  {tierDef.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                  <option value={CUSTOM_OPTION}>✏️ Other (manual entry)</option>
                </select>
              )}
              {tier.options.length > 1 && (
                <button type="button" className={styles.btnRemoveOpt} onClick={() => removeOption(i)}>×</button>
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
const ListingPickerModal = ({ products, loading, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { productId, product }
  const [checkedModels, setCheckedModels] = useState({}); // modelId → bool

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
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
    (product.models || []).forEach((m) => { initial[m._id] = true; });
    setCheckedModels(initial);
  };

  const buildVariantLabel = (product, model) => {
    const { tiers = [] } = product;
    if (!tiers.length || !model.tierIndex?.length) return '';
    return model.tierIndex.map((ti, axis) => tiers[axis]?.options[ti] ?? '').filter(Boolean).join(' / ');
  };

  const handleConfirm = () => {
    if (!selected) return;
    const pickedModels = (selected.models || []).filter((m) => checkedModels[m._id]);
    if (!pickedModels.length) return;

    // One group per product, variants = all picked models
    const group = {
      _id: Math.random().toString(36).slice(2),
      productName: selected.name,
      productId: selected._id,
      tiers: [],
      variants: pickedModels.map((model) => ({
        _variantLabel: buildVariantLabel(selected, model),
        sku: model.sku,
        quantity: 1,
        unitPriceCny: 0,
        weightKg: model.weight || 0,
        dimLength: 0, dimWidth: 0, dimHeight: 0,
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Select product from listing</div>
              {selected && <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{selected.name}</div>}
            </div>
          </div>
          <button onClick={onClose} style={pickerCloseBtnStyle} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {!selected ? (
          <>
            {/* Search */}
            <div style={pickerSearchWrapStyle}>
              <svg style={pickerSearchIconStyle} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
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
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: 13 }}>Loading list...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: 13 }}>No products found</div>
            ) : (
              <div style={pickerListStyle}>
                {filtered.map((p) => (
                  <div key={p._id} style={pickerItemStyle}
                    onClick={() => handleSelectProduct(p)}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#fafbff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={pickerChipStyle}>{p.models?.length || 0} variants</span>
                      {p.models?.[0] && <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {p.models[0].sku}</span>}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>

            {/* Select all */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 6px' }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Select variants to add:</p>
              <button
                onClick={() => {
                  const allChecked = (selected.models || []).every((m) => checkedModels[m._id]);
                  const next = {};
                  (selected.models || []).forEach((m) => { next[m._id] = !allChecked; });
                  setCheckedModels(next);
                }}
                style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {(selected.models || []).every((m) => checkedModels[m._id]) ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Variant list */}
            <div style={pickerListStyle}>
              {(selected.models || []).map((model) => (
                <label key={model._id} style={{
                  ...pickerVariantRowStyle,
                  ...(checkedModels[model._id] ? pickerVariantCheckedStyle : {}),
                }} onMouseEnter={(e) => { if (!checkedModels[model._id]) e.currentTarget.style.borderColor = '#6366f1'; }}
                   onMouseLeave={(e) => { if (!checkedModels[model._id]) e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                  <input
                    type="checkbox"
                    checked={!!checkedModels[model._id]}
                    onChange={() => toggleModel(model._id)}
                    style={{ width: 15, height: 15, accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4338ca', fontWeight: 600, minWidth: 90 }}>{model.sku}</span>
                  <span style={{ color: '#475569', fontSize: 13, flex: 1 }}>{buildVariantLabel(selected, model) || <em style={{ color: '#cbd5e1' }}>No classification</em>}</span>
                  {model.weight > 0 && (
                    <span style={pickerWeightBadgeStyle}>{model.weight}kg</span>
                  )}
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
                <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 999, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>
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
  position: 'fixed', inset: 0,
  background: 'rgba(15,23,42,0.45)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
};
const pickerPanelStyle = {
  background: '#ffffff',
  borderRadius: 16,
  padding: '24px 24px 20px',
  width: '90%', maxWidth: 540,
  maxHeight: '85vh',
  display: 'flex', flexDirection: 'column', gap: 0,
  boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
};
const pickerHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 16,
  paddingBottom: 14,
  borderBottom: '1px solid #f1f5f9',
};
const pickerIconBadgeStyle = {
  width: 34, height: 34,
  background: '#eef2ff',
  borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#6366f1',
};
const pickerCloseBtnStyle = {
  background: '#f1f5f9', border: 'none', color: '#64748b',
  width: 30, height: 30, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background 0.15s',
  flexShrink: 0,
};
const pickerSearchWrapStyle = {
  position: 'relative', marginBottom: 12,
};
const pickerSearchIconStyle = {
  position: 'absolute', left: 11, top: '50%',
  transform: 'translateY(-50%)', color: '#94a3b8',
  pointerEvents: 'none',
};
const pickerSearchStyle = {
  width: '100%', padding: '9px 12px 9px 36px',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a',
  fontSize: 14, boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.15s',
};
const pickerListStyle = {
  overflowY: 'auto', flex: 1,
  maxHeight: 360,
  display: 'flex', flexDirection: 'column', gap: 5,
  paddingRight: 2,
};
const pickerItemStyle = {
  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
  background: '#ffffff', border: '1.5px solid #e2e8f0',
  transition: 'border-color 0.15s, background 0.15s',
};
const pickerChipStyle = {
  display: 'inline-block',
  background: '#eef2ff', color: '#6366f1',
  borderRadius: 999, fontSize: 11, fontWeight: 600,
  padding: '1px 7px',
};
const pickerVariantRowStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 8,
  background: '#ffffff', border: '1.5px solid #e2e8f0',
  cursor: 'pointer', userSelect: 'none',
  transition: 'border-color 0.15s, background 0.15s',
};
const pickerVariantCheckedStyle = {
  background: '#f0f4ff', borderColor: '#6366f1',
};
const pickerWeightBadgeStyle = {
  fontSize: 11, color: '#64748b',
  background: '#f1f5f9', borderRadius: 6,
  padding: '1px 6px', fontWeight: 500,
};
const pickerBackBtnStyle = {
  background: 'none', border: 'none', color: '#6366f1',
  fontSize: 12, cursor: 'pointer', padding: 0,
  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
  marginBottom: 2,
};
const pickerConfirmBtnStyle = {
  marginTop: 14, width: '100%', padding: '11px 0',
  borderRadius: 10, border: 'none',
  background: '#6366f1',
  color: '#fff', fontWeight: 700, fontSize: 14,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
};

const EMPTY_TIER = () => ({ type: '', options: [{ value: '', isCustom: false }] });

const ProductGroup = ({ group, index, onUpdate, onRemove, exchangeRate, onPickerSelect }) => {
  const dispatch = useDispatch();
  const { myProducts, myProductsLoading } = useSelector((state) => state.erp);
  const { productName, tiers, variants } = group;
  const [showDim, setShowDim] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
      if (onPickerSelect) onPickerSelect(pickedGroups.slice(1));
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
    const newVariants = variants.map((v, idx) =>
      idx === vi ? { ...v, [field]: value } : v
    );
    onUpdate({ ...group, variants: newVariants });
  };

  const autoFillWeight = (vi) => {
    // Copy weight/dim from first variant to all
    const src = variants[vi];
    const newVariants = variants.map((v) => ({
      ...v,
      weightKg: src.weightKg,
      dimLength: src.dimLength,
      dimWidth:  src.dimWidth,
      dimHeight: src.dimHeight,
    }));
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
        />
      )}

      {/* Header */}
      <div className={styles.pgHeader}>
        <h3 className={styles.pgTitle}>📦 Product #{index + 1}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className={styles.btnSecondary} onClick={openPicker}
            style={{ fontSize: 13, padding: '4px 12px' }}>
            📋 Select from listing
          </button>
          <button type="button" className={styles.btnRemove} onClick={onRemove}>✕</button>
        </div>
      </div>

      {/* Tên sản phẩm */}
      <div className={styles.formGroup} style={{ marginBottom: 16 }}>
        <label>Product Name <span className={styles.required}>*</span></label>
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
        <p className={styles.variantHint}>
          {tiers.length === 0
            ? 'Product has no classification — enter information below'
            : `${variants.length} variants auto-generated from classification`}
        </p>

        {/* Toggle dim columns */}
        <label className={styles.dimToggle}>
          <input
            type="checkbox"
            checked={showDim}
            onChange={(e) => setShowDim(e.target.checked)}
          />
          &nbsp;📐 Enter box dimensions for volumetric weight (L×W×H/6000)
          <span className={styles.dimToggleHint}>&nbsp;— leave blank if using actual weight</span>
        </label>

        <div className={styles.tableContainer}>
          <table className={styles.variantTable}>
            <thead>
              <tr>
                <th>Classification</th>
                <th>SKU <span className={styles.autoTag}>auto</span></th>
                <th>Qty</th>
                <th>Unit Price (¥)</th>
                <th>Amount</th>
                <th>KG/unit</th>
                {showDim && <th>L×W×H (cm)</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, vi) => (
                <tr key={vi}>
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
                      type="number" min="1"
                      className={styles.numInput}
                      value={v.quantity}
                      onChange={(e) => updateVariant(vi, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number" min="0" step="0.5"
                      className={styles.numInput}
                      value={v.unitPriceCny}
                      onChange={(e) => updateVariant(vi, 'unitPriceCny', e.target.value)}
                    />
                  </td>
                  <td className={styles.calcCell}>
                    {fmt(Number(v.unitPriceCny) * exchangeRate * Number(v.quantity))} ₫
                  </td>
                  <td>
                    <input
                      type="number" min="0" step="0.01"
                      className={styles.numInput}
                      style={{ width: 65 }}
                      value={v.weightKg}
                      onChange={(e) => updateVariant(vi, 'weightKg', e.target.value)}
                    />
                  </td>
                  {showDim && (
                    <td>
                      <div className={styles.dimRow}>
                        <input type="number" min="0" step="0.5" className={styles.dimInput}
                          value={v.dimLength} onChange={(e) => updateVariant(vi, 'dimLength', e.target.value)} placeholder="D" />
                        <input type="number" min="0" step="0.5" className={styles.dimInput}
                          value={v.dimWidth} onChange={(e) => updateVariant(vi, 'dimWidth', e.target.value)} placeholder="R" />
                        <input type="number" min="0" step="0.5" className={styles.dimInput}
                          value={v.dimHeight} onChange={(e) => updateVariant(vi, 'dimHeight', e.target.value)} placeholder="C" />
                      </div>
                    </td>
                  )}
                  <td>
                    {vi === 0 && variants.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnCopyDim}
                        onClick={() => autoFillWeight(vi)}
                        title="Copy kg/dim to all variants"
                      >
                        ↓ Copy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
  const { suppliers, loading, myProducts, myProductsLoading } = useSelector((state) => state.erp);

  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    taxAmount: 0,
    otherCost: 0,
    notes: '',
  });

  const DEFAULT_IMPORT_CONFIG = {
    exchangeRate:          3500,
    buyingServiceFeeRate:  0.05,
    shippingRatePerKg:     80000,
    useVolumetricShipping: true,
  };

  const DEFAULT_FIXED_COSTS = {
    cnDomesticShippingCny: 0,
    packagingCostVnd:      0,
    vnDomesticShippingVnd: 0,
  };

  const [importConfig, setImportConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gz_import_config'));
      return saved ? { ...DEFAULT_IMPORT_CONFIG, ...saved } : DEFAULT_IMPORT_CONFIG;
    } catch { return DEFAULT_IMPORT_CONFIG; }
  });

  const [fixedCosts, setFixedCosts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gz_fixed_costs'));
      return saved ? { ...DEFAULT_FIXED_COSTS, ...saved } : DEFAULT_FIXED_COSTS;
    } catch { return DEFAULT_FIXED_COSTS; }
  });

  const [groups, setGroups] = useState([EMPTY_GROUP()]);
  const [errors, setErrors] = useState({});

  useEffect(() => { dispatch(fetchSuppliers({ limit: 100 })); }, [dispatch]);

  // Save import config to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('gz_import_config', JSON.stringify(importConfig)); } catch {}
  }, [importConfig]);

  useEffect(() => {
    try { localStorage.setItem('gz_fixed_costs', JSON.stringify(fixedCosts)); } catch {}
  }, [fixedCosts]);

  // Flatten all variants for LC computation
  const flatItems = useMemo(() =>
    groups.flatMap((g) => g.variants.map((v) => ({ ...v, _groupId: g._id }))),
    [groups]
  );

  const lcResult = useMemo(() =>
    computeLandedCost(
      flatItems,
      importConfig,
      fixedCosts,
      Number(formData.taxAmount) || 0,
      Number(formData.otherCost) || 0,
    ),
    [flatItems, importConfig, fixedCosts, formData.taxAmount, formData.otherCost]
  );

  // Build LC map by (groupId + variantLabel)
  const lcMap = useMemo(() => {
    const map = {};
    lcResult.itemsWithLC.forEach((lc) => {
      map[lc._groupId + '||' + lc._variantLabel] = lc;
    });
    return map;
  }, [lcResult]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setImportConfig((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
  };

  const handleFixedCostChange = (e) => {
    const { name, value } = e.target;
    setFixedCosts((p) => ({ ...p, [name]: parseFloat(value) || 0 }));
  };

  /** Merge all groups that share the same productName into one group */
  const mergeGroupsByName = (groupList) => {
    const seen = new Map(); // productName (lowercased) → index in merged array
    const merged = [];
    groupList.forEach((g) => {
      const key = g.productName.trim().toLowerCase();
      if (!key) { merged.push(g); return; }
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
    if (groups.length > 1) setGroups((p) => p.filter((_, idx) => idx !== i));
  };

  const addGroup = () => setGroups((p) => [...p, EMPTY_GROUP()]);

  /** Called when ListingPicker returns 1+ groups — merge duplicates */
  const addGroupsFromPicker = (pickerGroups) => {
    setGroups((prev) => mergeGroupsByName([...prev.filter((g) => g.productName.trim()), ...pickerGroups]));
  };

  const validate = () => {
    const errs = {};
    if (!formData.supplierId) errs.supplierId = 'Please select a supplier';
    if (!formData.expectedDeliveryDate) errs.expectedDeliveryDate = 'Please select a delivery date';
    groups.forEach((g, gi) => {
      if (!g.productName.trim()) errs[`pname_${gi}`] = 'Product name is required';
      g.variants.forEach((v, vi) => {
        if (!v.sku) errs[`sku_${gi}_${vi}`] = 'SKU is required';
        if (Number(v.quantity) < 1) errs[`qty_${gi}_${vi}`] = 'Qty ≥ 1';
        if (Number(v.unitPriceCny) <= 0) errs[`price_${gi}_${vi}`] = 'Price > 0';
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { alert('Please review the information'); return; }

    const rate = parseFloat(importConfig.exchangeRate) || 3500;

    // Build flat items array for the PO
    const items = groups.flatMap((g) =>
      g.variants.map((v) => ({
        ...(v._productId ? { productId: v._productId, modelId: v._modelId } : {}),
        sku:          v.sku || genSKU(g.productName, v._variantLabel),
        productName:  g.productName,
        variantName:  v._variantLabel || '',
        quantity:     parseInt(v.quantity) || 1,
        unitPriceCny: parseFloat(v.unitPriceCny),
        unitPrice:    parseFloat(v.unitPriceCny) * rate,
        totalPrice:   (parseFloat(v.unitPriceCny) * rate) * (parseInt(v.quantity) || 1),
        weightKg:     parseFloat(v.weightKg  || 0),
        dimLength:    parseFloat(v.dimLength  || 0),
        dimWidth:     parseFloat(v.dimWidth   || 0),
        dimHeight:    parseFloat(v.dimHeight  || 0),
      }))
    );

    try {
      const orderData = {
        ...formData,
        taxAmount:  parseFloat(formData.taxAmount  || 0),
        otherCost:  parseFloat(formData.otherCost  || 0),
        importConfig: {
          ...importConfig,
          buyingServiceFeeRate: parseFloat(importConfig.buyingServiceFeeRate),
          shippingRatePerKg:    parseFloat(importConfig.shippingRatePerKg),
          exchangeRate:         rate,
        },
        fixedCosts: {
          cnDomesticShippingCny: parseFloat(fixedCosts.cnDomesticShippingCny || 0),
          packagingCostVnd:      parseFloat(fixedCosts.packagingCostVnd      || 0),
          vnDomesticShippingVnd: parseFloat(fixedCosts.vnDomesticShippingVnd || 0),
        },
        items,
      };

      await dispatch(createPurchaseOrder(orderData)).unwrap();
      alert('Purchase order created successfully!');
      navigate('/erp/purchase-orders');
    } catch (err) {
      console.error('Failed:', err);
      alert('Error: ' + (err.error || JSON.stringify(err)));
    }
  };

  if (loading && !suppliers.length) return <LoadingSpinner />;

  const { summary } = lcResult;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Create Purchase Order</h1>
        </div>
        <button type="button" className={styles.btnSecondary}
          onClick={() => navigate('/erp/purchase-orders')}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ─── Section 1: Order Info ─────────────────────────── */}
        <div className={styles.section}>
          <h2>Order Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Supplier <span className={styles.required}>*</span></label>
              <select name="supplierId" value={formData.supplierId} onChange={handleFormChange}
                className={errors.supplierId ? styles.error : ''}>
                <option value="">-- Select supplier --</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {errors.supplierId && <span className={styles.errorText}>{errors.supplierId}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Expected Delivery Date <span className={styles.required}>*</span></label>
              <input type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate}
                onChange={handleFormChange} className={errors.expectedDeliveryDate ? styles.error : ''} />
              {errors.expectedDeliveryDate && <span className={styles.errorText}>{errors.expectedDeliveryDate}</span>}
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormChange}
                rows={2} placeholder="Order notes..." />
            </div>
          </div>
        </div>

        {/* ─── Section 2: Guangzhou Config ───────────────────── */}
        <div className={styles.configSection}>
          <h2>
            Guangzhou Import Configuration
            <span className={styles.savedBadge}>✓ Auto-saved</span>
          </h2>
          <div className={styles.formGrid4}>
            <div className={styles.formGroup}>
              <label>Exchange Rate (VND / ¥)</label>
              <input type="number" name="exchangeRate" value={importConfig.exchangeRate}
                onChange={handleConfigChange} min="1" step="10" />
            </div>
            <div className={styles.formGroup}>
              <label>Buying Service Fee (%)</label>
              <input type="number"
                value={(importConfig.buyingServiceFeeRate * 100).toFixed(1)}
                onChange={(e) => setImportConfig((p) => ({
                  ...p, buyingServiceFeeRate: parseFloat(e.target.value || 0) / 100,
                }))} min="0" max="30" step="0.5" />
            </div>
            <div className={styles.formGroup}>
              <label>Intl Shipping (VND / kg)</label>
              <input type="number" name="shippingRatePerKg" value={importConfig.shippingRatePerKg}
                onChange={handleConfigChange} min="0" step="1000" />
            </div>
            <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 22 }}>
              <input type="checkbox" id="useVol" name="useVolumetricShipping"
                style={{ width: 15, height: 15, accentColor: '#6366f1', cursor: 'pointer' }}
                checked={importConfig.useVolumetricShipping} onChange={handleConfigChange} />
              <label htmlFor="useVol" style={{ marginBottom: 0, textTransform: 'none', fontSize: '0.82rem', letterSpacing: 0, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
                Volumetric weight (L×W×H/6000)
              </label>
            </div>
          </div>

          <h3>Fixed Costs</h3>
          <div className={styles.formGrid4}>
            <div className={styles.formGroup}>
              <label>CN Domestic Ship (¥)</label>
              <input type="number" name="cnDomesticShippingCny"
                value={fixedCosts.cnDomesticShippingCny} onChange={handleFixedCostChange} min="0" step="1" />
            </div>
            <div className={styles.formGroup}>
              <label>Packaging / Insurance (VND)</label>
              <input type="number" name="packagingCostVnd"
                value={fixedCosts.packagingCostVnd} onChange={handleFixedCostChange} min="0" step="10000" />
            </div>
            <div className={styles.formGroup}>
              <label>VN Domestic Ship (VND)</label>
              <input type="number" name="vnDomesticShippingVnd"
                value={fixedCosts.vnDomesticShippingVnd} onChange={handleFixedCostChange} min="0" step="10000" />
            </div>
            <div className={styles.formGroup}>
              <label>Import Tax / VAT (VND)</label>
              <input type="number" name="taxAmount" value={formData.taxAmount}
                onChange={handleFormChange} min="0" step="10000" />
            </div>
            <div className={styles.formGroup}>
              <label>Other Costs (VND)</label>
              <input type="number" name="otherCost" value={formData.otherCost}
                onChange={handleFormChange} min="0" step="10000" />
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

        {/* ─── Section 4: LC Preview ────────────────────────── */}
        <div className={styles.section}>
          <h2>Cost Basis (Landed Cost Preview)</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Classification</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>¥ CNY</th>
                  <th style={{ textAlign: 'right' }}>W_charge (kg)</th>
                  <th style={{ textAlign: 'right' }}>LC / Unit</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) =>
                  g.variants.map((v, vi) => {
                    const lc = lcMap[g._id + '||' + v._variantLabel];
                    const isFirst = vi === 0;
                    return (
                      <tr key={g._id + vi} style={isFirst && g.variants.length > 1
                        ? { borderTop: '2px solid #e2e8f0' } : {}}>
                        {/* Product name cell — only on the FIRST variant row, spans all rows */}
                        {isFirst && (
                          <td rowSpan={g.variants.length} style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#0f172a',
                            verticalAlign: 'top',
                            paddingTop: '0.65rem',
                            borderRight: '1px solid #f1f5f9',
                            background: '#fafbff',
                            whiteSpace: 'nowrap',
                          }}>
                            {g.productName || '—'}
                          </td>
                        )}
                        {/* Variant label */}
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {v._variantLabel || <em style={{ color: '#cbd5e1' }}>—</em>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.sku || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{v.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{fmtCny(v.unitPriceCny)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {lc ? (Number(lc.chargeableWeightKg) || 0).toFixed(3) : '0.000'} kg
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                          {lc ? fmt(lc.landedCostUnit) : '—'} ₫
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className={styles.summary} style={{ marginTop: 16 }}>
            <div className={styles.summaryRow}>
              <span>Total Goods Value:</span>
              <span>{fmt(summary.totalValueVnd)} ₫ ({fmtCny(summary.totalValueCny)})</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Chargeable Weight:</span>
              <span>{(Number(summary.totalChargeableKg) || 0).toFixed(3)} kg</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Intl Ship + VN Ship:</span>
              <span style={{ color: '#7c3aed' }}>{fmt(summary.intlShippingVnd + summary.vnDomesticVnd)} ₫</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Buying Fee + CN Ship + Packaging:</span>
              <span style={{ color: '#2563eb' }}>{fmt(summary.buyingFeeVnd + summary.cnDomesticVnd + summary.packagingVnd)} ₫</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total Landed Cost:</span>
              <strong style={{ color: '#e38c00', fontSize: 18 }}>{fmt(summary.finalAmount)} ₫</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary}
            onClick={() => navigate('/erp/purchase-orders')}>Cancel</button>
          <button type="submit" className={styles.btnPrimary}>Create Purchase Order</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchaseOrderPage;
