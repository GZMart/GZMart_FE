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

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderCode) {
        setStatus('error');
        setMessage('Invalid payment information');
        return;
      }

      try {
        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check payment status
        const response = await paymentService.getPaymentStatus(orderCode);

        if (response.success) {
          setStatus('success');
          setMessage('Payment successful! Redirecting to order details...');

          // Redirect to orders page after 2 seconds
          setTimeout(() => {
            navigate(BUYER_ROUTES.ORDERS);
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify payment. Please check your orders.');
      }
    };

    verifyPayment();
  }, [orderCode, navigate]);

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
                  onClick={() => navigate(BUYER_ROUTES.ORDERS)}
                >
                  View My Orders
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
