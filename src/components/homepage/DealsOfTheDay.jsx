import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dealService, flashsaleService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

// Helper function to format price
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
              Flash Deal Ends in {product.dealEndsIn} !
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
                width: product.dealEndsIn.includes('1 Hour') ? '85%' : '40%',
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

const DealsOfTheDay = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nearestEndDate, setNearestEndDate] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);

        const [flashSaleRes, dealsRes] = await Promise.allSettled([
          flashsaleService.getActive(),
          dealService.getActiveDeals({ limit: 20 }),
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

        const todayFlashSales = flashSalesData.filter((fs) => {
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
            image: product?.images?.[0] || variantModel?.image || '',
            price: formatPrice(flashSale.salePrice || variantModel?.price || 0),
            originalPrice: variantModel?.price,
            discount:
              flashSale.discountPercent ||
              Math.round(((variantModel?.price - flashSale.salePrice) / variantModel?.price) * 100),
            dealEndsIn: getTimeRemaining(flashSale.endAt),
            endDate: flashSale.endAt,
            isNew: product?.isNew || false,
          };
        });

        // ── Parse active deals (special, daily_deal, etc.) ───────
        let dealsData = [];
        if (dealsRes.status === 'fulfilled') {
          const response = dealsRes.value;
          if (Array.isArray(response)) {
            dealsData = response;
          } else if (response?.data) {
            dealsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
          }
        }

        const flashSaleProductIds = new Set(transformedFlashSales.map((p) => String(p.productId)));

        const transformedDeals = dealsData
          .filter((deal) => deal && deal.productId && deal.type !== 'flash_sale')
          .filter((deal) => {
            const pid = typeof deal.productId === 'object' ? deal.productId._id : deal.productId;
            return !flashSaleProductIds.has(String(pid));
          })
          .map((deal) => {
            const product = deal.productId;
            const pid = typeof product === 'object' ? product._id : product;
            const salePrice = deal.dealPrice || deal.discountedPrice || product?.price || 0;
            return {
              id: deal._id,
              productId: pid,
              name: product?.name || 'Product',
              image: product?.images?.[0] || '',
              price: formatPrice(salePrice),
              originalPrice: product?.originalPrice || product?.price,
              discount: deal.discountPercent || 0,
              dealEndsIn: getTimeRemaining(deal.endDate),
              endDate: deal.endDate,
              isNew: product?.isNew || false,
            };
          });

        const allDeals = [...transformedFlashSales, ...transformedDeals];
        setDeals(allDeals);

        // Find nearest end date for countdown
        if (allDeals.length > 0) {
          const sortedByEndDate = [...allDeals].sort(
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

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nearestEndDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
          <h3 className="fw-bold text-dark mb-3 mb-md-0">TODAY'S DEALS OF THE DAY</h3>

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
          <motion.div
            className="row g-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {deals.map((product) => (
              <motion.div
                key={product.id}
                className="col-12 col-sm-6 col-md-4 col-lg-3"
                variants={itemVariants}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DealsOfTheDay;
