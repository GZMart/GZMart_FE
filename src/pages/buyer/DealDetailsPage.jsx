import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Select, Progress, Spin, Result } from 'antd';
import {
  LeftOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dealService from '@/services/api/dealService';
import styles from '@assets/styles/buyer/DealDetailsPage.module.css';

const { Title, Text } = Typography;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Compute { hours, minutes, seconds } remaining until `isoEndDate`. */
const calcTimeLeft = (isoEndDate) => {
  const diff = Math.max(0, new Date(isoEndDate) - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = ({ hours, minutes, seconds }) =>
  `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

const fmtPrice = (n) =>
  typeof n === 'number' ? n.toLocaleString('vi-VN') : '—';

// ─── component ────────────────────────────────────────────────────────────────

const DealDetailsPage = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();

  // Data state
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Variant selections: { [variationName]: selectedOption }
  const [selectedVariants, setSelectedVariants] = useState({});

  // Countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // ── fetch deal ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dealId) return;

    const fetchDeal = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dealService.getDealById(dealId);
        const data = response?.data?.data ?? response?.data ?? null;
        if (!data) throw new Error('Deal not found');
        setDeal(data);
        // Seed countdown from real endDate
        if (data.endDate) setTimeLeft(calcTimeLeft(data.endDate));
      } catch (err) {
        console.error('❌ DealDetailsPage: failed to fetch deal', err);
        setError(err?.response?.data?.message || err.message || 'Không tải được deal');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId]);

  // ── countdown ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!deal?.endDate) return;
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(deal.endDate));
    }, 1000);
    return () => clearInterval(id);
  }, [deal?.endDate]);

  // ── derived values ──────────────────────────────────────────────────────────
  const product = deal?.productId ?? {};
  const tierVariations = Array.isArray(product.tier_variations) ? product.tier_variations : [];

  const allVariantsSelected =
    tierVariations.length === 0 ||
    tierVariations.every((v) => selectedVariants[v.name]);

  const handleVariantChange = useCallback((varName, value) => {
    setSelectedVariants((prev) => ({ ...prev, [varName]: value }));
  }, []);

  const soldCount = deal?.soldCount ?? 0;
  const quantityLimit = deal?.quantityLimit ?? null;
  const fillPercent =
    quantityLimit && quantityLimit > 0
      ? Math.min(100, Math.round((soldCount / quantityLimit) * 100))
      : 0;

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!allVariantsSelected) {
      alert('Please select all variant options before adding to cart.');
      return;
    }
    console.log('🛒 Add to cart:', { dealId, quantity, selectedVariants });
    alert('Added to cart successfully!');
  };

  const handleBuyNow = () => {
    if (!allVariantsSelected) {
      alert('Please select all variant options before purchasing.');
      return;
    }
    navigate('/checkout', { state: { dealId, quantity, selectedVariants } });
  };

  const handleShareDeal = () => {
    navigator.clipboard.writeText(`${window.location.origin}/deal/${dealId}`);
    alert('Deal link copied to clipboard!');
  };

  // ── loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading deal..." />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <Result
        status="404"
        title="Deal not found"
        subTitle={error ?? 'The deal you are looking for does not exist or has expired.'}
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        }
      />
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────
  const mainImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

  return (
    <div className={styles.dealDetailsPage}>
      <div className={styles.dealDetailsContainer}>
        {/* Header */}
        <div className={styles.dealDetailsHeader}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            className={styles.backButton}
          />
          <span className={styles.headerTitle}>Deal Details</span>
        </div>

        {/* Status alert — show for active deals */}
        {deal.status === 'active' && (
          <div className={`${styles.dealAlert} ${styles.pendingAlert}`}>
            ⚡ This deal is <strong>LIVE</strong> — ends in{' '}
            <strong>{fmtTime(timeLeft)}</strong>
          </div>
        )}

        <div className={styles.dealDetailsContent}>
          {/* ── Left: Images ── */}
          <div className={styles.dealDetailsLeft}>
            <div className={styles.dealMainImage}>
              <img src={mainImage} alt={product.name} />
            </div>
            {product.images?.length > 1 && (
              <div className={styles.dealThumbnailGallery}>
                {product.images.map((img, index) => (
                  <div key={index} className={styles.thumbnail}>
                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Details ── */}
          <div className={styles.dealDetailsRight}>
            {/* Rating */}
            {product.rating != null && (
              <div className={styles.dealRatingSection}>
                <span className={styles.ratingStars}>
                  {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}{' '}
                  {product.rating}
                </span>
                {product.reviewCount != null && (
                  <span className={styles.ratingCount}>
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Product Name */}
            <Title level={2} className={styles.dealName}>
              {product.name ?? 'Deal Product'}
            </Title>

            {/* Meta row */}
            <div className={styles.dealInfoRow}>
              {product.brand && (
                <div className={styles.infoItemInline}>
                  <span className={styles.label}>
                    Brand:{' '}
                    <span className={styles.value}>
                      {typeof product.brand === 'object' ? product.brand?.name : product.brand}
                    </span>
                  </span>
                </div>
              )}
              {product.category && (
                <div className={styles.infoItemInline}>
                  <span className={styles.label}>
                    Category:{' '}
                    <span className={styles.value}>
                      {typeof product.category === 'object'
                        ? product.category?.name
                        : product.category}
                    </span>
                  </span>
                </div>
              )}
              <div className={styles.infoItemInline}>
                <span className={styles.label}>
                  Deal Type:{' '}
                  <span className={styles.value} style={{ textTransform: 'capitalize' }}>
                    {deal.type?.replace(/_/g, ' ') ?? '—'}
                  </span>
                </span>
              </div>
            </div>

            {/* Price */}
            <div className={styles.dealPriceAndQuantity}>
              <div className={styles.dealPriceSection}>
                <div className={styles.priceMain}>
                  <span className={styles.currency}>₫</span>
                  <span className={styles.priceValue}>
                    {fmtPrice(deal.dealPrice ?? deal.discountedPrice)}
                  </span>
                  {product.originalPrice != null && (
                    <span className={styles.originalPrice}>
                      ₫{fmtPrice(product.originalPrice)}
                    </span>
                  )}
                  {deal.discountPercent > 0 && (
                    <span className={styles.discount}>{deal.discountPercent}% OFF</span>
                  )}
                </div>
                {deal.discountedMinPrice !== deal.discountedMaxPrice && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Range: ₫{fmtPrice(deal.discountedMinPrice)} – ₫{fmtPrice(deal.discountedMaxPrice)}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className={styles.quantitySection}>
                <label className={styles.quantityLabel}>Quantity</label>
                <div className={styles.quantityControl}>
                  <Button
                    type="text"
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className={styles.qtyBtn}
                  />
                  <span className={styles.qtyValue}>{quantity}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setQuantity((q) => q + 1)}
                    className={styles.qtyBtn}
                  />
                </div>
              </div>
            </div>

            {/* ── Variant selectors (dynamic from tier_variations) ── */}
            {tierVariations.length > 0 && (
              <div className={styles.dealOptionsWrapper}>
                <div className={styles.dealOptions}>
                  {tierVariations.map((variation) => (
                    <div key={variation.name} className={styles.optionGroup}>
                      <label className={styles.optionLabel}>{variation.name}</label>
                      {/* If options have images, show color swatches; otherwise a Select */}
                      {variation.images?.length > 0 ? (
                        <div className={styles.colorOptions}>
                          {variation.options.map((opt, idx) => (
                            <div
                              key={opt}
                              className={`${styles.colorBox} ${
                                selectedVariants[variation.name] === opt ? styles.selected : ''
                              }`}
                              style={{
                                backgroundImage: `url(${variation.images[idx] || ''})`,
                                backgroundSize: 'cover',
                              }}
                              onClick={() => handleVariantChange(variation.name, opt)}
                              title={opt}
                            />
                          ))}
                        </div>
                      ) : (
                        <Select
                          placeholder={`Select ${variation.name}`}
                          value={selectedVariants[variation.name]}
                          onChange={(val) => handleVariantChange(variation.name, val)}
                          className={styles.optionSelect}
                          options={variation.options.map((o) => ({ value: o, label: o }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Deal stats ── */}
            <div className={styles.dealInfoStats}>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Deal Members Filled</span>
                  <span className={styles.statValue}>
                    {soldCount}
                    {quantityLimit != null ? ` / ${quantityLimit}` : ''}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Deal Price</span>
                  <span className={styles.statValue}>
                    ₫{fmtPrice(deal.dealPrice ?? deal.discountedPrice)}
                  </span>
                </div>
              </div>

              {quantityLimit != null && (
                <div className={styles.progressSection}>
                  <Progress
                    percent={fillPercent}
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </div>
              )}

              {/* Countdown */}
              {deal.endDate && (
                <div className={styles.timerSection}>
                  <span className={styles.timerLabel}>
                    Deal ends in: <strong>{fmtTime(timeLeft)}</strong>
                  </span>
                  <div className={styles.timerProgressBar}>
                    <div
                      className={styles.timerProgress}
                      style={{
                        width: `${Math.max(0, Math.min(100, (timeLeft.hours / 24) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Action buttons ── */}
            <div className={styles.actionButtons}>
              <Button
                type="default"
                size="large"
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                icon={<ShoppingCartOutlined />}
              >
                ADD TO CART
              </Button>
              <Button
                type="primary"
                size="large"
                className={styles.buyNowBtn}
                onClick={handleBuyNow}
              >
                🔒 BUY NOW
              </Button>
            </div>

            {/* ── Secondary actions ── */}
            <div className={styles.secondaryActions}>
              <Button
                type="text"
                className={styles.actionLink}
                onClick={() => setIsWishlisted((w) => !w)}
                icon={isWishlisted ? <HeartFilled style={{ color: '#f5222d' }} /> : <HeartOutlined />}
              >
                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </Button>
              <Button type="text" className={styles.actionLink}>
                Add to Compare
              </Button>
              <Button type="text" className={styles.actionLink} onClick={handleShareDeal}>
                Share Deal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailsPage;
