import { Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Promo Banner Component
 * Displays promotional messages or discounts
 */
const PromoBanner = ({ message, variant = 'info', dismissible = false }) => {
  if (!message) {
    return null;
  }

  return (
    <Alert variant={variant} dismissible={dismissible} className="mb-4">
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-tag-fill"></i>
        <span className="mb-0">{message}</span>
      </div>
    </Alert>
  );
};

PromoBanner.propTypes = {
  message: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  dismissible: PropTypes.bool,
};

export default PromoBanner;
