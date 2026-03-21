/* eslint-disable react/prop-types */
/**
 * VoucherGroupPreview — Live Render Component cho Voucher Group Module
 *
 * Hien thi cac voucher cards voi duong rang cua (notched edge)
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import { getModuleVouchers } from '@services/shopDecoration/moduleTemplates';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function VoucherGroupPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  const vouchers = getModuleVouchers(module, 3);
  const hideTitle = props.hideTitle || false;
  const title = props.title || 'Ma Giam Gia';

  return (
    <div
      className={`${styles.voucherWrap} ${isSelected ? styles.voucherWrapSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Header */}
      {!hideTitle && (
        <div className={styles.voucherHeader}>
          <h3 className={styles.voucherTitle}>{title}</h3>
        </div>
      )}

      {/* Voucher Cards */}
      {vouchers.length > 0 ? (
        <div className={styles.voucherGrid}>
          {vouchers.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>
      ) : (
        <div className={styles.voucherEmpty}>
          <i className="bi bi-ticket-perforated" />
          <p>Chua co voucher nao</p>
          <small>Them voucher trong panel cau hinh</small>
        </div>
      )}
    </div>
  );
}

function VoucherCard({ voucher }) {
  const isDisabled = voucher.disabled || voucher.remaining === 0;
  const isShipping = voucher.type === 'shipping';

  return (
    <div className={`${styles.voucherCard} ${isDisabled ? styles.voucherCardDisabled : ''}`}>
      {/* Left: Discount */}
      <div className={`${styles.voucherLeft} ${isShipping ? styles.voucherLeftShipping : ''}`}>
        <span className={styles.voucherDiscount}>
          {voucher.discount === 'Freeship' ? (
            <i className="bi bi-truck" />
          ) : (
            `-${voucher.discount}`
          )}
        </span>
        {voucher.maxDiscount && (
          <span className={styles.voucherMaxDiscount}>
            Giam toi da {voucher.maxDiscount}
          </span>
        )}
      </div>

      {/* Notched divider */}
      <div className={styles.voucherNotch}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.voucherNotchDot} />
        ))}
      </div>

      {/* Right: Info */}
      <div className={styles.voucherRight}>
        <span className={styles.voucherCode}>{voucher.code}</span>
        {voucher.minOrder !== '0' && (
          <span className={styles.voucherMinOrder}>Don toi thieu {voucher.minOrder}</span>
        )}
        <span className={styles.voucherExpires}>HSD: {voucher.expires}</span>
        {isDisabled ? (
          <button className={styles.voucherBtnDisabled} disabled>Het luot</button>
        ) : (
          <button className={styles.voucherBtnSave}>Luu ma</button>
        )}
      </div>
    </div>
  );
}
