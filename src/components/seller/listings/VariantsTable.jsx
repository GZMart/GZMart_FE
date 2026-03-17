import React, { useState } from 'react';
import styles from '../../../assets/styles/seller/VariantsTable.module.css';

const VariantsTable = ({ tiers, models, onChange, disabled, isEditMode = false, showShippingColumns = false }) => {
  const [bulkEdit, setBulkEdit] = useState({ price: '', costPrice: '', stock: '' });
  const [selectedRows, setSelectedRows] = useState(new Set());

  /* ── Helpers ──────────────────────────────────────────────── */
  const getVariantLabel = (model) =>
    model.tierIndex.map((idx, tierIdx) => tiers[tierIdx]?.options[idx]?.value || '?').join(' / ');

  const getTierName = (tierIdx) => tiers[tierIdx]?.name || `Tier ${tierIdx + 1}`;

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

  const handleImageUpload = (index, e) => {
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
    const updated = [...models];
    updated[index] = {
      ...updated[index],
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    };
    onChange(updated);
  };

  const handleRemoveImage = (index) => {
    const updated = [...models];
    if (updated[index].imagePreview) {
      URL.revokeObjectURL(updated[index].imagePreview);
    }
    updated[index] = { ...updated[index], imageFile: null, imagePreview: null, image: null };
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
                <th className={styles.colImg}>Image</th>
                <th className={styles.colVar}>Variant</th>
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
              {models.map((model, index) => (
                <tr key={index} className={selectedRows.has(index) ? styles.rowSelected : ''}>
                  {/* Checkbox */}
                  <td className={styles.checkCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedRows.has(index)}
                      onChange={() => handleSelectRow(index)}
                    />
                  </td>

                  {/* Image */}
                  <td className={styles.imgCell}>
                    {model.imagePreview || model.image ? (
                      <div className={styles.imgThumb}>
                        <img
                          src={model.imagePreview || model.image}
                          alt={getVariantLabel(model)}
                          className={styles.imgThumbImg}
                        />
                        <button
                          type="button"
                          className={styles.imgRemoveBtn}
                          onClick={() => handleRemoveImage(index)}
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
                          onChange={(e) => handleImageUpload(index, e)}
                          disabled={disabled}
                        />
                        <svg
                          width="16"
                          height="16"
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

                  {/* Variant label — e.g. "Đen / S" */}
                  <td>
                    <div className={styles.varLabel}>{getVariantLabel(model)}</div>
                    <div className={styles.varTierNames}>
                      {model.tierIndex.map((_, i) => getTierName(i)).join(' · ')}
                    </div>
                  </td>

                  {/* Price */}
                  <td>
                    <input
                      type="number"
                      className={styles.compactInput}
                      value={model.price || ''}
                      onChange={(e) =>
                        handleModelChange(index, 'price', parseFloat(e.target.value))
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
                          handleModelChange(index, 'costPrice', parseFloat(e.target.value))
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
                          handleModelChange(index, 'stock', parseInt(e.target.value))
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
                      onChange={(e) => handleModelChange(index, 'sku', e.target.value)}
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
                          onChange={(e) => handleModelChange(index, 'weight', parseFloat(e.target.value) || 0)}
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
                            onChange={(e) => handleModelChange(index, 'dimLength', parseFloat(e.target.value) || 0)}
                            placeholder="R"
                            min="0"
                            disabled={disabled}
                          />
                          <input
                            type="number"
                            className={styles.dimInput}
                            value={model.dimWidth ?? ''}
                            onChange={(e) => handleModelChange(index, 'dimWidth', parseFloat(e.target.value) || 0)}
                            placeholder="D"
                            min="0"
                            disabled={disabled}
                          />
                          <input
                            type="number"
                            className={styles.dimInput}
                            value={model.dimHeight ?? ''}
                            onChange={(e) => handleModelChange(index, 'dimHeight', parseFloat(e.target.value) || 0)}
                            placeholder="C"
                            min="0"
                            disabled={disabled}
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
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
          Upload variant images to show product colors/styles. Select rows and use the
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

export default VariantsTable;
