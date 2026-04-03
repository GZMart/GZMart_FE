import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@assets/styles/common/Drawer.module.css';

/**
 * Reusable slide-in Drawer (from right)
 *
 * Props:
 *   open        {boolean}   — controls visibility
 *   onClose     {function}  — called when backdrop or ✕ is clicked
 *   title       {ReactNode} — drawer header title
 *   subtitle    {ReactNode} — optional header subtitle
 *   headerIcon  {ReactNode} — optional icon element left of title
 *   footer      {ReactNode} — footer content (buttons)
 *   width       {string}    — CSS width, default '500px'
 *   children    {ReactNode} — body content
 */
const Drawer = ({
  open,
  onClose,
  title,
  subtitle,
  headerIcon,
  footer,
  width = '500px',
  children,
}) => {
  const drawerRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    if (open) {
      document.addEventListener('keydown', handler);
    }
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return createPortal(
    <div
      className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        ref={drawerRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {headerIcon && <div className={styles.headerIconWrap}>{headerIcon}</div>}
            <div>
              {title && <div className={styles.headerTitle}>{title}</div>}
              {subtitle && <div className={styles.headerSubtitle}>{subtitle}</div>}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>{children}</div>

        {/* Footer */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
