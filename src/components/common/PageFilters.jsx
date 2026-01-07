import React from 'react';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/**
 * Generic Filters Component
 * Can be used for Listings, Returns, Orders, etc.
 */
const PageFilters = ({ filters, onFilterChange, filterConfigs = [] }) => {
  return (
    <div className={styles.filtersContainer}>
      {filterConfigs.map((config) => (
        <div key={config.name} className={styles.filterGroup}>
          <label className={styles.filterLabel}>{config.label}</label>
          <select
            className={styles.filterSelect}
            value={filters[config.name]}
            onChange={(e) => onFilterChange(config.name, e.target.value)}
          >
            {config.options.map((option) => {
              // Support both string and object formats
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
};

export default PageFilters;
