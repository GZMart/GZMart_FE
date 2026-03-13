import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { productService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

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
  if (product?.images?.length > 0) {
    return product.images[0];
  }
  if (product?.image) {
    return product.image;
  }
  if (product?.models?.length > 0 && product.models[0]?.image) {
    return product.models[0].image;
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

const FrequentlyBoughtTogether = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use trending products instead of getAll for better relevance
        const response = await productService.getTrendingProducts(9);
        const apiData = Array.isArray(response) ? response : response.data || [];
        setProducts(apiData);
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
      <section className="py-5">
        <Container>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="fw-bold text-dark m-0">FREQUENTLY BOUGHT TOGETHER</h3>
          </div>
          <hr className="my-4 text-secondary opacity-25" />
          <div className="text-center py-5">
            <p className="text-muted fs-5">No products available at the moment</p>
          </div>
        </Container>
      </section>
    );
  }

  // Safe check: need at least 1 product
  if (!products || products.length === 0 || !products[0]) {
    return (
      <section className="py-5">
        <Container>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="fw-bold text-dark m-0">FREQUENTLY BOUGHT TOGETHER</h3>
            <Link to={PUBLIC_ROUTES.PRODUCTS} style={{ textDecoration: 'none' }}>
              <Button
                className="fw-bold px-4 border-0 text-dark"
                style={{ backgroundColor: '#FFC107', borderRadius: '4px' }}
              >
                VIEW ALL
              </Button>
            </Link>
          </div>
          <hr className="my-4 text-secondary opacity-25" />
          <div className="text-center py-5">
            <p className="text-muted fs-5">No products available at the moment</p>
          </div>
        </Container>
      </section>
    );
  }

  // Transform API data to component format
  const mainProduct = products[0];
  const mainPriceInfo = getProductPrice(mainProduct);
  const mainDiscount = calculateDiscount(mainPriceInfo.originalPrice, mainPriceInfo.price);

  const MAIN_PRODUCT = {
    id: mainProduct._id,
    title: mainProduct.name,
    image: getProductImage(mainProduct),
    description: mainProduct.description || 'Featured trending product',
    rating: mainProduct.rating || 5,
    reviews: mainProduct.sold || mainProduct.reviewCount || 0,
    price: mainPriceInfo.price,
    originalPrice: mainPriceInfo.originalPrice,
    stock: mainPriceInfo.stock,
    badges: [
      mainDiscount > 0 && {
        text: `${mainDiscount}% OFF`,
        bg: 'warning',
        color: 'dark',
      },
      mainProduct.isFeatured && { text: 'BEST SELLER', bg: 'danger', color: 'white' },
      mainProduct.isNew && { text: 'NEW', bg: 'success', color: 'white' },
    ].filter(Boolean),
  };

  const SIDE_PRODUCTS = products.slice(1, 9).map((product) => {
    const priceInfo = getProductPrice(product);
    const discount = calculateDiscount(priceInfo.originalPrice, priceInfo.price);

    return {
      id: product._id,
      title: product.name,
      image: getProductImage(product),
      price: priceInfo.price,
      originalPrice: priceInfo.originalPrice,
      stock: priceInfo.stock,
      badges: [
        priceInfo.stock === 0 && { text: 'SOLD OUT', bg: 'secondary', color: 'white' },
        discount > 0 && { text: `${discount}% OFF`, bg: 'warning', color: 'dark' },
        product.isHot && { text: 'HOT', bg: 'danger', color: 'white' },
        product.isNew && { text: 'NEW', bg: 'success', color: 'white' },
      ].filter(Boolean),
      isSoldOut: priceInfo.stock === 0,
    };
  });

  const MainProductItem = ({ product }) => (
    <Link
      to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <motion.div
        className="h-100 p-4 d-flex flex-column"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="d-flex flex-column gap-1 position-absolute m-3 z-1">
          {product.badges.map((badge, idx) => (
            <Badge
              key={idx}
              bg={badge.bg}
              text={badge.color}
              className="rounded-1 px-2 py-1 fw-bold"
            >
              {badge.text}
            </Badge>
          ))}
        </div>

        <div
          className="mb-3 d-flex align-items-center justify-content-center w-100"
          style={{ height: '320px' }}
        >
          <img
            src={product.image}
            alt={product.title}
            className="img-fluid"
            style={{ maxHeight: '100%', width: '100%', objectFit: 'contain' }}
          />
        </div>

        <div className="d-flex flex-column flex-grow-1">
          <div
            className="d-flex align-items-center mb-2 px-2 py-1 bg-light border border-light-subtle"
            style={{ borderRadius: '10px', width: 'fit-content' }}
          >
            <div className="d-flex text-warning">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#FFC107" strokeWidth={0} />
              ))}
            </div>
            <span className="text-secondary ms-2 small">({product.reviews} sold)</span>
          </div>

          <h5 className="fw-bold mb-2 lh-base">{product.title}</h5>

          <div className="mb-3">
            {product.originalPrice && (
              <span className="text-decoration-line-through text-secondary me-2">
                {formatPrice(product.originalPrice)}₫
              </span>
            )}
            <span className="fw-bold fs-4 text-primary">{formatPrice(product.price)}₫</span>
          </div>

          <p
            className="text-secondary small mb-4"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>

          <div className="mt-auto d-flex gap-2 w-100">
            <Button variant="outline-secondary" className="rounded-1 p-2 border-light-subtle">
              <Heart size={20} />
            </Button>
            <Button
              variant="primary"
              className="flex-grow-1 fw-bold text-white border-0 rounded-1 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#007bff' }}
              disabled={product.stock === 0}
            >
              <ShoppingCart size={18} /> {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
            </Button>
            <Button variant="outline-secondary" className="rounded-1 p-2 border-light-subtle">
              <Eye size={20} />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  const SmallProductItem = ({ product }) => (
    <Link
      to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <motion.div
        className="h-100 p-3 d-flex flex-column position-relative"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        {product.badges.length > 0 && (
          <div className="position-absolute top-0 start-0 m-2 z-1">
            <Badge
              bg={product.badges[0].bg}
              text={product.badges[0].color}
              className="rounded-1 px-2 py-1 fw-bold small"
            >
              {product.badges[0].text}
            </Badge>
          </div>
        )}

        <div
          className="d-flex align-items-center justify-content-center mb-3 bg-light rounded"
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

          <div className="mt-auto">
            {product.originalPrice && (
              <div className="mb-1">
                <span className="text-decoration-line-through text-secondary me-2 small">
                  {formatPrice(product.originalPrice)}₫
                </span>
              </div>
            )}
            <span className="fw-bold text-primary fs-6">{formatPrice(product.price)}₫</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  return (
    <section className="py-5">
      <Container>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="fw-bold text-dark m-0">FREQUENTLY BOUGHT TOGETHER</h3>
          <Link to={PUBLIC_ROUTES.PRODUCTS} style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#e0a800' }}
              whileTap={{ scale: 0.95 }}
              className="d-flex align-items-center justify-content-center px-4 py-2 rounded fw-bold text-dark border-0"
              style={{ backgroundColor: '#FFC107' }}
            >
              VIEW ALL
            </motion.button>
          </Link>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        <motion.div
          className="border border-light-subtle rounded"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Row className="g-0">
            <Col lg={3} md={12} className="border-end border-light-subtle">
              <MainProductItem product={MAIN_PRODUCT} />
            </Col>

            <Col lg={9} md={12}>
              <Row className="g-0 h-100">
                {SIDE_PRODUCTS.map((product, index) => (
                  <Col
                    key={product.id}
                    lg={3}
                    md={4}
                    sm={6}
                    xs={12}
                    className={`
                      ${index < 4 ? 'border-bottom border-light-subtle' : ''} 
                      ${(index + 1) % 4 !== 0 ? 'border-end border-light-subtle' : ''}
                    `}
                  >
                    <SmallProductItem product={product} />
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </section>
  );
};

export default FrequentlyBoughtTogether;
