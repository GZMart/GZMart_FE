import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import RichTextEditor from '../../common/RichTextEditor';
import styles from '../../../assets/styles/seller/ListingsPage.module.css';

function deepClone(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

function formatVariantLabel(tiers, tierIndex) {
  if (!tiers?.length || !tierIndex?.length) {
    return 'Variant';
  }
  return tierIndex
    .map((optIdx, i) => {
      const t = tiers[i];
      const label = t?.options?.[optIdx];
      return t?.name && label != null ? `${t.name}: ${label}` : '—';
    })
    .join(' · ');
}

const parseNonNegNumber = (raw, fallback = 0) => {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }
  return n;
};

const parseNonNegInt = (raw, fallback = 0) => {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }
  return n;
};

/**
 * Drawer: xem đầy đủ + sửa field cốt lõi trước khi confirm bulk create (phương án D).
 */
const BulkUploadProductEditDrawer = ({
  open,
  product,
  rowIndex,
  ai,
  onClose,
  onSave,
  confirming,
}) => {
  const titleId = useId();
  const firstFieldRef = useRef(null);
  const productRef = useRef(product);
  productRef.current = product;
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (open && productRef.current != null) {
      setDraft(deepClone(productRef.current));
    }
    if (!open) {
      setDraft(null);
    }
  }, [open, rowIndex]);

  useEffect(() => {
    if (open && firstFieldRef.current) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open && !confirming) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirming, onClose]);

  if (!open || !draft) {
    return null;
  }

  const isVariant = Array.isArray(draft.tiers) && draft.tiers.length > 0;
  const models = Array.isArray(draft.models) ? draft.models : [];

  const validateAndSave = () => {
    const name = (draft.name || '').trim();
    if (!name) {
      toast.error('Product name is required.');
      return;
    }

    if (!isVariant) {
      const m0 = models[0] || {};
      const price = parseNonNegNumber(m0.price, NaN);
      const stock = parseNonNegInt(m0.stock, NaN);
      if (!Number.isFinite(price)) {
        toast.error('Price must be a valid number.');
        return;
      }
      if (!Number.isFinite(stock)) {
        toast.error('Stock must be a valid whole number.');
        return;
      }
      const next = {
        ...draft,
        name,
        description: (draft.description ?? '').trim(),
        brand: draft.brand ? String(draft.brand).trim() : null,
        models: [
          {
            ...m0,
            sku: m0.sku ? String(m0.sku).trim() : null,
            price,
            stock,
            costPrice: parseNonNegNumber(m0.costPrice, 0),
            tierIndex: [],
            weight: m0.weight != null && m0.weight !== '' ? parseNonNegNumber(m0.weight, 0) : 0,
            weightUnit: (m0.weightUnit || 'gr').toLowerCase(),
          },
        ],
      };
      onSave(next);
      return;
    }

    const nextModels = models.map((m) => {
      const price = parseNonNegNumber(m.price, NaN);
      const stock = parseNonNegInt(m.stock, NaN);
      if (!Number.isFinite(price) || !Number.isFinite(stock)) {
        return null;
      }
      return {
        ...m,
        sku: m.sku ? String(m.sku).trim() : null,
        price,
        stock,
        costPrice: parseNonNegNumber(m.costPrice, 0),
        weight: m.weight != null && m.weight !== '' ? parseNonNegNumber(m.weight, 0) : 0,
        weightUnit: (m.weightUnit || 'gr').toLowerCase(),
      };
    });

    if (nextModels.some((x) => x == null)) {
      toast.error('Each variant must have valid price and stock.');
      return;
    }

    onSave({
      ...draft,
      name,
      description: (draft.description ?? '').trim(),
      brand: draft.brand ? String(draft.brand).trim() : null,
      models: nextModels,
    });
  };

  const confPct =
    typeof ai?.confidence === 'number' ? Math.round(ai.confidence * 100) : null;

  return (
    <div className={styles.bulkReviewDrawerRoot} role="presentation">
      <button
        type="button"
        className={styles.bulkReviewDrawerBackdrop}
        aria-label="Close detail panel"
        onClick={confirming ? undefined : onClose}
        disabled={confirming}
      />
      <div
        className={styles.bulkReviewDrawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.bulkReviewDrawerHeader}>
          <div>
            <h3 id={titleId} className={styles.bulkReviewDrawerTitle}>
              Product details
            </h3>
            <p className={styles.bulkReviewDrawerMeta}>
              Row #{rowIndex + 1}
              {ai?.suggestedCategoryName ? (
                <>
                  {' · '}
                  AI: {ai.suggestedCategoryName}
                  {confPct != null ? ` (${confPct}%)` : ''}
                </>
              ) : null}
              {ai?.embeddingFailed ? ' · No AI embedding' : null}
            </p>
          </div>
          <button
            type="button"
            className={styles.bulkReviewDrawerClose}
            onClick={onClose}
            disabled={confirming}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.bulkReviewDrawerBody}>
          <label className={styles.bulkReviewField}>
            <span className={styles.bulkReviewFieldLabel}>Name *</span>
            <input
              ref={firstFieldRef}
              type="text"
              className={styles.bulkReviewInput}
              value={draft.name ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              disabled={confirming}
            />
          </label>

          <div className={styles.bulkReviewField}>
            <span className={styles.bulkReviewFieldLabel}>Description</span>
            <div className={styles.bulkReviewRichText}>
              <RichTextEditor
                value={draft.description ?? ''}
                onChange={(html) =>
                  setDraft((d) => ({ ...d, description: html || '' }))
                }
                placeholder="Mô tả sản phẩm... Có thể thêm ảnh bằng nút 📷 trên thanh công cụ"
                disabled={confirming}
                minHeight={200}
              />
            </div>
          </div>

          <label className={styles.bulkReviewField}>
            <span className={styles.bulkReviewFieldLabel}>Brand</span>
            <input
              type="text"
              className={styles.bulkReviewInput}
              value={draft.brand ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, brand: e.target.value || null }))
              }
              disabled={confirming}
            />
          </label>

          {!isVariant && models[0] ? (
            <div className={styles.bulkReviewFieldGroup}>
              <p className={styles.bulkReviewFieldGroupTitle}>Pricing & inventory</p>
              <div className={styles.bulkReviewFieldRow}>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>SKU</span>
                  <input
                    type="text"
                    className={styles.bulkReviewInput}
                    value={models[0].sku ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], sku: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  />
                </label>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>Price *</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.bulkReviewInput}
                    value={models[0].price ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], price: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  />
                </label>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>Stock *</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.bulkReviewInput}
                    value={models[0].stock ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], stock: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  />
                </label>
              </div>
              <div className={styles.bulkReviewFieldRow}>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>Cost price</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.bulkReviewInput}
                    value={models[0].costPrice ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], costPrice: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  />
                </label>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>Weight</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.bulkReviewInput}
                    value={models[0].weight ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], weight: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  />
                </label>
                <label className={styles.bulkReviewField}>
                  <span className={styles.bulkReviewFieldLabel}>Weight unit</span>
                  <select
                    className={styles.bulkReviewSelectInput}
                    value={models[0].weightUnit || 'gr'}
                    onChange={(e) =>
                      setDraft((d) => {
                        const m = [...(d.models || [])];
                        m[0] = { ...m[0], weightUnit: e.target.value };
                        return { ...d, models: m };
                      })
                    }
                    disabled={confirming}
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {isVariant ? (
            <div className={styles.bulkReviewFieldGroup}>
              <p className={styles.bulkReviewFieldGroupTitle}>Variant tiers (read-only)</p>
              <ul className={styles.bulkReviewTierList}>
                {(draft.tiers || []).map((t) => (
                  <li key={t.name}>
                    <strong>{t.name}</strong>: {(t.options || []).join(', ')}
                  </li>
                ))}
              </ul>

              <p className={styles.bulkReviewFieldGroupTitle}>Models</p>
              <div className={styles.bulkReviewVariantScroll}>
                {models.map((m, mi) => (
                  <div key={mi} className={styles.bulkReviewVariantCard}>
                    <p className={styles.bulkReviewVariantLabel}>
                      {formatVariantLabel(draft.tiers, m.tierIndex)}
                    </p>
                    <div className={styles.bulkReviewFieldRow}>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>SKU</span>
                        <input
                          type="text"
                          className={styles.bulkReviewInput}
                          value={m.sku ?? ''}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], sku: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        />
                      </label>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>Price *</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={styles.bulkReviewInput}
                          value={m.price ?? ''}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], price: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        />
                      </label>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>Stock *</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={styles.bulkReviewInput}
                          value={m.stock ?? ''}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], stock: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        />
                      </label>
                    </div>
                    <div className={styles.bulkReviewFieldRow}>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>Cost</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={styles.bulkReviewInput}
                          value={m.costPrice ?? ''}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], costPrice: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        />
                      </label>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>Weight</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={styles.bulkReviewInput}
                          value={m.weight ?? ''}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], weight: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        />
                      </label>
                      <label className={styles.bulkReviewField}>
                        <span className={styles.bulkReviewFieldLabel}>Unit</span>
                        <select
                          className={styles.bulkReviewSelectInput}
                          value={m.weightUnit || 'gr'}
                          onChange={(e) =>
                            setDraft((d) => {
                              const next = [...(d.models || [])];
                              next[mi] = { ...next[mi], weightUnit: e.target.value };
                              return { ...d, models: next };
                            })
                          }
                          disabled={confirming}
                        >
                          <option value="gr">gr</option>
                          <option value="kg">kg</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.bulkReviewDrawerFooter}>
          <button
            type="button"
            className={styles.bulkCancelBtn}
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.bulkSubmitBtn}
            onClick={validateAndSave}
            disabled={confirming}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProductEditDrawer;
