import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/PromotionBadge.module.css';

/**
 * Combo Promotion Banner
 * Shows tier-based discounts (e.g., "Buy 2 get 10% off")
 */
export const ComboPromotionBanner = ({ combos }) => {
  if (!combos || combos.length === 0) {
    return null;
  }

  return (
    <div className={styles.comboSection}>
      <div className={styles.sectionHeader}>
        <i className="bi bi-tags-fill"></i>
        <span>Combo Promotion</span>
      </div>
      {combos.map((combo) => (
        <div key={combo.comboId} className={styles.comboCard}>
          <div className={styles.comboName}>{combo.name}</div>
          <div className={styles.comboTiers}>
            {combo.tiers.map((tier, idx) => {
              const label =
                combo.comboType === 'percent'
                  ? `Buy ${tier.quantity}, get ${tier.value}% off`
                  : combo.comboType === 'fixed_price'
                    ? `Buy ${tier.quantity}, save ${formatCurrency(tier.value)}`
                    : `Buy ${tier.quantity} for ${formatCurrency(tier.value)}`;

              return (
                <span key={idx} className={styles.tierBadge}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Add-on Deal Cards
 * Shows add-on products with discounted prices
 */
export const AddOnDealCards = ({ deals }) => {
  if (!deals || deals.length === 0) {
    return null;
  }

  return (
    <div className={styles.addonSection}>
      <div className={styles.sectionHeader}>
        <i className="bi bi-gift-fill"></i>
        <span>Add-on Deals</span>
      </div>
      {deals.map((deal) => (
        <div key={deal.dealId} className={styles.addonDeal}>
          <div className={styles.addonDealName}>{deal.name}</div>
          <div className={styles.addonItems}>
            {deal.subProducts.map((sp, idx) => {
              if (!sp.product) {
                return null;
              }
              const savings =
                sp.originalPrice > sp.price
                  ? Math.round(((sp.originalPrice - sp.price) / sp.originalPrice) * 100)
                  : 0;

              return (
                <div key={idx} className={styles.addonItem}>
                  <div className={styles.addonImageWrap}>
                    {sp.product.images?.[0] ? (
                      <img
                        src={sp.product.images[0]}
                        alt={sp.product.name}
                        className={styles.addonImage}
                      />
                    ) : (
                      <div className={styles.addonImagePlaceholder}>
                        <i className="bi bi-image"></i>
                      </div>
                    )}
                  </div>
                  <div className={styles.addonInfo}>
                    <div className={styles.addonProductName}>{sp.product.name}</div>
                    <div className={styles.addonPricing}>
                      <span className={styles.addonSalePrice}>{formatCurrency(sp.price)}</span>
                      {sp.originalPrice > sp.price && (
                        <>
                          <span className={styles.addonOriginalPrice}>
                            {formatCurrency(sp.originalPrice)}
                          </span>
                          <span className={styles.addonSavings}>-{savings}%</span>
                        </>
                      )}
                    </div>
                    {sp.limit && (
                      <div className={styles.addonLimit}>Limit: {sp.limit} per order</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
