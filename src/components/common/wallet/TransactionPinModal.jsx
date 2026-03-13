import { Modal, Form, Button } from 'react-bootstrap';
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Transaction Pin Modal Component
 * Modal for entering 4-digit PIN to confirm transaction
 */
const TransactionPinModal = ({ show, onHide, onConfirm, title = 'Transaction Pin' }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (show && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [show]);

  const handlePinChange = (index, value) => {
    if (value.length > 1) {
      return;
    } // Only allow single digit

    const newPin = [...pin];
    newPin[index] = value.replace(/\D/g, ''); // Only numbers
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];
    for (let i = 0; i < 4; i++) {
      newPin[i] = pastedData[i] || '';
    }
    setPin(newPin);
    if (pastedData.length === 4) {
      inputRefs[3].current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onConfirm(pinString);
    }
  };

  const handleClose = () => {
    setPin(['', '', '', '']);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-4">Provide transaction to fund wallet from card</p>

        <Form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-muted small mb-3 d-block">Enter your 4 Digits Pin</label>
            <div className="d-flex justify-content-center gap-2">
              {pin.map((digit, index) => (
                <Form.Control
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="text-center"
                  style={{
                    width: '60px',
                    height: '60px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button variant="secondary" className="flex-fill" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="flex-fill"
              disabled={pin.join('').length !== 4}
            >
              FUND WALLET
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

TransactionPinModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
};

export default TransactionPinModal;
