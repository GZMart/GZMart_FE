import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { paymentService } from '@services/api/paymentService';
import { BUYER_ROUTES } from '@constants/routes';

/**
 * Payment Success Page
 * Handles redirect from PayOS after successful payment
 */
const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Verifying your payment...');

  const orderCode = searchParams.get('orderCode');
  const redirectTo = searchParams.get('redirect') || searchParams.get('next');
  const afterSuccessPath = redirectTo || BUYER_ROUTES.ORDERS;

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderCode) {
        // eslint-disable-next-line no-console
        console.error('[PaymentSuccess] No orderCode provided!');
        setStatus('error');
        setMessage('Invalid payment information');
        return;
      }

      // FIX BUG 6: Use polling with retry instead of fixed 2-second wait
      const MAX_RETRIES = 10; // Try 10 times
      const RETRY_INTERVAL = 2000; // Every 2 seconds
      let retryCount = 0;

      const pollPaymentStatus = async () => {
        try {
          const response = await paymentService.checkPaymentFromPayOS(orderCode);

          if (response.success && response.data?.localPaymentStatus === 'paid') {
            setStatus('success');
            setMessage(
              redirectTo
                ? 'Payment successful! Redirecting...'
                : 'Payment successful! Redirecting to order details...'
            );

            setTimeout(() => {
              navigate(afterSuccessPath);
            }, 2000);
            return true; // Stop polling
          }

          // If still pending and we have retries left
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            setMessage(`Verifying payment... (${retryCount}/${MAX_RETRIES})`);
            setTimeout(pollPaymentStatus, RETRY_INTERVAL);
            return false; // Continue polling
          } else {
            // Max retries reached
            // eslint-disable-next-line no-console
            console.warn('[PaymentSuccess] Max retries reached, payment still pending');
            setStatus('error');
            setMessage('Payment verification timeout. Please check your orders page.');
            return true; // Stop polling
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[PaymentSuccess] Error during polling:', error);

          // If error and we have retries left, continue polling
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            setTimeout(pollPaymentStatus, RETRY_INTERVAL);
            return false;
          } else {
            // Max retries reached
            setStatus('error');
            setMessage(error.message || 'Failed to verify payment. Please check your orders.');
            return true;
          }
        }
      };

      // Start polling
      pollPaymentStatus();
    };

    verifyPayment();
  }, [orderCode, navigate, afterSuccessPath, redirectTo]);

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '80vh' }}
    >
      <Card style={{ maxWidth: '500px', width: '100%' }} className="border-0 shadow">
        <Card.Body className="p-5 text-center">
          {status === 'processing' && (
            <>
              <Spinner
                animation="border"
                variant="primary"
                style={{ width: '4rem', height: '4rem' }}
                className="mb-4"
              />
              <h3 className="fw-bold mb-3">Processing Payment</h3>
              <p className="text-muted">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <i
                className="bi bi-check-circle-fill text-success mb-4"
                style={{ fontSize: '5rem' }}
              ></i>
              <h3 className="fw-bold mb-3">Payment Successful!</h3>
              <p className="text-muted">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert variant="danger" className="mb-4">
                <Alert.Heading>Payment Verification Error</Alert.Heading>
                <p className="mb-0">{message}</p>
              </Alert>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate(afterSuccessPath)}
                >
                  {redirectTo ? 'Continue' : 'View My Orders'}
                </button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentSuccessPage;
