import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';
import { productService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

// Helper to format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

const FrequentlyBoughtTogether = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAll({ limit: 8, status: 'active' });
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
  if (!products[0]) {
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

  // Transform API data to component format
  const MAIN_PRODUCT = {
    id: products[0]._id,
    title: products[0].name,
    image: products[0].images?.[0] || products[0].image || 'https://via.placeholder.com/500',
    description: products[0].description || 'Featured product',
    rating: products[0].rating || 5,
    reviews: products[0].sold || 0,
    price: formatPrice(products[0].price),
    originalPrice: products[0].originalPrice ? formatPrice(products[0].originalPrice) : null,
    badges: [
      products[0].discount && {
        text: `${products[0].discount}% OFF`,
        bg: 'warning',
        color: 'dark',
      },
      products[0].isFeatured && { text: 'BEST SELLER', bg: 'danger', color: 'white' },
    ].filter(Boolean),
  };

  const SIDE_PRODUCTS = products.slice(1, 8).map((product) => ({
    id: product._id,
    title: product.name,
    image: product.images?.[0] || product.image || 'https://via.placeholder.com/300',
    price: formatPrice(product.price),
    originalPrice: product.originalPrice ? formatPrice(product.originalPrice) : null,
    badges: [
      product.stock === 0 && { text: 'SOLD OUT', bg: 'secondary', color: 'white' },
      product.discount && { text: `${product.discount}% OFF`, bg: 'warning', color: 'dark' },
      product.isHot && { text: 'HOT', bg: 'danger', color: 'white' },
    ].filter(Boolean),
    isSoldOut: product.stock === 0,
  }));

  const MainProductItem = ({ product }) => (
    <Link
      to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="h-100 p-4 d-flex flex-column">
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
            style={{ maxHeight: '100%', width: '100%', objectFit: 'cover' }}
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
            <span className="text-decoration-line-through text-secondary me-2">
              {product.originalPrice}₫
            </span>
            <span className="fw-bold fs-4 text-primary">{product.price}₫</span>
          </div>

          <p className="text-secondary small mb-4">{product.description}</p>

          <div className="mt-auto d-flex gap-2 w-100">
            <Button variant="outline-secondary" className="rounded-1 p-2 border-light-subtle">
              <Heart size={20} />
            </Button>
            <Button
              variant="primary"
              className="flex-grow-1 fw-bold text-white border-0 rounded-1 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#007bff' }}
            >
              <ShoppingCart size={18} /> ADD TO CART
            </Button>
            <Button variant="outline-secondary" className="rounded-1 p-2 border-light-subtle">
              <Eye size={20} />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );

  const SmallProductItem = ({ product }) => (
    <Link
      to={`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', product.id)}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="h-100 p-3 d-flex flex-column position-relative">
        {product.badges.length > 0 && (
          <div className="position-absolute top-0 start-0 m-2 z-1">
            <Badge
              bg={product.badges[0].bg}
              text={product.badges[0].color}
              className="rounded-1 px-2 py-1 fw-bold"
            >
              {product.badges[0].text}
            </Badge>
          </div>
        )}

        <div
          className="d-flex align-items-center justify-content-center mb-3"
          style={{ height: '220px' }}
        >
          <img
            src={product.image}
            className="w-100 h-100"
            style={{ objectFit: 'cover' }}
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
              minHeight: '45px',
            }}
            title={product.title}
          >
            {product.title}
          </h6>

          <div className="mt-auto">
            {product.originalPrice && (
              <span className="text-decoration-line-through text-secondary me-2 small">
                {product.originalPrice}₫
              </span>
            )}
            <span className="fw-bold text-primary">{product.price}₫</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <section className="py-5">
      <Container>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="fw-bold text-dark m-0">FREQUENTLY BOUGHT TOGETHER</h3>
          <Button
            className="fw-bold px-4 border-0 text-dark"
            style={{ backgroundColor: '#FFC107', borderRadius: '4px' }}
          >
            VIEW ALL
          </Button>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        <div className="border border-light-subtle">
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
        </div>
      </Container>
    </section>
  );
};

export default FrequentlyBoughtTogether;
