import { Card } from 'react-bootstrap';
import { formatCurrency, formatDate } from '@utils/formatters';
import PropTypes from 'prop-types';

/**
 * Transaction History Component
 * Displays list of wallet transactions
 */
const TransactionHistory = ({ transactions = [], onViewAll }) => {
  const getTransactionIcon = (type) => (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center"
      style={{
        width: '40px',
        height: '40px',
        backgroundColor: '#E3F2FD',
        color: '#1976D2',
      }}
    >
      <i className="bi bi-arrow-left-right"></i>
    </div>
  );

  const getTransactionColor = (amount) => (amount >= 0 ? 'text-success' : 'text-danger');

  const formatTransactionAmount = (amount) =>
    amount >= 0 ? `+ ${formatCurrency(Math.abs(amount))}` : `- ${formatCurrency(Math.abs(amount))}`;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h6 className="mb-0 fw-semibold">History Transactions</h6>
        {onViewAll && (
          <button
            className="btn btn-link p-0 text-decoration-none"
            onClick={onViewAll}
            style={{ fontSize: '0.875rem', color: '#0066CC' }}
          >
            View all
          </button>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        {transactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-0">No transactions yet</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id || index}
                className="list-group-item border-0 px-4 py-3"
                style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}
              >
                <div className="d-flex align-items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div className="flex-grow-1">
                    <p className="mb-1 fw-semibold">{transaction.description || 'Transaction'}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {transaction.date
                          ? formatDate(transaction.date, 'MMM dd, yy')
                          : 'Apr 25, 22'}
                      </small>
                      <small className="text-muted me-3">
                        Balance: {formatCurrency(transaction.balance || 0)}
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={`mb-0 fw-bold ${getTransactionColor(transaction.amount)}`}>
                      {formatTransactionAmount(transaction.amount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

TransactionHistory.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      description: PropTypes.string,
      amount: PropTypes.number,
      balance: PropTypes.number,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })
  ),
  onViewAll: PropTypes.func,
};

export default TransactionHistory;
