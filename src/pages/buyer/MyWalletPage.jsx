import { Container, Row, Col, Button } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@constants/routes';
import WalletCard from '@components/common/wallet/WalletCard';
import BalanceCard from '@components/common/wallet/BalanceCard';
import TransactionHistory from '@components/common/wallet/TransactionHistory';
import FundWalletModal from '@components/common/wallet/FundWalletModal';
import TransactionPinModal from '@components/common/wallet/TransactionPinModal';
import TransactionSuccessModal from '@components/common/wallet/TransactionSuccessModal';

/**
 * My Wallet Page Component
 * Displays wallet information, balance, and transaction history
 */
const MyWalletPage = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual data from API/Redux
  const [balance, setBalance] = useState(5000);
  const [cardholderName] = useState('SUPRAVA SAHA');
  const [cardNumber] = useState('1234123412341234');
  const [expiryDate] = useState('06/24');

  // Modal states
  const [showFundModal, setShowFundModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // Mock transactions - replace with actual data
  const [transactions] = useState([
    {
      id: 1,
      type: 'withdrawal',
      description: 'Withdrawal Initiated for Product Name and Product ID',
      amount: -2490,
      balance: 5000,
      date: new Date('2022-04-25'),
    },
    {
      id: 2,
      type: 'deposit',
      description: 'Withdrawal Initiated for Product Name and Product ID',
      amount: 2490,
      balance: 5000,
      date: new Date('2022-04-25'),
    },
    {
      id: 3,
      type: 'withdrawal',
      description: 'Withdrawal Initiated for Product Name and Product ID',
      amount: -2490,
      balance: 5000,
      date: new Date('2022-04-25'),
    },
  ]);

  const handleBack = () => {
    navigate(PUBLIC_ROUTES.HOME);
  };

  const handleFundWallet = () => {
    setShowFundModal(true);
  };

  const handleFundProceed = (fundData) => {
    setPendingTransaction(fundData);
    setShowFundModal(false);
    setShowPinModal(true);
  };

  const handlePinConfirm = (pin) => {
    // TODO: Verify PIN and process transaction
    // For now, just simulate success
    // eslint-disable-next-line no-console
    console.log('PIN confirmed:', pin);
    // eslint-disable-next-line no-console
    console.log('Transaction data:', pendingTransaction);

    // Update balance (mock)
    if (pendingTransaction) {
      setBalance((prev) => prev + pendingTransaction.amount);
    }

    setShowPinModal(false);
    setShowSuccessModal(true);
    setPendingTransaction(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  const handleViewAllTransactions = () => {
    // TODO: Navigate to full transaction history page
    // eslint-disable-next-line no-console
    console.log('View all transactions');
  };

  return (
    <div className="my-wallet-page bg-white" style={{ minHeight: '100vh' }}>
      <div className="py-4">
        <Container>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-start">
              <Button
                variant="link"
                className="p-0 text-decoration-none d-flex align-items-center"
                onClick={handleBack}
                style={{ color: '#000' }}
              >
                <div
                  className="rounded-circle border d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderColor: '#dee2e6',
                  }}
                >
                  <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
                </div>
              </Button>
              <div>
                <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>
                  My Wallet
                </h1>
                <p className="text-muted mb-0">Let&apos;s create your account</p>
              </div>
            </div>
            <Button variant="link" className="p-0">
              <i className="bi bi-share fs-5"></i>
            </Button>
          </div>
        </Container>

        {/* Main Content */}
        <Container>
          <Row style={{ marginTop: '35px' }}>
            {/* Card and Balance Row */}
            <Col xs={12} className="mb-4">
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <WalletCard
                    cardholderName={cardholderName}
                    cardNumber={cardNumber}
                    expiryDate={expiryDate}
                  />
                </Col>
                <Col md={6}>
                  <BalanceCard
                    balance={balance}
                    currency="VND"
                    status="Active"
                    changePercentage={23.12}
                  />
                </Col>
              </Row>
            </Col>

            {/* Action Buttons */}
            <Col xs={12} className="mb-4">
              <Row>
                <Col md={6} className="mb-2 mb-md-0">
                  <Button variant="primary" className="w-100">
                    <i className="bi bi-lock me-2"></i>
                    Need Help?
                  </Button>
                </Col>
                <Col md={6}>
                  <Button variant="primary" className="w-100" onClick={handleFundWallet}>
                    <i className="bi bi-wallet me-2"></i>
                    Add Money to Wallet
                  </Button>
                </Col>
              </Row>
            </Col>

            {/* Add Card Button */}
            <Col xs={12} className="mb-4">
              <Button variant="light" className="w-100 border">
                <i className="bi bi-plus-circle me-2"></i>
                Add card
              </Button>
            </Col>

            {/* Transaction History */}
            <Col xs={12}>
              <TransactionHistory
                transactions={transactions}
                onViewAll={handleViewAllTransactions}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Modals */}
      <FundWalletModal
        show={showFundModal}
        onHide={() => setShowFundModal(false)}
        currentBalance={balance}
        onProceed={handleFundProceed}
      />

      <TransactionPinModal
        show={showPinModal}
        onHide={() => {
          setShowPinModal(false);
          setPendingTransaction(null);
        }}
        onConfirm={handlePinConfirm}
      />

      <TransactionSuccessModal
        show={showSuccessModal}
        onHide={handleSuccessClose}
        message="Transaction Successful"
      />
    </div>
  );
};

export default MyWalletPage;
