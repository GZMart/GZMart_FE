import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert } from 'react-bootstrap';
import { BUYER_ROUTES, PUBLIC_ROUTES } from '@constants/routes';

/**
 * Payment Cancelled Page
 * Handles redirect from PayOS when user cancels payment
 */
const PaymentCancelledPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate(BUYER_ROUTES.ORDERS);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ maxWidth: '500px', width: '100%' }} className="border-0 shadow">
        <Card.Body className="p-5 text-center">
          <i className="bi bi-x-circle-fill text-warning mb-4" style={{ fontSize: '5rem' }}></i>
          <h3 className="fw-bold mb-3">Payment Cancelled</h3>
          <p className="text-muted mb-4">
            {orderCode
              ? `Your payment for order #${orderCode} has been cancelled.`
              : 'Your payment has been cancelled.'}
          </p>
          <Alert variant="info" className="mb-4">
            <p className="mb-0">
              <strong>Your order is still saved!</strong> You can complete the payment anytime from
              your orders page.
            </p>
          </Alert>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(PUBLIC_ROUTES.HOME)}
            >
              Continue Shopping
            </button>
            <button className="btn btn-primary" onClick={() => navigate(BUYER_ROUTES.ORDERS)}>
              View My Orders
            </button>
          </div>
          <p className="text-muted small mt-3">Redirecting to orders page in 5 seconds...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentCancelledPage;
