import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { getVariantImageGroupTierIndex } from '../../../constants/tierTypes';
import styles from '../../../assets/styles/seller/VariantsTable.module.css';

const VariantsTable = ({ tiers, models, onChange, disabled, isEditMode = false, showShippingColumns = false }) => {
  const [bulkEdit, setBulkEdit] = useState({ price: '', costPrice: '', stock: '' });
  const [selectedRows, setSelectedRows] = useState(new Set());

  /* ── Helpers ──────────────────────────────────────────────── */
  const _getVariantLabel = (model) =>
    model.tierIndex.map((idx, tierIdx) => tiers[tierIdx]?.options[idx]?.value || '?').join(' / ');

  const getTierName = (tierIdx) => tiers[tierIdx]?.name || `Tier ${tierIdx + 1}`;

  /** Cột nhóm + ảnh: ưu tiên Color khi có cả nhiều tầng (cùng màu, nhiều size = chung ảnh). */
  const primaryGroupTierIndex = useMemo(
    () => getVariantImageGroupTierIndex(tiers),
    [tiers]
  );

  const hasTier1 = tiers.length >= 1;
  const hasMultipleTiers = tiers.length >= 2;

  /**
   * Group models by their tier-0 index.
   * Returns an array of { tier0Index, tier0Label, models: [{model, originalIndex}] }
   */
  const tier0Groups = useMemo(() => {
    if (!hasTier1 || models.length === 0) {
      return [];
    }

    const groupMap = new Map();
    models.forEach((model, originalIndex) => {
      const gIdx = model.tierIndex[primaryGroupTierIndex] ?? 0;
      if (!groupMap.has(gIdx)) {
        groupMap.set(gIdx, {
          tier0Index: gIdx,
          tier0Label: tiers[primaryGroupTierIndex]?.options[gIdx]?.value || `Option ${gIdx + 1}`,
          models: [],
        });
      }
      groupMap.get(gIdx).models.push({ model, originalIndex });
    });

    return Array.from(groupMap.values()).sort((a, b) => a.tier0Index - b.tier0Index);
  }, [tiers, models, hasTier1, primaryGroupTierIndex]);

  /**
   * Get the display image for a tier-0 group.
   * Priority: imagePreview (local upload) > image (server URL) from any model in group.
   */
  const getTier0Image = (group) => {
    for (const { model } of group.models) {
      if (model.imagePreview) {
return model.imagePreview;
}
      if (model.image) {
return model.image;
}
    }
    return null;
  };

  const stockClass = (qty) => {
    if (!qty || qty === 0) {
return styles.stockEmpty;
}
    if (qty < 5) {
return styles.stockLow;
}
    return styles.stockOk;
  };

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleModelChange = (index, field, value) => {
    const updated = [...models];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  /**
   * Upload image for an entire tier-0 group.
   * Propagate imageFile + imagePreview to ALL models sharing tier0Index.
   */
  const handleGroupImageUpload = (groupOptionIndex, e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      return alert('Please select an image file.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return alert('Image must be under 5 MB.');
    }

    const preview = URL.createObjectURL(file);
    const updated = models.map((model) => {
      if (model.tierIndex[primaryGroupTierIndex] === groupOptionIndex) {
        return { ...model, imageFile: file, imagePreview: preview };
      }
      return model;
    });
    onChange(updated);
  };

  /**
   * Remove image for an entire tier-0 group.
   */
  const handleGroupRemoveImage = (groupOptionIndex) => {
    // Revoke the preview URL once
    const firstWithPreview = models.find(
      (m) => m.tierIndex[primaryGroupTierIndex] === groupOptionIndex && m.imagePreview
    );
    if (firstWithPreview?.imagePreview) {
      URL.revokeObjectURL(firstWithPreview.imagePreview);
    }

    const updated = models.map((model) => {
      if (model.tierIndex[primaryGroupTierIndex] === groupOptionIndex) {
        return { ...model, imageFile: null, imagePreview: null, image: null };
      }
      return model;
    });
    onChange(updated);
  };

  const handleSelectRow = (index) => {
    const next = new Set(selectedRows);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelectedRows(next);
  };

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.size === models.length ? new Set() : new Set(models.map((_, i) => i))
    );
  };

  const handleBulkApply = () => {
    if (selectedRows.size === 0) {
return;
}
    const updated = models.map((model, index) => {
      if (!selectedRows.has(index)) {
return model;
}
      return {
        ...model,
        ...(bulkEdit.price && { price: parseFloat(bulkEdit.price) }),
        ...(bulkEdit.costPrice && { costPrice: parseFloat(bulkEdit.costPrice) }),
        ...(!isEditMode && bulkEdit.stock && { stock: parseInt(bulkEdit.stock) }),
      };
    });
    onChange(updated);
    setBulkEdit({ price: '', costPrice: '', stock: '' });
    setSelectedRows(new Set());
  };

  /* ── Guard states ─────────────────────────────────────────── */
  if (models.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          style={{ marginBottom: 8 }}
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <p style={{ margin: 0 }}>No variants yet — add options in the Tiers section above.</p>
      </div>
    );
  }

  if (models.length > 200) {
    return (
      <div className={styles.overLimit}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Too many variants ({models.length}). Maximum is 200 — please reduce tier options.
      </div>
    );
  }

  /* ── Render helper: Tier-0 group image cell (rowSpan) ────── */
  const renderTier0GroupCell = (group) => {
    const img = getTier0Image(group);
    const rowSpan = group.models.length;

    return (
      <td
        className={styles.tier0GroupCell}
        rowSpan={rowSpan}
      >
        <div className={styles.tier0Label}>{group.tier0Label}</div>
        {img ? (
          <div className={styles.imgThumb}>
            <img
              src={img}
              alt={group.tier0Label}
              className={styles.imgThumbImg}
            />
            <button
              type="button"
              className={styles.imgRemoveBtn}
              onClick={() => handleGroupRemoveImage(group.tier0Index)}
              disabled={disabled}
              aria-label="Remove image"
            >
              <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <label
            className={`${styles.imgUploadZone} ${disabled ? styles.imgUploadDisabled : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              className={styles.fileHidden}
              onChange={(e) => handleGroupImageUpload(group.tier0Index, e)}
              disabled={disabled}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </label>
        )}
      </td>
    );
  };

  /* ── Render helper: second-tier label for multi-tier ────── */
  const getSecondaryLabel = (model) => {
    if (!hasMultipleTiers) {
      return null;
    }
    const parts = [];
    for (let i = 0; i < tiers.length; i += 1) {
      if (i === primaryGroupTierIndex) {
continue;
}
      const idx = model.tierIndex[i];
      const val = tiers[i]?.options[idx]?.value;
      if (val != null && val !== '') {
parts.push(val);
}
    }
    return parts.join(' / ');
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className={styles.wrapper}>
      {/* Title + bulk toolbar */}
      <div className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Variants
          <span className={styles.countPill}>{models.length}</span>
          {selectedRows.size > 0 && (
            <span style={{ fontWeight: 400, color: '#f97316', fontSize: 11 }}>
              · {selectedRows.size} selected
            </span>
          )}
        </div>

        {selectedRows.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkLabel}>Bulk edit:</span>
            <input
              type="number"
              className={styles.bulkInput}
              placeholder="Price (₫)"
              value={bulkEdit.price}
              onChange={(e) => setBulkEdit({ ...bulkEdit, price: e.target.value })}
            />
            {!isEditMode && (
              <input
                type="number"
                className={styles.bulkInput}
                placeholder="Cost (₫)"
                value={bulkEdit.costPrice}
                onChange={(e) => setBulkEdit({ ...bulkEdit, costPrice: e.target.value })}
              />
            )}
            {!isEditMode && (
              <input
                type="number"
                className={styles.bulkInput}
                placeholder="Stock"
                style={{ width: 80 }}
                value={bulkEdit.stock}
                onChange={(e) => setBulkEdit({ ...bulkEdit, stock: e.target.value })}
              />
            )}
            <button className={styles.bulkApplyBtn} onClick={handleBulkApply}>
              Apply to {selectedRows.size}
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={styles.gridContainer}>
        <div className={styles.gridScroll}>
          <table className={styles.grid}>
            <thead>
              <tr>
                <th className={styles.colCheck}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedRows.size === models.length}
                    onChange={handleSelectAll}
                  />
                </th>
                {/* Tier 1 grouped column: label + image */}
                <th className={styles.colTier0}>
                  {hasTier1 ? (
                    <>
                      <span style={{ color: '#ef4444' }}>● </span>
                      {getTierName(primaryGroupTierIndex)}
                    </>
                  ) : (
                    'Image'
                  )}
                </th>
                {/* Show secondary tier column(s) only when multiple tiers */}
                {hasMultipleTiers && (
                  <th className={styles.colVar}>
                    {tiers
                      .map((t, i) => (i !== primaryGroupTierIndex ? t.name : null))
                      .filter(Boolean)
                      .join(' / ')}
                  </th>
                )}
                <th className={styles.colPrice}>
                  Price (₫) <span style={{ color: '#ef4444' }}>*</span>
                </th>
                <th className={styles.colCost}>
                  {isEditMode ? (
                    <span title="Managed via Inventory page">Cost (₫) 🔒</span>
                  ) : (
                    'Cost (₫)'
                  )}
                </th>
                <th className={styles.colStock}>
                  {isEditMode ? (
                    <span title="Managed via Inventory page">Stock 🔒</span>
                  ) : (
                    <>
                      Stock <span style={{ color: '#ef4444' }}>*</span>
                    </>
                  )}
                </th>
                <th className={styles.colSku}>SKU</th>
                {showShippingColumns && (
                  <>
                    <th>Weight (gr)</th>
                    <th>R×D×C (cm)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tier0Groups.map((group) =>
                group.models.map(({ model, originalIndex }, rowIdxInGroup) => (
                  <tr
                    key={originalIndex}
                    className={`${selectedRows.has(originalIndex) ? styles.rowSelected : ''} ${
                      rowIdxInGroup === 0 ? styles.tier0GroupFirstRow : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedRows.has(originalIndex)}
                        onChange={() => handleSelectRow(originalIndex)}
                      />
                    </td>

                    {/* Tier-0 group cell — only rendered on first row of group */}
                    {rowIdxInGroup === 0 && renderTier0GroupCell(group)}

                    {/* Secondary tier label (Size, etc.) — only when multi-tier */}
                    {hasMultipleTiers && (
                      <td>
                        <div className={styles.varLabel}>{getSecondaryLabel(model)}</div>
                      </td>
                    )}

                    {/* Price */}
                    <td>
                      <input
                        type="number"
                        className={styles.compactInput}
                        value={model.price || ''}
                        onChange={(e) =>
                          handleModelChange(originalIndex, 'price', parseFloat(e.target.value))
                        }
                        placeholder="150000"
                        min="0"
                        disabled={disabled}
                      />
                    </td>

                    {/* Cost */}
                    <td style={{ textAlign: 'center' }}>
                      {isEditMode ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span className={`${styles.stockBadge} ${styles.stockOk}`}>
                            {model.costPrice ? model.costPrice.toLocaleString('vi-VN') : '—'}
                          </span>
                          {model.costSource === 'po' && model.costSourcePoId ? (
                            <a
                              href={`/seller/erp/purchase-orders`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Last updated by Purchase Order`}
                              style={{
                                fontSize: '0.62rem',
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              via PO ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Manual</span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="number"
                          className={styles.compactInput}
                          value={model.costPrice || ''}
                          onChange={(e) =>
                            handleModelChange(originalIndex, 'costPrice', parseFloat(e.target.value))
                          }
                          placeholder="80000"
                          min="0"
                          disabled={disabled}
                        />
                      )}
                    </td>

                    {/* Stock */}
                    <td style={{ textAlign: 'center' }}>
                      {isEditMode ? (
                        <span className={`${styles.stockBadge} ${stockClass(model.stock)}`}>
                          {model.stock ?? 0}
                        </span>
                      ) : (
                        <input
                          type="number"
                          className={styles.compactInput}
                          value={model.stock || ''}
                          onChange={(e) =>
                            handleModelChange(originalIndex, 'stock', parseInt(e.target.value))
                          }
                          placeholder="50"
                          min="0"
                          disabled={disabled}
                        />
                      )}
                    </td>

                    {/* SKU */}
                    <td>
                      <input
                        type="text"
                        className={styles.compactInput}
                        value={model.sku || ''}
                        onChange={(e) => handleModelChange(originalIndex, 'sku', e.target.value)}
                        placeholder="Auto-generated"
                        disabled={disabled}
                        style={{ fontFamily: 'monospace', fontSize: 11 }}
                      />
                    </td>
                    {showShippingColumns && (
                      <>
                        <td>
                          <input
                            type="number"
                            className={styles.compactInput}
                            value={model.weight ?? ''}
                            onChange={(e) => handleModelChange(originalIndex, 'weight', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            disabled={disabled}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td>
                          <div className={styles.dimRow}>
                            <input
                              type="number"
                              className={styles.dimInput}
                              value={model.dimLength ?? ''}
                              onChange={(e) => handleModelChange(originalIndex, 'dimLength', parseFloat(e.target.value) || 0)}
                              placeholder="R"
                              min="0"
                              disabled={disabled}
                            />
                            <input
                              type="number"
                              className={styles.dimInput}
                              value={model.dimWidth ?? ''}
                              onChange={(e) => handleModelChange(originalIndex, 'dimWidth', parseFloat(e.target.value) || 0)}
                              placeholder="D"
                              min="0"
                              disabled={disabled}
                            />
                            <input
                              type="number"
                              className={styles.dimInput}
                              value={model.dimHeight ?? ''}
                              onChange={(e) => handleModelChange(originalIndex, 'dimHeight', parseFloat(e.target.value) || 0)}
                              placeholder="C"
                              min="0"
                              disabled={disabled}
                            />
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tip */}
      <div className={styles.tipRow}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          className={styles.tipIcon}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Upload one image per <strong>{hasTier1 ? getTierName(primaryGroupTierIndex).toLowerCase() : 'variant'}</strong> — it
          will apply to all other options within that group. Select rows and use the
          <strong> bulk edit bar</strong> to set price/cost for multiple variants at once.
          {isEditMode && (
            <>
              {' '}
              Stock and cost price are managed via the <strong>Inventory</strong> page.
            </>
          )}
        </span>
      </div>
    </div>
  );
};

VariantsTable.propTypes = {
  tiers: PropTypes.array.isRequired,
  models: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isEditMode: PropTypes.bool,
  showShippingColumns: PropTypes.bool,
};

export default VariantsTable;
