import { Card, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@utils/formatters';
import { BUYER_ROUTES } from '@constants/routes';
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Order Summary Component
 * Displays order totals and checkout button
 */
const OrderSummary = ({
  shipping = 0,
  tax = 0,
  discount = 0,
  giftBoxPrice = 10.9,
  onCheckout,
  selectedItems = [],
}) => {
  const navigate = useNavigate();
  const [includeGiftBox, setIncludeGiftBox] = useState(false);

  // Calculate subtotal from selected items only
  const subtotal =
    selectedItems.length > 0
      ? selectedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
      : 0;

  const finalShipping = shipping || 0;
  const finalTax = tax || 0;
  // Only apply discount if there are selected items
  const finalDiscount = selectedItems.length > 0 ? discount || 0 : 0;
  const giftBoxCost = includeGiftBox && selectedItems.length > 0 ? giftBoxPrice : 0;

  // Ensure total is never negative
  const total = Math.max(0, subtotal + finalShipping + finalTax - finalDiscount + giftBoxCost);

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout({ includeGiftBox, total });
    } else {
      // Pass selected items to checkout page
      navigate(BUYER_ROUTES.CHECKOUT, {
        state: { selectedItems },
      });
    }
  };

  const isCartEmpty = selectedItems.length === 0;

  return (
    <Card className="sticky-top" style={{ top: '20px' }}>
      <Card.Header className="bg-white">
        <h5 className="mb-0 fw-semibold">Order Summary</h5>
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Price</span>
          <span className="fw-semibold">{formatCurrency(subtotal)}</span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Shipping</span>
          <span className="fw-semibold">
            {finalShipping === 0 ? 'Free' : formatCurrency(finalShipping)}
          </span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Tax</span>
          <span className="fw-semibold">{finalTax === 0 ? 'Free' : formatCurrency(finalTax)}</span>
        </div>

        {finalDiscount > 0 && selectedItems.length > 0 && (
          <div className="d-flex justify-content-between mb-2 text-success">
            <span>Discount</span>
            <span className="fw-semibold">-{formatCurrency(finalDiscount)}</span>
          </div>
        )}

        {selectedItems.length > 0 && (
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              id="giftBox"
              label="Pack in a Gift Box"
              checked={includeGiftBox}
              onChange={(e) => setIncludeGiftBox(e.target.checked)}
              disabled={selectedItems.length === 0}
            />
            {includeGiftBox && (
              <small className="text-muted ms-4">+{formatCurrency(giftBoxPrice)}</small>
            )}
          </div>
        )}

        <hr />

        <div className="d-flex justify-content-between mb-4">
          <span className="fw-bold fs-5">Total Price</span>
          <span className="fw-bold fs-5 text-primary">{formatCurrency(total)}</span>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-100"
          onClick={handleCheckout}
          disabled={isCartEmpty}
        >
          <i className="bi bi-gift me-2"></i>
          SHOP NOW
        </Button>

        {isCartEmpty && (
          <p className="text-muted small text-center mt-2 mb-0">Add items to cart to proceed</p>
        )}
      </Card.Body>
    </Card>
  );
};

OrderSummary.propTypes = {
  shipping: PropTypes.number,
  tax: PropTypes.number,
  discount: PropTypes.number,
  giftBoxPrice: PropTypes.number,
  onCheckout: PropTypes.func,
  selectedItems: PropTypes.array,
};

export default OrderSummary;
