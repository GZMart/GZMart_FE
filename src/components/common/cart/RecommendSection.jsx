import { useState, useEffect } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { products as mockProducts } from '@utils/data/mockData';
import { formatCurrency } from '@utils/formatters';
import { useDispatch } from 'react-redux';
import { addToCart } from '@store/slices/cartSlice';
import PropTypes from 'prop-types';

/**
 * Helper to convert product from mockData to cart format
 */
const convertProductForCart = (product) => {
  const variant = product.variantsArray?.[0];
  return {
    id: variant?.sku_code || product._id,
    _id: product._id,
    name: product.name,
    description: product.summary,
    image: product.mainImage || product.images?.[0],
    price: variant?.selling_price || product.finalPrice || product.price?.regular || 0,
    originalPrice: product.price?.regular,
    discount: product.price?.discountPercent || 0,
    brand: product.brand,
  };
};

/**
 * Recommend Section Component
 * Displays "You Might Also Like" products carousel
 */
const RecommendSection = ({ limit = 4 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    // Use mock data for recommendations
    setLoading(true);
    try {
      // Get products that are on sale or new, limit to requested amount
      const recommended = mockProducts
        .filter((p) => p.status && (p.price?.isOnSale || p.isNew))
        .slice(0, limit * 2)
        .map(convertProductForCart);
      setProducts(recommended);
    } catch (error) {
      console.error('Error loading recommended products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const handleAddToCart = (product) => {
    // Convert back to full product format for cart
    const fullProduct = mockProducts.find((p) => p._id === product._id);
    if (fullProduct) {
      const cartItem = {
        id: product.id,
        _id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        color: fullProduct.variantsArray?.[0]?.color || 'N/A',
        size: fullProduct.variantsArray?.[0]?.size || 'N/A',
        variant:
          `${fullProduct.variantsArray?.[0]?.size || ''} - ${fullProduct.variantsArray?.[0]?.color || ''}`.trim(),
        sku: product.id,
        brand: product.brand,
      };
      dispatch(addToCart({ product: cartItem, quantity: 1 }));
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, products.length - limit);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + limit);

  if (loading) {
    return (
      <section className="recommend-section py-5">
        <div className="text-center">
          <p className="text-muted">Loading recommendations...</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="recommend-section py-5 bg-light">
      <div className="position-relative">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0">YOU MIGHT ALSO LIKE</h4>
          {products.length > limit && (
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <i className="bi bi-chevron-left"></i>
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex >= products.length - limit}
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          )}
        </div>

        <Row>
          {visibleProducts.map((product) => (
            <Col key={product.id} xs={6} md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={product.image || '/placeholder-image.jpg'}
                    alt={product.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                  />
                  {product.discount && (
                    <span
                      className="badge bg-danger position-absolute top-0 end-0 m-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="small fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>
                    {product.name || 'Product Name'}
                  </Card.Title>
                  <div className="mt-auto">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fw-bold text-primary">
                        {formatCurrency(product.price || 0)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-muted text-decoration-line-through small">
                            {formatCurrency(product.originalPrice)}
                          </span>
                          {product.discount > 0 && (
                            <span className="badge bg-danger small">-{product.discount}%</span>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

RecommendSection.propTypes = {
  limit: PropTypes.number,
};

export default RecommendSection;
