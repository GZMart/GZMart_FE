/**
 * Parse a chat message against a configured order syntax.
 *
 * Supports two modes:
 *
 *  Simple  — #prefix [qty]
 *            e.g. #muangay 2
 *
 *  Variants — #prefix [variantOption...] [qty?]
 *             e.g. #muangay vang XL 2
 *             Multi-word options (e.g. "Xám nhạt") consume multiple tokens until
 *             the joined text matches an option in that tier's allowed list.
 *
 * @param {string}   message      Raw chat message content
 * @param {string}   prefix      Configured keyword (e.g. 'muangay')
 * @param {string|null} productId  Optional specific product ID
 * @param {Array|null} variantTiers [{ name: "color", options: ["vang","xanh"] }, ...]
 *                               From session.orderSyntax.variantTiers (lowercased names)
 * @returns {{ matched: boolean, keyword?: string, quantity?: number, productId?: string|null,
 *             variants?: Array<{ tierName: string, value: string }> }}
 */

/** Normalize for option matching: trim, lowercase, collapse internal spaces */
export function normalizeVariantOptionKey(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Partition whitespace-split tokens into one contiguous span per tier so each span
 * matches an entry in that tier's `options`. Prefers longer spans for earlier tiers
 * (so "Xám nhạt" wins over "Xám" + "nhạt" when both are valid prefixes).
 *
 * @param {string[]} tokens — tokens after prefix, quantity already stripped
 * @param {Array<{ name: string, options?: string[] }>} variantTiers
 * @returns {Array<{ tierName: string, value: string }>|null}
 */
export function partitionVariantTokensAgainstOptions(tokens, variantTiers) {
  if (!Array.isArray(variantTiers) || variantTiers.length === 0) {
    return [];
  }
  const k = variantTiers.length;
  if (!tokens.length || tokens.length < k) {
    return null;
  }

  const optionsPerTier = variantTiers.map((t) => (Array.isArray(t.options) ? t.options.map(String) : []));

  function canonicalForTier(tierIdx, joinedNorm) {
    const opts = optionsPerTier[tierIdx];
    for (const o of opts) {
      if (normalizeVariantOptionKey(o) === joinedNorm) {
        return o;
      }
    }
    return null;
  }

  function dfs(tierIdx, start) {
    if (tierIdx === k) {
      return start === tokens.length ? [] : null;
    }
    const minRemaining = k - tierIdx - 1;
    const maxEnd = tokens.length - minRemaining;
    // Longest span first for this tier → multi-word color options win
    for (let end = maxEnd; end >= start + 1; end--) {
      const joined = tokens.slice(start, end).join(' ');
      const canon = canonicalForTier(tierIdx, normalizeVariantOptionKey(joined));
      if (canon != null) {
        const rest = dfs(tierIdx + 1, end);
        if (rest != null) {
          return [
            { tierName: variantTiers[tierIdx].name, value: canon },
            ...rest,
          ];
        }
      }
    }
    return null;
  }

  return dfs(0, 0);
}

export function parseOrderSyntax(message, prefix, productId = null, variantTiers = null) {
  if (!message || !prefix) { return { matched: false }; }

  const trimmed = message.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ── Step 1: match the #prefix token ──────────────────────────────────────
  // Pattern: #prefix followed by zero or more whitespace-separated tokens
  // The prefix token may appear anywhere after #, not just at the very start,
  // so we use \s* after the anchor to allow: "# muangay 2" or "Hi #muangay 2"
  const prefixPattern = new RegExp(`^#\\s*${escaped}(?:\\s+|$)`, 'i');
  const prefixMatch = trimmed.match(prefixPattern);
  if (!prefixMatch) { return { matched: false }; }

  // Everything after the matched "#prefix" token (must use numeric index — slice(string) coerces to 0 and breaks parsing)
  const prefixEnd = prefixMatch.index + prefixMatch[0].length;
  const afterPrefix = trimmed.slice(prefixEnd).trim();
  if (!afterPrefix) {
    return { matched: true, keyword: prefix, quantity: 1, productId, variants: [] };
  }

  // ── Step 2: parse variant tokens + quantity ────────────────────────────────
  const tokens = afterPrefix.split(/\s+/).filter(Boolean);

  if (!Array.isArray(variantTiers) || variantTiers.length === 0) {
    // Simple mode: single optional integer quantity at the end
    let quantity = 1;
    const last = tokens[tokens.length - 1];
    if (/^\d+$/.test(last) && Number(last) > 0) {
      quantity = parseInt(last, 10);
    }
    return {
      matched: true,
      keyword: prefix,
      quantity,
      productId,
      variants: [],
    };
  }

  const numTiers = variantTiers.length;

  let quantity = 1;
  const lastToken = tokens[tokens.length - 1];
  let workTokens = tokens;
  if (/^\d+$/.test(lastToken) && Number(lastToken) > 0) {
    quantity = parseInt(lastToken, 10);
    workTokens = tokens.slice(0, -1);
  }

  const partitioned = partitionVariantTokensAgainstOptions(workTokens, variantTiers);

  let variants;
  if (partitioned) {
    variants = partitioned;
  } else {
    // Legacy: one whitespace token per tier (first numTiers tokens)
    const variantTokens = workTokens.slice(0, numTiers);
    variants = variantTokens.map((token, idx) => ({
      tierName: variantTiers[idx]?.name ?? `tier_${idx}`,
      value: token,
    }));
  }

  return {
    matched: true,
    keyword: prefix,
    quantity,
    productId,
    variants,
  };
}
