import PropTypes from 'prop-types';
import { useState } from 'react';
import styles from '@assets/styles/seller/Campaigns.module.css';

const CollapsibleHelpBox = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.helpBox}>
      <div className={styles.helpBoxHeader} onClick={() => setOpen((o) => !o)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className={styles.helpBoxTitle}>Campaign Rules &amp; Notes</span>
        <svg
          className={`${styles.helpBoxArrow} ${open ? styles.helpBoxArrowOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div className={styles.helpBoxContent}>
          <ul className={styles.helpList}>
            <li>
              <span className={styles.helpDot} />
              <span><strong>Discount range:</strong> Products must have 5% to 90% off.</span>
            </li>
            <li>
              <span className={styles.helpDot} />
              <span><strong>Minimum quantity:</strong> At least 1 unit must be available per variant.</span>
            </li>
            <li>
              <span className={styles.helpDot} />
              <span><strong>Start time:</strong> Must be at or after the current time.</span>
            </li>
            <li>
              <span className={styles.helpDot} />
              <span><strong>Time locked:</strong> Start and end times CANNOT be changed after creation.</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

CollapsibleHelpBox.propTypes = {};

export default CollapsibleHelpBox;
