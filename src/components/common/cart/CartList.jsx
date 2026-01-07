import CartItemCard from './CartItemCard';
import PropTypes from 'prop-types';

/**
 * Cart List Component
 * Renders list of cart items
 */
const CartList = ({ items, selectedItems, onItemSelect }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-cart-x display-1 text-muted"></i>
        <p className="mt-3 text-muted">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="cart-list">
      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          isSelected={selectedItems?.has(item.id)}
          onSelect={() => onItemSelect?.(item.id)}
        />
      ))}
    </div>
  );
};

CartList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  selectedItems: PropTypes.instanceOf(Set),
  onItemSelect: PropTypes.func,
};

export default CartList;
