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
 *
 * @param {string}   message      Raw chat message content
 * @param {string}   prefix      Configured keyword (e.g. 'muangay')
 * @param {string|null} productId  Optional specific product ID
 * @param {Array|null} variantTiers [{ name: "color", options: ["vang","xanh"] }, ...]
 *                               From session.orderSyntax.variantTiers (lowercased names)
 * @returns {{ matched: boolean, keyword?: string, quantity?: number, productId?: string|null,
 *             variants?: Array<{ tierName: string, value: string }> }}
 */
export function parseOrderSyntax(message, prefix, productId = null, variantTiers = null) {
  if (!message || !prefix) return { matched: false };

  const trimmed = message.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ── Step 1: match the #prefix token ──────────────────────────────────────
  // Pattern: #prefix followed by zero or more whitespace-separated tokens
  // The prefix token may appear anywhere after #, not just at the very start,
  // so we use \s* after the anchor to allow: "# muangay 2" or "Hi #muangay 2"
  const prefixPattern = new RegExp(`^#\\s*${escaped}(?:\\s+|$)`, 'i');
  const prefixMatch = trimmed.match(prefixPattern);
  if (!prefixMatch) return { matched: false };

  // Everything after the matched "#prefix" token (must use numeric index — slice(string) coerces to 0 and breaks parsing)
  const prefixEnd = prefixMatch.index + prefixMatch[0].length;
  const afterPrefix = trimmed.slice(prefixEnd).trim();
  if (!afterPrefix) {
    // "#muangay" alone → quantity 1, no variants
    return { matched: true, keyword: prefix, quantity: 1, productId, variants: [] };
  }

  // ── Step 2: parse variant tokens + quantity ────────────────────────────────
  // The message after the prefix is a sequence of whitespace-separated words.
  // We need to extract:
  //   - N tokens that belong to variant options (consumed from left to right)
  //   - The last token, if it is a positive integer → quantity
  //   - Everything else is a variant option token
  //
  // Because variant options are free-text (buyer types natural language),
  // we use the configured variantTiers to disambiguate:
  //   - We try to greedily match the longest suffix as a number (qty).
  //   - Remaining tokens are treated as variant options, in tier order.

  const tokens = afterPrefix.split(/\s+/);

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

  // Variant mode: use greedy longest-match against known tier options
  // to correctly handle multi-word values like "Xanh Đen".

  // 1. Separate trailing quantity (last token if it's a positive integer)
  let quantity = 1;
  const lastToken = tokens[tokens.length - 1];
  const lastIsQty = /^\d+$/.test(lastToken) && Number(lastToken) > 0;
  if (lastIsQty) {
    quantity = parseInt(lastToken, 10);
  }

  // 2. Join non-qty tokens into a single string for greedy matching
  const variantTokens = lastIsQty ? tokens.slice(0, -1) : [...tokens];
  let variantText = variantTokens.join(' ');

  // 3. For each tier, greedily match the longest known option at the start
  const variants = [];
  for (let i = 0; i < variantTiers.length; i++) {
    const tier = variantTiers[i];
    const tierName = tier?.name ?? `tier_${i}`;

    if (!variantText) {
      // No more text left but still have tiers → take first single token fallback
      variants.push({ tierName, value: '' });
      continue;
    }

    // Sort options longest-first so we greedily match "Xanh Đen" before "Xanh"
    const sortedOptions = [...(tier.options || [])].sort((a, b) => b.length - a.length);
    const lowerText = variantText.toLowerCase();
    const matched = sortedOptions.find((opt) => {
      const lowerOpt = opt.toLowerCase();
      // Must match at start and be followed by whitespace, end-of-string, or nothing
      if (!lowerText.startsWith(lowerOpt)) return false;
      const afterMatch = variantText[opt.length];
      return afterMatch === undefined || /\s/.test(afterMatch);
    });

    if (matched) {
      variants.push({ tierName, value: matched });
      variantText = variantText.slice(matched.length).trimStart();
    } else {
      // Fallback: take the first whitespace-delimited token
      const spaceIdx = variantText.indexOf(' ');
      const token = spaceIdx === -1 ? variantText : variantText.slice(0, spaceIdx);
      variants.push({ tierName, value: token });
      variantText = spaceIdx === -1 ? '' : variantText.slice(spaceIdx + 1).trimStart();
    }
  }

  return {
    matched: true,
    keyword: prefix,
    quantity,
    productId,
    variants,
  };
}
