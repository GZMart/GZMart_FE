import PropTypes from 'prop-types';
import { Spinner } from 'react-bootstrap';

/**
 * Loading Spinner Component
 * @param {'fullscreen'|'content'} [variant=fullscreen] — content = trong khung trang (sidebar giữ; fullscreen = trang toàn tải)
 */
const LoadingSpinner = ({ variant = 'fullscreen' }) => (
  <div
    className={
      variant === 'content'
        ? 'loading-spinner-container loading-spinner-container--content'
        : 'loading-spinner-container'
    }
  >
    <div className="text-center">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted">Loading...</p>
    </div>
  </div>
);

LoadingSpinner.propTypes = {
  variant: PropTypes.oneOf(['fullscreen', 'content']),
};

export default LoadingSpinner;
