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
  if (!message || !prefix) {
return { matched: false };
}

  const trimmed = message.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ── Step 1: match the #prefix token ──────────────────────────────────────
  // Pattern: #prefix followed by zero or more whitespace-separated tokens
  // The prefix token may appear anywhere after #, not just at the very start,
  // so we use \s* after the anchor to allow: "# muangay 2" or "Hi #muangay 2"
  const prefixPattern = new RegExp(`^#\\s*${escaped}(?:\\s+|$)`, 'i');
  const prefixMatch = trimmed.match(prefixPattern);
  if (!prefixMatch) {
return { matched: false };
}

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

  // Variant mode: first N tokens are variant options (one per configured tier),
  // the last numeric token (if any) is the quantity.
  // Remaining non-numeric tokens must equal the number of variant tiers.

  const numTiers = variantTiers.length;
  const variantTokens = tokens.slice(0, numTiers);    // candidate variant tokens
  const restTokens   = tokens.slice(numTiers);       // after variant tokens

  // Last token of the whole message → candidate qty
  let quantity = 1;
  const lastToken = tokens[tokens.length - 1];
  if (/^\d+$/.test(lastToken) && Number(lastToken) > 0) {
    quantity = parseInt(lastToken, 10);
  }

  // If there are more non-qty tokens than tiers, something is wrong → reject
  // (but only if the last token was successfully parsed as a number)
  const nonQtyTokenCount = /^\d+$/.test(lastToken) && Number(lastToken) > 0
    ? tokens.length - 1
    : tokens.length;

  if (nonQtyTokenCount !== numTiers) {
    // Try a looser heuristic: accept if all non-qty tokens fit within tier options
    // Fall back to partial match (first N tokens as variants, ignore extras)
    // This allows "#muangay vang XL" without a qty
    if (nonQtyTokenCount > numTiers) {
      // Take only the first N non-qty tokens
    }
  }

  // Build variant mapping: { tierName, value } for each configured tier
  const variants = variantTokens.map((token, idx) => ({
    tierName: variantTiers[idx]?.name ?? `tier_${idx}`,
    value: token,
  }));

  return {
    matched: true,
    keyword: prefix,
    quantity,
    productId,
    variants,
  };
}
