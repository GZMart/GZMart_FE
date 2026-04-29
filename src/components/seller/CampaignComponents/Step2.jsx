import PropTypes from 'prop-types';
import { useMemo, useState, Fragment } from 'react';
import { Input, Button, InputNumber } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styles from '@assets/styles/seller/Campaigns.module.css';
import vtStyles from '@assets/styles/seller/VariantsTable.module.css';
import { getVariantImageGroupTierIndex } from '@constants/tierTypes';

/** Models from API use `tierIndex` (Mongoose); some payloads use `tier_index`. */
const getModelTierIndex = (model) => {
  if (!model) {
return [];
}
  if (Array.isArray(model.tierIndex)) {
return model.tierIndex;
}
  if (Array.isArray(model.tier_index)) {
return model.tier_index;
}
  return [];
};

/** Normalize listing `tiers` or API `tier_variations` for labels */
const getProductTiers = (product) => {
  if (Array.isArray(product.tier_variations) && product.tier_variations.length > 0) {
    return product.tier_variations;
  }
  if (!Array.isArray(product.tiers) || product.tiers.length === 0) {
return [];
}
  return product.tiers.map((t) => ({
    name: t.name,
    options: (Array.isArray(t.options) ? t.options : []).map((opt) =>
      typeof opt === 'string' ? opt : (opt?.value ?? opt?.name ?? '')
    ),
  }));
};

const tierOptionLabel = (tiers, tierLevel, optionIndex) => {
  const raw = tiers?.[tierLevel]?.options?.[optionIndex];
  if (raw == null || raw === '') {
return '—';
}
  if (typeof raw === 'string') {
return raw;
}
  if (typeof raw === 'object') {
return raw.value ?? raw.name ?? raw.label ?? '—';
}
  return String(raw);
};

const secondaryTierLabel = (tiers, tierIndexArr, primaryGroupTierIndex) => {
  if (!tierIndexArr?.length || !tiers || tiers.length < 2) {
    return '';
  }
  const parts = [];
  for (let t = 0; t < tierIndexArr.length; t += 1) {
    if (t === primaryGroupTierIndex) continue;
    parts.push(tierOptionLabel(tiers, t, tierIndexArr[t]));
  }
  return parts.join(' / ');
};

const makeSortRowsInGroup = (primaryIdx) => (a, b) => {
  const ai = getModelTierIndex(a.model);
  const bi = getModelTierIndex(b.model);
  const n = Math.max(ai.length, bi.length, primaryIdx + 1);
  for (let i = 0; i < n; i += 1) {
    if (i === primaryIdx) continue;
    const da = ai[i] ?? 0;
    const db = bi[i] ?? 0;
    if (da !== db) {
      return da - db;
    }
  }
  return String(a.model.sku || '').localeCompare(String(b.model.sku || ''), 'vi');
};

/** First model image in tier-0 group (same as VariantsTable.getTier0Image) */
const getTier0Image = (groupRows) => {
  for (const record of groupRows) {
    const m = record.model;
    if (m?.imagePreview) {
return m.imagePreview;
}
    if (m?.image) {
return m.image;
}
  }
  return null;
};

