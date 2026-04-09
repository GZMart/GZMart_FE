import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import livestreamService from '@services/api/livestreamService';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

/**
 * OrderSyntaxPanel — seller UI for configuring the live chat order syntax.
 * Supports:
 *  - Simple mode: #prefix [qty]
 *  - Variant mode: #prefix [variantOption...] [qty?]
 *    e.g. #muangay vang XL 2
 */
export default function OrderSyntaxPanel({ sessionId, isLive, liveProducts = [], pinnedProductId = null }) {
  const [enabled, setEnabled] = useState(false);
  const [prefix, setPrefix] = useState('muangay');
  const [variantMode, setVariantMode] = useState(false);
  const [variantTiers, setVariantTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const resolvedProduct = pinnedProductId
    ? liveProducts.find((p) => String(p._id) === String(pinnedProductId))
    : null;

  const productTiers = resolvedProduct?.tiers ?? [];

  // ── Index tier positions ─────────────────────────────────────────────
  const tierIndexMap = useMemo(() => {
    const m = {};
    productTiers.forEach((t, i) => {
 m[t.name.toLowerCase()] = i; 
});
    return m;
  }, [productTiers]);

  const colorIdx = productTiers.findIndex((t) => /color|màu|mau/i.test(t.name));
  const sizeIdx = productTiers.findIndex((t) => /size|kích|kich/i.test(t.name));

  // ── Build full stock map: { colorIdx: { sizeIdx: stock } } ────────
  const fullStockMap = useMemo(() => {
    const map = {};
    for (const model of resolvedProduct?.models ?? []) {
      if (!model.tierIndex || colorIdx < 0 || sizeIdx < 0) {
continue;
}
      const c = model.tierIndex[colorIdx];
      const s = model.tierIndex[sizeIdx];
      if (c == null || s == null) {
continue;
}
      if (!map[c]) {
map[c] = {};
}
      map[c][s] = Math.max(0, Number(model.stock) || 0);
    }
    return map;
  }, [resolvedProduct, colorIdx, sizeIdx]);

  // ── Cascaded stock: filter by previously selected tiers ───────────
  const getCascadedStock = useCallback((tierName, optIdx, selectedTierStates) => {
    if (colorIdx < 0 || sizeIdx < 0) {
return null;
}
    const tierPos = tierIndexMap[tierName.toLowerCase()];
    if (tierPos == null) {
return null;
}

    const prevColorIdx = selectedTierStates[colorIdx];
    const prevSizeIdx = selectedTierStates[sizeIdx];

    // Color tier: sum stock across all sizes for that color
    if (tierPos === colorIdx) {
      if (prevSizeIdx != null) {
        return fullStockMap[optIdx]?.[prevSizeIdx] ?? 0;
      }
      return Object.values(fullStockMap[optIdx] ?? {}).reduce((s, v) => s + v, 0);
    }
    // Size tier: sum stock across all colors for that size
    if (tierPos === sizeIdx) {
      if (prevColorIdx != null) {
        return fullStockMap[prevColorIdx]?.[optIdx] ?? 0;
      }
      return Object.values(fullStockMap).reduce((sum, sizeMap) => sum + (sizeMap[optIdx] ?? 0), 0);
    }
    return null;
  }, [colorIdx, sizeIdx, fullStockMap, tierIndexMap]);

  // ── Track which tier index is selected in what order ─────────────
  const [selectedTierStates, setSelectedTierStates] = useState({});

  // ── Load config from session (syntax always targets the pinned product) ─
  useEffect(() => {
    if (!isLive || !sessionId) {
return;
}
    livestreamService
      .getSessionConfig(sessionId)
      .then((res) => {
        const cfg = res?.data?.orderSyntax;
        if (!cfg) {
return;
}
        setEnabled(cfg.enabled ?? false);
        setPrefix(cfg.prefix ?? 'muangay');
        const cfgPid = cfg.productId != null && cfg.productId !== '' ? String(cfg.productId) : null;
        const pinPid = pinnedProductId != null && pinnedProductId !== '' ? String(pinnedProductId) : null;
        const variantOk = !cfgPid || !pinPid || cfgPid === pinPid;
        if (variantOk && Array.isArray(cfg.variantTiers) && cfg.variantTiers.length > 0) {
          setVariantMode(true);
          setVariantTiers(cfg.variantTiers);
        } else {
          setVariantMode(false);
          setVariantTiers([]);
        }
      })
      .catch(() => {});
  }, [isLive, sessionId, pinnedProductId]);

  const prevPinForSyntaxRef = useRef(undefined);

  // When the pinned product id actually changes, reset chip selection and rebuild variant tiers from the new product
  useEffect(() => {
    const pinStr = pinnedProductId != null && pinnedProductId !== '' ? String(pinnedProductId) : '';
    const prev = prevPinForSyntaxRef.current;
    const pinChanged = prev !== undefined && prev !== pinStr;
    prevPinForSyntaxRef.current = pinStr;

    if (!variantMode || !pinStr || !pinChanged) {
return;
}

    setSelectedTierStates({});
    const p = liveProducts.find((x) => String(x._id) === pinStr);
    if (!p?.tiers?.length) {
      setVariantTiers([]);
      return;
    }
    setVariantTiers(
      p.tiers.map((tier) => ({
        name: tier.name,
        options: [...(tier.options ?? [])],
      })),
    );
  }, [pinnedProductId, variantMode, liveProducts]);

  const toggleTier = useCallback((tierName, checked) => {
    setVariantTiers((prev) => {
      if (checked) {
        if (prev.some((t) => t.name === tierName)) {
return prev;
}
        const tier = resolvedProduct?.tiers?.find((t) => t.name === tierName);
        return [...prev, { name: tierName, options: [...(tier?.options ?? [])] }];
      } else {
        // When deactivating a tier, clear its selection from state
        const pos = tierIndexMap[tierName.toLowerCase()];
        setSelectedTierStates((prev2) => {
          const next = { ...prev2 };
          if (pos != null) {
delete next[pos];
}
          return next;
        });
        return prev.filter((t) => t.name !== tierName);
      }
    });
  }, [resolvedProduct, tierIndexMap]);

  // eslint-disable-next-line no-unused-vars
  const updateTierOptions = useCallback((tierName, newOptions) => {
    setVariantTiers((prev) =>
      prev.map((t) => (t.name === tierName ? { ...t, options: newOptions } : t)),
    );
  }, []);

  const toggleOption = useCallback((tierName, option, checked, optIdx) => {
    const pos = tierIndexMap[tierName.toLowerCase()];
    setSelectedTierStates((prev) => ({
      ...prev,
      [pos]: checked ? optIdx : undefined,
    }));
    setVariantTiers((prev) =>
      prev.map((t) => {
        if (t.name !== tierName) {
return t;
}
        const opts = checked ? [...t.options, option] : t.options.filter((o) => o !== option);
        return { ...t, options: opts };
      }),
    );
  }, [tierIndexMap]);

  const handleDisableAllOOS = useCallback(() => {
    if (!resolvedProduct) {
return;
}
    setVariantTiers((prev) => {
      const newTiers = prev.map((t) => {
        const pos = tierIndexMap[t.name.toLowerCase()];
        const validOpts = [];
        t.options.forEach((opt, idx) => {
          const stock = getCascadedStock(t.name, idx, selectedTierStates);
          if (stock > 0) {
validOpts.push(opt);
}
        });
        return { ...t, options: validOpts };
      });
      return newTiers;
    });
  }, [resolvedProduct, tierIndexMap, getCascadedStock, selectedTierStates]);

  const handleDisableAllOOSInTier = useCallback((tierName) => {
    const tier = variantTiers.find((t) => t.name === tierName);
    if (!tier) {
return;
}
    const pos = tierIndexMap[tierName.toLowerCase()];
    const validOpts = [];
    tier.options.forEach((opt, idx) => {
      const stock = getCascadedStock(tierName, idx, selectedTierStates);
      if (stock > 0) {
validOpts.push(opt);
}
    });
    setVariantTiers((prev) =>
      prev.map((t) => (t.name === tierName ? { ...t, options: validOpts } : t)),
    );
  }, [variantTiers, tierIndexMap, getCascadedStock, selectedTierStates]);

  const handleReenableAllInTier = useCallback((tierName) => {
    const productTier = productTiers.find((t) => t.name === tierName);
    if (!productTier) {
return;
}
    setVariantTiers((prev) =>
      prev.map((t) =>
        t.name === tierName ? { ...t, options: [...(productTier.options ?? [])] } : t,
      ),
    );
  }, [productTiers]);

  const handleSave = async () => {
    if (!sessionId) {
return;
}
    setSaving(true);
    try {
      await livestreamService.updateSession(sessionId, {
        orderSyntax: {
          enabled,
          prefix: prefix.trim().replace(/^#/, ''),
          productId: pinnedProductId || null,
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

  const previewTokens = [
    prefix.replace(/^#/, ''),
    ...variantTiers.map((t) => t.options[0] ?? `<${t.name}>`),
    '2',
  ];
  const previewExample = `#${previewTokens.join(' ')}`;

  const saveDisabled = saving || (variantMode && variantTiers.length === 0);

  // Determine filter hint text
  const filterHints = [];
  variantTiers.forEach((t) => {
    const pos = tierIndexMap[t.name.toLowerCase()];
    if (pos != null && selectedTierStates[pos] != null) {
      const label = t.options[selectedTierStates[pos]];
      if (label) {
filterHints.push(`${t.name}: ${label}`);
}
    }
  });

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

      {/* Variant mode toggle */}
      {resolvedProduct?.tiers?.length > 0 && (
        <div>
          <div className={styles.orderSyntaxVariantHeader}>
            <div>
              <div className={styles.orderSyntaxVariantTitle}>Variant selection</div>
              <div className={styles.orderSyntaxVariantDesc}>
                Buyers specify variant options in the message (e.g. #muangay vang XL 2)
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
                  setSelectedTierStates({});
                  if (checked) {
                    setVariantTiers(
                      resolvedProduct.tiers.map((t) => ({
                        name: t.name,
                        options: [...(t.options ?? [])],
                      })),
                    );
                  } else {
                    setVariantTiers([]);
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

          {/* Disable all OOS banner */}
          {variantMode && variantTiers.length > 0 && (
            <div className={styles.orderSyntaxOosBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Some options are out of stock</span>
              <button
                type="button"
                className={styles.orderSyntaxOosBannerBtn}
                onClick={handleDisableAllOOS}
              >
                Disable all OOS
              </button>
            </div>
          )}

          {/* Filter hint */}
          {variantMode && filterHints.length > 0 && (
            <div className={styles.orderSyntaxFilterHint}>
              Filtered by: {filterHints.join(' • ')}
            </div>
          )}

          {/* Tier config */}
          {variantMode && (
            <div className={styles.orderSyntaxVariantBox}>
              {productTiers.map((tier) => {
                const isActive = variantTiers.some((t) => t.name === tier.name);
                const selectedIdx = selectedTierStates[tierIndexMap[tier.name.toLowerCase()]];

                return (
                  <div key={tier.name}>
                    <div className={styles.orderSyntaxTierRow}>
                      <input
                        type="checkbox"
                        id={`tier-toggle-${tier.name}`}
                        checked={isActive}
                        onChange={(e) => toggleTier(tier.name, e.target.checked)}
                      />
                      <label
                        className={styles.orderSyntaxTierLabel}
                        htmlFor={`tier-toggle-${tier.name}`}
                      >
                        {tier.name}
                      </label>
                      <span className={styles.orderSyntaxTierMeta}>
                        {tier.options?.length ?? 0} options
                      </span>
                      {isActive && variantTiers.length > 1 && (
                        <div className={styles.orderSyntaxTierActions}>
                          <button
                            type="button"
                            className={styles.orderSyntaxTierActionBtn}
                            onClick={() => handleDisableAllOOSInTier(tier.name)}
                            title="Disable out-of-stock options in this tier"
                          >
                            Disable OOS
                          </button>
                          <button
                            type="button"
                            className={styles.orderSyntaxTierActionBtn}
                            onClick={() => handleReenableAllInTier(tier.name)}
                            title="Re-enable all options in this tier"
                          >
                            Re-enable all
                          </button>
                        </div>
                      )}
                    </div>

                    {isActive && tier.options?.length > 0 && (
                      <div className={styles.orderSyntaxChipWrap}>
                        {tier.options.map((opt, optIdx) => {
                          const isSelected = variantTiers
                            .find((t) => t.name === tier.name)
                            ?.options.includes(opt);
                          const stock = getCascadedStock(tier.name, optIdx, selectedTierStates);
                          const isOOS = stock !== null && stock <= 0;

                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`${styles.orderSyntaxChip} ${isSelected ? styles.orderSyntaxChipOn : ''} ${isOOS ? styles.orderSyntaxChipOos : ''}`}
                              onClick={() => toggleOption(tier.name, opt, !isSelected, optIdx)}
                              title={isOOS ? 'Hết hàng' : `Còn ${stock ?? '?'} sản phẩm`}>
                              <span className={styles.orderSyntaxChipLabel}>{opt}</span>
                              {stock !== null && (
                                <span className={`${styles.orderSyntaxChipStock} ${isOOS ? styles.orderSyntaxChipStockOos : ''}`}>
                                  {stock}
                                </span>
                              )}
                              {isOOS && (
                                <span className={styles.orderSyntaxChipOosIcon}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isActive && !tier.options?.length && (
                      <div className={`${styles.orderSyntaxHint} ${styles.orderSyntaxChipWrap}`}>
                        No options configured for this tier
                      </div>
                    )}
                  </div>
                );
              })}

              {variantTiers.length === 0 && (
                <div className={styles.orderSyntaxEmptyHint}>
                  Select at least one tier above
                </div>
              )}
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
        {resolvedProduct ? (
          <div className={styles.orderSyntaxPreviewMeta}>
            → Order: <strong>{resolvedProduct.name}</strong>
            {variantMode && variantTiers.length > 0 && (
              <span>
                {' '}(variants: {variantTiers.map((t) => t.options[0] ?? t.name).join(', ')})
              </span>
            )}
          </div>
        ) : (
          <div className={styles.orderSyntaxHint}>
            Order syntax applies to the product pinned for viewers — add and pin a featured product first.
          </div>
        )}
        {variantMode && variantTiers.length === 0 && (
          <div className={styles.orderSyntaxWarn}>
            Select at least one tier to enable variant syntax
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        type="button"
        className={`${styles.orderSyntaxSaveBtn} ${saved ? styles.orderSyntaxSaveBtnSaved : ''}`}
        onClick={handleSave}
        disabled={saveDisabled}
        title={variantMode && variantTiers.length === 0 ? 'Select at least one tier before saving' : ''}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Syntax'}
      </button>
    </div>
  );
}
