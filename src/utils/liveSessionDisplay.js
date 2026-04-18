/**
 * Shared display helpers for live session analytics / end summary tables.
 */

/**
 * @param {string|null|undefined} name
 * @param {number} [maxWords=4]
 * @returns {{ short: string, full: string }}
 */
export function truncateProductNameWords(name, maxWords = 4) {
  if (name == null || typeof name !== 'string') {
    return { short: '—', full: '' };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { short: '—', full: '' };
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return { short: trimmed, full: trimmed };
  }
  return {
    short: `${words.slice(0, maxWords).join(' ')}…`,
    full: trimmed,
  };
}

/**
 * Amount + currency on one line (NBSP before symbol).
 * @param {number|null|undefined} n
 */
export function formatSessionMoney(n) {
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  return `${new Intl.NumberFormat('en-US').format(Math.round(n))}\u00A0₫`;
}