const Step2 = ({
  campaignInfo,
  selectedProducts,
  variantConfigs,
  selectedVariantKeys,
  productSearchText,
  setProductSearchText,
  filteredProducts,
  variantTableData,
  isEditMode,
  onBack,
  onNext,
  onAddProduct,
  onRemoveProduct,
  onUpdateVariantConfig,
  onBulkUpdate,
  onRemoveVariant,
  setSelectedVariantKeys,
  onCancel,
}) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const variantSections = useMemo(() => selectedProducts
      .map((product) => {
        const rows = variantTableData.filter(
          (r) => r.product._id === product._id && variantConfigs[r.key]
        );
        if (rows.length === 0) {
          return null;
        }

        const tiers = getProductTiers(product);
        const hasMultipleTiers = tiers.length >= 2;
        const primaryGroupTierIndex = getVariantImageGroupTierIndex(tiers);
        const tier0Name = tiers[primaryGroupTierIndex]?.name || 'Variant';
        const tierRestHeader =
          tiers
            .map((t, i) => (i !== primaryGroupTierIndex ? t.name : null))
            .filter(Boolean)
            .join(' / ') || '';

        const groupMap = new Map();
        rows.forEach((record) => {
          const idx = getModelTierIndex(record.model);
          const t0 = idx[primaryGroupTierIndex] ?? 0;
          if (!groupMap.has(t0)) {
            groupMap.set(t0, []);
          }
          groupMap.get(t0).push(record);
        });

        const sortRows = makeSortRowsInGroup(primaryGroupTierIndex);
        const sortedT0 = Array.from(groupMap.keys()).sort((a, b) => Number(a) - Number(b));
        const groups = sortedT0.map((t0) => {
          const groupRows = [...groupMap.get(t0)].sort(sortRows);
          return {
            tier0Index: t0,
            tier0Label: tierOptionLabel(tiers, primaryGroupTierIndex, t0),
            rowSpan: groupRows.length,
            rows: groupRows,
          };
        });

        return {
          product,
          tiers,
          hasMultipleTiers,
          primaryGroupTierIndex,
          tier0Name,
          tierRestHeader,
          groups,
        };
      })
      .filter(Boolean), [selectedProducts, variantTableData, variantConfigs]);

  const allVariantKeys = useMemo(() => Object.keys(variantConfigs), [variantConfigs]);

  return (
    <div>
      {/* Campaign Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
            {campaignInfo.title}
          </div>
          <div style={{ fontSize: 11.5, color: '#3b82f6' }}>
            🕒 {campaignInfo.startTime?.format('DD/MM/YYYY HH:mm')} →{' '}
            {campaignInfo.endTime?.format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
        {!isEditMode && (
          <Button
            size="small"
            type="link"
            onClick={onBack}
            style={{ fontSize: 12, fontWeight: 600, padding: '0 4px' }}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Two-column layout */}
      <div
        className={`${styles.step2Layout} ${leftPanelCollapsed ? styles.step2LayoutCollapsed : ''}`}
      >
        {/* Left: Product Selector */}
        <div
          className={`${styles.step2Left} ${leftPanelCollapsed ? styles.step2LeftCollapsed : ''}`}
        >
          {leftPanelCollapsed ? (
            <div className={styles.step2CollapsedRail}>
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setLeftPanelCollapsed(false)}
                aria-label="Expand product list"
                title="Show products"
              />
              <span className={styles.step2CollapsedBadge} title="Selected products">
                {selectedProducts.length}
              </span>
            </div>
          ) : (
            <>
          <div className={styles.step2LeftToolbar}>
            <span className={styles.step2LeftTitle}>Products</span>
            <Button
              type="text"
              size="small"
              icon={<MenuFoldOutlined />}
              onClick={() => setLeftPanelCollapsed(true)}
              aria-label="Collapse product list"
              title="Collapse to widen variant table"
            />
          </div>
          <div className={styles.productSearchWrap}>
            <span className={styles.productSearchIcon}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <Input
              placeholder="Search products…"
              value={productSearchText}
              onChange={(e) => setProductSearchText(e.target.value)}
              className={styles.productSearchInput}
            />
          </div>

          <div className={styles.selectedCount}>{selectedProducts.length} product(s) selected</div>

          <div className={styles.productList}>
            {filteredProducts.length === 0 ? (
              <div className={styles.productEmpty}>
                <div className={styles.productEmptyIcon}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className={styles.productEmptyText}>No products found</div>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProducts.some((p) => p._id === product._id);
                return (
                  <div
                    key={product._id}
                    className={`${styles.productListItem} ${isSelected ? styles.productListItemActive : ''}`}
                    onClick={() => {
                      if (isSelected) {
onRemoveProduct(product._id);
} else {
onAddProduct(product._id);
}
                    }}
                  >
                    <div className={styles.productThumb}>
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className={styles.productMeta}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productSku}>
                        Stock: {product.totalStock ?? product.stock ?? 0}
                      </div>
                    </div>
                    {isSelected ? (
                      <button
                        className={styles.productRemoveBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveProduct(product._id);
                        }}
                        disabled={isEditMode}
                        title="Remove"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        className={styles.productAddBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddProduct(product._id);
                        }}
                        disabled={isEditMode}
                        title="Add"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
            </>
          )}
        </div>

        {/* Right: Variant grid (VariantsTable / ProductDrawer pattern) */}
        <div className={styles.step2Right}>
          <div className={styles.variantTableToolbar}>
            <div className={styles.variantConfigTitleRow}>
              <div className={styles.variantConfigTitleGroup}>
                <span className={styles.variantConfigTitle}>Variant Configuration</span>
                <span className={styles.variantBadge}>
                  {Object.keys(variantConfigs).length} variants
                </span>
              </div>
            </div>
            {Object.keys(variantConfigs).length > 0 && (
              <div className={styles.bulkActionBar}>
                <span className={styles.bulkEditHeading}>Bulk Edit:</span>
                <div className={styles.bulkBarInputs}>
                  <InputNumber
                    placeholder="Discount %"
                    min={0}
                    max={99}
                    className={`${styles.bulkInput} ${styles.fsFlashNumber} ${styles.fsFlashNumberDiscount}`}
                    addonAfter="%"
                    onChange={(val) =>
                      val != null &&
                      onBulkUpdate('discountPercent', Math.min(99, Math.max(0, Math.round(val))))
                    }
                  />
                  <InputNumber
                    placeholder="Quantity"
                    min={1}
                    className={`${styles.bulkInput} ${styles.fsFlashNumber}`}
                    onChange={(val) => val != null && onBulkUpdate('quantity', val)}
                  />
                  <InputNumber
                    placeholder="Limit/Order"
                    min={1}
                    className={`${styles.bulkInput} ${styles.fsFlashNumber}`}
                    onChange={(val) => val != null && onBulkUpdate('purchaseLimit', val)}
                  />
                </div>
                <span className={styles.bulkSelectedPill}>
                  ({selectedVariantKeys.length} selected)
                </span>
              </div>
            )}
          </div>

          <div className={styles.variantGridShell}>
            <div className={`${styles.variantGridScroll} ${styles.fsVariantGridScroll}`}>
              {allVariantKeys.length === 0 ? (
                <div className={styles.variantEmptyState}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <div className={styles.variantEmptyTitle}>No variants configured</div>
                  <div className={styles.variantEmptyDesc}>
                    Select products from the left panel to configure variants
                  </div>
                </div>
              ) : (
                <div className={styles.variantStackedTables}>
                  {variantSections.map((section, sectionIndex) => (
                    <Fragment key={section.product._id}>
                      <div className={styles.variantProductBlockTitle}>{section.product.name}</div>
                      <div className={`${vtStyles.gridContainer} ${styles.fsFlashTableWrap}`}>
                        <div className={vtStyles.gridScroll}>
                          <table className={vtStyles.grid}>
                            <thead>
                              <tr>
                                <th className={vtStyles.colCheck}>
                                  {sectionIndex === 0 ? (
                                    <input
                                      type="checkbox"
                                      className={vtStyles.checkbox}
                                      checked={
                                        allVariantKeys.length > 0 &&
                                        selectedVariantKeys.length === allVariantKeys.length
                                      }
                                      ref={(el) => {
                                        if (el) {
                                          el.indeterminate =
                                            selectedVariantKeys.length > 0 &&
                                            selectedVariantKeys.length < allVariantKeys.length;
                                        }
                                      }}
                                      onChange={(e) => {
                                        if (e.target.checked) {
setSelectedVariantKeys(allVariantKeys);
} else {
setSelectedVariantKeys([]);
}
                                      }}
                                      aria-label="Select all variants"
                                    />
                                  ) : null}
                                </th>
                                <th className={`${vtStyles.colTier0} ${styles.fsFlashTier0Col}`}>
                                  <span style={{ color: '#ef4444' }} aria-hidden>
                                    ●{' '}
                                  </span>
                                  {section.tier0Name}
                                </th>
                                {section.hasMultipleTiers ? (
                                  <th className={`${vtStyles.colVar} ${styles.fsFlashSizeCol}`}>
                                    {section.tiers
                                      .slice(1)
                                      .map((t) => t.name)
                                      .join(' / ')}
                                  </th>
                                ) : null}
                                <th className={styles.fsFlashColOriginal}>Original Price</th>
                                <th className={styles.fsFlashColFlashPrice}>
                                  Flash Sale Price <span style={{ color: '#ef4444' }}>*</span>
                                </th>
                                <th className={styles.fsFlashColDiscount}>Discount</th>
                                <th className={styles.fsFlashColSaleQty}>Sale Qty</th>
                                <th className={styles.fsFlashColStock}>Stock</th>
                                <th className={styles.fsFlashColLimit}>Purchase Limit</th>
                                <th className={styles.fsFlashColAction} aria-label="Actions" />
                              </tr>
                            </thead>
                            <tbody>
                              {section.groups.map((group) =>
                                group.rows.map((record, rowIdxInGroup) => {
                                  const { key, model } = record;
                                  const config = variantConfigs[key];
                                  if (!config) {
return null;
}
                                  const listPrice = config.originalPrice ?? model.price;
                                  const salePrice = config.salePrice ?? listPrice;
                                  const discountPct =
                                    config.discountPercent ??
                                    (listPrice > 0
                                      ? Math.round((1 - salePrice / listPrice) * 100)
                                      : 0);
                                  const isFirstInGroup = rowIdxInGroup === 0;
                                  const secLabel = secondaryTierLabel(
                                    section.tiers,
                                    getModelTierIndex(model),
                                    section.primaryGroupTierIndex
                                  );
                                  const tierImg = getTier0Image(group.rows);
                                  const rowSelected = selectedVariantKeys.includes(key);

                                  return (
                                    <tr
                                      key={key}
                                      className={`${rowSelected ? vtStyles.rowSelected : ''} ${
                                        isFirstInGroup ? vtStyles.tier0GroupFirstRow : ''
                                      }`}
                                    >
                                      <td className={vtStyles.checkCell}>
                                        <input
                                          type="checkbox"
                                          className={vtStyles.checkbox}
                                          checked={rowSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedVariantKeys((p) => [...p, key]);
                                            } else {
                                              setSelectedVariantKeys((p) =>
                                                p.filter((k) => k !== key)
                                              );
                                            }
                                          }}
                                          aria-label={`Select variant ${model.sku || key}`}
                                        />
                                      </td>
                                      {isFirstInGroup ? (
                                        <td
                                          className={`${vtStyles.tier0GroupCell} ${styles.fsFlashTier0Col}`}
                                          rowSpan={group.rowSpan}
                                        >
                                          <div className={vtStyles.tier0Label}>
                                            {group.tier0Label}
                                          </div>
                                          {tierImg ? (
                                            <div className={vtStyles.imgThumb}>
                                              <img
                                                src={tierImg}
                                                alt=""
                                                className={vtStyles.imgThumbImg}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              className={vtStyles.imgUploadZone}
                                              style={{
                                                pointerEvents: 'none',
                                                cursor: 'default',
                                                opacity: 0.9,
                                              }}
                                              title="No image on variant"
                                            >
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
                                            </div>
                                          )}
                                        </td>
                                      ) : null}
                                      {section.hasMultipleTiers ? (
                                        <td className={styles.fsFlashSizeCol}>
                                          <div className={vtStyles.varLabel}>{secLabel || '—'}</div>
                                        </td>
                                      ) : null}
                                      <td className={styles.fsFlashColOriginal}>
                                        <span className={styles.fsFlashReadonlyPrice}>
                                          {listPrice != null && listPrice !== ''
                                            ? `₫${Number(listPrice).toLocaleString('vi-VN')}`
                                            : '—'}
                                        </span>
                                      </td>
                                      <td className={styles.fsFlashColFlashPrice}>
                                        <InputNumber
                                          min={0}
                                          value={Number.isFinite(salePrice) ? salePrice : undefined}
                                          className={`${styles.fsRowInputNumber} ${styles.fsFlashNumber}`}
                                          addonBefore="₫"
                                          controls={false}
                                          onChange={(val) => {
                                            if (val == null || Number.isNaN(val)) {
return;
}
                                            onUpdateVariantConfig(
                                              key,
                                              'salePrice',
                                              Math.round(val)
                                            );
                                          }}
                                        />
                                      </td>
                                      <td className={styles.fsFlashColDiscount}>
                                        <InputNumber
                                          min={0}
                                          max={99}
                                          value={discountPct}
                                          className={`${styles.fsRowInputNumber} ${styles.fsFlashNumber} ${styles.fsFlashNumberDiscount}`}
                                          addonAfter="%"
                                          controls={false}
                                          onChange={(val) => {
                                            if (val == null || Number.isNaN(val)) {
return;
}
                                            const clamped = Math.min(
                                              99,
                                              Math.max(0, Math.round(val))
                                            );
                                            onUpdateVariantConfig(key, 'discountPercent', clamped);
                                          }}
                                        />
                                      </td>
                                      <td
                                        className={styles.fsFlashColSaleQty}
                                        style={{ textAlign: 'center' }}
                                      >
                                        <input
                                          type="number"
                                          className={vtStyles.compactInput}
                                          value={config.quantity ?? ''}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === '') {
return;
}
                                            const v = parseInt(raw, 10);
                                            if (!Number.isNaN(v) && v >= 1) {
                                              onUpdateVariantConfig(key, 'quantity', v);
                                            }
                                          }}
                                          placeholder="1"
                                          min={1}
                                        />
                                      </td>
                                      <td
                                        className={styles.fsFlashColStock}
                                        style={{ textAlign: 'center' }}
                                      >
                                        <span className={styles.fsFlashReadonlyMuted}>
                                          {model.stock != null ? model.stock : '—'}
                                        </span>
                                      </td>
                                      <td className={styles.fsFlashColLimit}>
                                        <input
                                          type="number"
                                          className={vtStyles.compactInput}
                                          value={config.purchaseLimit ?? ''}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === '') {
return;
}
                                            const v = parseInt(raw, 10);
                                            if (!Number.isNaN(v) && v >= 1) {
                                              onUpdateVariantConfig(key, 'purchaseLimit', v);
                                            }
                                          }}
                                          placeholder="5"
                                          min={1}
                                        />
                                      </td>
                                      <td className={styles.fsFlashColAction}>
                                        <button
                                          type="button"
                                          className={styles.fsVariantRemoveCircle}
                                          onClick={() => onRemoveVariant(key)}
                                          disabled={isEditMode && !config._flashSaleId}
                                          title="Remove variant"
                                          aria-label="Remove variant"
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            strokeLinecap="round"
                                          >
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.stepFooter}>
        <div className={styles.stepFooterLeft}>
          <Button
            className={styles.btnBack}
            onClick={onBack}
            icon={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            }
          >
            Back
          </Button>
          <Button onClick={onCancel} className={styles.btnBack}>
            Cancel
          </Button>
        </div>
        <div className={styles.stepFooterRight}>
          <Button
            className={styles.btnNext}
            onClick={onNext}
            disabled={selectedProducts.length === 0}
          >
            Review
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: 4 }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

Step2.propTypes = {
  campaignInfo: PropTypes.object,
  selectedProducts: PropTypes.array.isRequired,
  variantConfigs: PropTypes.object.isRequired,
  selectedVariantKeys: PropTypes.array,
  productSearchText: PropTypes.string,
  setProductSearchText: PropTypes.func,
  filteredProducts: PropTypes.array,
  variantTableData: PropTypes.array,
  isEditMode: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onAddProduct: PropTypes.func,
  onRemoveProduct: PropTypes.func,
  onUpdateVariantConfig: PropTypes.func,
  onBulkUpdate: PropTypes.func,
  onRemoveVariant: PropTypes.func,
  setSelectedVariantKeys: PropTypes.func,
  onCancel: PropTypes.func,
};

export default Step2;
