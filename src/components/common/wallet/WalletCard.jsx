import { Card } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Wallet Card Component
 * Displays virtual wallet card with cardholder info
 */
const WalletCard = ({ cardholderName, cardNumber, expiryDate, cardType = 'United Deals Card' }) => {
  // Format card number with spaces
  const formatCardNumber = (number) => {
    if (!number) {
      return '1234 1234 1234 1234';
    }
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry date
  const formatExpiryDate = (date) => {
    if (!date) {
      return '06/24';
    }
    return date;
  };

  return (
    <Card
      className="border-0 shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
        borderRadius: '16px',
        minHeight: '200px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Card.Body
        className="p-4 text-white d-flex flex-column justify-content-between"
        style={{ minHeight: '200px' }}
      >
        {/* Contactless Icon */}
        <div className="d-flex justify-content-end">
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                fill="white"
              />
              <path
                d="M9 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Card Type */}
        <div>
          <h6 className="mb-3 fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            {cardType}
          </h6>
        </div>

        {/* Card Number */}
        <div className="mb-3">
          <p
            className="mb-0"
            style={{ fontSize: '1.3rem', letterSpacing: '2px', fontFamily: 'monospace' }}
          >
            {formatCardNumber(cardNumber)}
          </p>
        </div>

        {/* Cardholder Name and Expiry */}
        <div className="d-flex justify-content-between align-items-end">
          <div>
            <small className="text-white-50 d-block mb-1" style={{ fontSize: '0.7rem' }}>
              CARDHOLDER NAME
            </small>
            <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              {cardholderName || 'SUPRAVA SAHA'}
            </p>
          </div>
          <div className="text-end">
            <small className="text-white-50 d-block mb-1" style={{ fontSize: '0.7rem' }}>
              EXPIRY DATE
            </small>
            <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>
              {formatExpiryDate(expiryDate)}
            </p>
          </div>
        </div>

        {/* Decorative Logo */}
        <div
          className="position-absolute"
          style={{
            bottom: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
          }}
        />
      </Card.Body>
    </Card>
  );
};

WalletCard.propTypes = {
  cardholderName: PropTypes.string,
  cardNumber: PropTypes.string,
  expiryDate: PropTypes.string,
  cardType: PropTypes.string,
};

export default WalletCard;
