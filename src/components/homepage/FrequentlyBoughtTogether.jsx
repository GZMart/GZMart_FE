import React from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';

const MAIN_PRODUCT = {
  id: 1,
  title: 'Korean Style Oversized Blazer Set with Pleated Skirt - Beige',
  image:
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=80',
  description:
    'Trendy design, high-quality snow rain fabric that keeps its shape. Perfect for work or casual outings, easy to mix & match.',
  rating: 5,
  reviews: 1250,
  price: '450,000',
  originalPrice: '650,000',
  badges: [
    { text: '30% OFF', bg: 'warning', color: 'dark' },
    { text: 'BEST SELLER', bg: 'danger', color: 'white' },
  ],
};

const SIDE_PRODUCTS = [
  {
    id: 2,
    title: 'Mini Soft Leather Crossbody Bag Ulzzang Style',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80',
    price: '150,000',
    badges: [{ text: 'SOLD OUT', bg: 'secondary', color: 'white' }],
    isSoldOut: true,
  },
  {
    id: 3,
    title: 'Baby Tee Cotton T-Shirt 4-Way Stretch',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
    price: '89,000',
    badges: [],
  },
  {
    id: 4,
    title: 'Chunky High-Sole Sneakers Figure Flattering',
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80',
    price: '320,000',
    originalPrice: '400,000',
    badges: [{ text: '20% OFF', bg: 'warning', color: 'dark' }],
  },
  {
    id: 5,
    title: 'Unisex Round Rim Khaki Bucket Hat',
    image:
      'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=300&q=80',
    price: '75,000',
    badges: [],
  },
  {
    id: 6,
    title: 'Retro High-Waist Wide Leg Jeans',
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=300&q=80',
    price: '280,000',
    badges: [],
  },
  {
    id: 7,
    title: 'Vintage Square Frame Fashion Sunglasses',
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=300&q=80',
    price: '60,000',
    originalPrice: '120,000',
    badges: [{ text: '50% OFF', bg: 'warning', color: 'dark' }],
  },
  {
    id: 8,
    title: 'High-Waist Plaid Tennis Skirt',
    image:
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=300&q=80',
    price: '135,000',
    badges: [{ text: 'HOT', bg: 'danger', color: 'white' }],
  },
  {
    id: 9,
    title: 'Bear Pattern High Neck Socks Set (5 Pairs)',
    image:
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=300&q=80',
    price: '45,000',
    originalPrice: '60,000',
    badges: [{ text: 'SALE', bg: 'info', color: 'white' }],
  },
];

const MainProductItem = ({ product }) => (
  <div className="h-100 p-4 d-flex flex-column">
    <div className="d-flex flex-column gap-1 position-absolute m-3 z-1">
      {product.badges.map((badge, idx) => (
        <Badge key={idx} bg={badge.bg} text={badge.color} className="rounded-1 px-2 py-1 fw-bold">
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
      {/* UPDATE HERE: Added bg-light, padding, and borderRadius */}
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
);

const SmallProductItem = ({ product }) => (
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
);

const FrequentlyBoughtTogether = () => {
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
