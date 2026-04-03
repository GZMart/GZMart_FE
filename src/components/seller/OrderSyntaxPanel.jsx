import { useState, useEffect, useCallback } from 'react';
import livestreamService from '@services/api/livestreamService';
import styles from '@pages/seller/LiveStreamPage.module.css';

/**
 * OrderSyntaxPanel — seller UI for configuring the live chat order syntax.
 * Supports:
 *  - Simple mode: #prefix [qty]
 *  - Variant mode: #prefix [variantOption...] [qty?]
 *    e.g. #muangay vang XL 2
 */
export default function OrderSyntaxPanel({ sessionId, isLive, liveProducts = [] }) {
  const [enabled, setEnabled] = useState(false);
  const [prefix, setPrefix] = useState('muangay');
  const [productId, setProductId] = useState('');
  const [variantMode, setVariantMode] = useState(false);
  // variantTiers: [{ name: "Color", options: ["Vàng","Xanh"] }, ...]
  const [variantTiers, setVariantTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Resolved product (for preview)
  const resolvedProduct = productId
    ? liveProducts.find((p) => String(p._id) === String(productId))
    : null;

  // ── Load config from session ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLive || !sessionId) {
return;
}
    livestreamService
      .getSessionConfig(sessionId)
      .then((res) => {
        const cfg = res?.data?.orderSyntax;
        if (cfg) {
          setEnabled(cfg.enabled ?? false);
          setPrefix(cfg.prefix ?? 'muangay');
          setProductId(cfg.productId != null && cfg.productId !== '' ? String(cfg.productId) : '');
          setVariantMode(Array.isArray(cfg.variantTiers) && cfg.variantTiers.length > 0);
          setVariantTiers(Array.isArray(cfg.variantTiers) ? cfg.variantTiers : []);
        }
      })
      .catch(() => {});
  }, [isLive, sessionId]);

  // ── When product changes, reset variantTiers to match that product's tiers ─
  const handleProductChange = useCallback((newProductId) => {
    setProductId(newProductId);
    if (!newProductId) {
      setVariantTiers([]);
      return;
    }
    const product = liveProducts.find((p) => String(p._id) === String(newProductId));
    if (!product?.tiers?.length) {
      setVariantTiers([]);
      return;
    }
    // Initialise variantTiers from the product's tiers
    setVariantTiers(
      product.tiers.map((tier) => ({
        name: tier.name,
        options: [...(tier.options ?? [])],
      })),
    );
  }, [liveProducts]);

  // ── Toggle a tier's variant mode ───────────────────────────────────────────
  const toggleTier = useCallback((tierName, checked) => {
    setVariantTiers((prev) => {
      if (checked) {
        // Add tier if not already present
        if (prev.some((t) => t.name === tierName)) {
return prev;
}
        const product = resolvedProduct;
        const tier = product?.tiers?.find((t) => t.name === tierName);
        return [...prev, { name: tierName, options: [...(tier?.options ?? [])] }];
      } else {
        // Remove tier
        return prev.filter((t) => t.name !== tierName);
      }
    });
  }, [resolvedProduct]);

  // ── Update options for a tier ──────────────────────────────────────────────
  const updateTierOptions = useCallback((tierName, newOptions) => {
    setVariantTiers((prev) =>
      prev.map((t) => (t.name === tierName ? { ...t, options: newOptions } : t)),
    );
  }, []);

  // ── Toggle a single option in a tier ──────────────────────────────────────
  const toggleOption = useCallback((tierName, option, checked) => {
    setVariantTiers((prev) =>
      prev.map((t) => {
        if (t.name !== tierName) {
return t;
}
        const opts = checked
          ? [...t.options, option]
          : t.options.filter((o) => o !== option);
        return { ...t, options: opts };
      }),
    );
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
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
          productId: productId || null,
          // Only send variantTiers when variantMode is on and there are tiers
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

  // ── Build preview string ────────────────────────────────────────────────────
  const previewTokens = [
    prefix.replace(/^#/, ''),
    ...variantTiers.map((t) => t.options[0] ?? `<${t.name}>`),
    '2',
  ];
  const previewExample = `#${previewTokens.join(' ')}`;

  // All tiers from the resolved product
  const productTiers = resolvedProduct?.tiers ?? [];

  const saveDisabled = saving || (variantMode && variantTiers.length === 0);

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

      {/* Product selector */}
      <div className={styles.orderSyntaxField}>
        <label className={styles.orderSyntaxFieldLabel} htmlFor="order-syntax-product">
          Target product
        </label>
        <select
          id="order-syntax-product"
          className={styles.orderSyntaxSelect}
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          disabled={!enabled}
        >
          <option value="">— Pinned product —</option>
          {liveProducts.map((p) => (
            <option key={p._id} value={String(p._id)}>{p.name}</option>
          ))}
        </select>
        <div className={styles.orderSyntaxHint}>
          Leave empty → uses whichever product is pinned on the viewer overlay
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

          {/* Tier config */}
          {variantMode && (
            <div className={styles.orderSyntaxVariantBox}>
              {productTiers.map((tier) => {
                const isActive = variantTiers.some((t) => t.name === tier.name);
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

                    {isActive && (!tier.options?.length) && (
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
        {resolvedProduct && (
          <div className={styles.orderSyntaxPreviewMeta}>
            → Order: <strong>{resolvedProduct.name}</strong>
            {variantMode && variantTiers.length > 0 && (
              <span>
                {' '}(variants: {variantTiers.map((t) => t.options[0] ?? t.name).join(', ')})
              </span>
            )}
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
