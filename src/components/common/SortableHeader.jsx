import React from 'react';
import styles from '../../assets/styles/common/SortableHeader.module.css';

/**
 * Reusable sortable <th> for any table.
 *
 * Usage:
 *   <SortableHeader
 *     label="Price"
 *     colKey="price"
 *     sortKey={sortKey}
 *     sortDir={sortDir}
 *     onSort={handleSort}
 *     align="right"          // optional: 'left' | 'center' | 'right'
 *     className={styles.th}  // optional: pass page-level th class
 *   />
 */
const SortableHeader = ({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
  className = '',
}) => {
  const isActive = sortKey === colKey;

  return (
    <th
      className={`${styles.th} ${isActive ? styles.active : ''} ${className}`}
      style={{ textAlign: align }}
      onClick={() => onSort(colKey)}
    >
      <span
        className={styles.inner}
        style={{
          justifyContent:
            align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        }}
      >
        {label}
        <span className={`${styles.icon} ${isActive ? styles.iconActive : ''}`}>
          {isActive ? sortDir === 'asc' ? <UpIcon /> : <DownIcon /> : <BothIcon />}
        </span>
      </span>
    </th>
  );
};

// Tiny inline SVG icons — no extra import needed
const UpIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
);
const DownIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const BothIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m18 15-6-6-6 6M6 9l6-6 6 6" opacity=".4" />
    <path d="m6 15 6 6 6-6" opacity=".4" />
  </svg>
);

export default SortableHeader;

/**
 * Convenience hook for sort state + handler.
 * Uses a single state object to avoid nested-setState race conditions.
 * Returns { sortKey, sortDir, handleSort }
 */
export const useSortState = (defaultKey = null, defaultDir = 'asc') => {
  const [sort, setSort] = React.useState({ key: defaultKey, dir: defaultDir });

  const handleSort = React.useCallback((key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return { sortKey: sort.key, sortDir: sort.dir, handleSort };
};

/**
 * Generic sort comparator.
 * For stockStatus: pass statusOrder = { out: 0, low: 1, ok: 2 }
 */
export const sortRows = (rows, sortKey, sortDir, overrides = {}) => {
  if (!sortKey) {
    return rows;
  }
  return [...rows].sort((a, b) => {
    let aVal = overrides[sortKey] ? overrides[sortKey](a) : a[sortKey];
    let bVal = overrides[sortKey] ? overrides[sortKey](b) : b[sortKey];

    if (aVal == null) {
      aVal = typeof bVal === 'number' ? -Infinity : '';
    }
    if (bVal == null) {
      bVal = typeof aVal === 'number' ? -Infinity : '';
    }

    if (typeof aVal === 'string') {
      const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });
};
