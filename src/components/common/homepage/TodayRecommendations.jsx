import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../../../services/api';
import promotionBuyerService from '../../../services/api/promotionBuyerService';
import { PUBLIC_ROUTES } from '../../../constants/routes';

// Helper to format price
const formatPrice = (price) => {
  if (!price && price !== 0) {
    return '0';
  }
  return new Intl.NumberFormat('vi-VN').format(price);
};

// Helper to calculate discount percentage
const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Helper to get product image
const getProductImage = (product) => {
  // Prefer active model's image (variant-specific)
  const activeModel = product?.models?.find(m => m.isActive) || product?.models?.[0];
  if (activeModel?.image) {
return activeModel.image;
}
  if (product?.images?.length > 0) {
return product.images[0];
}
  if (product?.image) {
return product.image;
}
  return 'https://via.placeholder.com/400x400?text=No+Image';
};

// Helper to get product price (sale price or regular price)
const getProductPrice = (product) => {
  // Try to get first active model
  const activeModel = product?.models?.find((m) => m.isActive) || product?.models?.[0];

  if (activeModel) {
    return {
      price: activeModel.salePrice || activeModel.price || 0,
      originalPrice: activeModel.salePrice ? activeModel.price : null,
      stock: activeModel.stock || 0,
    };
  }

  return {
    price: product?.price || 0,
    originalPrice: product?.originalPrice || null,
    stock: product?.stock || 0,
  };
};

const badgeShape = PropTypes.shape({
  text: PropTypes.string,
  bg: PropTypes.string,
  color: PropTypes.string,
});

const frequentlyBoughtProductShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  description: PropTypes.string,
  price: PropTypes.number,
  originalPrice: PropTypes.number,
  stock: PropTypes.number,
  badges: PropTypes.arrayOf(badgeShape),
});

// Reusable Product Card Component for the Grid
const ProductCard = ({ product }) => (
  <Link
    to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <motion.div
      className="h-100 p-3 bg-white border border-light-subtle rounded d-flex flex-column position-relative"
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      {product.badges.length > 0 && (
        <div className="position-absolute top-0 start-0 m-2 z-1 d-flex flex-column gap-1">
          {product.badges.map((badge, idx) => (
            <Badge
              key={idx}
              bg={badge.bg}
              text={badge.color}
              className="rounded-1 px-2 py-1 fw-bold small shadow-sm"
            >
              {badge.text}
            </Badge>
          ))}
        </div>
      )}
      
      {/* AI Recommendation Source Badge */}
      {product.recSource && (
        <div className="position-absolute top-0 end-0 m-2 z-1">
          <Badge
            bg={product.recSource === 'trending' ? 'secondary' : 'primary'}
            className="rounded-pill px-2 py-1 small shadow-sm"
            style={{ fontSize: '0.65rem', opacity: 0.85 }}
          >
            {product.recSource === 'trending' ? 'HOT TREND' : 
             product.recSource === 'content' ? '✨ AI: SIMILAR' : 
             product.recSource === 'collab' ? '🤝 AI: BOUGHT TOGETHER' : 
             '🌟 AI: HYBRID'}
          </Badge>
        </div>
      )}

      <div
        className="d-flex align-items-center justify-content-center mb-3 rounded"
        style={{ height: '200px', overflow: 'hidden' }}
      >
        <img
          src={product.image}
          className="img-fluid"
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          alt={product.title}
        />
      </div>

      <div className="d-flex flex-column flex-grow-1">
        <h6
          className="fw-semibold mb-2 text-dark"
          style={{
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '42px',
          }}
          title={product.title}
        >
          {product.title}
        </h6>

        <div className="mt-auto d-flex justify-content-between align-items-end">
          <div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="mb-1">
                <span className="text-decoration-line-through text-secondary me-2 small">
                  {formatPrice(product.originalPrice)}₫
                </span>
              </div>
            )}
            <span
              className="fw-bold fs-5"
              style={{ color: product.isFlashSale ? '#e53935' : 'var(--color-primary)' }}
            >
              {formatPrice(product.price)}₫
            </span>
          </div>

          {/* Số lượng đã bán căn phải */}
          <div className="text-secondary mb-1" style={{ fontSize: '0.8rem' }}>
            {product.sold >= 1000
              ? `${(product.sold / 1000).toFixed(1).replace('.0', '')}k sold`
              : `${product.sold} sold`}
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

ProductCard.propTypes = {
  product: frequentlyBoughtProductShape.isRequired,
};

