import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartItems } from '@store/slices/cartSlice';
import { orderService } from '@services/api/orderService';
import { formatCurrency } from '@utils/formatters';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';

/**
 * Checkout Page Component
 * Multi-step checkout process with 3 steps:
 * 1. Customer Information
 * 2. Shipping & Payments
 * 3. Product Confirmation
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Form data state
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    country: 'Australia',
    state: 'Melbourne',
    address: '',
    phone: '',
  });

  // Fetch customer info on mount
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      try {
        const response = await orderService.getCheckoutInfo();
        if (response.success) {
          setCustomerInfo((prev) => ({
            ...prev,
            ...response.data,
            // Ensure controlled inputs don't become uncontrolled
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            address: response.data.address || '',
          }));
        }
      } catch (error) {
        console.error('Failed to fetch customer info:', error);
      }
    };

    fetchCustomerInfo();
  }, []);

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [shippingCompany, setShippingCompany] = useState('racecouriers');
  const [includeGiftBox, setIncludeGiftBox] = useState(false);

  // Payment methods data
  const paymentMethods = [
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery (COD)',
      logo: 'https://cdn-icons-png.flaticon.com/512/2331/2331941.png', // Generic COD icon
      description: 'Pay cash when you receive your order.',
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png',
      description: 'Pay securely using VNPay QR or ATM card.',
    },
    {
      id: 'payos',
      name: 'PayOS',
      logo: 'https://payos.vn/wp-content/uploads/sites/13/2023/07/Logo-PayOS-Purple.svg', 
      description: 'Pay via PayOS payment gateway.',
    },
  ];

  // Shipping companies data
  const shippingCompanies = [
    {
      id: 'ausff',
      name: 'AUSFF',
      logo: 'https://via.placeholder.com/100x50?text=AUSFF',
      deliveryTime: '14-21 days',
      shippingCost: 0,
      insurance: false,
    },
    {
      id: 'racecouriers',
      name: 'RaceCouriers',
      logo: 'https://via.placeholder.com/100x50?text=RaceCouriers',
      deliveryTime: '14-21 days',
      shippingCost: 10,
      insurance: true,
    },
    {
      id: 'transcocargo',
      name: 'TranscoCargo',
      logo: 'https://via.placeholder.com/100x50?text=TranscoCargo',
      deliveryTime: '14-21 days',
      shippingCost: 12,
      insurance: true,
    },
  ];

  // Order summary state
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shippingCost: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  // Calculate local subtotal for initial render/fallback
  const localSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Fetch order preview when city/state changes or cart items change
  useEffect(() => {
    const fetchPreview = async () => {
      // Use state/region as 'city' for backend logic (HCM vs Others)
      const city = customerInfo.state;
      try {
        const response = await orderService.previewOrder({ city });
        if (response.success) {
          setOrderSummary(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch order preview:', error);
        // Fallback to local calculation
        setOrderSummary({
           subtotal: localSubtotal,
           shippingCost: 0,
           tax: 0,
           discount: 0,
           total: localSubtotal
        });
      }
    };

    if (cartItems.length > 0) {
      fetchPreview();
    }
  }, [customerInfo.state, cartItems, localSubtotal]); // Re-run when address (city) or cart changes

  // Values for display (prioritize backend response)
  const { subtotal, shippingCost, tax, discount, total } = orderSummary;
  const giftBoxPrice = includeGiftBox ? 10.9 : 0;
  const finalTotal = total + giftBoxPrice;

  // Handle form input changes
  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(PUBLIC_ROUTES.HOME);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      handleNext();
    } else if (currentStep === 2) {
      handleNext();
    } else if (currentStep === 3) {
      const orderData = {
          shippingAddress: `${customerInfo.address}, ${customerInfo.state}, ${customerInfo.country}`,
          city: customerInfo.state, 
          paymentMethod,
          notes: '' 
      };

      try {
        const response = await orderService.createOrder(orderData);
        if (response.success) {
           const orderId = response.data._id;
           navigate(BUYER_ROUTES.ORDER_CONFIRMATION.replace(':orderId', orderId));
        }
      } catch (error) {
        console.error('Failed to create order', error);
        alert(error.message || 'Failed to create order');
      }
    }
  };

  // Render Step 1: Customer Information
  const renderStep1 = () => (
    <Form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3 className="fw-bold mb-2">Customer Information</h3>
        <Form.Group className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
            required
          />
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={customerInfo.firstName}
                onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={customerInfo.lastName}
                onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="mb-4">
        <h3 className="fw-bold mb-2">Shipping Address</h3>
        <Form.Group className="mb-3">
          <Form.Label>Country</Form.Label>
          <Form.Select
            value={customerInfo.country}
            onChange={(e) => handleCustomerInfoChange('country', e.target.value)}
            required
          >
            <option value="Australia">Australia</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>State/Region</Form.Label>
          <Form.Select
            value={customerInfo.state}
            onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
            required
          >
            <option value="Melbourne">Melbourne</option>
            <option value="Sydney">Sydney</option>
            <option value="Brisbane">Brisbane</option>
            <option value="Perth">Perth</option>
            <option value="Adelaide">Adelaide</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            value={customerInfo.address}
            onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
            required
          />
        </Form.Group>
      </div>
    </Form>
  );

  // Render Step 2: Shipping & Payments
  const renderStep2 = () => (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-2">Payment</h3>
        <p className="text-muted mb-3">Please choose a payment method.</p>
        <div className="d-flex flex-column gap-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`border ${paymentMethod === method.id ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setPaymentMethod(method.id)}
            >
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <Form.Check
                      type="radio"
                      name="paymentMethod"
                      id={`payment-${method.id}`}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <div>
                      <h6 className="mb-1 fw-semibold">{method.name}</h6>
                      <p className="text-muted small mb-0">{method.description}</p>
                    </div>
                  </div>
                  <img src={method.logo} alt={method.name} style={{ height: '40px' }} />
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="fw-bold mb-2">Shipping</h3>
        <p className="text-muted mb-3">Please choose a shipping company based on your region.</p>
        <div className="d-flex flex-column gap-3">
          {shippingCompanies.map((company) => (
            <Card
              key={company.id}
              className={`border ${shippingCompany === company.id ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShippingCompany(company.id)}
            >
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <Form.Check
                      type="radio"
                      name="shippingCompany"
                      id={`shipping-${company.id}`}
                      checked={shippingCompany === company.id}
                      onChange={() => setShippingCompany(company.id)}
                    />
                    <div>
                      <h6 className="mb-1 fw-semibold">{company.name}</h6>
                      <div className="small text-muted">
                        <div>Delivery time: {company.deliveryTime}</div>
                        <div>
                          Shipping cost:{' '}
                          {company.shippingCost === 0
                            ? 'Free'
                            : formatCurrency(company.shippingCost)}
                        </div>
                        <div className={company.insurance ? 'text-success' : 'text-danger'}>
                          Insurance: {company.insurance ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <img src={company.logo} alt={company.name} style={{ height: '50px' }} />
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Step 3: Product Confirmation
  const renderStep3 = () => (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-3">Shopping items</h3>
        <div className="d-flex flex-column gap-3">
          {cartItems.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  </Col>
                  <Col>
                    <h6 className="mb-1">{item.name}</h6>
                    <p className="text-muted small mb-1">{item.variant || item.description}</p>
                    <div className="d-flex align-items-center gap-2">
                      {item.color && (
                        <div className="d-flex align-items-center gap-1">
                          <div
                            className="rounded-circle"
                            style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: item.colorCode || '#ccc',
                              border: '1px solid #ddd',
                            }}
                            title={item.color}
                          />
                          <span className="small">{item.color}</span>
                        </div>
                      )}
                      {item.size && item.size !== 'N/A' && (
                        <span className="small text-muted">Size: {item.size}</span>
                      )}
                    </div>
                  </Col>
                  <Col xs="auto" className="text-end">
                    <div className="small text-muted mb-1">
                      Unit price: {formatCurrency(item.price || 0)}
                    </div>
                    <div className="small text-muted mb-1">Quantity: x{item.quantity || 1}</div>
                    <div className="fw-bold">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="fw-bold mb-3">Payment method</h3>
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold">
                {paymentMethods.find((m) => m.id === paymentMethod)?.name || 'Paypal'}
              </span>
              <img
                src={paymentMethods.find((m) => m.id === paymentMethod)?.logo}
                alt={paymentMethod}
                style={{ height: '30px' }}
              />
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="mb-4">
        <h3 className="fw-bold mb-3">Shipping company</h3>
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold">
                {shippingCompanies.find((s) => s.id === shippingCompany)?.name || 'RaceCouriers'}
              </span>
              <img
                src={shippingCompanies.find((s) => s.id === shippingCompany)?.logo}
                alt={shippingCompany}
                style={{ height: '40px' }}
              />
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="mb-4">
        <h3 className="fw-bold mb-3">Customer Details</h3>
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="small">
              <div className="mb-2">
                <strong>Name:</strong> {customerInfo.firstName} {customerInfo.lastName}
              </div>
              <div className="mb-2">
                <strong>Country:</strong> {customerInfo.country}
              </div>
              <div className="mb-2">
                <strong>Address:</strong> {customerInfo.address}
              </div>
              <div className="mb-2">
                <strong>City:</strong> {customerInfo.state}
              </div>
              <div>
                <strong>Phone:</strong> {customerInfo.phone}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  // Render Order Summary Sidebar
  const renderOrderSummary = () => (
    <Card className="sticky-top" style={{ top: '20px' }}>
      <Card.Header className="bg-white">
        <h5 className="mb-0 fw-semibold">Order Summary</h5>
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Price</span>
          <span className="fw-semibold">{formatCurrency(subtotal)}</span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Shipping</span>
          <span className="fw-semibold">
            {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
          </span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Tax</span>
          <span className="fw-semibold">{tax === 0 ? 'Free' : formatCurrency(tax)}</span>
        </div>

        {discount > 0 && (
          <div className="d-flex justify-content-between mb-2 text-success">
            <span>Discount price</span>
            <span className="fw-semibold">-{formatCurrency(discount)}</span>
          </div>
        )}

        {currentStep < 3 && (
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              id="giftBox"
              label="Pack in a Gift Box"
              checked={includeGiftBox}
              onChange={(e) => setIncludeGiftBox(e.target.checked)}
            />
            {includeGiftBox && <small className="text-muted ms-4">+{formatCurrency(10.9)}</small>}
          </div>
        )}

        {currentStep === 3 && includeGiftBox && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Pack in a Gift Box</span>
            <span className="fw-semibold">+{formatCurrency(10.9)}</span>
          </div>
        )}

        <hr />

        <div className="d-flex justify-content-between mb-4">
          <span className="fw-bold fs-5">Total Price</span>
          <span className="fw-bold fs-5 text-primary">{formatCurrency(finalTotal)}</span>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="primary"
            className={currentStep === 1 ? 'w-100' : 'flex-fill'}
            onClick={handleSubmit}
            disabled={cartItems.length === 0}
          >
            <i className="bi bi-gift me-2"></i>
            {currentStep === 3 ? 'CONFIRM' : 'NEXT'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  // Step titles
  const stepTitles = ['Customer Information', 'Shipping & Payments', 'Product Confirmation'];

  return (
    <div className="checkout-page bg-white" style={{ minHeight: '100vh' }}>
      <Container className="py-4">
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
            <div className="mb-4">
              <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>
                {stepTitles[currentStep - 1]}
              </h1>
              <p className="text-muted mb-0">Let&apos;s create your account</p>
            </div>
          </div>
          <Button variant="link" className="p-0">
            <i className="bi bi-share fs-5"></i>
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="d-flex align-items-center flex-fill">
                <div className="d-flex flex-column align-items-center flex-fill">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                      currentStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'
                    }`}
                    style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
                  >
                    {step}
                  </div>
                  <small className="text-center text-muted">{stepTitles[step - 1]}</small>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-fill mx-2 ${currentStep > step ? 'bg-primary' : 'bg-light'}`}
                    style={{ height: '2px', marginTop: '-20px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Row style={{ marginTop: '45px' }}>
          <Col lg={8}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </Col>

          <Col lg={4}>{renderOrderSummary()}</Col>
        </Row>
      </Container>
    </div>
  );
};

export default CheckoutPage;
