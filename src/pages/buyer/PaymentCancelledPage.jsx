import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert, Spinner } from 'react-bootstrap';
import { BUYER_ROUTES, PUBLIC_ROUTES } from '@constants/routes';
import { paymentService } from '@services/api/paymentService';

/**
 * Payment Cancelled Page
 * Handles redirect from PayOS when user cancels payment
 */
const PaymentCancelledPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cancelling, setCancelling] = useState(true);
  const [error, setError] = useState(null);

  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    // CRITICAL FIX: Cancel the order when user lands on this page
    const cancelOrder = async () => {
      if (!orderCode) {
        setCancelling(false);
        return;
      }

      try {
        console.log('[PaymentCancelled] Cancelling order:', orderCode);
        await paymentService.cancelPayment(orderCode);
        console.log('[PaymentCancelled] Order cancelled successfully');
        setCancelling(false);
      } catch (err) {
        console.error('[PaymentCancelled] Error cancelling order:', err);
        // Don't show error if order was already cancelled or not found
        if (err.response?.status === 400 || err.response?.status === 404) {
          setCancelling(false);
        } else {
          setError(err.message || 'Failed to cancel order');
          setCancelling(false);
        }
      }
    };

    cancelOrder();

    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate(BUYER_ROUTES.ORDERS);
    }, 5000);

    return () => clearTimeout(timer);
  }, [orderCode, navigate]);

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ maxWidth: '500px', width: '100%' }} className="border-0 shadow">
        <Card.Body className="p-5 text-center">
          {cancelling ? (
            <>
              <Spinner
                animation="border"
                variant="warning"
                style={{ width: '4rem', height: '4rem' }}
                className="mb-4"
              />
              <h3 className="fw-bold mb-3">Cancelling Payment</h3>
              <p className="text-muted">Processing cancellation...</p>
            </>
          ) : (
            <>
              <i className="bi bi-x-circle-fill text-warning mb-4" style={{ fontSize: '5rem' }}></i>
              <h3 className="fw-bold mb-3">Payment Cancelled</h3>
              <p className="text-muted mb-4">
                {orderCode
                  ? `Your payment for order #${orderCode} has been cancelled.`
                  : 'Your payment has been cancelled.'}
              </p>
              {error ? (
                <Alert variant="warning" className="mb-4">
                  <p className="mb-0">{error}</p>
                </Alert>
              ) : (
                <Alert variant="info" className="mb-4">
                  <p className="mb-0">
                    Your order has been cancelled. No charges were made to your account.
                  </p>
                </Alert>
              )}
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
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentCancelledPage;
