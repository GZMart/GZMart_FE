import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { removeFromCart, updateQuantity } from '@store/slices/cartSlice';
import { formatCurrency } from '@utils/formatters';
import PropTypes from 'prop-types';

/**
 * Cart Item Card Component
 * Displays individual cart item with controls
 */
const CartItemCard = ({ item, isSelected = false, onSelect }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const preOrderDays = Number(item.preOrderDays) || 0;

  const handleRemove = () => {
    dispatch(removeFromCart(item.id));
  };

  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value) || 1;
    dispatch(updateQuantity({ productId: item.id, quantity }));
  };

  const itemTotal = (item.price || 0) * (item.quantity || 1);

  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body>
        <Row className="align-items-center flex-nowrap">
          {/* Checkbox */}
          <Col
            xs="auto"
            className="pe-2 d-flex align-items-center flex-shrink-0"
            style={{ minWidth: '40px' }}
          >
            <Form.Check
              type="checkbox"
              id={`item-${item.id}`}
              checked={isSelected}
              onChange={() => onSelect?.()}
              style={{ cursor: 'pointer' }}
            />
          </Col>

          {/* Product Image */}
          <Col xs="auto" className="ps-0 flex-shrink-0" style={{ width: '120px' }}>
            <div className="position-relative">
              <img
                src={item.image || '/placeholder-image.jpg'}
                alt={item.name}
                className="img-fluid rounded"
                style={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                }}
              />
            </div>
          </Col>

          {/* Product Info */}
          <Col className="flex-grow-1" style={{ minWidth: '200px' }}>
            <h6 className="mb-1 fw-semibold">{item.name || 'Product Name'}</h6>
            <p className="text-muted small mb-1">{item.description || item.variant || ''}</p>
            {preOrderDays > 0 && (
              <div
                className="small d-flex align-items-center gap-1 mb-2"
                style={{ color: '#8B4513' }}
              >
                <i className="bi bi-clock-history" aria-hidden />
                <span>{t('cart.item.pre_order_eta', { days: preOrderDays })}</span>
              </div>
            )}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              {item.color && (
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Color:</span>
                  <div
                    className="rounded-circle border"
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: item.colorCode || '#ccc',
                      border: '1px solid #ddd',
                    }}
                    title={item.color}
                  />
                  <span className="small">{item.color}</span>
                </div>
              )}
              {item.size && item.size !== 'N/A' && (
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Size:</span>
                  <span className="small fw-semibold">{item.size}</span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
              <span className="fw-bold" style={{ color: '#B13C36' }}>
                {formatCurrency(item.price || 0)}
              </span>
              <span className="text-muted small">per item</span>
            </div>
          </Col>

          {/* Quantity Controls */}
          <Col
            xs="auto"
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ minWidth: '80px' }}
          >
            <Form.Control
              type="number"
              min="1"
              value={item.quantity || 1}
              onChange={handleQuantityChange}
              style={{ width: '60px', textAlign: 'center' }}
              className="border-secondary"
            />
          </Col>

          {/* Item Total Price */}
          <Col
            xs="auto"
            className="text-center d-flex align-items-center flex-shrink-0"
            style={{ minWidth: '100px' }}
          >
            <p className="mb-0 fw-bold fs-5">{formatCurrency(itemTotal)}</p>
          </Col>

          {/* Remove Button */}
          <Col
            xs="auto"
            className="text-end d-flex align-items-center flex-shrink-0"
            style={{ minWidth: '40px' }}
          >
            <Button
              variant="link"
              className="text-danger p-0"
              onClick={handleRemove}
              title="Remove item"
            >
              <i className="bi bi-trash fs-5"></i>
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

CartItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    price: PropTypes.number,
    quantity: PropTypes.number,
    color: PropTypes.string,
    colorCode: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    variant: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
};

export default CartItemCard;
