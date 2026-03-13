import { Modal, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Transaction Success Modal Component
 * Displays success message after transaction completion
 */
const TransactionSuccessModal = ({ show, onHide, message = 'Transaction Successful' }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Body className="text-center py-5">
      <div className="mb-4">
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#d4edda',
            color: '#28a745',
          }}
        >
          <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
        </div>
      </div>
      <h5 className="fw-bold mb-3">{message}</h5>
      <Button variant="primary" onClick={onHide} className="px-5">
        OK
      </Button>
    </Modal.Body>
  </Modal>
);

TransactionSuccessModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  message: PropTypes.string,
};

export default TransactionSuccessModal;
