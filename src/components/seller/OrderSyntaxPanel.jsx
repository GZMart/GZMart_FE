import { useState, useEffect, useCallback, useMemo } from 'react';
import livestreamService from '@services/api/livestreamService';
import styles from '../../assets/styles/buyer/LiveStreamPage.module.css';

/* ─── Stock map helpers ─────────────────────────────────────────────────── */

/**
 * Build stock map for a single tier, filtering models by the fixed selections
 * of all previously selected tiers (cascading by combo).
 */
const buildOptionStockMap = (product, tierPos, otherFilters = []) => {
  const map = {};
  const options = product.tiers[tierPos]?.options ?? [];
  options.forEach((opt) => {
    map[opt] = { inStock: false, stock: null };
  });

  if (!product.models?.length) return map;

  product.models.forEach((model) => {
    if (!model.tierIndex || model.tierIndex.length !== product.tiers.length) return;
    const otherMatch = otherFilters.every(
      ({ tierPos: fp, optionIdx }) => model.tierIndex[fp] === optionIdx,
    );
    if (!otherMatch) return;

    const thisOptIdx = model.tierIndex[tierPos];
    if (thisOptIdx == null || thisOptIdx < 0) return;
    const optionValue = product.tiers[tierPos].options?.[thisOptIdx];
    if (!optionValue) return;

    const inStock = model.isActive !== false && (model.stock == null || model.stock > 0);
    const prev = map[optionValue];
    if (inStock) {
      if (!prev.inStock) {
        map[optionValue] = { inStock: true, stock: model.stock ?? null };
      } else {
        map[optionValue] = {
          ...prev,
          stock: (prev.stock ?? 0) + (model.stock ?? 0),
        };
      }
    }
  });

  return map;
};

/**
 * Compute cascaded stock maps for all tiers.
 * Each tier's map is filtered by the selected option of all previous tiers.
 */
