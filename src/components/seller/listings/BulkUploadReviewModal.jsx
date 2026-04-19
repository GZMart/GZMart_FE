import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { categoryService } from '../../../services/api/categoryService';
import { getProductDrawerSelectStyles } from '../../../utils/productDrawerSelectStyles';
import {
  compareCategoryPeers,
  flattenCategoriesFromTree,
} from '../../../utils/sellerCategoryTree';
import BulkUploadProductEditDrawer from './BulkUploadProductEditDrawer';
import styles from '../../../assets/styles/seller/ListingsPage.module.css';

function deepCloneProduct(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

/** Hiển thị snippet trong bảng — mô tả có thể là HTML (sau khi dùng RichTextEditor như ProductDrawer). */
function plainTextFromDescription(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  const s = String(raw);
  if (typeof document === 'undefined' || !s.includes('<')) {
    return s;
  }
  try {
    const d = document.createElement('div');
    d.innerHTML = s;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return s;
  }
}

/**
 * Bước 2: xem trước + chỉnh danh mục + xem/sửa chi tiết SP (phương án D) trước khi gọi API tạo SP.
 */
const BulkUploadReviewModal = ({ items, onBack, onConfirm, confirming }) => {
  const [categories, setCategories] = useState([]);
  const [selection, setSelection] = useState({});
  const [localProducts, setLocalProducts] = useState({});
  const [editedRows, setEditedRows] = useState(() => new Set());
  const [editingIndex, setEditingIndex] = useState(null);

  const categorySelectStyles = useMemo(() => getProductDrawerSelectStyles(false), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await categoryService.getTree();
        if (!cancelled && res?.success) {
          setCategories(flattenCategoriesFromTree(res.data));
          return;
        }
      } catch {
        /* fallback */
      }
      try {
        const fallback = await categoryService.getAll({ status: 'active' });
        if (!cancelled && fallback?.success && Array.isArray(fallback.data)) {
          const sorted = [...fallback.data].sort(compareCategoryPeers);
          setCategories(sorted.map((cat) => ({ ...cat, depth: 0 })));
        } else if (!cancelled) {
          setCategories([]);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const initSel = {};
    const initProd = {};
    items.forEach((it) => {
      initSel[it.index] = it.defaultCategoryId || it.ai?.suggestedCategoryId || '';
      initProd[it.index] = deepCloneProduct(it.product);
    });
    setSelection(initSel);
    setLocalProducts(initProd);
    setEditedRows(new Set());
    setEditingIndex(null);
  }, [items]);

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat._id,
        label: `${cat.depth > 0 ? `${'\u00A0'.repeat(cat.depth * 4)}› ` : ''}${cat.name}`,
      })),
    [categories],
  );

  const allHaveCategory = useMemo(() => {
    return items.every((it) => {
      const id = selection[it.index];
      return id && String(id).trim() !== '';
    });
  }, [items, selection]);

  const handleSelect = (index, categoryId) => {
    setSelection((prev) => ({ ...prev, [index]: categoryId }));
  };

  const handleSubmit = () => {
    if (!allHaveCategory) {
      return;
    }
    const payload = items.map((it) => ({
      index: it.index,
      categoryId: selection[it.index],
      product: {
        ...localProducts[it.index],
        categoryId: selection[it.index],
      },
    }));
    onConfirm(payload);
  };

  const rowNeedsAttention = (ai) =>
    Boolean(ai?.needsReview || ai?.embeddingFailed);

  const editingAi = useMemo(() => {
    if (editingIndex === null) {
      return null;
    }
    return items.find((it) => it.index === editingIndex)?.ai ?? null;
  }, [items, editingIndex]);

  return (
    <div className={styles.bulkReviewWrap}>
      <div className={styles.bulkReviewToolbar}>
        <button type="button" className={styles.bulkCancelBtn} onClick={onBack} disabled={confirming}>
          ← Back to file selection
        </button>
        <p className={styles.bulkReviewHint}>
          The file has no category column — the system suggests categories from name + description (embedding). Adjust
          the dropdown if needed; rows highlighted need another look (low confidence or no AI). Use{' '}
          <strong>View &amp; edit</strong> to review full text and fix name, description, SKU, or prices before creating.
        </p>
      </div>

      <div className={styles.bulkReviewTableScroll}>
        <table className={styles.bulkReviewTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Category (select)</th>
              <th>AI</th>
              <th className={styles.bulkReviewThActions}> </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const sel = selection[it.index] || '';
              const ai = it.ai || {};
              const confPct =
                typeof ai.confidence === 'number' ? Math.round(ai.confidence * 100) : null;

              const selectedOption = categoryOptions.find((o) => o.value === sel) || null;
              const prod = localProducts[it.index];
              const desc = plainTextFromDescription(prod?.description);
              const attention = rowNeedsAttention(ai);

              return (
                <tr
                  key={it.index}
                  className={attention ? styles.bulkReviewRowAttention : undefined}
                >
                  <td>{it.index + 1}</td>
                  <td>
                    <div className={styles.bulkReviewNameRow}>
                      <span className={styles.bulkReviewName}>{prod?.name || '—'}</span>
                      {editedRows.has(it.index) ? (
                        <span className={styles.bulkReviewEditedBadge}>Edited</span>
                      ) : null}
                    </div>
                    {desc ? (
                      <div className={styles.bulkReviewDesc}>
                        {desc.slice(0, 120)}
                        {desc.length > 120 ? '…' : ''}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className={styles.bulkReviewCategoryWrap}>
                      <Select
                        inputId={`bulk-cat-input-${it.index}`}
                        instanceId={`bulk-cat-${it.index}`}
                        options={categoryOptions}
                        value={selectedOption}
                        onChange={(opt) => handleSelect(it.index, opt?.value ?? '')}
                        placeholder="Select or search category…"
                        isClearable
                        isSearchable
                        isDisabled={confirming}
                        styles={categorySelectStyles}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        noOptionsMessage={() => 'No categories found'}
                        filterOption={(option, rawInput) => {
                          const q = (rawInput || '').trim().toLowerCase();
                          if (!q) {
                            return true;
                          }
                          const label = String(option.label || '').toLowerCase();
                          return label.includes(q);
                        }}
                        formatOptionLabel={(option) => (
                          <span style={{ whiteSpace: 'pre' }}>{option.label}</span>
                        )}
                      />
                    </div>
                  </td>
                  <td>
                    {ai.embeddingFailed ? (
                      <span className={styles.bulkAiPillWarn}>No suggestion (API)</span>
                    ) : (
                      <>
                        <span
                          className={ai.needsReview ? styles.bulkAiPillWarn : styles.bulkAiPillOk}
                        >
                          {ai.suggestedCategoryName || '—'}
                          {confPct != null ? ` · ${confPct}%` : ''}
                        </span>
                        {ai.needsReview ? (
                          <span className={styles.bulkAiReviewLbl}>Needs review</span>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td className={styles.bulkReviewTdActions}>
                    <button
                      type="button"
                      className={styles.bulkReviewDetailBtn}
                      onClick={() => setEditingIndex(it.index)}
                      disabled={confirming}
                    >
                      View &amp; edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.bulkModalActions}>
        <button type="button" className={styles.bulkCancelBtn} onClick={onBack} disabled={confirming}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.bulkSubmitBtn}
          disabled={confirming || !allHaveCategory}
          onClick={handleSubmit}
        >
          {confirming ? 'Creating products…' : 'Confirm & create products'}
        </button>
      </div>

      <BulkUploadProductEditDrawer
        open={editingIndex !== null}
        product={editingIndex !== null ? localProducts[editingIndex] : null}
        rowIndex={editingIndex ?? 0}
        ai={editingAi}
        onClose={() => setEditingIndex(null)}
        onSave={(nextProduct) => {
          if (editingIndex === null) {
            return;
          }
          const idx = editingIndex;
          setLocalProducts((prev) => ({ ...prev, [idx]: nextProduct }));
          setEditedRows((prev) => new Set(prev).add(idx));
          setEditingIndex(null);
        }}
        confirming={confirming}
      />
    </div>
  );
};

export default BulkUploadReviewModal;
