import React, { useEffect, useState, useCallback } from 'react';
import { X, Save, Pencil, AlertTriangle, Send, XCircle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPurchaseOrderById,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  fetchSuppliers,
  clearCurrentPurchaseOrder,
  fetchExchangeRate,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import drawerStyles from '@assets/styles/erp/EditPODrawer.module.css';
import formStyles from '@assets/styles/erp/CreatePurchaseOrderPage.module.css';
import { TIER_TYPES, TIER_TYPE_KEYS, CUSTOM_OPTION } from '../../constants/tierTypes';

/* ────────────────────────────────────────────────────────────────────
   Utilities (shared with EditPurchaseOrderPage)
   ──────────────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0));
const fmtVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

/** Label with tooltip (?) — hover to see fee explanation */
const LabelWithTooltip = ({ children, tooltip }) => (
  <span className={formStyles.labelWithTooltip}>
    {children}
    <span className={formStyles.tooltipIcon} title={tooltip}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  </span>
);

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
  weightKg: 0,
  dimLength: 0,
  dimWidth: 0,
  dimHeight: 0,
});

/* ── Cartesian product ── */
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

/* ── Tier Row ── */
const MAX_OPTIONS = 20;

const TierRow = ({ tier, usedTypes, onChangeType, onChangeOptions, onRemove, s, readOnly }) => {
  const tierDef = TIER_TYPES[tier.type];
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
    newOpts[i] =
      val === CUSTOM_OPTION ? { value: '', isCustom: true } : { value: val, isCustom: false };
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
          disabled={readOnly}
        >
          <option value="">-- Select classification type --</option>
          {availableTypes.map((k) => (
            <option key={k} value={k}>
              {TIER_TYPES[k].nameEn} ({TIER_TYPES[k].name})
            </option>
          ))}
        </select>
        {!readOnly && (
          <button type="button" className={s.btnRemoveTier} onClick={onRemove}>
            ✕
          </button>
        )}
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
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              ) : (
                <select
                  className={s.optionSelect}
                  value={opt.value}
                  onChange={(e) => handleOptionSelect(i, e.target.value)}
                  disabled={readOnly}
                >
                  <option value="">-- Select {tierDef.nameEn.toLowerCase()} --</option>
                  {tierDef.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>✏️ Other (manual entry)</option>
                </select>
              )}
              {!readOnly && tier.options.length > 1 && (
                <button type="button" className={s.btnRemoveOpt} onClick={() => removeOption(i)}>
                  ×
                </button>
              )}
            </div>
          ))}
          {!readOnly && tier.options.length < MAX_OPTIONS && (
            <button type="button" className={s.btnAddOption} onClick={addOption}>
              + Add option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** Stage 1 cost basis only — Goods Value + Buying Fee. Stage 2 costs entered when receiving. */
function computeStage1Summary(groups, importConfig) {
  const rate = parseFloat(importConfig.exchangeRate) || 3500;
  const buyingRate = (parseFloat(importConfig.buyingServiceFeeRate) || 0) / 100;
  const totalValueVnd = groups
    .flatMap((g) => g.variants)
    .reduce((s, v) => s + Number(v.unitPriceCny) * rate * Number(v.quantity), 0);
  const buyingFeeVnd = totalValueVnd * buyingRate;
  return {
    totalValueVnd,
    buyingFeeVnd,
    costBasisVnd: totalValueVnd + buyingFeeVnd,
  };
}

/* ────────────────────────────────────────────────────────────────────
   ProductGroup — Tier-select UX identical to CreatePurchaseOrderPage
   ──────────────────────────────────────────────────────────────────── */
const ProductGroup = ({ group, index, exchangeRate, onUpdate, onRemove, readOnly }) => {
  const [showDim, setShowDim] = useState(false);
  const s = formStyles;
  const { productName, tiers = [], variants } = group;

  const updateProductName = (name) => {
    onUpdate({
      ...group,
      productName: name,
      variants: variants.map((v) => ({ ...v, sku: genSKU(name, v._variantLabel) })),
    });
  };

  /* ── Tier helpers ── */
  const updateTiers = (newTiers) => {
    onUpdate({
      ...group,
      tiers: newTiers,
      variants: generateVariants(newTiers, variants, productName),
    });
  };
  const addTier = () => updateTiers([...tiers, EMPTY_TIER()]);
  const updateTier = (i, patch) =>
    updateTiers(tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const removeTier = (i) => updateTiers(tiers.filter((_, idx) => idx !== i));

  /* ── Variant helpers ── */
  const updateVariant = (vi, field, value) => {
    onUpdate({
      ...group,
      variants: variants.map((v, i) => (i === vi ? { ...v, [field]: value } : v)),
    });
  };
  const autoFillWeight = (vi) => {
    const src = variants[vi];
    onUpdate({
      ...group,
      variants: variants.map((v) => ({
        ...v,
        weightKg: src.weightKg,
        dimLength: src.dimLength,
        dimWidth: src.dimWidth,
        dimHeight: src.dimHeight,
      })),
    });
  };

  return (
    <div className={s.productGroup}>
      <div className={s.pgHeader}>
        <h3 className={s.pgTitle}>📦 Product #{index + 1}</h3>
        {!readOnly && (
          <button type="button" className={s.btnRemove} onClick={onRemove}>
            ✕
          </button>
        )}
      </div>

      <div className={s.formGroup} style={{ marginBottom: 16 }}>
        <label>
          Product Name <span className={s.required}>*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Guangzhou Fashion Leather Backpack"
          value={productName}
          onChange={(e) => updateProductName(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
        />
      </div>

      {/* Tiers (classification) */}
      <div className={s.tiersSection}>
        <div className={s.tiersSectionHeader}>
          <span className={s.tiersLabel}>🏷️ Classification (optional)</span>
          {!readOnly && tiers.length < 3 && (
            <button type="button" className={s.btnAddTier} onClick={addTier}>
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
              s={s}
              readOnly={readOnly}
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

      <div className={s.variantsSection}>
        <p className={s.variantHint}>
          {tiers.length === 0
            ? 'No classification — enter information below'
            : `${variants.length} variants auto-generated from classification`}
        </p>
        <label className={s.dimToggle}>
          <input type="checkbox" checked={showDim} onChange={(e) => setShowDim(e.target.checked)} />
          &nbsp;📐 Box dimensions (L×W×H/6000)
          <span className={s.dimToggleHint}>&nbsp;— leave blank if using actual weight</span>
        </label>

        <div className={s.tableContainer}>
          <table className={s.variantTable}>
            <thead>
              <tr>
                <th>Classification</th>
                <th>
                  SKU <span className={s.autoTag}>auto</span>
                </th>
                <th>Qty</th>
                <th>Price (¥)</th>
                <th>Amount</th>
                <th>KG</th>
                {showDim && <th>L×W×H (cm)</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, vi) => (
                <tr key={vi}>
                  <td className={s.variantLabel}>
                    {v._variantLabel || <em style={{ color: '#aaa' }}>—</em>}
                  </td>
                  <td>
                    <input
                      className={s.skuInput}
                      value={v.sku}
                      onChange={(e) => updateVariant(vi, 'sku', e.target.value.toUpperCase())}
                      placeholder="AUTO"
                      disabled={readOnly}
                      readOnly={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className={s.numInput}
                      value={v.quantity}
                      onChange={(e) => updateVariant(vi, 'quantity', e.target.value)}
                      disabled={readOnly}
                      readOnly={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className={s.numInput}
                      value={v.unitPriceCny}
                      onChange={(e) => updateVariant(vi, 'unitPriceCny', e.target.value)}
                      disabled={readOnly}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className={s.calcCell}>
                    {fmt(Number(v.unitPriceCny) * exchangeRate * Number(v.quantity))} ₫
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={s.numInput}
                      style={{ width: 55 }}
                      value={v.weightKg}
                      onChange={(e) => updateVariant(vi, 'weightKg', e.target.value)}
                      disabled={readOnly}
                      readOnly={readOnly}
                    />
                  </td>
                  {showDim && (
                    <td>
                      <div className={s.dimRow}>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className={s.dimInput}
                          value={v.dimLength}
                          onChange={(e) => updateVariant(vi, 'dimLength', e.target.value)}
                          placeholder="L"
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className={s.dimInput}
                          value={v.dimWidth}
                          onChange={(e) => updateVariant(vi, 'dimWidth', e.target.value)}
                          placeholder="W"
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className={s.dimInput}
                          value={v.dimHeight}
                          onChange={(e) => updateVariant(vi, 'dimHeight', e.target.value)}
                          placeholder="H"
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </td>
                  )}
                  <td>
                    {!readOnly && vi === 0 && variants.length > 1 && (
                      <button
                        type="button"
                        className={s.btnCopyDim}
                        onClick={() => autoFillWeight(vi)}
                        title="Copy kg/dim to all"
                      >
                        ↓
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

/* ────────────────────────────────────────────────────────────────────
   EditPODrawer — slide-over panel
   Props:
     poId      {string}    — ID of the PO to edit
     onClose   {function}  — called when drawer is dismissed
     onSaved   {function}  — called after successful save (passes updated PO)
   ──────────────────────────────────────────────────────────────────── */
const EditPODrawer = ({ poId, onClose, onSaved, onSubmitted, onCancelled }) => {
  const dispatch = useDispatch();
  const {
    currentPurchaseOrder: po,
    loading,
    suppliers,
    exchangeRate: liveRate,
  } = useSelector((s) => s.erp);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [importConfig, setImportConfig] = useState({
    exchangeRate: 3500,
    buyingServiceFeeRate: 0,
    useVolumetricShipping: true,
  });

  const [groups, setGroups] = useState([EMPTY_GROUP()]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null); // null | 'submit' | 'cancel'
  const [cancelReason, setCancelReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  /* ── Lock body scroll while drawer is open ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /* ── Escape key closes drawer ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  /* ── Load PO & suppliers ── */
  useEffect(() => {
    dispatch(fetchPurchaseOrderById(poId));
    dispatch(fetchSuppliers({ limit: 100 }));
    dispatch(fetchExchangeRate());
    return () => {
      dispatch(clearCurrentPurchaseOrder());
    };
  }, [dispatch, poId]);

  /* ── Pre-fill form ── */
  useEffect(() => {
    if (!po || po._id !== poId) {
      return;
    }

    setSupplierId(po.supplierId?._id || po.supplierId || '');
    setNotes(po.notes || '');
    if (po.expectedDeliveryDate) {
      setExpectedDeliveryDate(new Date(po.expectedDeliveryDate).toISOString().split('T')[0]);
    }
    if (po.importConfig) {
      setImportConfig({
        exchangeRate: po.importConfig.exchangeRate || 3500,
        buyingServiceFeeRate: (po.importConfig.buyingServiceFeeRate || 0) * 100,
        useVolumetricShipping: po.importConfig.useVolumetricShipping ?? true,
      });
    }
    if (po.items?.length) {
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
          weightKg: item.weightKg || 0,
          dimLength: item.dimLength || 0,
          dimWidth: item.dimWidth || 0,
          dimHeight: item.dimHeight || 0,
          _productId: item.productId || null,
          _modelId: item.modelId || null,
        });
      });
      setGroups([...groupMap.values()]);
    }
  }, [po, poId]);

  const updateGroup = useCallback(
    (idx, updated) => setGroups((prev) => prev.map((g, i) => (i === idx ? updated : g))),
    []
  );
  const removeGroup = useCallback(
    (idx) => setGroups((prev) => prev.filter((_, i) => i !== idx)),
    []
  );

  const rate = parseFloat(importConfig.exchangeRate) || 3500;
  const summary = computeStage1Summary(groups, importConfig);
  const isLocked = po?.status === 'ORDERED' || po?.status === 'ARRIVED_VN';

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (!supplierId) {
      errs.supplierId = 'Please select a supplier';
    }
    if (!expectedDeliveryDate) {
      errs.expectedDeliveryDate = 'Please enter delivery date';
    }
    groups.forEach((g, gi) => {
      if (!g.productName.trim()) {
        errs[`g${gi}_name`] = 'Product name required';
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

  /* ── Build payload ── */
  const buildUpdateData = (extraFields = {}) => {
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
          weightKg: parseFloat(v.weightKg) || 0,
          dimLength: parseFloat(v.dimLength) || 0,
          dimWidth: parseFloat(v.dimWidth) || 0,
          dimHeight: parseFloat(v.dimHeight) || 0,
          ...(v._productId ? { productId: v._productId } : {}),
          ...(v._modelId ? { modelId: v._modelId } : {}),
        };
      })
    );
    return {
      supplierId,
      expectedDeliveryDate,
      notes,
      taxAmount: parseFloat(po?.taxAmount) ?? 0,
      otherCost: parseFloat(po?.otherCost) ?? 0,
      importConfig: {
        exchangeRate: parseFloat(importConfig.exchangeRate) || 3500,
        buyingServiceFeeRate: (parseFloat(importConfig.buyingServiceFeeRate) || 0) / 100,
        shippingRatePerKg: parseFloat(po?.importConfig?.shippingRatePerKg) ?? 0,
        useVolumetricShipping: importConfig.useVolumetricShipping ?? true,
      },
      fixedCosts: {
        cnDomesticShippingCny: parseFloat(po?.fixedCosts?.cnDomesticShippingCny) ?? 0,
        packagingCostVnd: parseFloat(po?.fixedCosts?.packagingCostVnd) ?? 0,
        vnDomesticShippingVnd: parseFloat(po?.fixedCosts?.vnDomesticShippingVnd) ?? 0,
      },
      items,
      ...extraFields,
    };
  };

  /* ── Save draft ── */
  const handleSave = async () => {
    setSubmitError('');
    if (!validate()) {
      return;
    }
    setSaving(true);
    try {
      const result = await dispatch(
        updatePurchaseOrder({ id: poId, updateData: buildUpdateData() })
      ).unwrap();
      onSaved?.(result);
      onClose();
    } catch (err) {
      setSubmitError(err.message || err.error || 'Cannot update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Show inline submit confirmation ── */
  const handleSaveAndSubmit = () => {
    setSubmitError('');
    if (!validate()) {
      return;
    }
    setConfirmMode('submit');
  };

  /* ── Confirm submit (after inline panel OK) ── */
  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await dispatch(
        updatePurchaseOrder({ id: poId, updateData: buildUpdateData({ status: 'ORDERED' }) })
      ).unwrap();
      onSubmitted?.(result);
      onClose();
    } catch (err) {
      setConfirmMode(null);
      setSubmitError(err.message || err.error || 'Cannot submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Show inline cancel confirmation ── */
  const handleCancel = () => {
    setCancelReason('');
    setSubmitError('');
    setConfirmMode('cancel');
  };

  /* ── Confirm cancel (after inline panel OK) ── */
  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      return;
    }
    setCancelling(true);
    try {
      await dispatch(cancelPurchaseOrder({ id: poId, cancelReason: cancelReason.trim() })).unwrap();
      onCancelled?.();
      onClose();
    } catch (err) {
      setConfirmMode(null);
      setSubmitError(err.message || err.error || 'Cannot cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const s = formStyles;
  const d = drawerStyles;

  return createPortal(
    <>
      {/* ── Overlay ── */}
      <div className={d.overlay} onClick={onClose} />

      {/* ── Drawer Panel ── */}
      <div className={d.drawer} role="dialog" aria-modal="true" aria-label="Edit Purchase Order">
        {/* Header */}
        <div className={d.drawerHeader}>
          <div className={d.drawerHeaderLeft}>
            <div className={d.drawerIcon}>
              <Pencil size={16} />
            </div>
            <div>
              <div className={d.drawerTitle}>Edit Purchase Order</div>
              <div className={d.drawerSubtitle}>
                <span className={d.drawerCodeBadge}>{po?.code || '...'}</span>
                <span>· {isLocked ? 'Only Notes and Expected Date editable' : 'Draft: full edit'} </span>
              </div>
            </div>
          </div>
          <button className={d.drawerCloseBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={d.drawerBody}>
          {loading && !po ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingSpinner />
            </div>
          ) : po ? (
            <>
              {/* Edit banner */}
              <div className={d.editBanner}>
                <AlertTriangle size={15} />
                <span>
                  Changes are not saved immediately. Press <strong>Save Draft</strong> at the
                  bottom.
                </span>
              </div>

              {submitError && (
                <div className={d.errorBanner}>
                  <AlertTriangle size={15} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Basic information */}
              <div className={s.section}>
                <h2>Basic Information</h2>
                <div className={s.formGrid}>
                  <div className={s.formGroup}>
                    <label>
                      Supplier <span className={s.required}>*</span>
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      disabled={isLocked}
                    >
                      <option value="">-- Select --</option>
                      {(suppliers || []).map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplierId && <span className={s.errorText}>{errors.supplierId}</span>}
                  </div>
                  <div className={s.formGroup}>
                    <label>
                      Expected Delivery Date <span className={s.required}>*</span>
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    />
                    {errors.expectedDeliveryDate && (
                      <span className={s.errorText}>{errors.expectedDeliveryDate}</span>
                    )}
                  </div>
                  <div className={s.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional info..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* ── Import Config (Stage 1 only: Exchange Rate + Buying Fee) ── */}
              <div className={s.configSection}>
                <h2>⚙️ Import Configuration</h2>
                <p className={s.hint} style={{ marginBottom: '0.75rem' }}>
                  Shipping and fees are entered when goods arrive (Stage 2).
                </p>
                <div className={s.formGrid3}>
                  <div className={s.formGroup}>
                    <label>
                      <LabelWithTooltip tooltip="Exchange rate 1 ¥ (CNY) to VND. Used to convert goods value to VND.">
                        Exchange Rate ¥ → VND
                      </LabelWithTooltip>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={importConfig.exchangeRate}
                      onChange={(e) =>
                        setImportConfig((c) => ({ ...c, exchangeRate: e.target.value }))
                      }
                      placeholder="3500"
                      disabled={isLocked}
                      readOnly={isLocked}
                    />
                    {!isLocked && liveRate?.rate ? (
                      <span className={s.rateHint}>
                        Live: <strong>{Number(liveRate.rate).toLocaleString('vi-VN')}</strong> ₫/¥
                        {Number(importConfig.exchangeRate) !== liveRate.rate && (
                          <button
                            type="button"
                            className={s.rateSyncBtn}
                            onClick={() =>
                              setImportConfig((c) => ({ ...c, exchangeRate: liveRate.rate }))
                            }
                          >
                            ↻ Use
                          </button>
                        )}
                      </span>
                    ) : liveRate?.rate ? (
                      <span className={s.rateHint}>
                        Live: <strong>{Number(liveRate.rate).toLocaleString('vi-VN')}</strong> ₫/¥
                      </span>
                    ) : (
                      <span className={s.hint}>VND/¥</span>
                    )}
                  </div>
                  <div className={s.formGroup}>
                    <label>
                      <LabelWithTooltip tooltip="Buying service fee (%). Applied to total goods value in VND. E.g. 5% = enter 5.">
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
                      disabled={isLocked}
                      readOnly={isLocked}
                    />
                  </div>
                </div>
              </div>

              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h2 style={{ marginBottom: 0 }}>
                    Products
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: '#94a3b8',
                        textTransform: 'none',
                        letterSpacing: 0,
                        marginLeft: 6,
                      }}
                    >
                      ({groups.reduce((sum, g) => sum + g.variants.length, 0)} SKUs)
                    </span>
                  </h2>
                  {!isLocked && (
                    <button
                      type="button"
                      className={s.btnSecondary}
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={() => setGroups((p) => [...p, EMPTY_GROUP()])}
                    >
                      + New Group
                    </button>
                  )}
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
                    readOnly={isLocked}
                  />
                ))}
              </div>

              <div className={s.section}>
                <h2>Cost Basis (Stage 1)</h2>
                <div className={s.summary}>
                  <div className={s.summaryRow}>
                    <span>Goods Value</span>
                    <strong>{fmtVnd(summary.totalValueVnd)}</strong>
                  </div>
                  {summary.buyingFeeVnd > 0 && (
                    <div className={s.summaryRow}>
                      <span>Buying Fee</span>
                      <span>{fmtVnd(summary.buyingFeeVnd)}</span>
                    </div>
                  )}
                  <div className={`${s.summaryRow} ${s.total}`}>
                    <span>Cost Basis — Payment 1</span>
                    <strong>{fmtVnd(summary.costBasisVnd)}</strong>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ── Inline confirmation panels ── */}
        {confirmMode === 'submit' && (
          <div className={d.confirmPanel} data-variant="submit">
            <div className={d.confirmIcon}>
              <Send size={18} />
            </div>
            <div className={d.confirmContent}>
              <p className={d.confirmTitle}>Submit this order?</p>
              <p className={d.confirmDesc}>
                Status will change to <strong>Ordered</strong>. You can still cancel later.
              </p>
            </div>
            <div className={d.confirmActions}>
              <button
                type="button"
                className={d.confirmDismiss}
                onClick={() => setConfirmMode(null)}
                disabled={submitting}
              >
                Go Back
              </button>
              <button
                type="button"
                className={d.confirmOk}
                data-variant="submit"
                onClick={confirmSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={13} className={d.spinIcon} /> : <Send size={13} />}
                {submitting ? 'Submitting…' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        )}

        {confirmMode === 'cancel' && (
          <div className={d.confirmPanel} data-variant="cancel">
            <div className={d.confirmIcon}>
              <XCircle size={18} />
            </div>
            <div className={d.confirmContent}>
              <p className={d.confirmTitle}>Cancel this order?</p>
              <textarea
                className={d.confirmTextarea}
                placeholder="Reason for cancellation (required)…"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                autoFocus
              />
            </div>
            <div className={d.confirmActions}>
              <button
                type="button"
                className={d.confirmDismiss}
                onClick={() => setConfirmMode(null)}
                disabled={cancelling}
              >
                Go Back
              </button>
              <button
                type="button"
                className={d.confirmOk}
                data-variant="cancel"
                onClick={confirmCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? <Loader2 size={13} className={d.spinIcon} /> : <XCircle size={13} />}
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={d.drawerFooter}>
          <button
            type="button"
            className={d.btnCancelOrder}
            onClick={handleCancel}
            disabled={saving || submitting || cancelling || !!confirmMode || !po}
          >
            <XCircle size={13} />
            Cancel Order
          </button>
          <div className={d.drawerFooterRight}>
            <button
              type="button"
              className={s.btnSecondary}
              onClick={onClose}
              disabled={saving || submitting || cancelling}
            >
              Close
            </button>
            <button
              type="button"
              className={s.btnPrimary}
              onClick={handleSave}
              disabled={saving || submitting || cancelling || !!confirmMode || !po}
            >
              {saving ? <Loader2 size={14} className={d.spinIcon} /> : <Save size={14} />}
              {saving ? 'Saving...' : isLocked ? 'Save Changes' : 'Save Draft'}
            </button>
            {!isLocked && (
              <button
                type="button"
                className={d.btnSubmitOrder}
                onClick={handleSaveAndSubmit}
                disabled={saving || submitting || cancelling || !!confirmMode || !po}
              >
                <Send size={14} />
                Submit Order
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default EditPODrawer;
