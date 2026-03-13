import React from 'react';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/**
 * Generic Page Header Component
 * Can be used for Listings, Returns, Orders, etc.
 */
const PageHeader = ({ title, subtitle, buttonText, onButtonClick, showButton = true }) => (
  <div className={styles.listingsHeader}>
    <div className={styles.headerContent}>
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSubtitle}>{subtitle}</p>
      </div>
      {showButton && buttonText && (
        <button className={styles.addButton} onClick={onButtonClick}>
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

export default PageHeader;
