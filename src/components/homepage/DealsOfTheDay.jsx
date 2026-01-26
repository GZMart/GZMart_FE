import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dealService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

// Helper function to format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Helper to calculate time remaining
const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '< 1 Hour';
  if (hours < 24) return `${hours} Hours`;

  const days = Math.floor(hours / 24);
  return `${days} Days`;
};

// Helper to format countdown timer
const formatCountdown = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
      style={{ textDecoration: 'none' }}
    >
      <motion.div
        className="card h-100 border-0 bg-transparent"
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="p-3">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: '#FAFAFA',
              padding: '10px',
              borderRadius: '24px',
            }}
          >
            <div
              className="position-relative w-100 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: '#ECEDEF',
                borderRadius: '16px',
                height: '240px',
                overflow: 'hidden',
                padding: '24px',
              }}
            >
              {product.isNew && (
                <span
                  className="position-absolute fw-bold text-white px-3 py-1"
                  style={{
                    backgroundColor: '#FFC107',
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
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                src={product.image}
                alt={product.name}
                className="img-fluid"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '16px',
                }}
              />
            </div>
          </div>
        </div>

        <div className="card-body d-flex flex-column pt-0 px-3 pb-3">
          <div className="mb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="fw-medium" style={{ color: '#007bff' }}>
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
                  backgroundColor: '#007bff',
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
            <span style={{ color: '#FFC107' }}>{product.price}</span>
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
};

const DealsOfTheDay = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nearestEndDate, setNearestEndDate] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await dealService.getAllDeals();

        console.log('🔍 DealsOfTheDay - Full API Response:', response);
        console.log('🔍 DealsOfTheDay - Response.data:', response.data);

        const dealsData = Array.isArray(response) ? response : response.data || [];

        console.log('🔍 DealsOfTheDay - Deals Data:', dealsData);
        console.log('🔍 DealsOfTheDay - First Deal:', dealsData[0]);

        const transformedDeals = dealsData.map((deal) => {
          // Backend populates 'productId' not 'product'
          const product = deal.productId || deal.product;

          console.log('🔍 Deal transform:', {
            dealId: deal._id,
            hasProductId: !!deal.productId,
            hasProduct: !!deal.product,
            productData: product,
            discountedPrice: deal.discountedMinPrice || deal.discountedPrice,
          });

          return {
            id: deal._id,
            name: product?.name || 'Product',
            image: product?.images?.[0] || product?.image || '',
            price: formatPrice(
              deal.discountedMinPrice || deal.discountedPrice || product?.price || 0
            ),
            originalPrice: product?.price,
            discount: deal.discountPercent,
            dealEndsIn: getTimeRemaining(deal.endDate),
            endDate: deal.endDate,
            isNew: product?.isNew || false,
          };
        });

        setDeals(transformedDeals.slice(0, 4));

        // Find nearest end date
        if (transformedDeals.length > 0) {
          const sortedByEndDate = [...transformedDeals].sort(
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
    if (!nearestEndDate) return;

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
              className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-dark"
              style={{
                backgroundColor: '#FCBD01',
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
                whileHover={{ scale: 1.05, backgroundColor: '#e0a800' }}
                whileTap={{ scale: 0.95 }}
                className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-dark"
                style={{
                  backgroundColor: '#FCBD01',
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
                className="col-12 col-sm-6 col-lg-3"
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
