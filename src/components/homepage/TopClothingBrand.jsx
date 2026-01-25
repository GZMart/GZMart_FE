import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { brandService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

const COLOR_SCHEMES = [
  {
    bgColor: '#1F1F1F',
    textColor: '#FFFFFF',
    tagColor: '#333333',
    circleColor: 'rgba(255, 255, 255, 0.1)',
    lineColor: 'rgba(255, 255, 255, 0.05)',
  },
  {
    bgColor: '#FDF0CC',
    textColor: '#000000',
    tagColor: '#F3DE6D',
    circleColor: 'rgba(255, 255, 255, 0.4)',
    lineColor: 'rgba(255, 255, 255, 0.6)',
  },
  {
    bgColor: '#FCECE0',
    textColor: '#000000',
    tagColor: '#F2D4C2',
    circleColor: 'rgba(255, 255, 255, 0.4)',
    lineColor: 'rgba(255, 255, 255, 0.6)',
  },
  {
    bgColor: '#E3F2FD',
    textColor: '#000000',
    tagColor: '#BBDEFB',
    circleColor: 'rgba(255, 255, 255, 0.5)',
    lineColor: 'rgba(33, 150, 243, 0.2)',
  },
  {
    bgColor: '#FFEBEE',
    textColor: '#D32F2F',
    tagColor: '#FFCDD2',
    circleColor: 'rgba(211, 47, 47, 0.1)',
    lineColor: 'rgba(211, 47, 47, 0.2)',
  },
  {
    bgColor: '#FFFFFF',
    textColor: '#E60033',
    tagColor: '#F5F5F5',
    circleColor: 'rgba(230, 0, 51, 0.05)',
    lineColor: 'rgba(230, 0, 51, 0.1)',
  },
];

const TopClothingBrand = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await brandService.getTopBrands(10);
        const brandsData = Array.isArray(response) ? response : response.data || [];

        const transformedBrands = brandsData.map((brand, index) => ({
          id: brand._id,
          brandName: brand.name,
          logoUrl:
            brand.logo || brand.imageUrl || 'https://via.placeholder.com/150x50?text=' + brand.name,
          discount: `UP to ${brand.discount || 50}% OFF`,
          productImg: brand.featuredImage || brand.image || 'https://via.placeholder.com/300',
          ...COLOR_SCHEMES[index % COLOR_SCHEMES.length],
        }));

        setBrands(transformedBrands);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const BRAND_DEALS = brands;
  const activeIndex = currentIndex;
  const itemsToShow = 3;
  const totalItems = BRAND_DEALS.length;
  const maxIndex = Math.max(0, totalItems - itemsToShow);
  const visibleItems = BRAND_DEALS.slice(activeIndex, activeIndex + itemsToShow);

  useEffect(() => {
    if (!loading && maxIndex > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((current) => (current === maxIndex ? 0 : current + 1));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [maxIndex, loading]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </section>
    );
  }

  const BrandBannerCard = ({ item }) => {
    return (
      <motion.div
        whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        className="d-flex position-relative rounded-3 overflow-hidden h-100"
        style={{
          backgroundColor: item.bgColor,
          minHeight: '220px',
          cursor: 'pointer',
        }}
      >
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '320px',
            height: '320px',
            backgroundColor: item.circleColor,
            top: '-40px',
            right: '-80px',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div
          className="position-absolute rounded-circle"
          style={{
            width: '320px',
            height: '320px',
            border: `1px solid ${item.lineColor}`,
            top: '-40px',
            right: '20px',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div
          className="d-flex flex-column justify-content-between p-4"
          style={{ width: '55%', zIndex: 2 }}
        >
          <div>
            <span
              className="badge rounded-1 px-3 py-2 fw-semibold"
              style={{
                backgroundColor: item.tagColor,
                color: item.textColor,
                fontSize: '0.9rem',
                letterSpacing: '1px',
              }}
            >
              {item.brandName.toUpperCase()}
            </span>
          </div>

          <div className="my-3">
            <img
              src={item.logoUrl}
              alt={item.brandName}
              style={{
                maxWidth: '100px',
                maxHeight: '50px',
                filter: item.id === 1 ? 'brightness(0) invert(1)' : 'none',
              }}
            />
          </div>

          <h5 className="fw-semibold m-0" style={{ color: item.textColor }}>
            {item.discount}
          </h5>
        </div>

        <div
          className="position-absolute h-100 d-flex align-items-end justify-content-end"
          style={{
            width: '50%',
            right: '15px',
            bottom: '15px',
            zIndex: 1,
          }}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            src={item.productImg}
            alt="Product"
            className="img-fluid"
            style={{
              height: '90%',
              objectFit: 'contain',
              position: 'relative',
            }}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
            <h3 className="fw-bold text-dark m-0">TOP</h3>
            <h3 className="fw-bold m-0" style={{ color: '#FFC107' }}>
              CLOTHING BRANDS
            </h3>
          </div>
          <Link to={PUBLIC_ROUTES.PRODUCTS} style={{ textDecoration: 'none' }}>
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

        <hr className="my-4 text-secondary opacity-25" />

        {brands.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5">No brands available at the moment</p>
          </div>
        ) : (
          <>
            <div className="row g-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  className="d-flex w-100 gap-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="col-lg-4 col-md-6 col-12"
                      style={{ flex: '1 0 0%' }}
                    >
                      <BrandBannerCard item={item} />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
              {[...Array(maxIndex + 1)].map((_, i) => (
                <motion.div
                  key={i}
                  onClick={() => handleDotClick(i)}
                  animate={{
                    width: i === activeIndex ? 40 : 8,
                    backgroundColor: i === activeIndex ? '#0099DD' : '#D9D9D9',
                  }}
                  style={{
                    height: '8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default TopClothingBrand;
