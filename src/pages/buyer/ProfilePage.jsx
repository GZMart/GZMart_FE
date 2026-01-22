import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
// import { Container } from 'react-bootstrap'; // Unused in original but kept if needed
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { orderService } from '@services/api/orderService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(PUBLIC_ROUTES.LOGIN);
    }
  }, [isAuthenticated, navigate]);

  // State for tab switching
  const [activeTab, setActiveTab] = useState('account');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsTab, setDetailsTab] = useState('items');

  // Order API State
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
  }, [activeTab]);

  const fetchOrders = async (page) => {
    setOrderLoading(true);
    try {
      const response = await orderService.getMyOrders(page, pagination.limit);
      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
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
      console.error("Failed to fetch order details:", error);
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
      console.error("Failed to get invoice:", error);
      alert("Could not generate invoice. Please try again.");
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
            <img
              src="https://cdn-icons-png.flaticon.com/512/854/854878.png"
              style={{ display: 'none' }}
              alt="map"
            />
          </svg>
          Saved Addresses
        </h3>
        <button className={styles.addAddressBtn} title="Add New Address">
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
        {[1].map((item) => ( // Kept static loop for address as API doesn't have address list yet, or just show user current address
          <div key={item} className={styles.addressCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardType}>
                Primary Address
              </span>
              <span className={styles.editLink}>
                <svg
                  width="14"
                  height="14"
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
                Edit
              </span>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.cardName}>{user.fullName}</span>
              <p style={{ margin: '0.5rem 0 0', lineHeight: '1.6' }}>
                {user.phone}
                <br />
                {user.address}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className={styles.saveAddressBtn}>Save Address</button>
    </div>
  );

  // Pro Max Badge Logic
  const getStatusBadge = (status) => {
    let badgeClass = styles.badgeInfo;
    switch (status) {
      case 'completed':
        badgeClass = styles.badgeSuccess;
        break;
      case 'pending':
        badgeClass = styles.badgeWarning;
        break;
      case 'cancelled':
        badgeClass = styles.badgeDanger;
        break;
      case 'processing':
        badgeClass = styles.badgeInfo;
        break;
    }

    return (
      <span className={`${styles.badge} ${badgeClass}`}>
        {status}
      </span>
    );
  };

  const renderOrdersTab = () => (
    <div>
      {!selectedOrder ? (
        <>
          <div className={styles.addressHeader}>
            <h3 className={styles.addressTitle}>
              <div style={{ background: '#FFF7ED', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order._id}
                      className={styles.orderRow}
                      onClick={() => handleOrderClick(order._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>#{order.orderNumber}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{formatCurrency(order.totalPrice)}</td>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Previous
              </button>
              <span className={styles.paginationInfo}>Page {pagination.page} of {pagination.pages}</span>
              <button
                className={styles.paginationBtn}
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>
            Back to Orders List
          </button>

          {detailsLoading || !selectedOrderDetails ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading details...</div>
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
                                src={item.productId?.images?.[0] || 'https://via.placeholder.com/60'}
                                alt={item.productId?.name}
                                className={styles.productImage}
                              />
                              <div className={styles.productInfo}>
                                <h4>{item.productId?.name}</h4>
                                <p>{item.tierSelections ? Object.values(item.tierSelections).join(' / ') : 'Standard'}</p>
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
                <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Invoice #{selectedOrderDetails.orderNumber}</h4>
                  <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Download or view the official invoice for this order.</p>
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
                <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Shipment Status</h4>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '99px', fontWeight: '600', marginBottom: '1rem' }}>
                    {selectedOrderDetails.status.toUpperCase()}
                  </div>
                  <p style={{ color: '#6B7280' }}>Tracking Number: <span style={{ fontFamily: 'monospace', color: '#111827' }}>{selectedOrderDetails.trackingNumber || 'Pending Assignment'}</span></p>
                </div>
              )}

              {/* Order Information */}
              <div className={styles.orderInfoGrid}>
                <div className={styles.infoSection}>
                  <h4>Order Summary</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Subtotal</span>
                    <span className={styles.infoValue}>{formatCurrency(selectedOrderDetails.subtotal)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Shipping Fee</span>
                    <span className={styles.infoValue}>{formatCurrency(selectedOrderDetails.shippingCost)}</span>
                  </div>
                  {selectedOrderDetails.discount > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Discount</span>
                      <span className={styles.infoValue} style={{ color: '#059669' }}>-{formatCurrency(selectedOrderDetails.discount)}</span>
                    </div>
                  )}

                  <div className={styles.infoRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #E5E7EB' }}>
                    <span className={styles.infoLabel} style={{ fontWeight: '700', color: '#111827' }}>
                      Grand Total
                    </span>
                    <span className={styles.infoValue} style={{ fontSize: '1.25rem', color: '#2563EB' }}>
                      {formatCurrency(selectedOrderDetails.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className={styles.infoSection}>
                  <h4>Payment</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoValue} style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                      {selectedOrderDetails.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className={styles.infoSection}>
                  <h4>Shipping Details</h4>
                  <div className={styles.addressDetails}>
                    <p style={{ fontWeight: '700', marginBottom: '0.25rem', color: '#111827' }}>{selectedOrderDetails.userId?.fullName || user.fullName}</p>
                    <p>{selectedOrderDetails.shippingAddress}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>Order #{selectedOrderDetails.orderNumber}</p>
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
                  onClick={() => setActiveTab('account')}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className={styles.navCardTitle}>Account</span>
                </div>

                <div
                  className={`${styles.navCard} ${styles.navCardOrder} ${activeTab === 'orders' ? styles.active : ''}`}
                  onClick={() => {
                    setActiveTab('orders');
                    setSelectedOrder(null);
                  }}
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
                  onClick={() => setActiveTab('address')}
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
    </div>
  );
};

export default ProfilePage;
