import { Button, message } from 'antd';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/FlashSales.module.css';

const Step3 = ({ campaignInfo, selectedProducts, variantConfigs, selectedFlashSale, onBack, onSubmit, loading, onCancel }) => {
  const isEditMode = !!selectedFlashSale;

  return (
    <div className={styles.step3Container}>
      <h3 className={styles.step1Title}>Review &amp; Confirm</h3>
      <p className={styles.step1Desc}>Review your campaign details before pushing live.</p>

      {/* Summary Cards */}
      <div className={styles.reviewGrid}>
        {/* Campaign Card */}
        <div className={styles.reviewCard}>
          <div className={styles.reviewCardHeader}>
            <div className={styles.reviewCardIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className={styles.reviewCardTitle}>Campaign Info</div>
          </div>
          <div className={styles.reviewStat}>
            <div className={styles.reviewStatLabel}>Title</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {campaignInfo.title}
            </div>
          </div>
          <div className={styles.reviewStat}>
            <div className={styles.reviewStatLabel}>Schedule</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {campaignInfo.startTime?.format('DD/MM/YYYY HH:mm')}
              <br />
              → {campaignInfo.endTime?.format('DD/MM/YYYY HH:mm')}
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className={styles.reviewCard}>
          <div className={styles.reviewCardHeader}>
            <div className={styles.reviewCardIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className={styles.reviewCardTitle}>Products</div>
          </div>
          <div className={styles.reviewStat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div className={styles.reviewStatLabel}>Products</div>
                <div className={styles.reviewStatValue}>{selectedProducts.length}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.reviewStatLabel}>Variants</div>
                <div className={styles.reviewStatValue}>{Object.keys(variantConfigs).length}</div>
              </div>
            </div>
          </div>
          <div className={styles.reviewStat}>
            <div className={styles.reviewStatLabel}>Discount Range</div>
            <div>
              {(() => {
                const discounts = Object.values(variantConfigs).map((c) => c.discountPercent).filter(Boolean);
                if (discounts.length === 0) {
return <span style={{ color: '#94a3b8' }}>N/A</span>;
}
                const min = Math.min(...discounts);
                const max = Math.max(...discounts);
                return (
                  <span style={{ display: 'inline-block', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
                    {min}% – {max}% OFF
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Impact Card */}
        <div className={`${styles.reviewCard} ${styles.reviewCardPrimary}`}>
          <div className={styles.reviewCardHeader}>
            <div className={styles.reviewCardIcon} style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className={styles.reviewCardTitle}>Estimated Impact</div>
          </div>
          <div className={styles.reviewStat}>
            <div className={styles.reviewStatLabel}>Total Reserved Stock</div>
            <div className={styles.reviewStatValue}>
              {Object.values(variantConfigs)
                .reduce((s, c) => s + (c.quantity || 0), 0)
                .toLocaleString('vi-VN')}{' '}
              units
            </div>
          </div>
          <div className={styles.reviewStat}>
            <div className={styles.reviewStatLabel}>Potential Revenue</div>
            <div className={styles.reviewStatValue} style={{ fontSize: 18 }}>
              {(() => {
                const rev = Object.values(variantConfigs).reduce((s, c) => s + (c.quantity || 0) * (c.salePrice || 0), 0);
                return `₫${rev.toLocaleString('vi-VN')}`;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className={styles.validationCheck}>
        <div className={styles.validationCheckTitle}>Final Validation</div>
        {[
          {
            ok: (() => {
              const d = Object.values(variantConfigs).map((c) => c.discountPercent).filter(Boolean);
              return d.length > 0 && d.every((x) => x >= 5 && x <= 90);
            })(),
            text: 'Discount range: 5% – 90%',
          },
          {
            ok: !campaignInfo.startTime?.isBefore(dayjs()) || !!selectedFlashSale,
            text: 'Start time is in the future',
          },
          {
            ok: Object.values(variantConfigs).every((c) => (c.quantity || 0) > 0),
            text: 'All selected variants have quantity > 0',
          },
        ].map(({ ok, text }, i) => (
          <div key={i} className={styles.validationItem}>
            {ok ? (
              <svg className={styles.validationIconOk} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg className={styles.validationIconWarn} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            <span className={styles.validationText} style={{ color: ok ? '#166534' : '#92400e' }}>
              {text}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.stepFooter}>
        <div className={styles.stepFooterLeft}>
          <Button
            className={styles.btnBack}
            onClick={onBack}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            }
          >
            Back
          </Button>
          <Button onClick={onCancel} className={styles.btnBack}>
            Cancel
          </Button>
          <Button
            style={{ borderRadius: 10, fontWeight: 600, borderColor: '#dbeafe', color: '#2563eb' }}
            onClick={() => {
 message.info('Draft saved!'); 
}}
          >
            Save as Draft
          </Button>
        </div>
        <div className={styles.stepFooterRight}>
          <Button
            className={styles.btnSubmit}
            loading={loading}
            onClick={onSubmit}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
            {isEditMode ? 'Update Flash Sale' : 'Create Flash Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3;