const buildCascadedStockMaps = (product, tierSelections = []) => {
  if (!product?.tiers?.length || !product?.models?.length) return [];

  const maps = [];
  let currentFilters = [];

  product.tiers.forEach((_, tierPos) => {
    const map = buildOptionStockMap(product, tierPos, currentFilters);
    maps.push(map);

    const selection = tierSelections[tierPos];
    if (selection != null && selection >= 0) {
      currentFilters = [...currentFilters, { tierPos, optionIdx: selection }];
    }
  });

  return maps;
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function OrderSyntaxPanel({ sessionId, isLive, liveProducts = [], pinnedProductId = null }) {
  const [enabled, setEnabled] = useState(false);
  const [prefix, setPrefix] = useState('muangay');
  const productId = pinnedProductId ? String(pinnedProductId) : '';
  const resolvedProduct = productId
    ? liveProducts.find((p) => String(p._id) === String(productId))
    : null;

  const [variantMode, setVariantMode] = useState(false);
  const [variantTiers, setVariantTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Selected option index per tier position — drives the cascade
  // null = not selected yet, number = selected option index
  const [tierSelections, setTierSelections] = useState([]);

  // ── Load config from session ───────────────────────────────────────────
  useEffect(() => {
    if (!isLive || !sessionId) return;
    livestreamService
      .getSessionConfig(sessionId)
      .then((res) => {
        const cfg = res?.data?.orderSyntax;
        if (cfg) {
          setEnabled(cfg.enabled ?? false);
          setPrefix(cfg.prefix ?? 'muangay');
          setVariantMode(Array.isArray(cfg.variantTiers) && cfg.variantTiers.length > 0);
          setVariantTiers(Array.isArray(cfg.variantTiers) ? cfg.variantTiers : []);
        }
      })
      .catch(() => {});
  }, [isLive, sessionId]);

  // ── When pinned product changes, reset everything ──────────────────────
  useEffect(() => {
    if (!pinnedProductId) return;
    const product = liveProducts.find((p) => String(p._id) === String(pinnedProductId));
    if (!product?.tiers?.length) {
      setVariantTiers([]);
      setTierSelections([]);
      return;
    }
    setVariantTiers(
      product.tiers.map((tier) => ({
        name: tier.name,
        options: [...(tier.options ?? [])],
      })),
    );
    // Initialize selections: first option selected for each tier by default
    setTierSelections(product.tiers.map((_, i) => 0));
  }, [pinnedProductId, liveProducts]);

  // ── When variantMode toggled, sync tierSelections length ───────────────
  useEffect(() => {
    if (variantMode && variantTiers.length > 0) {
      setTierSelections((prev) => {
        if (prev.length === variantTiers.length) return prev;
        // Align length: fill missing with 0 (first option)
        return variantTiers.map((_, i) => (prev[i] != null ? prev[i] : 0));
      });
    } else {
      setTierSelections([]);
    }
  }, [variantMode, variantTiers.length]);

  // ── Cascaded stock maps ────────────────────────────────────────────────
  const cascadedMaps = useMemo(
    () => buildCascadedStockMaps(resolvedProduct, tierSelections),
    [resolvedProduct, tierSelections],
  );

  // ── Select / deselect an option in a tier ─────────────────────────────
  const selectOption = useCallback((tierPos, optionIdx) => {
    setTierSelections((prev) => {
      const next = [...prev];
      if (next[tierPos] === optionIdx) {
        // Deselect: set to null (no filter for this tier)
        next[tierPos] = null;
      } else {
        next[tierPos] = optionIdx;
      }
      // Reset all subsequent tier selections when earlier tier changes
      // (cascading: changing tier N resets tiers N+1, N+2,...)
      for (let i = tierPos + 1; i < next.length; i++) {
        next[i] = null;
      }
      return next;
    });
  }, []);

  // ── Toggle a tier's active state in syntax config ─────────────────────
  const toggleTier = useCallback((tierName, checked) => {
    setVariantTiers((prev) => {
      if (checked) {
        if (prev.some((t) => t.name === tierName)) return prev;
        const tier = resolvedProduct?.tiers?.find((t) => t.name === tierName);
        return [...prev, { name: tierName, options: [...(tier?.options ?? [])] }];
      } else {
        return prev.filter((t) => t.name !== tierName);
      }
    });
  }, [resolvedProduct]);

  // ── Toggle a single option in a tier (syntax config) ───────────────────
  const toggleOption = useCallback((tierName, option, checked) => {
    setVariantTiers((prev) =>
      prev.map((t) => {
        if (t.name !== tierName) return t;
        const opts = checked
          ? [...t.options, option]
          : t.options.filter((o) => o !== option);
        return { ...t, options: opts };
      }),
    );
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await livestreamService.updateSession(sessionId, {
        orderSyntax: {
          enabled,
          prefix: prefix.trim().replace(/^#/, ''),
          productId: pinnedProductId ? String(pinnedProductId) : null,
          variantTiers: variantMode ? variantTiers : null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('[OrderSyntaxPanel] updateSession failed:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Preview example (uses currently selected options) ───────────────────
  const previewTokens = [
    prefix.replace(/^#/, ''),
    ...tierSelections.map((selIdx, i) => {
      const opts = resolvedProduct?.tiers?.[i]?.options ?? [];
      const inStockOpt = Object.keys(cascadedMaps[i] ?? {}).find(
        (k) => cascadedMaps[i]?.[k]?.inStock,
      );
      if (selIdx != null && selIdx >= 0 && opts[selIdx]) {
        return opts[selIdx];
      }
      if (inStockOpt) return inStockOpt;
      return opts[0] ?? `<${resolvedProduct?.tiers?.[i]?.name ?? 'tier'}>`;
    }),
    '2',
  ];
  const previewExample = `#${previewTokens.join(' ')}`;

  const productTiers = resolvedProduct?.tiers ?? [];
  const saveDisabled = saving || (variantMode && variantTiers.length === 0) || !pinnedProductId;

  return (
    <div className={styles.orderSyntaxRoot}>
      {/* Enable toggle */}
      <div className={styles.orderSyntaxHeaderRow}>
        <div>
          <div className={styles.orderSyntaxTitle}>Order Syntax</div>
          <div className={styles.orderSyntaxSubtitle}>
            Buyers type the syntax in chat to auto-create an order
          </div>
        </div>
        <label className={styles.orderSyntaxSwitch}>
          <input
            type="checkbox"
            className={styles.orderSyntaxSwitchInput}
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span
            className={`${styles.orderSyntaxSwitchTrack} ${enabled ? styles.orderSyntaxSwitchTrackOn : ''}`}
          >
            <span
              className={`${styles.orderSyntaxSwitchKnob} ${enabled ? styles.orderSyntaxSwitchKnobOn : ''}`}
            />
          </span>
        </label>
      </div>

      {/* Syntax prefix input */}
      <div className={styles.orderSyntaxField}>
        <label className={styles.orderSyntaxFieldLabel} htmlFor="order-syntax-prefix">
          Chat keyword
        </label>
        <div className={styles.orderSyntaxKeywordRow}>
          <span className={styles.orderSyntaxHash}>#</span>
          <input
            id="order-syntax-prefix"
            type="text"
            className={styles.orderSyntaxTextInput}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="muangay"
            disabled={!enabled}
          />
        </div>
      </div>

      {/* Pinned product */}
      <div className={styles.orderSyntaxField}>
        <label className={styles.orderSyntaxFieldLabel}>Target product</label>
        {resolvedProduct ? (
          <div className={styles.orderSyntaxPinnedProduct}>
            <img
              src={resolvedProduct.thumbnail || '/placeholder.png'}
              alt={resolvedProduct.name}
              className={styles.orderSyntaxPinnedImg}
            />
            <span className={styles.orderSyntaxPinnedName}>{resolvedProduct.name}</span>
            <span className={styles.orderSyntaxPinnedBadge}>
              <i className="bi bi-pin-angle-fill" /> Pinned
            </span>
          </div>
        ) : (
          <div className={styles.orderSyntaxNoProduct}>
            <i className="bi bi-pin" /> No product pinned
          </div>
        )}
      </div>

      {/* Variant mode */}
      {resolvedProduct?.tiers?.length > 0 && (
        <div>
          <div className={styles.orderSyntaxVariantHeader}>
            <div>
              <div className={styles.orderSyntaxVariantTitle}>Variant selection</div>
              <div className={styles.orderSyntaxVariantDesc}>
                Select variant combinations; each tier shows real stock filtered by previous choices
              </div>
            </div>
            <label className={`${styles.orderSyntaxSwitch} ${styles.orderSyntaxSwitchSm}`}>
              <input
                type="checkbox"
                className={styles.orderSyntaxSwitchInput}
                checked={variantMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setVariantMode(checked);
                  if (checked) {
                    setVariantTiers(
                      resolvedProduct.tiers.map((t) => ({
                        name: t.name,
                        options: [...(t.options ?? [])],
                      })),
                    );
                    setTierSelections(resolvedProduct.tiers.map((_, i) => 0));
                  } else {
                    setVariantTiers([]);
                    setTierSelections([]);
                  }
                }}
                disabled={!enabled}
              />
              <span
                className={`${styles.orderSyntaxSwitchTrack} ${variantMode ? styles.orderSyntaxSwitchTrackOn : ''} ${!enabled ? styles.orderSyntaxSwitchTrackDisabled : ''}`}
              >
                <span
                  className={`${styles.orderSyntaxSwitchKnob} ${variantMode ? styles.orderSyntaxSwitchKnobOn : ''}`}
                />
              </span>
            </label>
          </div>

          {/* Cascade selector UI */}
          {variantMode && (
            <div className={styles.orderSyntaxVariantBox}>
              {/* Cascade selector — stock per (tier, option) filtered by previous selections */}
              {productTiers.map((tier, tierPos) => {
                const stockMap = cascadedMaps[tierPos] ?? {};
                const selectedIdx = tierSelections[tierPos];
                const isSelected = selectedIdx != null;

                return (
                  <div key={tier.name} className={styles.orderSyntaxCascadeTier}>
                    {/* Tier label */}
                    <div className={styles.orderSyntaxCascadeHeader}>
                      <span className={styles.orderSyntaxCascadeTierName}>{tier.name}</span>
                      {tierPos > 0 && (
                        <span className={styles.orderSyntaxCascadeHint}>
                          ← filtered by {productTiers[tierPos - 1]?.name}:{' '}
                          <strong>{productTiers[tierPos - 1]?.options?.[tierSelections[tierPos - 1]] ?? '—'}</strong>
                        </span>
                      )}
                    </div>

                    {/* Option chips */}
                    <div className={styles.orderSyntaxChipWrap}>
                      {tier.options?.map((opt, optIdx) => {
                        const info = stockMap[opt];
                        const isOOS = !info?.inStock;
                        const isActive = selectedIdx === optIdx;

                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.orderSyntaxChip} ${isActive ? styles.orderSyntaxChipOn : ''} ${isOOS ? styles.orderSyntaxChipOos : ''}`}
                            onClick={() => selectOption(tierPos, optIdx)}
                            title={
                              isOOS
                                ? 'Hết hàng với lựa chọn hiện tại'
                                : info?.stock != null
                                ? `Còn ${info.stock} vé`
                                : 'Còn hàng'
                            }
                          >
                            <span className={styles.orderSyntaxChipLabel}>{opt}</span>
                            {isOOS ? (
                              <span className={styles.orderSyntaxChipOosBadge}>✗</span>
                            ) : info?.stock != null ? (
                              <span className={styles.orderSyntaxChipStock}>{info.stock}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected summary */}
                    {isSelected && (
                      <div className={styles.orderSyntaxCascadeSelected}>
                        <i className="bi bi-check-circle-fill" />
                        Selected: <strong>{tier.options?.[selectedIdx]}</strong>
                        {(() => {
                          const info = stockMap[tier.options?.[selectedIdx]];
                          if (!info?.inStock) {
                            return (
                              <span className={styles.orderSyntaxCascadeSelectedOos}>
                                — Hết hàng
                              </span>
                            );
                          }
                          if (info?.stock != null) {
                            return (
                              <span className={styles.orderSyntaxCascadeSelectedStock}>
                                — Còn {info.stock} vé
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Syntax config row */}
              <div className={styles.orderSyntaxConfigSection}>
                <div className={styles.orderSyntaxConfigTitle}>
                  <i className="bi bi-gear" />
                  Cú pháp — chọn options nào được phép nhập
                </div>
                <div className={styles.orderSyntaxConfigDesc}>
                  Chọn options bạn muốn cho phép trong cú pháp chat. Bạn có thể chọn subset (không bắt buộc chọn tất cả).
                </div>

                {productTiers.map((tier) => {
                  const isActive = variantTiers.some((t) => t.name === tier.name);

                  return (
                    <div key={`cfg-${tier.name}`} className={styles.orderSyntaxConfigTier}>
                      <div className={styles.orderSyntaxTierRow}>
                        <input
                          type="checkbox"
                          id={`cfg-tier-toggle-${tier.name}`}
                          checked={isActive}
                          onChange={(e) => toggleTier(tier.name, e.target.checked)}
                        />
                        <label
                          className={styles.orderSyntaxTierLabel}
                          htmlFor={`cfg-tier-toggle-${tier.name}`}
                        >
                          {tier.name}
                        </label>
                        <span className={styles.orderSyntaxTierMeta}>
                          {tier.options?.length ?? 0} options
                        </span>
                      </div>

                      {isActive && tier.options?.length > 0 && (
                        <div className={styles.orderSyntaxChipWrap}>
                          {tier.options.map((opt) => {
                            const isSelected = variantTiers
                              .find((t) => t.name === tier.name)
                              ?.options.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                className={`${styles.orderSyntaxChip} ${isSelected ? styles.orderSyntaxChipOn : ''}`}
                                onClick={() => toggleOption(tier.name, opt, !isSelected)}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {variantTiers.length === 0 && (
                  <div className={styles.orderSyntaxEmptyHint}>
                    Bật ít nhất một tier ở trên để bật cú pháp variant
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live preview */}
      <div className={styles.orderSyntaxPreview}>
        <div className={styles.orderSyntaxPreviewLabel}>Buyer example</div>
        <div className={styles.orderSyntaxPreviewCode}>
          <span className={styles.orderSyntaxPreviewCodeAccent}>{previewExample}</span>
        </div>
        {resolvedProduct && (
          <div className={styles.orderSyntaxPreviewMeta}>
            → Order: <strong>{resolvedProduct.name}</strong>
            {variantMode && variantTiers.length > 0 && (
              <span>
                {' '}(variants:{' '}
                {tierSelections
                  .map((selIdx, i) => {
                    const opts = resolvedProduct?.tiers?.[i]?.options ?? [];
                    return selIdx != null ? opts[selIdx] ?? '—' : '—';
                  })
                  .join(', ')}
                )
              </span>
            )}
          </div>
        )}
        {variantMode && variantTiers.length === 0 && (
          <div className={styles.orderSyntaxWarn}>
            Bật ít nhất một tier để kích hoạt cú pháp variant
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        type="button"
        className={`${styles.orderSyntaxSaveBtn} ${saved ? styles.orderSyntaxSaveBtnSaved : ''}`}
        onClick={handleSave}
        disabled={saveDisabled}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Syntax'}
      </button>
    </div>
  );
}
