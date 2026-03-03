import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner, Button } from 'react-bootstrap';
// import { Container } from 'react-bootstrap'; // Unused in original but kept if needed
import { PUBLIC_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { orderService } from '@services/api/orderService';
import { paymentService } from '@services/api/paymentService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';
import addressService from '@services/api/addressService';
import OrderTrackingEnhanced from '@components/buyer/OrderTrackingEnhanced';
import locationService from '@services/api/locationService';
import { Modal, Form } from 'react-bootstrap';
import toast, { Toaster } from 'react-hot-toast';
import ReviewModal from '@components/common/ReviewModal';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(PUBLIC_ROUTES.LOGIN);
    }
  }, [isAuthenticated, navigate]);

  // State for tab switching - get from URL or default to 'account'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsTab, setDetailsTab] = useState('items');

  // Order API State
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Initialize form data from user
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    repeatPassword: '',
  });

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    receiverName: '',
    phone: '',
    provinceCode: '', // Simplified for now, just text or code
    provinceName: '',
    wardCode: '',
    wardName: '',
    street: '',
    details: '',
    isDefault: false,
  });

  // Location State
  const [provinces, setProvinces] = useState([]);
  // const [districts, setDistricts] = useState([]); // Removed for V2
  const [wards, setWards] = useState([]);

  // Fetch Provinces on Mount
  useEffect(() => {
    const fetchProvinces = async () => {
      const data = await locationService.getProvinces();
      setProvinces(data);
    };
    fetchProvinces();
  }, []);

  // Fetch Wards when Province Changes (V2: Wards are under Province)
  useEffect(() => {
    if (addressForm.provinceCode) {
      const fetchWards = async () => {
        const data = await locationService.getWards(addressForm.provinceCode);
        setWards(data);
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [addressForm.provinceCode]);

  // Fetch Wards when District Changes -> REMOVED
  // useEffect(() => {
  //   if (addressForm.districtCode) {
  //     const fetchWards = async () => {
  //       const data = await locationService.getWards(addressForm.districtCode);
  //       setWards(data);
  //     };
  //     fetchWards();
  //   } else {
  //     setWards([]);
  //   }
  // }, [addressForm.districtCode]);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const province = provinces.find((p) => p.code === Number(code));
    setAddressForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: province ? province.name : '',
      // districtCode: '', // Removed
      // districtName: '', // Removed
      wardCode: '',
      wardName: '',
    }));
  };

  // const handleDistrictChange = ... // Removed

  const handleWardChange = (e) => {
    const code = e.target.value;
    const ward = wards.find((w) => w.code === Number(code));
    setAddressForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: ward ? ward.name : '',
    }));
  };

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      // Split fullName into firstName and lastName
      const nameParts = (user.fullName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        displayName: firstName || user.fullName || user.email?.split('@')[0] || '',
        email: user.email || '',
        oldPassword: '',
        newPassword: '',
        repeatPassword: '',
      });
    }
  }, [user]);

  // Fetch orders when Orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders(pagination.page);
    }
    if (activeTab === 'address') {
      fetchAddresses();
    }
  }, [activeTab]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    if (tab === 'orders') {
      setSelectedOrder(null);
    }
  };

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const response = await addressService.getAddresses();
      if (response && response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      receiverName: user?.fullName || '',
      phone: user?.phone || '',
      provinceCode: '',
      provinceName: '',
      // districtCode: '',
      // districtName: '',
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
    setShowAddressModal(true);
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      receiverName: addr.receiverName,
      phone: addr.phone,
      provinceCode: addr.provinceCode || '',
      provinceName: addr.provinceName || '',
      // districtCode: addr.districtCode || '',
      // districtName: addr.districtName || '',
      wardCode: addr.wardCode || '',
      wardName: addr.wardName || '',
      street: addr.street || '',
      details: addr.details || '',
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
    // Trigger location fetches by setting codes (controlled by useEffects)
    // Note: useEffects will run and fetch districts/wards based on these codes
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress._id, addressForm);
      } else {
        await addressService.createAddress(addressForm);
      }

      setShowAddressModal(false);
      fetchAddresses();
      toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address. Please try again.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await addressService.deleteAddress(id);
        fetchAddresses();
        toast.success('Address deleted successfully');
      } catch (error) {
        console.error('Failed to delete address:', error);
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
      toast.success('Default address updated');
      // Optionally reload user profile to sync top-level user data
      // dispatch(fetchUserProfile()); // if such action exists
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const formatAddressString = (addr) => {
    return [addr.details, addr.wardName, addr.provinceName]
      .filter((part) => part && part.trim() !== '')
      .join(', ');
  };

  const fetchOrders = async (page) => {
    setOrderLoading(true);
    try {
      const response = await orderService.getMyOrders(page, pagination.limit);
      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  };

  const handleOrderClick = async (orderId) => {
    setSelectedOrder({ id: orderId }); // Using object wrapper to match original prop structure if needed, or just ID
    setDetailsLoading(true);
    try {
      const response = await orderService.getOrderById(orderId);
      if (response.success) {
        setSelectedOrderDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewInvoice = async (e, orderId) => {
    // e.stopPropagation(); // Not needed if button is outside clickable row area or handled correctly
    try {
      const response = await orderService.getInvoice(orderId);
      if (response.success) {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(response.data);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to get invoice:', error);
      alert('Could not generate invoice. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving profile:', formData);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate(PUBLIC_ROUTES.HOME);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePayNow = async (orderId) => {
    setPaymentProcessing(orderId);
    try {
      const response = await paymentService.createPaymentLink(orderId);
      if (response.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      alert(err.message || 'Failed to create payment link');
      setPaymentProcessing(null);
    }
  };

  const handleOpenReviewModal = (order) => {
    setReviewingOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewData) => {
    if (!reviewingOrder) return;

    setReviewSubmitting(true);
    try {
      // TODO: Replace with actual API call
      // const response = await orderService.submitReview(reviewingOrder._id, reviewData);
      // if (response.success) {
      //   toast.success('Review submitted successfully');
      //   setShowReviewModal(false);
      //   setReviewingOrder(null);
      // }

      // Temporary: Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Review submitted for order:', reviewingOrder._id, reviewData);
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      setReviewingOrder(null);
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Get user display info
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const renderAccountTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111827"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <h3 className={styles.sectionTitle}>Account Details</h3>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>FIRST NAME</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>LAST NAME</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label className={styles.formLabel}>EMAIL ADDRESS</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Security</h3>
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label className={styles.formLabel}>CURRENT PASSWORD</label>
          <input
            type="password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>NEW PASSWORD</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New strong password"
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>CONFIRM PASSWORD</label>
          <input
            type="password"
            name="repeatPassword"
            value={formData.repeatPassword}
            onChange={handleChange}
            placeholder="Repeat new password"
            className={styles.formInput}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <button className={styles.saveButton} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </>
  );

  const renderAddressTab = () => (
    <div>
      <div className={styles.addressHeader}>
        <h3 className={styles.addressTitle}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111827"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Saved Addresses
        </h3>
        <button
          className={styles.addAddressBtn}
          title="Add New Address"
          onClick={handleAddAddressClick}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className={styles.addressGrid}>
        {addresses.length === 0 && (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
            No addresses found. Add one now!
          </p>
        )}
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardType}>
                {addr.isDefault ? 'Default Address' : 'Address'}
              </span>
              <div
                className={styles.cardActions}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {!addr.isDefault && (
                  <span
                    className={styles.setDefaultLink}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefaultAddress(addr._id);
                    }}
                    title="Set as Default"
                  >
                    Set Default
                  </span>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={styles.iconActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddressClick(addr);
                    }}
                    title="Edit Address"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className={styles.iconActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr._id);
                    }}
                    title="Delete Address"
                    style={{ color: '#DC2626' }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.cardName}>{addr.receiverName}</span>
              <p style={{ margin: '0.5rem 0 0', lineHeight: '1.6', color: '#4B5563' }}>
                {addr.phone}
              </p>
              <p style={{ margin: '0.25rem 0 0', lineHeight: '1.6', color: '#6B7280' }}>
                {formatAddressString(addr)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Pro Max Badge Logic
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: styles.badgeWarning, text: 'Chờ xử lý' },
      processing: { class: styles.badgeInfo, text: 'Đang xử lý' },
      confirmed: { class: styles.badgeInfo, text: 'Đã xác nhận' },
      packing: { class: styles.badgeInfo, text: 'Đang đóng gói' },
      shipping: { class: styles.badgeInfo, text: 'Đang giao hàng' },
      shipped: { class: styles.badgeInfo, text: 'Đang giao hàng' },
      delivered: { class: styles.badgeSuccess, text: 'Đã giao hàng' },
      delivered_pending_confirmation: { class: styles.badgeSuccess, text: 'Đã giao hàng' },
      completed: { class: styles.badgeSuccess, text: 'Hoàn thành' },
      cancelled: { class: styles.badgeDanger, text: 'Đã hủy' },
      refunded: { class: styles.badgeWarning, text: 'Đã hoàn tiền' },
    };

    const config = statusConfig[status] || { class: styles.badgeInfo, text: status };
    return <span className={`${styles.badge} ${config.class}`}>{config.text}</span>;
  };

  const renderOrdersTab = () => (
    <div>
      {!selectedOrder ? (
        <>
          <div className={styles.addressHeader}>
            <h3 className={styles.addressTitle}>
              <div
                style={{
                  background: '#FFF7ED',
                  padding: '8px',
                  borderRadius: '12px',
                  display: 'flex',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8h-4l-3-4-3 4H7L4 8l-3 4v8h22v-8l-3-4z" />
                  <path d="M10 12h4" />
                </svg>
              </div>
              Orders History
            </h3>
          </div>

          <div className={styles.tableWrapper}>
            {orderLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 font-weight-bold">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                <h4>No orders found</h4>
                <p>Looks like you haven't placed any orders yet.</p>
              </div>
            ) : (
              <table className={styles.orderTable}>
                <thead>
                  <tr className={styles.orderTableHeader}>
                    <th>Order ID</th>
                    <th>Date Placed</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className={styles.orderRow}
                      onClick={() => handleOrderClick(order._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>#{order.orderNumber}</td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{formatCurrency(order.totalPrice)}</td>
                      <td>
                        {[
                          'confirmed',
                          'processing',
                          'packing',
                          'shipping',
                          'shipped',
                          'delivered',
                          'delivered_pending_confirmation',
                        ].includes(order.status) && (
                          <button
                            className={`${styles.badge} ${styles.badgeSuccess}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/buyer/orders/${order._id}`);
                            }}
                            style={{
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              backgroundColor: '#10B981',
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            📍 Track Order
                          </button>
                        )}
                        {order.paymentMethod === 'payos' && order.paymentStatus === 'pending' && (
                          <button
                            className={`${styles.badge} ${styles.badgeWarning}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayNow(order._id);
                            }}
                            disabled={paymentProcessing === order._id}
                            style={{
                              cursor: paymentProcessing === order._id ? 'not-allowed' : 'pointer',
                              opacity: paymentProcessing === order._id ? 0.6 : 1,
                              border: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (paymentProcessing !== order._id) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow =
                                  '0 2px 8px rgba(234, 179, 8, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {paymentProcessing === order._id ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  style={{ width: '12px', height: '12px', marginRight: '4px' }}
                                />
                                Processing...
                              </>
                            ) : (
                              'Pay Now'
                            )}
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button
                            className={`${styles.badge} ${styles.badgeInfo}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReviewModal(order);
                            }}
                            style={{
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            Add Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pro Max Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationBtn}
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className={styles.paginationBtn}
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}

          <button className={styles.enquireButton}>Need help with an order?</button>
        </>
      ) : (
        <div>
          {/* Back Button */}
          <button
            className={styles.backButton}
            onClick={() => setSelectedOrder(null)}
            style={{ marginBottom: '2rem' }}
          >
            <div className={styles.backIconCircle} style={{ width: '36px', height: '36px' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
            Back to Orders List
          </button>

          {detailsLoading || !selectedOrderDetails ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
              Loading details...
            </div>
          ) : (
            <>
              {/* Details Tabs */}
              <div className={styles.detailsTabs}>
                <button
                  className={`${styles.detailsTabBtn} ${detailsTab === 'items' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('items')}
                >
                  Items Ordered
                </button>
                <button
                  className={`${styles.detailsTabBtn} ${detailsTab === 'invoices' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('invoices')}
                >
                  Invoices
                </button>
                <button
                  className={`${styles.detailsTabBtn} ${detailsTab === 'shipment' ? styles.active : ''}`}
                  onClick={() => setDetailsTab('shipment')}
                >
                  Shipment Status
                </button>
              </div>

              {detailsTab === 'items' && (
                <div className={styles.tableWrapper}>
                  <table className={styles.productTable}>
                    <thead>
                      <tr>
                        <th>Product Details</th>
                        <th>Unit Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetails.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className={styles.productItem}>
                              <img
                                src={
                                  item.productId?.images?.[0] || 'https://via.placeholder.com/60'
                                }
                                alt={item.productId?.name}
                                className={styles.productImage}
                              />
                              <div className={styles.productInfo}>
                                <h4>{item.productId?.name}</h4>
                                <p>
                                  {item.tierSelections
                                    ? Object.values(item.tierSelections).join(' / ')
                                    : 'Standard'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailsTab === 'invoices' && (
                <div
                  style={{
                    padding: '4rem',
                    textAlign: 'center',
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h4 style={{ marginBottom: '0.5rem' }}>
                    Invoice #{selectedOrderDetails.orderNumber}
                  </h4>
                  <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                    Download or view the official invoice for this order.
                  </p>
                  <button
                    className={styles.reorderBtn}
                    onClick={(e) => handleViewInvoice(e, selectedOrderDetails._id)}
                    style={{ margin: '0 auto' }}
                  >
                    View Invoice
                  </button>
                </div>
              )}

              {detailsTab === 'shipment' && (
                <div>
                  {/* Use OrderTrackingEnhanced component for map and tracking steps */}
                  <OrderTrackingEnhanced
                    order={selectedOrderDetails}
                    onOrderUpdate={(updatedData) => {
                      console.log('Order updated in ProfilePage:', updatedData);
                      // Refresh order details
                      handleOrderClick(selectedOrderDetails._id);
                    }}
                  />
                </div>
              )}

              {/* Order Information */}
              <div className={styles.orderInfoGrid}>
                <div className={styles.infoSection}>
                  <h4>Order Summary</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Subtotal</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(selectedOrderDetails.subtotal)}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Shipping Fee</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(selectedOrderDetails.shippingCost)}
                    </span>
                  </div>
                  {selectedOrderDetails.discount > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Discount</span>
                      <span className={styles.infoValue} style={{ color: '#059669' }}>
                        -{formatCurrency(selectedOrderDetails.discount)}
                      </span>
                    </div>
                  )}

                  <div
                    className={styles.infoRow}
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px dashed #E5E7EB',
                    }}
                  >
                    <span
                      className={styles.infoLabel}
                      style={{ fontWeight: '700', color: '#111827' }}
                    >
                      Grand Total
                    </span>
                    <span
                      className={styles.infoValue}
                      style={{ fontSize: '1.25rem', color: '#2563EB' }}
                    >
                      {formatCurrency(selectedOrderDetails.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className={styles.infoSection}>
                  <h4>Payment</h4>
                  <div className={styles.infoRow}>
                    <span
                      className={styles.infoValue}
                      style={{
                        textTransform: 'capitalize',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      {selectedOrderDetails.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className={styles.infoSection}>
                  <h4>Shipping Details</h4>
                  <div className={styles.addressDetails}>
                    <p style={{ fontWeight: '700', marginBottom: '0.25rem', color: '#111827' }}>
                      {selectedOrderDetails.userId?.fullName || user.fullName}
                    </p>
                    <p>{selectedOrderDetails.shippingAddress}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                      Order #{selectedOrderDetails.orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button className={styles.ratingBtn}>Add Rating</button>
                <button className={styles.reorderBtn}>Reorder Again</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.pageLayout}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className={styles.mainContent}>
        <div className={styles.profileContainer}>
          {/* Mobile Navigation Bar */}
          <div className={styles.navigationBar}>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <div className={styles.backIconCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>Back</span>
            </button>

            <h1 className={styles.pageTitle}>MY PROFILE</h1>

            {/* Share Button */}
            <button className={styles.shareButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>

          <div className={styles.profileGrid}>
            {/* Sidebar Card */}
            <div className={styles.sidebarCard}>
              <div className={styles.avatarSection}>
                <img src={userAvatar} alt={userDisplayName} className={styles.avatar} />
                <div className={styles.cameraButton}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <h2 className={styles.userName}>{userDisplayName}</h2>

              <div className={styles.sidebarNavGrid}>
                <div
                  className={`${styles.navCard} ${styles.navCardAccount} ${activeTab === 'account' ? styles.active : ''}`}
                  onClick={() => handleTabChange('account')}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className={styles.navCardTitle}>Account</span>
                </div>

                <div
                  className={`${styles.navCard} ${styles.navCardOrder} ${activeTab === 'orders' ? styles.active : ''}`}
                  onClick={() => handleTabChange('orders')}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 8h-4l-3-4-3 4H7L4 8l-3 4v8h22v-8l-3-4z" />
                    <path d="M10 12h4" />
                  </svg>
                  <span className={styles.navCardTitle}>Orders</span>
                </div>

                <div
                  className={`${styles.navCard} ${styles.navCardAddress} ${activeTab === 'address' ? styles.active : ''}`}
                  onClick={() => handleTabChange('address')}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span className={styles.navCardTitle}>Address</span>
                </div>

                <div className={`${styles.navCard} ${styles.navCardLogout}`} onClick={handleLogout}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className={styles.navCardTitle}>Logout</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.accountDetailsCard}>
              {activeTab === 'account' && renderAccountTab()}
              {activeTab === 'address' && renderAddressTab()}
              {activeTab === 'orders' && renderOrdersTab()}
            </div>
          </div>
        </div>
      </div>
      <Modal
        show={showAddressModal}
        onHide={() => setShowAddressModal(false)}
        centered
        contentClassName={styles.premiumModalContent}
      >
        <div className={styles.modalHeader}>
          <h4 className={styles.modalTitle}>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h4>
          <button className={styles.modalCloseBtn} onClick={() => setShowAddressModal(false)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <Form>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Receiver Name</label>
              <input
                type="text"
                name="receiverName"
                value={addressForm.receiverName}
                onChange={handleAddressFormChange}
                placeholder="Ex: John Doe"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressFormChange}
                placeholder="Ex: 0912345678"
                className={styles.modalInput}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Province</label>
                <select
                  name="provinceCode"
                  value={addressForm.provinceCode}
                  onChange={handleProvinceChange}
                  className={styles.modalSelect}
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Ward</label>
                <select
                  name="wardCode"
                  value={addressForm.wardCode}
                  onChange={handleWardChange}
                  disabled={!addressForm.provinceCode}
                  className={styles.modalSelect}
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Street</label>
              <input
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleAddressFormChange}
                placeholder="Street name, number"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Specific Address</label>
              <textarea
                rows={2}
                name="details"
                value={addressForm.details}
                onChange={handleAddressFormChange}
                placeholder="Building, Floor, Unit etc."
                className={styles.modalTextarea || styles.modalInput}
              />
            </div>
            <div className={styles.modalFormGroup}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressFormChange}
                  style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
                />
                <span style={{ fontSize: '0.9375rem', color: '#374151', fontWeight: 500 }}>
                  Set as default address
                </span>
              </label>
            </div>
          </Form>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={() => setShowAddressModal(false)}>
            Cancel
          </button>
          <button className={styles.modalSaveBtn} onClick={handleSaveAddress}>
            {editingAddress ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </Modal>
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewingOrder(null);
        }}
        onSubmit={handleReviewSubmit}
        orderNumber={reviewingOrder?.orderNumber}
        isSubmitting={reviewSubmitting}
      />
    </div>
  );
};

export default ProfilePage;
