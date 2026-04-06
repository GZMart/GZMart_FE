import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters';
import styles from '@assets/styles/seller/PoCostBreakdown.module.css';

function fmtVnd(n) {
  if (n == null || Number.isNaN(Number(n))) {
return '—';
}
  return `${Number(n).toLocaleString('vi-VN')}₫`;
}

/**
 * Lists every PO-derived fee and explains suggested price vs landed cost + market.
 * Renders from API costData — not from LLM text (stable, complete).
 */
export default function PoCostBreakdown({
  costData,
  suggestedPrice,
  currentPrice,
  marketAvg,
  variant = 'modal',
}) {
  if (!costData?.hasCostData) {
return null;
}

  const b = costData.breakdown;
  const landed = Number(costData.landedCostPerUnit) || 0;
  const sug = Number(suggestedPrice) || 0;
  const cur = Number(currentPrice) || 0;
  const avg = marketAvg != null && !Number.isNaN(Number(marketAvg)) ? Number(marketAvg) : null;

  const marginSug = landed > 0 && sug > 0 ? ((sug - landed) / landed) * 100 : null;
  const marginCur = landed > 0 && cur > 0 ? ((cur - landed) / landed) * 100 : null;

  const feePct = (b?.buyingServiceFeeRate ?? 0) * 100;
  const otherPu = b?.otherCostPerUnit ?? 0;

  const rootClass = variant === 'modal' ? styles.rootModal : styles.rootPanel;

  return (
    <div className={rootClass}>
      <div className={styles.label}>Lý giải gợi ý</div>

      <div className={styles.sectionTitle}>Chi phí từ phiếu nhập (PO)</div>
      {(costData.poCode || costData.sku) && (
        <div className={styles.meta}>
          {costData.poCode && (
            <>
              Mã PO: <strong>{costData.poCode}</strong>
            </>
          )}
          {costData.sku && (
            <>
              {costData.poCode ? ' · ' : null}
              SKU: <strong>{costData.sku}</strong>
            </>
          )}
          {costData.quantityInPo != null && (
            <>
              {' '}
              · SL trên dòng PO: <strong>{costData.quantityInPo}</strong>
            </>
          )}
        </div>
      )}
      {costData.isEstimate && (
        <div className={styles.estimate}>
          Ước tính — PO chưa hoàn tất hoặc hàng đang về; số liệu có thể thay đổi khi nhận hàng.
        </div>
      )}

      <ol className={styles.list}>
        <li>
          <span className={styles.liMain}>Giá hàng gốc (CNY → VND)</span>
          <span className={styles.liValue}>
            {b?.productCostCny ?? 0} ¥ × {fmtVnd(b?.exchangeRate)}/¥ = {fmtVnd(b?.productCostVnd)}
          </span>
        </li>
        <li>
          <span className={styles.liMain}>Phí dịch vụ mua hàng ({feePct.toFixed(1)}% trên giá hàng VND)</span>
          <span className={styles.liValue}>+ {fmtVnd(b?.buyingServiceFeeVnd)}</span>
        </li>
        <li>
          <span className={styles.liMain}>Cước vận chuyển quốc tế (phân bổ / 1 sản phẩm)</span>
          <span className={styles.liValue}>
            {(b?.shippingCostPerUnit ?? 0) > 0 ? (
              <>+ {fmtVnd(b.shippingCostPerUnit)}</>
            ) : (
              <span className={styles.muted}>Chưa có dữ liệu hoặc = 0</span>
            )}
          </span>
          {b?.shippingNote && (b?.shippingCostPerUnit ?? 0) > 0 && (
            <div className={styles.liNote}>{b.shippingNote}</div>
          )}
        </li>
        <li>
          <span className={styles.liMain}>Thuế nhập khẩu (phân bổ / 1 sản phẩm)</span>
          <span className={styles.liValue}>
            {(b?.taxPerUnit ?? 0) > 0 ? (
              <>+ {fmtVnd(b.taxPerUnit)}</>
            ) : (
              <span className={styles.muted}>Không có hoặc = 0</span>
            )}
          </span>
          {b?.taxNote && <div className={styles.liNote}>{b.taxNote}</div>}
        </li>
        <li>
          <span className={styles.liMain}>Chi phí khác trên PO (phân bổ / 1 sản phẩm)</span>
          <span className={styles.liValue}>
            {otherPu > 0 ? <>+ {fmtVnd(otherPu)}</> : <span className={styles.muted}>Không có</span>}
          </span>
        </li>
        <li>
          <span className={styles.liMain}>Chi phí cố định — ship nội TQ, đóng gói, ship nội VN (phân bổ / 1 sp)</span>
          <span className={styles.liValue}>
            {(b?.fixedCosts?.perUnit ?? 0) > 0 ? (
              <>+ {fmtVnd(b.fixedCosts.perUnit)}</>
            ) : (
              <span className={styles.muted}>Không có hoặc = 0</span>
            )}
          </span>
          {b?.fixedCosts?.note && (b?.fixedCosts?.perUnit ?? 0) > 0 && (
            <div className={styles.liNote}>{b.fixedCosts.note}</div>
          )}
        </li>
      </ol>

      <div className={styles.totalRow}>
        ➤ Tổng giá vốn landed (1 sản phẩm): <strong>{fmtVnd(landed)}</strong>
      </div>

      <div className={styles.sectionTitle}>Vì sao đề xuất mức giá này?</div>
      <ul className={styles.bulletList}>
        <li>
          Các khoản trên được cộng lại thành <strong>giá vốn landed {fmtVnd(landed)}</strong>. Đây là ngưỡng tối
          thiểu để tránh bán dưới vốn theo dữ liệu phiếu nhập.
        </li>
        {sug > 0 && marginSug != null && (
          <li>
            <strong>Mức giá đề xuất {formatCurrency(sug)}</strong> cao hơn vốn{' '}
            <strong>{marginSug.toFixed(1)}%</strong>
            {marginSug >= 10
              ? ' — đáp ứng hướng dẫn giữ biên lợi nhuận tối thiểu trên vốn (khoảng ≥ 10%).'
              : ' — biên dưới 10% trên vốn: cân nhắc tăng giá hoặc điều chỉnh chiến lược nếu phù hợp.'}
          </li>
        )}
        {avg != null && avg > 0 && sug > 0 && (
          <li>
            So với <strong>giá trung bình thị trường (tham chiếu) ~{formatCurrency(avg)}</strong>:
            {sug < avg * 0.95 && ' Đề xuất thấp hơn TB — ưu tiên cạnh tranh / xâm nhập.'}
            {sug >= avg * 0.95 && sug <= avg * 1.05 && ' Đề xuất gần mức TB — cân bằng cạnh tranh và lợi nhuận.'}
            {sug > avg * 1.05 && ' Đề xuất cao hơn TB — phù hợp khi tập trung lợi nhuận hoặc có lợi thế (rating, chất lượng).'}
          </li>
        )}
        {cur > 0 && landed > 0 && (
          <li>
            <strong>Giá bán hiện tại {formatCurrency(cur)}</strong>
            {marginCur != null
              ? ` tương ứng biên ~${marginCur.toFixed(1)}% trên vốn landed.`
              : '.'}
          </li>
        )}
      </ul>

    </div>
  );
}

PoCostBreakdown.propTypes = {
  costData: PropTypes.shape({
    hasCostData: PropTypes.bool,
    landedCostPerUnit: PropTypes.number,
    poCode: PropTypes.string,
    sku: PropTypes.string,
    quantityInPo: PropTypes.number,
    isEstimate: PropTypes.bool,
    breakdown: PropTypes.object,
  }),
  suggestedPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currentPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marketAvg: PropTypes.number,
  variant: PropTypes.oneOf(['modal', 'panel']),
};
