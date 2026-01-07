import { useSelector } from 'react-redux';
import { Form } from 'react-bootstrap';
import { selectCartItems, selectCartTotalItems } from '@store/slices/cartSlice';
import CartList from './CartList';
import PropTypes from 'prop-types';

/**
 * Cart Section Component
 * Container for cart items list with header
 */
const CartSection = ({ items, selectedItems, onItemSelect, onSelectAll, isAllSelected }) => {
  const cartItemsFromStore = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartTotalItems);
  const cartItems = items || cartItemsFromStore;
  const selectedCount = selectedItems?.size || 0;

  return (
    <div className="cart-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Form.Check
            type="checkbox"
            id="selectAll"
            checked={isAllSelected}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            label={
              <span className="fw-semibold">
                Select All ({selectedCount}/{cartItems.length})
              </span>
            }
            style={{ cursor: 'pointer' }}
          />
        </div>
        <h5 className="mb-0 fw-semibold text-muted">
          Number of Items {totalItems || cartItems.length}
        </h5>
      </div>
      <CartList items={cartItems} selectedItems={selectedItems} onItemSelect={onItemSelect} />
    </div>
  );
};

CartSection.propTypes = {
  items: PropTypes.array,
  selectedItems: PropTypes.instanceOf(Set),
  onItemSelect: PropTypes.func,
  onSelectAll: PropTypes.func,
  isAllSelected: PropTypes.bool,
};

export default CartSection;
