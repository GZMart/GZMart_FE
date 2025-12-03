import { Card } from 'react-bootstrap';
import { formatCurrency } from '@utils/formatters';
import PropTypes from 'prop-types';

/**
 * Balance Card Component
 * Displays wallet balance, currency, and status
 */
const BalanceCard = ({ balance, currency = 'VND', status = 'Active', changePercentage }) => {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <h6 className="text-muted mb-3 fw-semibold">Your Balance</h6>
        <h3 className="fw-bold mb-3" style={{ color: '#0066CC' }}>
          {formatCurrency(balance, currency)}
        </h3>

        {changePercentage !== undefined && (
          <div className="d-flex gap-3 mb-3">
            <div>
              <span className="text-success fw-semibold">↑ {changePercentage}%</span>
            </div>
            <div>
              <span className="text-danger fw-semibold">↑ {changePercentage}%</span>
            </div>
          </div>
        )}

        <div className="border-top pt-3">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Currency</span>
            <span className="fw-semibold small">
              {currency === 'VND' ? 'VND / US Dollar' : currency}
            </span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Status</span>
            <span className="text-success fw-semibold small">{status}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

BalanceCard.propTypes = {
  balance: PropTypes.number.isRequired,
  currency: PropTypes.string,
  status: PropTypes.string,
  changePercentage: PropTypes.number,
};

export default BalanceCard;
