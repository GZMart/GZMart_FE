import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dealService, campaignService } from '../../../services/api';
import { PUBLIC_ROUTES } from '../../../constants/routes';

// Helper function to format price
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Helper to map deal type to human-readable label
const TYPE_LABELS = {
  flash_sale: 'Flash Sale',
  daily_deal: 'Daily Deal',
  weekly_deal: 'Weekly Deal',
  limited_time: 'Limited Time',
  clearance: 'Clearance',
  special: 'Special Deal',
};

// Map deal type key to Vietnamese label
const getDealTypeLabel = (type) => TYPE_LABELS[type] || type || 'Deal';

// Helper to calculate time remaining
const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    return '< 1 Hour';
  }
  if (hours < 24) {
    return `${hours} Hours`;
  }

  const days = Math.floor(hours / 24);
  return `${days} Days`;
};

// Helper to format countdown timer
const formatCountdown = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

const dealsProductShape = PropTypes.shape({
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isNew: PropTypes.bool,
  image: PropTypes.string,
  name: PropTypes.string,
  dealEndsIn: PropTypes.string,
  dealType: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const ProductCard = ({ product }) => (
  <Link
    to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.productId || product.id)}`}
    style={{ textDecoration: 'none' }}
  >
    <motion.div
      className="card h-100 border-0 bg-transparent"
      whileHover={{ y: -10 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="p-3">
        <div
          className="position-relative w-100"
          style={{
            backgroundColor: 'var(--color-gray-100)',
            borderRadius: '16px',
            height: '240px',
            overflow: 'hidden',
          }}
        >
          {product.isNew && (
            <span
              className="position-absolute fw-bold text-white px-3 py-1"
              style={{
                backgroundColor: 'var(--color-primary)',
                top: '0',
                left: '0',
                borderRadius: '16px 0 16px 0',
                fontSize: '0.85rem',
                zIndex: 2,
              }}
            >
              New
            </span>
          )}

          <motion.img
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.3 }}
            src={product.image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px',
              display: 'block',
            }}
          />
        </div>
      </div>

      <div className="card-body d-flex flex-column pt-0 px-3 pb-3">
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-medium" style={{ color: 'var(--color-primary)' }}>
              {getDealTypeLabel(product.dealType)} Ends in {product.dealEndsIn} !
            </small>
          </div>

          <div
            className="progress rounded-pill"
            style={{ height: '6px', backgroundColor: '#E9ECEF' }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: product.dealType === 'flash_sale' ? '85%' : '40%',
                backgroundColor: 'var(--color-primary)',
              }}
              aria-valuenow="50"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        <h6
          className="card-title fw-bold text-dark mb-3 text-uppercase"
          style={{ lineHeight: '1.4', fontSize: '1.2rem' }}
        >
          {product.name}
        </h6>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-dark w-100 fw-bold py-2 mt-auto d-flex align-items-center justify-content-center gap-2"
          style={{
            borderRadius: '4px',
            fontSize: '0.85rem',
          }}
        >
          <span className="text-white">BUY NOW - </span>
          <span style={{ color: 'var(--color-danger)' }}>{product.price}</span>
        </motion.button>
      </div>
    </motion.div>
  </Link>
);

ProductCard.propTypes = {
  product: dealsProductShape.isRequired,
};

const DealsOfTheDay = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nearestEndDate, setNearestEndDate] = useState(null);

  // --- CAROUSEL STATES ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(4);
  const [isHovered, setIsHovered] = useState(false); // Used to pause autoplay

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);

        const [flashSaleRes, dealsRes] = await Promise.allSettled([
          campaignService.getActive(),
          dealService.getActiveDeals({ limit: 12 }), // Chỉ cần 12 deals cho carousel
        ]);

        // ── Parse flash sales ────────────────────────────────────
        let flashSalesData = [];
        if (flashSaleRes.status === 'fulfilled') {
          const response = flashSaleRes.value;
          if (Array.isArray(response)) {
            flashSalesData = response;
          } else if (response?.data) {
            flashSalesData = Array.isArray(response.data)
              ? response.data
              : response.data?.data || [];
          }
        }

        // Filter flash sales active today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayFlashSales = flashSalesData
          .filter((fs) => {
            // Lọc bỏ các flash sale không có productId hợp lệ
            const pid = typeof fs.productId === 'object' ? fs.productId?._id : fs.productId;
            return pid && String(pid).trim().length > 0;
          })
          .filter((fs) => {
            const startDate = new Date(fs.startAt);
            const endDate = new Date(fs.endAt);
            return startDate < tomorrow && endDate > today;
          });

        const transformedFlashSales = todayFlashSales.map((flashSale) => {
          const product = flashSale.productId;
          let variantModel = null;
          if (flashSale.variantSku && product?.models) {
            variantModel = product.models.find((m) => m.sku === flashSale.variantSku);
          }
          if (!variantModel) {
            variantModel = product?.models?.find((m) => m.isActive) || product?.models?.[0] || {};
          }
          return {
            id: flashSale._id,
            productId: product?._id,
            name: product?.name || 'Product',
            image: variantModel?.image || product?.images?.[0] || '',
            price: formatPrice(flashSale.salePrice || variantModel?.price || 0),
            originalPrice: variantModel?.price,
            discount:
              flashSale.discountPercent ||
              Math.round(((variantModel?.price - flashSale.salePrice) / variantModel?.price) * 100),
            dealEndsIn: getTimeRemaining(flashSale.endAt),
            endDate: flashSale.endAt,
            isNew: product?.isNew || false,
            dealType: 'flash_sale',
          };
        });

        // ── Parse active deals ───────────────────────────────────
        let dealsData = [];
        if (dealsRes.status === 'fulfilled') {
          const response = dealsRes.value;
          if (Array.isArray(response)) {
            dealsData = response;
          } else if (response?.data) {
            // API /api/deals trả về { data: [...] } → lấy response.data trực tiếp
            dealsData = Array.isArray(response.data) ? response.data : [];
          }
        }

        const transformedDeals = dealsData
          .filter((deal) => {
            // Chỉ lấy deals không phải flash_sale, không deduplicate theo productId
            // vì cùng 1 product có thể có nhiều deal types khác nhau
            const pid = typeof deal.productId === 'object' ? deal.productId?._id : deal.productId;
            return deal && pid && String(pid).trim().length > 0 && deal.type !== 'flash_sale';
          })
          .map((deal) => {
            const product = deal.productId;
            const pid = typeof product === 'object' ? product._id : product;
            const salePrice = deal.dealPrice || deal.discountedPrice || product?.price || 0;
            return {
              id: deal._id,
              productId: pid,
              name: product?.name || 'Product',
              image:
                (product?.models?.find((m) => m.isActive) || product?.models?.[0])?.image ||
                product?.images?.[0] ||
                '',
              price: formatPrice(salePrice),
              originalPrice: product?.originalPrice || product?.price,
              discount: deal.discountPercent || 0,
              dealEndsIn: getTimeRemaining(deal.endDate),
              endDate: deal.endDate,
              isNew: product?.isNew || false,
              dealType: deal.type || 'limited_time',
            };
          });

        // ── Smart sort & limit: 20 deals tối đa ─────────────────────────
        // Ưu tiên discount cao, đảm bảo variety giữa các deal types
        // Deduplicate by productId — keep the first occurrence (flash sales have priority)
        const seenProductIds = new Set();
        const allDeals = [...transformedFlashSales, ...transformedDeals].filter((deal) => {
          const pid = String(deal.productId);
          if (seenProductIds.has(pid)) return false;
          seenProductIds.add(pid);
          return true;
        });

        const DEAL_TYPE_PRIORITY = {
          flash_sale: 1,
          daily_deal: 2,
          weekly_deal: 3,
          limited_time: 4,
          clearance: 5,
          special: 6,
        };

        const sortedDeals = [...allDeals].sort((a, b) => {
          // Ưu tiên discount cao nhất
          const discountDiff = (b.discount || 0) - (a.discount || 0);
          if (discountDiff !== 0) {
return discountDiff;
}
          // Sau đó ưu tiên deal type
          return (DEAL_TYPE_PRIORITY[a.dealType] || 99) - (DEAL_TYPE_PRIORITY[b.dealType] || 99);
        });

        // Giới hạn 12 deals cho carousel homepage
        const topDeals = sortedDeals.slice(0, 20);
        setDeals(topDeals);

        // Find nearest end date for countdown từ topDeals
        if (topDeals.length > 0) {
          const sortedByEndDate = [...topDeals].sort(
            (a, b) => new Date(a.endDate) - new Date(b.endDate)
          );
          setNearestEndDate(sortedByEndDate[0].endDate);
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (!nearestEndDate) {
      return;
    }

    const updateCountdown = () => {
      const time = formatCountdown(nearestEndDate);
      setCountdown(time);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nearestEndDate]);

  // --- CAROUSEL LOGIC ---

  // 1. Responsive check to adjust items per slide
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 576) {
        setItemsPerSlide(1);
      } else if (window.innerWidth < 768) {
        setItemsPerSlide(2);
      } else if (window.innerWidth < 992) {
        setItemsPerSlide(3);
      } else {
        setItemsPerSlide(4);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = Math.ceil(deals.length / itemsPerSlide);

  // 2. Prevent empty screen if resizing pushes currentSlide out of bounds
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(totalSlides - 1);
    }
  }, [totalSlides, currentSlide]);

  // 3. Auto-navigation hook
  useEffect(() => {
    if (deals.length === 0 || isHovered) {
      return;
    } // Pause on hover

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Navigate every 4 seconds

    return () => clearInterval(timer);
  }, [deals.length, totalSlides, isHovered]);

  const titleParts = (() => {
    const words = "TODAY'S DEALS OF THE DAY".split(/\s+/);
    const splitAt = Math.ceil(words.length / 2);
    return {
      first: words.slice(0, splitAt).join(' '),
      second: words.slice(splitAt).join(' '),
    };
  })();

  return (
    <section className="py-5">
      <div className="container">
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
          <h3 className="fw-bold mb-3 mb-md-0">
            <span className="text-dark">{titleParts.first}</span>{' '}
            <span style={{ color: 'var(--color-primary)' }}>{titleParts.second}</span>
          </h3>

          <div className="d-flex align-items-center gap-3">
            <span className="fs-6 text-dark text-nowrap">Deals ends in</span>
            <div
              className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-white bg-primary"
              style={{
                backgroundColor: 'var(--color-primary)',
                minWidth: '160px',
                fontSize: '1rem',
              }}
            >
              <span>
                {countdown.expired
                  ? 'Expired'
                  : `${countdown.days}d : ${countdown.hours}h : ${countdown.minutes}m : ${countdown.seconds}s`}
              </span>
            </div>

            <Link to={PUBLIC_ROUTES.DEALS} style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'var(--color-secondary)' }}
                whileTap={{ scale: 0.95 }}
                className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-white btn-primary"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  border: 'none',
                }}
              >
                VIEW ALL
              </motion.button>
            </Link>
          </div>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5">No deals available at the moment</p>
          </div>
        ) : (
          <div
            className="carousel-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ overflow: 'hidden', padding: '10px 0' }}>
              <motion.div
                style={{ display: 'flex' }}
                animate={{ x: `-${currentSlide * 100}%` }}
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
              >
                {deals.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    style={{
                      minWidth: `${100 / itemsPerSlide}%`,
                      padding: '0 12px', // Simulates Bootstrap's standard gutter spacing
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Dots Navigation */}
            {totalSlides > 1 && (
              <div className="d-flex justify-content-center mt-4 gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      width: currentSlide === index ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: currentSlide === index ? 'var(--color-primary)' : '#ccc',
                      border: 'none',
                      padding: 0,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DealsOfTheDay;
