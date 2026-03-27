import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchPurchaseOrderById,
  updatePurchaseOrder,
  fetchSuppliers,
  clearCurrentPurchaseOrder,
  fetchExchangeRate,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/CreatePurchaseOrderPage.module.css';
import inventoryService from '../../services/api/inventoryService';
import { TIER_TYPES, TIER_TYPE_KEYS, CUSTOM_OPTION, buildTierSelectOptions } from '../../constants/tierTypes';

/* ────────────────────────────────────────────────────────────────────
   Utilities
   ──────────────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0));
const fmtVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

/** Label with tooltip (?) — hover to see fee explanation */
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

LabelWithTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  tooltip: PropTypes.string.isRequired,
};

const genSKU = (productName = '', variantLabel = '') => {
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
  return slug(productName || 'SP') + (variantLabel ? `-${slug(variantLabel).slice(0, 8)}` : '');
};

const makeVariant = (label, productName) => ({
  _variantLabel: label,
  sku: genSKU(productName, label),
  quantity: 1,
  unitPriceCny: 0,
});

/* ── Cartesian product of arrays ── */
const cartesian = (...arrays) =>
  arrays.reduce((acc, arr) => acc.flatMap((x) => arr.map((y) => [...x, y])), [[]]);

/* ── Generate variants from tiers ── */
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

const EMPTY_TIER = () => ({ type: '', options: [{ value: '', isCustom: false }] });

const EMPTY_GROUP = () => ({
  _id: Math.random().toString(36).slice(2),
  productName: '',
  tiers: [],
  variants: [makeVariant('', '')],
});

/* ── Tier Row (shared select UI) ── */
const MAX_OPTIONS = 20;

const TierRow = ({ tier, usedTypes, onChangeType, onChangeOptions, onRemove }) => {
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
    <div className={styles.tierRow}>
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

TierRow.propTypes = {
  tier: PropTypes.shape({
    type: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        isCustom: PropTypes.bool,
      })
    ).isRequired,
  }).isRequired,
  usedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeType: PropTypes.func.isRequired,
  onChangeOptions: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

/* ────────────────────────────────────────────────────────────────────
   SVG Icons
   ──────────────────────────────────────────────────────────────────── */
const ChevRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    width="12"
    height="12"
  >
    <path
      fillRule="evenodd"
      d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    width="16"
    height="16"
  >
    <path d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5ZM10 8a1 1 0 0 1 1 1v2.586l.793-.793a1 1 0 1 1 1.414 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414l.793.793V9a1 1 0 0 1 1-1Z" />
  </svg>
);

const WarnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    width="16"
    height="16"
  >
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      clipRule="evenodd"
    />
  </svg>
);

/* ────────────────────────────────────────────────────────────────────
   ProductGroup — identical Tier-select UX as CreatePurchaseOrderPage
   ──────────────────────────────────────────────────────────────────── */
