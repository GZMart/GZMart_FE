import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { orderService } from '@services/api/orderService';
import { selectCartItems, fetchCart } from '@store/slices/cartSlice'; // To clear cart if needed or just redirect
import { useDispatch } from 'react-redux';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { formatCurrency } from '@utils/formatters';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrderById(orderId);
        if (response.success) {
          setOrder(response.data);
          // Refresh cart in background to ensure it's empty in UI
          dispatch(fetchCart());
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, dispatch]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error loading order</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(PUBLIC_ROUTES.HOME)}>
            Go Home
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Order not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <div className="mb-3">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="fw-bold">Thank You For Your Order!</h1>
        <p className="text-muted fs-5">
          Order <span className="fw-bold">#{order.orderNumber}</span> has been placed.
        </p>
        <p className="text-muted">
          We have sent a confirmation email to <span className="fw-bold">{order.userId.email}</span>
        </p>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Order Details</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Order Number:</span>
                <span className="fw-bold">{order.orderNumber}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Date:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Payment Method:</span>
                <span className="text-capitalize">{order.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Payment Status:</span>
                <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-muted d-block mb-1">Shipping Address:</span>
                <p className="mb-0">{order.shippingAddress}</p>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
             <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Items</h5>
            </Card.Header>
            <Card.Body>
                {order.items?.map((item, index) => (
                    <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom last-no-border">
                        <div className="flex-grow-1">
                            <h6 className="mb-1">{item.productId?.name || 'Product Name'}</h6>
                            <div className="text-muted small">
                                {item.color && <span className="me-2">Color: {item.color}</span>}
                                {item.size && <span>Size: {item.size}</span>}
                            </div>
                            <div className="text-muted small">Qty: {item.quantity}</div>
                        </div>
                        <div className="fw-bold">
                            {formatCurrency(item.price * item.quantity)}
                        </div>
                    </div>
                ))}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
             <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                {order.discount > 0 && (
                     <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount)}</span>
                    </div>
                )}
                <hr />
                <div className="d-flex justify-content-between fs-5 fw-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(order.totalPrice)}</span>
                </div>
             </Card.Body>
          </Card>

          <div className="d-flex gap-3 justify-content-center">
            <Button variant="outline-primary" onClick={() => navigate(PUBLIC_ROUTES.HOME)}>
              Continue Shopping
            </Button>
            <Button variant="primary" onClick={() => navigate(BUYER_ROUTES.ORDERS)}>
              View My Orders
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderConfirmationPage;
