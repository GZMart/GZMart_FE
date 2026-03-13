import { Spinner } from 'react-bootstrap';

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => (
  <div className="loading-spinner-container">
    <div className="text-center">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted">Loading...</p>
    </div>
  </div>
);

export default LoadingSpinner;