const ProductGroup = ({ group, index, exchangeRate, onUpdate, onRemove }) => {
  const { productName, tiers = [], variants } = group;
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
          // ignore error
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

  const updateProductName = (name) => {
    const newVariants = variants.map((v) => ({ ...v, sku: genSKU(name, v._variantLabel) }));
    onUpdate({ ...group, productName: name, variants: newVariants });
  };

  /* ──── Tier helpers ──── */
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

  /* ──── Variant helpers ──── */
  const updateVariant = (vi, field, value) => {
    const newVariants = variants.map((v, i) => (i === vi ? { ...v, [field]: value } : v));
    onUpdate({ ...group, variants: newVariants });
  };

  return (
    <div className={styles.productGroup}>
      {/* Group Header */}
      <div className={styles.pgHeader}>
        <h3 className={styles.pgTitle}>📦 Product #{index + 1}</h3>
        <button type="button" className={styles.btnRemove} onClick={onRemove} title="Remove group">
          ✕
        </button>
      </div>

      {/* Product Name */}
      <div className={styles.formGroup} style={{ marginBottom: 16 }}>
        <label>
          Product Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Fashion Leather Backpack"
          value={productName}
          onChange={(e) => updateProductName(e.target.value)}
        />
      </div>

      {/* Tiers (classification) */}
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
            ? 'No classification — enter info below'
            : `${variants.length} variants auto-generated from classification`}
        </p>

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

/* ────────────────────────────────────────────────────────────────────
   Cost Summary
   ──────────────────────────────────────────────────────────────────── */
function computeSummary(groups, importConfig, fixedCosts, taxAmount, otherCost, totalWeightKg = 0) {
  const rate = parseFloat(importConfig.exchangeRate) || 3500;
  const buyingRate = (parseFloat(importConfig.buyingServiceFeeRate) || 0) / 100;
  const shippingRateKg = parseFloat(importConfig.shippingRatePerKg) || 0;

  const totalValueVnd = groups
    .flatMap((g) => g.variants)
    .reduce((s, v) => s + Number(v.unitPriceCny) * rate * Number(v.quantity), 0);

  const buyingFeeVnd = totalValueVnd * buyingRate;
  const cnShipVnd = (parseFloat(fixedCosts.cnDomesticShippingCny) || 0) * rate;
  const packVnd = parseFloat(fixedCosts.packagingCostVnd) || 0;
  const vnShipVnd = parseFloat(fixedCosts.vnDomesticShippingVnd) || 0;
  const intlShipVnd = (Number(totalWeightKg) || 0) * shippingRateKg;
  const tax = parseFloat(taxAmount) || 0;
  const other = parseFloat(otherCost) || 0;

  return {
    totalValueVnd,
    buyingFeeVnd,
    cnShipVnd,
    packVnd,
    vnShipVnd,
    intlShipVnd,
    tax,
    other,
    totalWeightKg: Number(totalWeightKg) || 0,
    finalAmount: totalValueVnd + buyingFeeVnd + cnShipVnd + packVnd + vnShipVnd + intlShipVnd + tax + other,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Main Edit Page
   ──────────────────────────────────────────────────────────────────── */
const EditPurchaseOrderPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentPurchaseOrder: po,
    loading,
    suppliers,
    exchangeRate: liveRate,
  } = useSelector((s) => s.erp);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  const [importConfig, setImportConfig] = useState({
    exchangeRate: 3500,
    buyingServiceFeeRate: 0, // shown as % in UI
    shippingRatePerKg: 0,
    useVolumetricShipping: true,
  });

  const [fixedCosts, setFixedCosts] = useState({
    cnDomesticShippingCny: 0,
    packagingCostVnd: 0,
    vnDomesticShippingVnd: 0,
  });

  const [groups, setGroups] = useState([EMPTY_GROUP()]);
  const [totalWeightKg, setTotalWeightKg] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  /* ── Load ── */
  useEffect(() => {
    dispatch(fetchPurchaseOrderById(id));
    dispatch(fetchSuppliers({ limit: 100 }));
    dispatch(fetchExchangeRate());
    return () => {
      dispatch(clearCurrentPurchaseOrder());
    };
  }, [dispatch, id]);

  /* ── Pre-fill ── */
  useEffect(() => {
    if (!po) {
      return;
    }
    if (po.status !== 'Draft') {
      navigate(`/seller/erp/purchase-orders/${id}`, { replace: true });
      return;
    }

    setSupplierId(po.supplierId?._id || po.supplierId || '');
    setNotes(po.notes || '');
    setTaxAmount(po.taxAmount || 0);
    setOtherCost(po.otherCost || 0);
    setTotalWeightKg(po.totalWeightKg || 0);

    if (po.expectedDeliveryDate) {
      setExpectedDeliveryDate(new Date(po.expectedDeliveryDate).toISOString().split('T')[0]);
    }

    if (po.importConfig) {
      setImportConfig({
        exchangeRate: po.importConfig.exchangeRate || 3500,
        buyingServiceFeeRate: (po.importConfig.buyingServiceFeeRate || 0) * 100,
        shippingRatePerKg: po.importConfig.shippingRatePerKg || 0,
        useVolumetricShipping: po.importConfig.useVolumetricShipping ?? true,
      });
    }

    if (po.fixedCosts) {
      setFixedCosts({
        cnDomesticShippingCny: po.fixedCosts.cnDomesticShippingCny || 0,
        packagingCostVnd: po.fixedCosts.packagingCostVnd || 0,
        vnDomesticShippingVnd: po.fixedCosts.vnDomesticShippingVnd || 0,
      });
    }

    if (po.items?.length) {
      /* Group flat items by productName — keep tiers empty so user can optionally reconfigure */
      const groupMap = new Map();
      po.items.forEach((item) => {
        const key = item.productName?.trim() || 'Product';
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            _id: Math.random().toString(36).slice(2),
            productName: key,
            tiers: [],
            variants: [],
          });
        }
        groupMap.get(key).variants.push({
          _variantLabel: item.variantName || '',
          sku: item.sku || '',
          quantity: item.quantity || 1,
          unitPriceCny: item.unitPriceCny || 0,
          _productId: item.productId || null,
          _modelId: item.modelId || null,
        });
      });
      setGroups([...groupMap.values()]);
    }
  }, [po, id, navigate]);

  const updateGroup = useCallback(
    (idx, updated) => setGroups((prev) => prev.map((g, i) => (i === idx ? updated : g))),
    []
  );
  const removeGroup = useCallback(
    (idx) => setGroups((prev) => prev.filter((_, i) => i !== idx)),
    []
  );

  const rate = parseFloat(importConfig.exchangeRate) || 3500;
  const summary = computeSummary(groups, importConfig, fixedCosts, taxAmount, otherCost, totalWeightKg);

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (!supplierId) {
      errs.supplierId = 'Please select a supplier';
    }
    if (!expectedDeliveryDate) {
      errs.expectedDeliveryDate = 'Please select a delivery date';
    }
    groups.forEach((g, gi) => {
      if (!g.productName.trim()) {
        errs[`g${gi}_name`] = 'Product name cannot be empty';
      }
      g.variants.forEach((v, vi) => {
        if (!v.sku.trim()) {
          errs[`g${gi}v${vi}_sku`] = 'SKU empty';
        }
        if (!v.quantity || v.quantity < 1) {
          errs[`g${gi}v${vi}_qty`] = 'Qty >= 1';
        }
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSubmitError('');
    if (!validate()) {
      return;
    }

    const items = groups.flatMap((g) =>
      g.variants.map((v) => {
        const priceVnd = (Number(v.unitPriceCny) || 0) * rate;
        return {
          sku: v.sku.trim().toUpperCase(),
          productName: g.productName.trim(),
          variantName: (v._variantLabel || '').trim(),
          quantity: parseInt(v.quantity) || 1,
          unitPriceCny: parseFloat(v.unitPriceCny) || 0,
          unitPrice: priceVnd,
          totalPrice: priceVnd * (parseInt(v.quantity) || 1),
          weightKg: 0,
          dimLength: 0,
          dimWidth: 0,
          dimHeight: 0,
          ...(v._productId ? { productId: v._productId } : {}),
          ...(v._modelId ? { modelId: v._modelId } : {}),
        };
      })
    );

    const updateData = {
      supplierId,
      expectedDeliveryDate,
      notes,
      taxAmount: parseFloat(taxAmount) || 0,
      otherCost: parseFloat(otherCost) || 0,
      totalWeightKg: parseFloat(totalWeightKg || 0),
      importConfig: {
        exchangeRate: parseFloat(importConfig.exchangeRate) || 3500,
        buyingServiceFeeRate: (parseFloat(importConfig.buyingServiceFeeRate) || 0) / 100,
        shippingRatePerKg: parseFloat(importConfig.shippingRatePerKg) || 0,
        useVolumetricShipping: importConfig.useVolumetricShipping,
      },
      fixedCosts: {
        cnDomesticShippingCny: parseFloat(fixedCosts.cnDomesticShippingCny) || 0,
        packagingCostVnd: parseFloat(fixedCosts.packagingCostVnd) || 0,
        vnDomesticShippingVnd: parseFloat(fixedCosts.vnDomesticShippingVnd) || 0,
      },
      items,
    };

    setSaving(true);
    try {
      await dispatch(updatePurchaseOrder({ id, updateData })).unwrap();
      navigate(`/seller/erp/purchase-orders/${id}`);
    } catch (err) {
      setSubmitError(err.message || err.error || 'Cannot update order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !po) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8',
        }}
      >
        <button onClick={() => navigate('/erp')} style={bcBtn}>
          ERP
        </button>
        <ChevRight />
        <button onClick={() => navigate('/seller/erp/purchase-orders')} style={bcBtn}>
          Purchase Orders
        </button>
        <ChevRight />
        <button onClick={() => navigate(`/seller/erp/purchase-orders/${id}`)} style={bcBtn}>
          {po.code}
        </button>
        <ChevRight />
        <span style={{ color: '#475569', fontWeight: 500 }}>Edit</span>
      </nav>

      {/* ── Page Header (reuse .header) ── */}
      <div className={styles.header}>
        <div>
          <h1>Edit Purchase Order</h1>
          <div className={styles.headerMeta}>
            <span style={draftBadge}>{po.code}</span>
            <span>·</span>
            <span>Can only edit when in Draft status</span>
          </div>
        </div>
      </div>

      {/* ── Edit Warning Banner ── */}
      <div style={editBannerStyle}>
        <WarnIcon />
        <span>
          You are <strong>editing</strong> order <strong>{po.code}</strong>. Click{' '}
          <strong>Save Changes</strong> at the bottom to save.
        </span>
      </div>

      {/* ── Submit Error ── */}
      {submitError && (
        <div style={errorBannerStyle}>
          <WarnIcon />
          <span>{submitError}</span>
        </div>
      )}

      {/* Basic information */}
      <div className={styles.section}>
        <h2>Basic Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>
              Supplier <span className={styles.required}>*</span>
            </label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">-- Select supplier --</option>
              {(suppliers || []).map((s) => (
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
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
            {errors.expectedDeliveryDate && (
              <span className={styles.errorText}>{errors.expectedDeliveryDate}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Import Tax (VND)</label>
            <input
              type="number"
              min="0"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Other Costs (VND)</label>
            <input
              type="number"
              min="0"
              value={otherCost}
              onChange={(e) => setOtherCost(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="More info about the order..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Import configuration */}
      <div className={styles.configSection}>
        <h2>⚙️ Guangzhou Import Configuration</h2>
        <h3>Exchange Rate & Fees</h3>
        <div className={styles.formGrid3}>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="Exchange rate 1 ¥ (CNY) to VND. Used to calculate import product prices in VND.">
                Exchange Rate ¥ CNY → VND
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={importConfig.exchangeRate}
              onChange={(e) => setImportConfig((c) => ({ ...c, exchangeRate: e.target.value }))}
              placeholder="3500"
            />
            {liveRate?.rate ? (
              <span className={styles.rateHint}>
                Live: <strong>{Number(liveRate.rate).toLocaleString('vi-VN')}</strong> ₫/¥
                {Number(importConfig.exchangeRate) !== liveRate.rate && (
                  <button
                    type="button"
                    className={styles.rateSyncBtn}
                    onClick={() => setImportConfig((c) => ({ ...c, exchangeRate: liveRate.rate }))}
                  >
                    ↻ Use
                  </button>
                )}
              </span>
            ) : (
              <span className={styles.hint}>Default: 3,500 VND/¥</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="Buying service / agent fee (%). Calculated on total goods value (VND). E.g. 5% = enter 5.">
                Buying Service Fee (%)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={importConfig.buyingServiceFeeRate}
              onChange={(e) =>
                setImportConfig((c) => ({ ...c, buyingServiceFeeRate: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="International shipping (CN → VN) per kg. Total shipping = Total weight × this rate.">
                Intl Shipping (VND/kg)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              value={importConfig.shippingRatePerKg}
              onChange={(e) =>
                setImportConfig((c) => ({ ...c, shippingRatePerKg: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="Total weight of shipment after packaging. Used to calculate international shipping cost.">
                Total weight after packaging (kg)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalWeightKg || ''}
              onChange={(e) => setTotalWeightKg(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <h3 style={{ marginTop: '1rem' }}>Fixed Costs</h3>
        <div className={styles.formGrid3}>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="CN domestic shipping (from CN warehouse to consolidation point). Unit: ¥ CNY.">
                CN Domestic Ship (¥ CNY)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              value={fixedCosts.cnDomesticShippingCny}
              onChange={(e) =>
                setFixedCosts((c) => ({ ...c, cnDomesticShippingCny: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="Wooden crate, insurance, packaging costs. Unit: VND.">
                Packaging / Insurance (VND)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              value={fixedCosts.packagingCostVnd}
              onChange={(e) => setFixedCosts((c) => ({ ...c, packagingCostVnd: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <LabelWithTooltip tooltip="VN domestic shipping (from VN warehouse to delivery point). Unit: VND.">
                VN Domestic Ship (VND)
              </LabelWithTooltip>
            </label>
            <input
              type="number"
              min="0"
              value={fixedCosts.vnDomesticShippingVnd}
              onChange={(e) =>
                setFixedCosts((c) => ({ ...c, vnDomesticShippingVnd: e.target.value }))
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Products list */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 style={{ marginBottom: 0 }}>
            Products List
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#94a3b8',
                textTransform: 'none',
                letterSpacing: 0,
                marginLeft: 8,
              }}
            >
              ({groups.reduce((s, g) => s + g.variants.length, 0)} SKU · {groups.length} groups)
            </span>
          </h2>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setGroups((p) => [...p, EMPTY_GROUP()])}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            + Add product group
          </button>
        </div>

        {groups.map((group, idx) => (
          <ProductGroup
            key={group._id}
            group={group}
            index={idx}
            exchangeRate={rate}
            onUpdate={(updated) => updateGroup(idx, updated)}
            onRemove={() => {
              if (groups.length > 1) {
                removeGroup(idx);
              }
            }}
          />
        ))}
      </div>

      {/* Cost estimate */}
      <div className={styles.section}>
        <h2>Cost Estimate</h2>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Subtotal (Est.)</span>
            <strong>{fmtVnd(summary.totalValueVnd)}</strong>
          </div>
          {summary.buyingFeeVnd > 0 && (
            <div className={styles.summaryRow}>
              <span>Buying Service Fee ({importConfig.buyingServiceFeeRate}%)</span>
              <span>{fmtVnd(summary.buyingFeeVnd)}</span>
            </div>
          )}
          {summary.cnShipVnd > 0 && (
            <div className={styles.summaryRow}>
              <span>CN Domestic Ship</span>
              <span>{fmtVnd(summary.cnShipVnd)}</span>
            </div>
          )}
          {summary.packVnd > 0 && (
            <div className={styles.summaryRow}>
              <span>Packaging / Insurance</span>
              <span>{fmtVnd(summary.packVnd)}</span>
            </div>
          )}
          {summary.intlShipVnd > 0 && (
            <div className={styles.summaryRow}>
              <span>Intl Shipping ({summary.totalWeightKg} kg)</span>
              <span>{fmtVnd(summary.intlShipVnd)}</span>
            </div>
          )}
          {summary.vnShipVnd > 0 && (
            <div className={styles.summaryRow}>
              <span>VN Domestic Ship</span>
              <span>{fmtVnd(summary.vnShipVnd)}</span>
            </div>
          )}
          {summary.tax > 0 && (
            <div className={styles.summaryRow}>
              <span>Import Tax</span>
              <span>{fmtVnd(summary.tax)}</span>
            </div>
          )}
          {summary.other > 0 && (
            <div className={styles.summaryRow}>
              <span>Other Costs</span>
              <span>{fmtVnd(summary.other)}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total Estimate</span>
            <strong>{fmtVnd(summary.finalAmount)}</strong>
          </div>
        </div>
      </div>

      {/* ── Sticky actions bar ── */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => navigate(`/seller/erp/purchase-orders/${id}`)}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
          <SaveIcon />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

/* ── Inline style constants ── */
const bcBtn = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: '0.8rem',
};
const draftBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.15rem 0.6rem',
  background: '#f1f5f9',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
};
const editBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1.125rem',
  background: 'linear-gradient(135deg,#fef3c7 0%,#fffbeb 100%)',
  border: '1px solid #fcd34d',
  borderLeft: '4px solid #d97706',
  borderRadius: '10px',
  marginBottom: '1rem',
  fontSize: '0.875rem',
  color: '#92400e',
};
const errorBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.875rem 1.125rem',
  background: '#fee2e2',
  border: '1px solid #fca5a5',
  borderLeft: '4px solid #dc2626',
  borderRadius: '10px',
  fontSize: '0.875rem',
  color: '#991b1b',
  marginBottom: '1rem',
};

ProductGroup.propTypes = {
  group: PropTypes.shape({
    productName: PropTypes.string,
    tiers: PropTypes.array,
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        sku: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unitPriceCny: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ).isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  exchangeRate: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default EditPurchaseOrderPage;
