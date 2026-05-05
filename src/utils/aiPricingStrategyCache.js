/**
 * Batch cache từ BE: mỗi strategy là object có suggestedPrice (+ reasoning, …).
 * Single-variant payload cũng có suggestedPrice ở root — coi là complete nếu số hợp lệ.
 */
export function strategyCacheEntryIsComplete(entry) {
  if (entry == null || typeof entry !== 'object') return false;
  const n = Number(entry.suggestedPrice);
  return Number.isFinite(n) && n > 0;
}
