import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartItems } from '@store/slices/cartSlice';
import { orderService } from '@services/api/orderService';
import { paymentService } from '@services/api/paymentService';
import addressService from '@services/api/addressService';
import locationService from '@services/api/locationService';
import voucherService from '@services/api/voucherService';
import { formatCurrency } from '@utils/formatters';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { Modal } from 'react-bootstrap';

/**
 * Checkout Page Component
 * Multi-step checkout process with 3 steps:
 * 1. Customer Information
 * 2. Shipping & Payments
 * 3. Product Confirmation
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const allCartItems = useSelector(selectCartItems);

  // Use selected items from CartPage if available, otherwise use all items
  const cartItems = location.state?.selectedItems || allCartItems;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Form data state
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    country: 'Vietnam',
    state: '',
    address: '',
    phone: '',
  });

  // Fetch applicable vouchers on mount
  useEffect(() => {
    const fetchVouchers = async () => {
      setVoucherLoading(true);
      try {
        const response = await voucherService.getApplicableVouchers();
        if (response.success) {
          setApplicableVouchers(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch applicable vouchers:', error);
      } finally {
        setVoucherLoading(false);
      }
    };
    if (cartItems.length > 0) {
      fetchVouchers();
    }
  }, [cartItems]);

  const handleSelectAddress = (addr) => {
    // Split receiverName into first/last name
    const nameParts = (addr.receiverName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setCustomerInfo((prev) => ({
      ...prev,
      firstName,
      lastName,
      country: addr.country || (addr.provinceName ? 'Vietnam' : 'Vietnam'),
      state: addr.provinceName || '',
      address: [addr.details, addr.street, addr.wardName].filter(Boolean).join(', '),
      phone: addr.phone || prev.phone,
    }));
    setSelectedAddressId(addr._id);
    setShowAddressModal(false);
  };

  // Fetch customer info and addresses on mount
  useEffect(() => {
    const initializeData = async () => {
      let currentAddressValue = '';

      // 1. Fetch Customer Info
      try {
        const infoResponse = await orderService.getCheckoutInfo();
        if (infoResponse.success) {
          const data = infoResponse.data;
          setCustomerInfo((prev) => ({
            ...prev,
            ...data,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
          }));
          currentAddressValue = data.address || '';
        }
      } catch (error) {
        console.error('Failed to fetch customer info:', error);
      }

      // 2. Fetch Addresses
      try {
        const addrResponse = await addressService.getAddresses();
        if (addrResponse.success) {
          const list = addrResponse.data || [];
          setAddresses(list);

          // Auto-select default address if no address is currently set
          if (!currentAddressValue && list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            if (defaultAddr) {
              handleSelectAddress(defaultAddr);
            }
          } else if (currentAddressValue && list.length > 0) {
            // Try to match current address to an ID for radio button sync
            const match = list.find(
              (a) =>
                [a.details, a.street, a.wardName].filter(Boolean).join(', ') === currentAddressValue
            );
            if (match) {
              setSelectedAddressId(match._id);
              // Also sync state/country if they are missing or to ensure consistency for previewOrder
              setCustomerInfo((prev) => ({
                ...prev,
                state: match.provinceName || prev.state,
                country: match.country || 'Vietnam',
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      }
    };

    initializeData();
  }, []);

  const resetAddressForm = () => {
    setAddressForm({
      receiverName: '',
      phone: '',
      provinceCode: '',
      provinceName: '',
      wardCode: '',
      wardName: '',
      street: '',
      details: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleAddAddressClick = () => {
    resetAddressForm();
    setAddressModalView('add');
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      receiverName: addr.receiverName,
      phone: addr.phone,
      provinceCode: addr.provinceCode || '',
      provinceName: addr.provinceName || '',
      wardCode: addr.wardCode || '',
      wardName: addr.wardName || '',
      street: addr.street || '',
      details: addr.details || '',
      isDefault: addr.isDefault,
    });
    setAddressModalView('edit');
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await addressService.deleteAddress(id);
        if (response.success) {
          const updatedAddresses = addresses.filter((a) => a._id !== id);
          setAddresses(updatedAddresses);
        }
      } catch (error) {
        console.error('Failed to delete address:', error);
      }
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const response = await addressService.setDefaultAddress(id);
      if (response.success) {
        const updatedAddresses = await addressService.getAddresses();
        setAddresses(updatedAddresses.data || []);
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
    }
  };

  const handleSaveAddress = async () => {
    try {
      let response;
      if (editingAddress) {
        response = await addressService.updateAddress(editingAddress._id, addressForm);
      } else {
        response = await addressService.createAddress(addressForm);
      }

      if (response.success) {
        const updatedAddresses = await addressService.getAddresses();
        setAddresses(updatedAddresses.data || []);

        // If it was newly created and is the only address, or just created, let's select it
        if (!editingAddress) {
          handleSelectAddress(response.data || updatedAddresses.data[0]);
        } else {
          setAddressModalView('list');
        }
      }
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const province = provinces.find((p) => p.code === Number(code));
    setAddressForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: province ? province.name : '',
      wardCode: '',
      wardName: '',
    }));
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const ward = wards.find((w) => w.code === Number(code));
    setAddressForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: ward ? ward.name : '',
    }));
  };

  const [paymentMethod, setPaymentMethod] = useState('payos');
  const [shippingCompany, setShippingCompany] = useState('ausff');
  const [includeGiftBox, setIncludeGiftBox] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalView, setAddressModalView] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingAddress, setEditingAddress] = useState(null);

  const [addressForm, setAddressForm] = useState({
    receiverName: '',
    phone: '',
    provinceCode: '',
    provinceName: '',
    wardCode: '',
    wardName: '',
    street: '',
    details: '',
    isDefault: false,
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  // Fetch Provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Failed to fetch provinces:', error);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch Wards when Province changes
  useEffect(() => {
    if (addressForm.provinceCode) {
      const fetchWards = async () => {
        try {
          const data = await locationService.getWards(addressForm.provinceCode);
          setWards(data);
        } catch (error) {
          console.error('Failed to fetch wards:', error);
        }
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [addressForm.provinceCode]);

  // Voucher state
  const [applicableVouchers, setApplicableVouchers] = useState([]);
  const [selectedShopVoucherId, setSelectedShopVoucherId] = useState(null);
  const [selectedProductVoucherId, setSelectedProductVoucherId] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Payment methods data
  const paymentMethods = [
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery (COD)',
      logo: 'https://cdn-icons-png.flaticon.com/512/2331/2331941.png', // Generic COD icon
      description:
        'Pay with cash when you receive your order at your doorstep. No upfront payment required.',
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png',
      description:
        'Pay securely using VNPay QR code, ATM card, or credit/debit card. Fast and secure payment processing.',
    },
    {
      id: 'payos',
      name: 'PayOS',
      logo: 'https://about.cas.so/wp-content/uploads/sites/11/2023/08/cropped-Untitled-1.png',
      description:
        'Pay via PayOS payment gateway with bank transfer or QR code. Safe and convenient online payment.',
    },
  ];

  // Shipping companies data
  const shippingCompanies = [
    {
      id: 'ausff',
      name: 'AUSFF',
      logo: 'data:image/png;base64,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',
      deliveryTime: '14-21 days',
      shippingCost: 0,
      insurance: false,
    },
    {
      id: 'racecouriers',
      name: 'RaceCouriers',
      logo: 'https://www.racegroup.com.au/storage/2020/12/Race-Couriers.png',
      deliveryTime: '14-21 days',
      shippingCost: 10,
      insurance: true,
    },
    {
      id: 'transcocargo',
      name: 'TranscoCargo',
      logo: 'https://srl.ams3.cdn.digitaloceanspaces.com/logos/transco-cargo-campbellfield-campbellfield.png',
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
    total: 0,
  });

  // Calculate local subtotal for initial render/fallback
  const localSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Get selected voucher IDs for API calls
  const getSelectedVoucherIds = useCallback(() => {
    const ids = [];
    if (selectedShopVoucherId) {
      ids.push(selectedShopVoucherId);
    }
    if (selectedProductVoucherId) {
      ids.push(selectedProductVoucherId);
    }
    return ids;
  }, [selectedShopVoucherId, selectedProductVoucherId]);

  // Fetch order preview when city/state, cart, or vouchers change
  useEffect(() => {
    const fetchPreview = async () => {
      const city = customerInfo.state;
      try {
        const response = await orderService.previewOrder({
          city,
          voucherIds: getSelectedVoucherIds(),
          cartItemIds: cartItems.map((item) => item._id || item.id),
        });
        if (response.success) {
          setOrderSummary(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch order preview:', error);
        setOrderSummary({
          subtotal: localSubtotal,
          shippingCost: 0,
          tax: 0,
          discount: 0,
          total: localSubtotal,
        });
      }
    };

    if (cartItems.length > 0) {
      fetchPreview();
    }
  }, [customerInfo.state, cartItems, localSubtotal, getSelectedVoucherIds]);

  // Get selected shipping company cost
  const selectedShippingCompany = shippingCompanies.find((c) => c.id === shippingCompany);
  const selectedShippingCost = selectedShippingCompany ? selectedShippingCompany.shippingCost : 0;

  // Values for display (use selected shipping cost instead of backend)
  const { subtotal, tax, discount } = orderSummary;
  const giftBoxPrice = includeGiftBox ? 10.9 : 0;
  const finalTotal = subtotal + selectedShippingCost + tax - discount + giftBoxPrice;

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
    console.log('[CHECKOUT-DEBUG] 📝 handleSubmit called, currentStep:', currentStep);

    if (currentStep === 1) {
      handleNext();
    } else if (currentStep === 2) {
      handleNext();
    } else if (currentStep === 3) {
      console.log('[CHECKOUT-DEBUG] 🛒 Step 3 - Creating order...');
      setIsProcessing(true);
      const orderData = {
        shippingAddress: `${customerInfo.address}, ${customerInfo.state}, ${customerInfo.country}`,
        city: customerInfo.state,
        paymentMethod,
        notes: '',
        voucherIds: getSelectedVoucherIds(),
        cartItemIds: cartItems.map((item) => item._id || item.id),
      };

      try {
        console.log('[CHECKOUT-DEBUG] 📤 Calling orderService.createOrder with:', orderData);
        const response = await orderService.createOrder(orderData);
        console.log('[CHECKOUT-DEBUG] ✅ Order created successfully:', response);

        if (response.success) {
          const orderId = response.data._id;

          // If PayOS payment method, create payment link and redirect
          if (paymentMethod === 'payos') {
            try {
              const paymentResponse = await paymentService.createPaymentLink(orderId);
              if (paymentResponse.success && paymentResponse.data.checkoutUrl) {
                // Redirect to PayOS checkout page
                window.location.href = paymentResponse.data.checkoutUrl;
                return;
              }
            } catch (paymentError) {
              console.error('Failed to create payment link:', paymentError);
              alert(
                'Failed to create payment link. Please try again or choose another payment method.'
              );
              setIsProcessing(false);
              return;
            }
          }

          // For other payment methods (COD, VNPay), go to confirmation page
          console.log('[CHECKOUT-DEBUG] 🧭 Navigating to order confirmation:', orderId);
          navigate(BUYER_ROUTES.ORDER_CONFIRMATION.replace(':orderId', orderId));
        }
      } catch (error) {
        console.error('Failed to create order', error);
        alert(error.message || 'Failed to create order');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Render Step 1: Customer Information
  const renderStep1 = () => (
    <Form onSubmit={handleSubmit}>
      <div className="mb-4">
        {/* Selected Address Display Block */}
        {customerInfo.address ? (
          <Card
            className="mb-4 border-0 shadow-sm overflow-hidden"
            style={{ borderRadius: '12px', background: '#fff' }}
          >
            <div
              style={{
                height: '4px',
                background:
                  'repeating-linear-gradient(45deg, #0D6EFD, #0D6EFD 33px, #fff 33px, #fff 46px, #405cbf 46px, #405cbf 79px, #fff 79px, #fff 92px)',
              }}
            />
            <Card.Body className="p-4">
              <div className="d-flex align-items-start gap-3">
                <div className="mt-1" style={{ color: '#0D6EFD', fontSize: '1.2rem' }}>
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0" style={{ color: '#0D6EFD' }}>
                      Shipping Address
                    </h5>
                    <Button
                      variant="link"
                      className="text-decoration-none p-0 fw-bold"
                      style={{ color: '#0D6EFD' }}
                      onClick={() => {
                        setAddressModalView('list');
                        setShowAddressModal(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                    <span className="fw-bold text-dark fs-5">
                      {customerInfo.firstName} {customerInfo.lastName}
                    </span>
                    <span className="text-secondary fs-5">(+84) {customerInfo.phone}</span>
                  </div>
                  <p className="mb-0 text-muted fs-5 lh-base">
                    {customerInfo.address}, {customerInfo.state}, {customerInfo.country}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <div className="text-center py-5 bg-light rounded-4 mb-4 border-dashed border-2">
            <i className="bi bi-geo-alt text-muted mb-3" style={{ fontSize: '3rem' }}></i>
            <h5 className="text-muted">No shipping address yet</h5>
            <Button
              variant="primary"
              className="mt-3 px-4 rounded-pill"
              onClick={() => {
                setAddressModalView('list');
                setShowAddressModal(true);
              }}
              style={{ backgroundColor: '#0D6EFD', borderColor: '#0D6EFD' }}
            >
              Select or Add Address
            </Button>
          </div>
        )}
      </div>
    </Form>
  );

  // Render Step 2: Shipping & Payments
  const renderStep2 = () => (
    <Row>
      {/* Payment Column */}
      <Col md={6}>
        <div className="mb-4">
          <h3 className="fw-bold mb-2">Payment</h3>
          <p className="text-muted mb-3">Please choose a payment method.</p>
          <div className="d-flex flex-column gap-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className={`border ${paymentMethod === method.id ? 'border-primary' : ''}`}
                style={{
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === method.id ? '#F3F4F6' : '#FFFFFF',
                  minHeight: '120px',
                }}
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
                    <img
                      src={method.logo}
                      alt={method.name}
                      style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                    />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </Col>

      {/* Shipping Column */}
      <Col md={6}>
        <div className="mb-4">
          <h3 className="fw-bold mb-2">Shipping</h3>
          <p className="text-muted mb-3">Please choose a shipping company based on your region.</p>
          <div className="d-flex flex-column gap-3">
            {shippingCompanies.map((company) => (
              <Card
                key={company.id}
                className={`border ${shippingCompany === company.id ? 'border-primary' : ''}`}
                style={{
                  cursor: 'pointer',
                  backgroundColor: shippingCompany === company.id ? '#F3F4F6' : '#FFFFFF',
                  minHeight: '120px',
                }}
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
                    <img
                      src={company.logo}
                      alt={company.name}
                      style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                    />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </Col>
    </Row>
  );

  // Render Step 3: Product Confirmation
  const renderStep3 = () => (
    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#F9FAFB' }}>
      <Card.Body className="p-4">
        {/* Shopping items */}
        <div className="mb-4">
          <h5 className="mb-3">Shopping items</h5>
          <div className="d-flex flex-column gap-3">
            {cartItems.map((item) => (
              <div key={item.id}>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <img
                      src={item.image || '/placeholder-image.png'}
                      alt={item.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-image.png';
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
                    <div className="small text-muted mb-1">{formatCurrency(item.price || 0)}</div>
                    <div className="small text-muted mb-1">x{item.quantity || 1}</div>
                    <div className="fw-bold">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        </div>

        <hr />

        {/* Payment method */}
        <div className="mb-4">
          <h5 className="">Payment method</h5>
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
        </div>

        <hr />

        {/* Shipping company */}
        <div className="mb-4">
          <h5 className="">Shipping company</h5>
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
        </div>

        {/* Customer Details - 2 column layout */}
        <div>
          <Row className="mb-3">
            <Col xs={3}>
              <span>Name</span>
            </Col>
            <Col xs={9} className="text-end">
              <span>
                {customerInfo.firstName} {customerInfo.lastName}
              </span>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={3}>
              <span>Country</span>
            </Col>
            <Col xs={9} className="text-end">
              <span>{customerInfo.country}</span>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={3}>
              <span>Address</span>
            </Col>
            <Col xs={9} className="text-end">
              <span>{customerInfo.address}</span>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={3}>
              <span>City</span>
            </Col>
            <Col xs={9} className="text-end">
              <span>{customerInfo.state}</span>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col xs={3}>
              <span>Phone</span>
            </Col>
            <Col xs={9} className="text-end">
              <span>{customerInfo.phone}</span>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );

  // Handle manual voucher code apply
  const handleApplyCode = async () => {
    if (!manualCode.trim()) {
      return;
    }
    setCodeError('');
    setCodeLoading(true);
    try {
      const response = await voucherService.validateCode(manualCode.trim());
      if (response.success && response.data) {
        const v = response.data;
        // Check if already in list
        const exists = applicableVouchers.find((av) => av._id === v._id);
        if (!exists) {
          setApplicableVouchers((prev) => [...prev, v]);
        }
        // Auto-select
        if (v.type === 'shop' || v.type === 'private') {
          setSelectedShopVoucherId(v._id);
        } else if (v.type === 'product') {
          setSelectedProductVoucherId(v._id);
        }
        setManualCode('');
      }
    } catch (error) {
      setCodeError(error.response?.data?.message || error.message || 'Invalid voucher code');
    } finally {
      setCodeLoading(false);
    }
  };

  // Render Voucher Section
  const renderVoucherSection = () => {
    const shopVouchers = applicableVouchers.filter(
      (v) => v.type === 'shop' || v.type === 'private'
    );
    const productVouchers = applicableVouchers.filter((v) => v.type === 'product');
    const hasVouchers = shopVouchers.length > 0 || productVouchers.length > 0;

    return (
      <div className="mb-3">
        <div
          className="d-flex align-items-center gap-2 mb-2"
          style={{ fontSize: '0.95rem', fontWeight: 600 }}
        >
          <i className="bi bi-tag" style={{ color: '#0D6EFD' }}></i>
          <span>Vouchers</span>
        </div>

        {voucherLoading && (
          <div className="text-center py-2">
            <Spinner animation="border" size="sm" className="me-2" />
            <small className="text-muted">Loading vouchers...</small>
          </div>
        )}

        {!voucherLoading && hasVouchers && (
          <>
            {/* Shop Vouchers */}
            {shopVouchers.length > 0 && (
              <div className="mb-2">
                <small className="text-muted fw-semibold d-block mb-1">Shop Voucher</small>
                {shopVouchers.map((v) => (
                  <div
                    key={v._id}
                    className={`d-flex align-items-start gap-2 p-2 rounded mb-1 ${
                      !v.eligible ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: selectedShopVoucherId === v._id ? '#fff5f0' : '#f8f9fa',
                      border:
                        selectedShopVoucherId === v._id
                          ? '1px solid #0D6EFD'
                          : '1px solid transparent',
                      cursor: v.eligible ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => {
                      if (!v.eligible) return;
                      setSelectedShopVoucherId(selectedShopVoucherId === v._id ? null : v._id);
                    }}
                  >
                    <Form.Check
                      type="radio"
                      name="shopVoucher"
                      checked={selectedShopVoucherId === v._id}
                      disabled={!v.eligible}
                      onChange={() => {}}
                      style={{ marginTop: '2px' }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-1">
                        <Badge
                          bg=""
                          style={{
                            backgroundColor: '#0D6EFD',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                          }}
                        >
                          {v.code}
                        </Badge>
                        <span className="fw-semibold" style={{ color: '#333' }}>
                          {v.name}
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {v.shopName}
                        {v.minBasketPrice > 0 && ` · Min ${formatCurrency(v.minBasketPrice)}`}
                      </div>
                      {v.eligible && v.estimatedSaving > 0 && (
                        <div style={{ color: '#ff6b35', fontSize: '0.78rem', fontWeight: 500 }}>
                          Save {formatCurrency(v.estimatedSaving)}
                        </div>
                      )}
                      {!v.eligible && v.ineligibleReason && (
                        <div className="text-danger" style={{ fontSize: '0.75rem' }}>
                          {v.ineligibleReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Product Vouchers */}
            {productVouchers.length > 0 && (
              <div className="mb-2">
                <small className="text-muted fw-semibold d-block mb-1">Product Voucher</small>
                {productVouchers.map((v) => (
                  <div
                    key={v._id}
                    className={`d-flex align-items-start gap-2 p-2 rounded mb-1 ${
                      !v.eligible ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: selectedProductVoucherId === v._id ? '#fff5f0' : '#f8f9fa',
                      border:
                        selectedProductVoucherId === v._id
                          ? '1px solid #0D6EFD'
                          : '1px solid transparent',
                      cursor: v.eligible ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => {
                      if (!v.eligible) {
                        return;
                      }
                      setSelectedProductVoucherId(
                        selectedProductVoucherId === v._id ? null : v._id
                      );
                    }}
                  >
                    <Form.Check
                      type="radio"
                      name="productVoucher"
                      checked={selectedProductVoucherId === v._id}
                      disabled={!v.eligible}
                      onChange={() => {}}
                      style={{ marginTop: '2px' }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-1">
                        <Badge
                          bg=""
                          style={{
                            backgroundColor: '#0D6EFD',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                          }}
                        >
                          {v.code}
                        </Badge>
                        <span className="fw-semibold" style={{ color: '#333' }}>
                          {v.name}
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {v.applicableProductNames?.length > 0
                          ? v.applicableProductNames.join(', ')
                          : v.shopName}
                        {v.minBasketPrice > 0 && ` · Min ${formatCurrency(v.minBasketPrice)}`}
                      </div>
                      {v.eligible && v.estimatedSaving > 0 && (
                        <div style={{ color: '#0D6EFD', fontSize: '0.78rem', fontWeight: 500 }}>
                          Save {formatCurrency(v.estimatedSaving)}
                        </div>
                      )}
                      {!v.eligible && v.ineligibleReason && (
                        <div className="text-danger" style={{ fontSize: '0.75rem' }}>
                          {v.ineligibleReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Manual Code Input */}
        <div className="d-flex gap-2 mt-2">
          <Form.Control
            size="sm"
            type="text"
            placeholder="Enter voucher code"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value.toUpperCase());
              setCodeError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
            style={{ fontSize: '0.85rem' }}
            isInvalid={!!codeError}
          />
          <Button
            size="sm"
            variant="outline-primary"
            onClick={handleApplyCode}
            disabled={codeLoading || !manualCode.trim()}
            style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
          >
            {codeLoading ? <Spinner animation="border" size="sm" /> : 'Apply'}
          </Button>
        </div>
        {codeError && (
          <small className="text-danger d-block mt-1" style={{ fontSize: '0.78rem' }}>
            {codeError}
          </small>
        )}
      </div>
    );
  };

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
            {selectedShippingCost === 0 ? 'Free' : formatCurrency(selectedShippingCost)}
          </span>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Tax</span>
          <span className="fw-semibold">{tax === 0 ? 'Free' : formatCurrency(tax)}</span>
        </div>

        <hr className="my-2" />

        {/* Voucher Section */}
        {renderVoucherSection()}

        {discount > 0 && (
          <div className="d-flex justify-content-between mb-2" style={{ color: '#0D6EFD' }}>
            <span>
              <i className="bi bi-tag-fill me-1"></i>Discount
            </span>
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
            disabled={cartItems.length === 0 || isProcessing}
            style={{ backgroundColor: '#0D6EFD', borderColor: '#0D6EFD' }}
          >
            {isProcessing ? (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="bi bi-gift me-2"></i>
            )}
            {currentStep === 3 ? 'CONFIRM' : 'NEXT'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  // Step titles
  const stepTitles = ['Customer Information', 'Shipping & Payments', 'Order Confirmation'];

  return (
    <div className="checkout-page" style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
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

      <Modal
        show={showAddressModal}
        onHide={() => setShowAddressModal(false)}
        centered
        size="lg"
        className="address-selection-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-4">
            {addressModalView === 'list'
              ? 'My Addresses'
              : addressModalView === 'edit'
                ? 'Update Address'
                : 'New Address'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-2">
          {addressModalView === 'list' ? (
            <>
              <div className="address-list py-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {addresses.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">You don&apos;t have any saved addresses.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`address-item p-3 mb-0 border-bottom position-relative ${addr._id === selectedAddressId ? 'bg-light-subtle' : ''}`}
                      onClick={() => handleSelectAddress(addr)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <Form.Check
                            type="radio"
                            name="address-radio"
                            checked={addr._id === selectedAddressId}
                            readOnly
                          />
                          <span className="fw-bold fs-5">{addr.receiverName}</span>
                          <span className="text-secondary mx-1">|</span>
                          <span className="text-secondary fs-5">(+84) {addr.phone}</span>
                        </div>
                        <div className="d-flex gap-3">
                          {!addr.isDefault && (
                            <Button
                              variant="link"
                              className="text-decoration-none p-0 fw-bold small text-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultAddress(addr._id);
                              }}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="link"
                            className="text-decoration-none p-0 fw-bold"
                            style={{ color: '#666' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddressClick(addr);
                            }}
                            title="Update"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Button>
                          <Button
                            variant="link"
                            className="text-decoration-none p-0 fw-bold text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addr._id);
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="ms-4">
                        <p className="text-muted mb-2 fs-6">
                          {addr.details}
                          <br />
                          {addr.street}, {addr.wardName}, {addr.provinceName}
                        </p>
                        {addr.isDefault && (
                          <Badge
                            bg="transparent"
                            className="border border-danger text-danger rounded-0 px-2 py-1 small"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="outline-secondary"
                className="w-100 py-3 mt-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleAddAddressClick}
                style={{ borderRadius: '4px', borderStyle: 'dashed' }}
              >
                <i className="bi bi-plus-lg"></i> Add New Address
              </Button>
            </>
          ) : (
            <Form>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Control
                      type="text"
                      placeholder="Full Name"
                      name="receiverName"
                      value={addressForm.receiverName}
                      onChange={handleAddressFormChange}
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Control
                      type="tel"
                      placeholder="Phone Number"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Select
                      name="provinceCode"
                      value={addressForm.provinceCode}
                      onChange={handleProvinceChange}
                      className="py-2"
                    >
                      <option value="">Province/City</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Select
                      name="wardCode"
                      value={addressForm.wardCode}
                      onChange={handleWardChange}
                      className="py-2"
                      disabled={!addressForm.provinceCode}
                    >
                      <option value="">Ward/Commune</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Street Name"
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressFormChange}
                  className="py-2"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Specific Address"
                  name="details"
                  value={addressForm.details}
                  onChange={handleAddressFormChange}
                  className="py-2"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  label="Set as default address"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressFormChange}
                  id="default-address-checkbox"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            className="px-4 py-2"
            onClick={() => {
              if (addressModalView === 'list') {
                setShowAddressModal(false);
              } else {
                setAddressModalView('list');
              }
            }}
          >
            {addressModalView === 'list' ? 'Cancel' : 'BACK'}
          </Button>
          <Button
            variant="primary"
            className="px-4 py-2"
            style={{ background: '#0D6EFD', borderColor: '#0D6EFD' }}
            onClick={() => {
              if (addressModalView === 'list') {
                setShowAddressModal(false);
              } else {
                handleSaveAddress();
              }
            }}
          >
            {addressModalView === 'list' ? 'Confirm' : 'SAVE'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