const TodayRecommendations = ({ title = 'RECOMMENDED FOR YOU' }) => {
  const [products, setProducts] = useState([]);
  const [promoMap, setPromoMap] = useState({});
  const [loading, setLoading] = useState(true);

  const renderDualToneTitle = () => {
    const words = (title || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return <h3 className="fw-bold text-dark m-0">{title}</h3>;
    }

    const splitAt = Math.ceil(words.length / 2);
    const first = words.slice(0, splitAt).join(' ');
    const second = words.slice(splitAt).join(' ');

    return (
      <h3 className="fw-bold m-0 mb-4">
        <span className="text-dark">{first}</span>
        {second ? <span style={{ color: 'var(--color-primary)' }}> {second}</span> : null}
      </h3>
    );
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let response;
        try {
          // Fetch 40 products (8 rows of 5)
          response = await productService.getPersonalizedRecommendations(40);
        } catch (todayError) {
          // Backward-compatible fallback
          response = await productService.getTrendingProducts(40);
        }
        const apiData = Array.isArray(response) ? response : response.data || [];
        setProducts(apiData);

        // Fetch flash sale promotions for all products
        const ids = apiData.map((p) => String(p._id)).filter(Boolean);
        if (ids.length > 0) {
          try {
            const promoResponse = await promotionBuyerService.getProductPromotionsBatch(ids);
            const rawMap =
              promoResponse?.success === true && promoResponse?.data
                ? promoResponse.data
                : promoResponse?.data ?? {};
            const map =
              rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap) ? rawMap : {};
            setPromoMap(map);
          } catch {
            // promotion fetch failure is non-blocking
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-5 bg-light">
        <Container>
          {renderDualToneTitle()}
          <hr className="my-4 text-secondary opacity-25" />
          <div className="text-center py-5">
            <p className="text-muted fs-5">No products available at the moment</p>
          </div>
        </Container>
      </section>
    );
  }

  // Transform all API data to uniform component format
  const transformedProducts = products.map((product) => {
    const productId = String(product._id ?? '');
    const priceInfo = getProductPrice(product);
    const promo = promoMap[productId];
    const preOrderDays = Number(product.preOrderDays) || 0;
    const treatAsSoldOut = priceInfo.stock === 0 && preOrderDays <= 0;

    // Overlay flash sale price if available
    let displayPrice = priceInfo.price;
    let displayOriginalPrice = priceInfo.originalPrice;
    let isFlashSale = false;

    if (
      promo?.flashSale?.salePrice != null &&
      Number(promo.flashSale.salePrice) > 0 &&
      Number(promo.flashSale.salePrice) < (priceInfo.price || Infinity)
    ) {
      displayPrice = Number(promo.flashSale.salePrice);
      displayOriginalPrice =
        Number(promo.flashSale.originalPrice) > 0
          ? Number(promo.flashSale.originalPrice)
          : priceInfo.price;
      isFlashSale = true;
    }

    const discount = calculateDiscount(displayOriginalPrice, displayPrice);

    return {
      id: productId,
      title: product.name,
      image: getProductImage(product),
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      stock: priceInfo.stock,
      sold: product.sold || 0,
      isFlashSale,
      badges: [
        treatAsSoldOut && { text: 'SOLD OUT', bg: 'secondary', color: 'white' },
        isFlashSale && { text: 'FLASH SALE', bg: 'danger', color: 'white' },
        !isFlashSale && discount > 0 && { text: `${discount}% OFF`, bg: 'warning', color: 'dark' },
        product.isHot && { text: 'HOT', bg: 'danger', color: 'white' },
        product.isNew && { text: 'NEW', bg: 'success', color: 'white' },
      ].filter(Boolean),
      isSoldOut: treatAsSoldOut,
      recSource: product.recSource,
    };
  });

  return (
    <section className="py-5 bg-light">
      <Container>
        {renderDualToneTitle()}

        {/* Grid System:
          - row-cols-2: 2 items per row on mobile
          - row-cols-md-3: 3 items per row on tablets
          - row-cols-lg-5: 5 items per row on large desktops
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Row className="row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 g-md-4">
            {transformedProducts.map((product) => (
              <Col key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Show More Button */}
        <div className="d-flex justify-content-center mt-5">
          <Link to={PUBLIC_ROUTES.PRODUCTS} style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: 'var(--color-primary)', // Nền đổi thành màu primary
                color: '#ffffff', // Chữ đổi thành màu trắng
              }}
              whileTap={{ scale: 0.95 }}
              className="btn px-5 py-2 fw-bold"
              style={{
                border: '2px solid var(--color-primary)', // Đóng khung viền
                color: 'var(--color-primary)', // Màu chữ lúc bình thường
                backgroundColor: 'transparent', // Nền trong suốt lúc bình thường
                borderRadius: '4px',
                transition: 'background-color 0.2s ease, color 0.2s ease', // Thêm transition cho mượt nếu cần
              }}
            >
              SHOW MORE
            </motion.button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

TodayRecommendations.propTypes = {
  title: PropTypes.string,
};

export default TodayRecommendations;
