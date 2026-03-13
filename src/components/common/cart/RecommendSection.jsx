import { useState, useEffect } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { formatCurrency } from '@utils/formatters';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addToCart } from '@store/slices/cartSlice';
import { productService } from '@services/api/productService';
import PropTypes from 'prop-types';

/**
 * Helper to convert product from mockData to cart format
 */
const convertProductForCart = (product) => {
  const activeModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};
  return {
    id: activeModel.sku_code || activeModel._id || product._id,
    _id: product._id,
    name: product.name,
    description: product.summary || product.description,
    image: product.images?.[0] || activeModel.image,
    price: activeModel.price || product.price || 0,
    originalPrice: activeModel.originalPrice || product.originalPrice || 0,
    discount: product.discount || 0,
    brand: product.brand?._id || product.brandId || product.brand,
    rawProduct: product, // Store original product for Add To Cart logic
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
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const response = await productService.getTrendingProducts(limit * 2);
        if (isMounted && response.success && response.data) {
          const recommended = response.data.map(convertProductForCart);
          setProducts(recommended);
        } else if (isMounted) {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading trending products:', error);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  const handleAddToCart = (product) => {
    if (!user) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const fullProduct = product.rawProduct;
    if (fullProduct) {
      const models = fullProduct.models || [];
      const activeModel = models.find((m) => m.isActive) || models[0] || {};

      let colorValue = 'N/A';
      let sizeValue = 'N/A';

      if (fullProduct.tier_variations && fullProduct.tier_variations.length > 0) {
        if (activeModel.tierIndex && activeModel.tierIndex.length > 0) {
          colorValue = fullProduct.tier_variations[0]?.options?.[activeModel.tierIndex[0]] || 'N/A';
          if (activeModel.tierIndex.length > 1) {
            sizeValue = fullProduct.tier_variations[1]?.options?.[activeModel.tierIndex[1]] || 'N/A';
          }
        }
      }

      const cartItem = {
        id: product.id,
        _id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        color: colorValue,
        size: sizeValue,
        variant: (sizeValue !== 'N/A' ? `${sizeValue} - ${colorValue}` : colorValue).trim() || 'Default',
        sku: product.id,
        brand: product.brand,
      };

      const addItemAsync = async () => {
        try {
          await dispatch(addToCart({
            product: cartItem,
            quantity: 1,
            color: cartItem.color,
            size: cartItem.size
          })).unwrap();
          toast.success('Added to cart successfully!');
        } catch (err) {
          console.error('Add to cart error:', err);
          toast.error(typeof err === 'string' ? err : 'Failed to add item to cart');
        }
      };

      addItemAsync();
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
          <h4 className="fw-bold mb-0" style={{ fontSize: '2rem' }}>
            YOU MIGHT ALSO LIKE
          </h4>
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
                  {product.discount > 0 && (
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
                      <span className="fw-bold" style={{ color: '#741E20' }}>
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
                      variant="outline-danger"
                      size="sm"
                      className="w-100 fw-semibold fw-medium"
                      style={{ color: '#B13C36', borderColor: '#B13C36' }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#B13C36';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#B13C36';
                      }}
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
