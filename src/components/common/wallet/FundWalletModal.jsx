import { Modal, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { formatCurrency } from '@utils/formatters';
import PropTypes from 'prop-types';

/**
 * Fund Wallet Modal Component
 * Modal for adding money to wallet
 */
const FundWalletModal = ({ show, onHide, currentBalance, onProceed }) => {
  const [amount, setAmount] = useState('');
  const [fundingMethod, setFundingMethod] = useState('bankTransfer');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      onProceed({
        amount: parseFloat(amount),
        fundingMethod,
        description,
      });
      // Reset form
      setAmount('');
      setDescription('');
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setFundingMethod('bankTransfer');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Fund Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-4">To fund wallet provide the details below</p>

        <div className="mb-4">
          <label className="text-muted small mb-2 d-block">Current Wallet Balance</label>
          <h4 className="fw-bold" style={{ color: '#0066CC' }}>
            {formatCurrency(currentBalance || 0, 'VND')}
          </h4>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Funding Method</Form.Label>
            <div className="d-flex flex-column gap-2">
              <Form.Check
                type="radio"
                id="bankTransfer"
                name="fundingMethod"
                label="Bank Transfer"
                checked={fundingMethod === 'bankTransfer'}
                onChange={() => setFundingMethod('bankTransfer')}
              />
              <Form.Check
                type="radio"
                id="card"
                name="fundingMethod"
                label="Fund by Card"
                checked={fundingMethod === 'card'}
                onChange={() => setFundingMethod('card')}
                disabled
              />
            </div>
          </Form.Group>

          {fundingMethod === 'bankTransfer' && (
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-3">Bank Transfer Details</h6>
              <div className="mb-2">
                <small className="text-muted d-block">Account Number</small>
                <p className="mb-0 fw-semibold">0123456789</p>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">Bank Name</small>
                <p className="mb-0 fw-semibold">Vietcombank</p>
              </div>
              <div>
                <small className="text-muted d-block">Beneficiary Name</small>
                <p className="mb-0 fw-semibold">GZMart</p>
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Write a Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button variant="secondary" className="flex-fill" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-fill">
              PROCEED
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

FundWalletModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  currentBalance: PropTypes.number,
  onProceed: PropTypes.func.isRequired,
};

export default FundWalletModal;
