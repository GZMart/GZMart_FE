import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import {
  Bell,
  Coins,
  User,
  ChevronDown,
  Package,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Camera,
  X,
  Check,
  MessageCircle,
  Store,
  Search,
} from 'lucide-react';
// import { Container } from 'react-bootstrap'; // Unused in original but kept if needed
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, updateUserProfile } from '@store/slices/authSlice';
import { orderService } from '@services/api/orderService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';
import addressService from '@services/api/addressService';
import coinService from '@services/coin.service';
import OrderTrackingEnhanced from '@components/buyer/OrderTrackingEnhanced';
import ReturnRequestModal from '@components/buyer/ReturnRequestModal';
import locationService from '@services/api/locationService';
import { Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Added import
import ReviewModal from '@components/common/ReviewModal';
import { io } from 'socket.io-client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation(); // Added hook usage
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
  const [showMyAccountDropdown, setShowMyAccountDropdown] = useState(true); // For My Account dropdown

  // Order API State
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Order Filter & Search State
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewSubmitting] = useState(false);

  // Coin State
  const [coinBalance, setCoinBalance] = useState(null);
  const [coinTransactions, setCoinTransactions] = useState([]);
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinHistoryFilter, setCoinHistoryFilter] = useState('all'); // 'all', 'received', 'used'
  const [coinPagination, setCoinPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Initialize form data from user
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    gender: 'other',
    dateOfBirth: '',
    aboutMe: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [, setAddressLoading] = useState(false);
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
    lat: null,
    lng: null,
  });
  const [gettingLocation, setGettingLocation] = useState(false);

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
        phone: user.phone || '',
        gender: user.gender || 'other',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        aboutMe: user.aboutMe || '',
      });
      // Only set avatarPreview if user has an avatar, otherwise leave it null to use fallback
      if (user.avatar || user.profileImage) {
        setAvatarPreview(user.avatar || user.profileImage);
      }
    }
  }, [user]);

  // Fetch orders when Orders tab is active
  // Sync active tab with URL changes (browser navigation/direct links)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'account';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }

    if (tabFromUrl !== 'orders' && selectedOrder) {
      setSelectedOrder(null);
      setSelectedOrderDetails(null);
    }
  }, [searchParams, activeTab, selectedOrder]);

  // Socket.io connection for real-time order updates
  const socketOrders = useMemo(() => orders.map((o) => ({ _id: o._id })), [orders]);
  const socketOrderIds = useMemo(() => orders.map((o) => o._id).join(','), [orders]);

  useEffect(() => {
    if (!isAuthenticated || !user || socketOrders.length === 0) {
      return;
    }

    // Connect to socket
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });

    // Listen for order status updates for all user's orders
    socketOrders.forEach((order) => {
      const statusEventName = `order:status:${order._id}`;
      const arrivedEventName = `order:arrived:${order._id}`;

      socket.on(statusEventName, (data) => {
        // Update order in the list
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o._id === data.orderId ? { ...o, status: data.status, ...data } : o
          )
        );

        // If this is the selected order, update its details too
        setSelectedOrderDetails((prev) => {
          if (prev?._id === data.orderId) {
            return { ...prev, status: data.status, ...data };
          }
          return prev;
        });

        // Show toast notification
        const orderNum = data.orderNumber || data.orderId.slice(-6);
        toast.info(`Order #${orderNum} status: ${data.status}`);
      });

      socket.on(arrivedEventName, (data) => {
        // Update order status to delivered
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o._id === data.orderId ? { ...o, status: 'delivered', deliveredAt: data.arrivedAt } : o
          )
        );

        setSelectedOrderDetails((prev) => {
          if (prev?._id === data.orderId) {
            return { ...prev, status: 'delivered', deliveredAt: data.arrivedAt };
          }
          return prev;
        });

        // Show toast notification
        const orderNum = data.orderNumber || data.orderId.slice(-6);
        toast.success(`Order #${orderNum} has been delivered! 🎉`);
      });
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, socketOrderIds, socketOrders, user]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    nextParams.delete('orderId');
    setSearchParams(nextParams);
    if (tab === 'orders') {
      setSelectedOrder(null);
      setSelectedOrderDetails(null);
    }
  };

  const fetchAddresses = useCallback(async () => {
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
  }, [setAddressLoading]);

  const fetchCoinData = useCallback(async () => {
    setCoinLoading(true);
    try {
      // Fetch balance
      const balanceResponse = await coinService.getCoinBalance();
      if (balanceResponse && balanceResponse.success) {
        setCoinBalance(balanceResponse.data);
      }

      // Fetch transactions
      const transactionsResponse = await coinService.getCoinTransactions({
        page: coinPagination.page,
        limit: coinPagination.limit,
      });
      if (transactionsResponse && transactionsResponse.success) {
        setCoinTransactions(transactionsResponse.transactions || []);
        setCoinPagination((prev) => ({
          ...prev,
          total: transactionsResponse.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch coin data:', error);
      toast.error('Failed to load coin data');
    } finally {
      setCoinLoading(false);
    }
  }, [coinPagination.limit, coinPagination.page]);

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
      lat: null,
      lng: null,
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
      lat: addr.location?.lat || null,
      lng: addr.location?.lng || null,
    });
    setShowAddressModal(true);
    // Trigger location fetches by setting codes (controlled by useEffects)
    // Note: useEffects will run and fetch districts/wards based on these codes
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddressForm((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setGettingLocation(false);
        toast.success(
          `GPS coordinates obtained: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        );
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Unable to retrieve your location';
        if (error.code === 1) {
          errorMessage =
            'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === 2) {
          errorMessage = 'Location information unavailable';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out';
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
      // Prepare data with location object if lat/lng exist
      const addressData = { ...addressForm };

      // Convert lat/lng to location object for backend
      if (addressForm.lat !== null && addressForm.lng !== null) {
        addressData.location = {
          lat: addressForm.lat,
          lng: addressForm.lng,
        };
      }

      // Remove separate lat/lng fields as they're now in location object
      delete addressData.lat;
      delete addressData.lng;

      if (editingAddress) {
        await addressService.updateAddress(editingAddress._id, addressData);
      } else {
        await addressService.createAddress(addressData);
      }

      setShowAddressModal(false);
      fetchAddresses();
      toast.success(
        editingAddress
          ? t('profile_page.address.success_update')
          : t('profile_page.address.success_add')
      );
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(t('profile_page.address.error_save'));
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm(t('profile_page.address.confirm_delete'))) {
      try {
        await addressService.deleteAddress(id);
        fetchAddresses();
        toast.success(t('profile_page.address.success_delete'));
      } catch (error) {
        console.error('Failed to delete address:', error);
        toast.error(t('profile_page.address.error_delete'));
      }
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
      toast.success(t('profile_page.address.success_default'));
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error(t('profile_page.address.error_default'));
    }
  };

  const formatAddressString = (addr) =>
    [addr.details, addr.wardName, addr.provinceName]
      .filter((part) => part && part.trim() !== '')
      .join(', ');

  const fetchOrders = useCallback(
    async (page) => {
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
    },
    [pagination.limit]
  );

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    if (activeTab === 'orders') {
      fetchOrders(pagination.page);
    }
    if (activeTab === 'address') {
      fetchAddresses();
    }
    if (activeTab === 'coin') {
      fetchCoinData();
    }
  }, [
    activeTab,
    fetchAddresses,
    fetchCoinData,
    fetchOrders,
    isAuthenticated,
    pagination.page,
    user,
  ]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  };

  const handleOrderClick = useCallback(
    async (orderId, options = {}) => {
      const { syncUrl = true } = options;

      if (syncUrl) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'orders');
        nextParams.set('orderId', orderId);
        setSearchParams(nextParams);
      }

      setSelectedOrder({ id: orderId }); // Using object wrapper to match original prop structure if needed, or just ID
      setDetailsLoading(true);
      try {
        const response = await orderService.getOrderById(orderId);
        if (response.success) {
          setSelectedOrderDetails(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        setSelectedOrder(null);
        setSelectedOrderDetails(null);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'orders');
        nextParams.delete('orderId');
        setSearchParams(nextParams);
      } finally {
        setDetailsLoading(false);
      }
    },
    [searchParams, setSearchParams]
  );

  // Open order details directly from URL: /buyer/profile?tab=orders&orderId=<id>
  useEffect(() => {
    if (!isAuthenticated || !user || activeTab !== 'orders') {
      return;
    }

    const orderIdFromUrl = searchParams.get('orderId');
    if (!orderIdFromUrl) {
      return;
    }

    if (selectedOrder?.id === orderIdFromUrl || selectedOrderDetails?._id === orderIdFromUrl) {
      return;
    }

    handleOrderClick(orderIdFromUrl, { syncUrl: false });
  }, [
    activeTab,
    handleOrderClick,
    isAuthenticated,
    searchParams,
    selectedOrder,
    selectedOrderDetails,
    user,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile || isSavingAvatar) {
      return;
    }
    try {
      setIsSavingAvatar(true);
      const submitData = new FormData();
      submitData.append('avatar', avatarFile);
      const profileAction = await dispatch(updateUserProfile({ formData: submitData }));
      if (updateUserProfile.fulfilled.match(profileAction)) {
        setAvatarFile(null);
        toast.success(t('profile_page.success_update'));
      } else {
        toast.error(profileAction.payload || t('profile_page.error_update'));
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      toast.error(t('profile_page.error_general'));
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    if (isSavingAvatar) {
      return;
    }
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || user?.profileImage || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      const submitData = new FormData();
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      submitData.append('fullName', fullName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('gender', formData.gender);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('aboutMe', formData.aboutMe);

      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }

      const profileAction = await dispatch(updateUserProfile({ formData: submitData }));
      if (updateUserProfile.fulfilled.match(profileAction)) {
        toast.success(t('profile_page.success_update'));
      } else {
        toast.error(profileAction.payload || t('profile_page.error_update'));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(t('profile_page.error_general'));
    }
  };

  const handleOpenReviewModal = (order) => {
    // Just pass orderId - ReviewModal will fetch order details to get product info
    setReviewingOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (_reviewData) => {
    // Note: This function is called from ReviewModal component
    // The ReviewModal component handles the actual API call using reviewService
    // This function just closes the modal after successful submission
    setShowReviewModal(false);
    setReviewingOrder(null);

    try {
      // Optional: Refresh order list after successful review submission
      //if (activeTab === 'orders') {
      //await fetchOrders(pagination.page);
      //}
    } catch (error) {
      console.error('Error after review submission:', error);
    }
  };

  // Get user display info
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    avatarPreview ||
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const renderNotificationsTab = () => (
    <div>
      <div className={styles.sectionHeader}>
        <Bell size={24} color="#111827" strokeWidth={2} />
        <h3 className={styles.sectionTitle}>Notifications</h3>
      </div>
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6B7280' }}>
        <Bell size={64} color="#D1D5DB" strokeWidth={1.5} style={{ margin: '0 auto 1rem' }} />
        <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>No Notifications</h4>
        <p>You don&apos;t have any notifications yet.</p>
      </div>
    </div>
  );

  const renderCoinTab = () => {
    // Calculate expiring coins info
    const expiringCoins = coinBalance?.breakdown?.expiringSoon?.details || [];
    const nextExpiringCoin = expiringCoins.length > 0 ? expiringCoins[0] : null;
    const totalBalance = coinBalance?.totalBalance || 0;

    // Filter transactions based on selected filter
    const getFilteredTransactions = () => {
      if (!coinTransactions || coinTransactions.length === 0) {
        return [];
      }

      if (coinHistoryFilter === 'received') {
        return coinTransactions.filter((tx) => tx.type === 'add' || tx.amount > 0);
      } else if (coinHistoryFilter === 'used') {
        return coinTransactions.filter((tx) => tx.type === 'deduct' || tx.amount < 0);
      }
      return coinTransactions; // 'all'
    };

    const filteredTransactions = getFilteredTransactions();

    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${hours}:${minutes} ${day}-${month}-${year}`;
    };

    // Format expiration date
    const formatExpirationDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    return (
      <div className={styles.coinTab}>
        {/* Header with balance */}
        <div className={styles.coinHeader}>
          <div className={styles.coinBalanceSection}>
            <div className={styles.coinIcon}>
              <Coins size={32} color="#F59E0B" strokeWidth={2} />
            </div>
            <div className={styles.coinBalanceInfo}>
              <div className={styles.coinBalanceLabel}>GZCoin balance</div>
              <div className={styles.coinBalanceAmount}>{totalBalance.toLocaleString()}</div>
              {nextExpiringCoin && (
                <div className={styles.coinExpirationInfo}>
                  {nextExpiringCoin.amount.toLocaleString()} GZCoin will expire on{' '}
                  {formatExpirationDate(nextExpiringCoin.expiresAt)}
                </div>
              )}
            </div>
          </div>
          <button className={styles.coinEarnMoreBtn}>
            Get more! <ChevronRight size={18} />
          </button>
        </div>

        {/* History Tabs */}
        <div className={styles.coinHistoryTabs}>
          <button
            className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'all' ? styles.active : ''}`}
            onClick={() => setCoinHistoryFilter('all')}
          >
            ALL HISTORY
          </button>
          <button
            className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'received' ? styles.active : ''}`}
            onClick={() => setCoinHistoryFilter('received')}
          >
            RECEIVED
          </button>
          <button
            className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'used' ? styles.active : ''}`}
            onClick={() => setCoinHistoryFilter('used')}
          >
            USED
          </button>
        </div>

        {/* Transaction List */}
        <div className={styles.coinTransactionList}>
          {coinLoading ? (
            <div className={styles.coinLoadingContainer}>
              <Spinner animation="border" size="sm" />
              <span>Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className={styles.coinEmptyState}>
              <Coins size={64} color="#D1D5DB" strokeWidth={1.5} />
              <p>No transaction history</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const isPositive = transaction.amount > 0;
              const amount = Math.abs(transaction.amount);

              return (
                <div key={transaction._id} className={styles.coinTransactionItem}>
                  <div className={styles.coinTransactionIcon}>
                    <div
                      className={`${styles.coinIconCircle} ${isPositive ? styles.positive : styles.negative}`}
                    >
                      <span>S</span>
                    </div>
                  </div>
                  <div className={styles.coinTransactionDetails}>
                    <div className={styles.coinTransactionTitle}>
                      {transaction.description || (isPositive ? 'Received GZCoin' : 'Used GZCoin')}
                    </div>
                    {transaction.metadata?.source && (
                      <div className={styles.coinTransactionSource}>
                        {transaction.metadata.source}
                      </div>
                    )}
                    <div className={styles.coinTransactionDate}>
                      {formatDate(transaction.createdAt || transaction.date)}
                    </div>
                  </div>
                  <div
                    className={`${styles.coinTransactionAmount} ${isPositive ? styles.positive : styles.negative}`}
                  >
                    {isPositive ? '+' : '-'}
                    {amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderAccountTab = () => (
    <>
      <div className={styles.sectionHeader}>
        <User size={24} color="#111827" strokeWidth={2} />
        <h3 className={styles.sectionTitle}>{t('profile_page.account.title')}</h3>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('profile_page.account.first_name')}</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('profile_page.account.last_name')}</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label className={styles.formLabel}>{t('profile_page.account.email')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.formInput}
            disabled // Email usually shouldn't be changed easily or needs verification
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('profile_page.account.phone')}</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Enter phone number"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('profile_page.account.gender')}</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={styles.formInput}
          >
            <option value="male">{t('profile_page.account.gender_options.male')}</option>
            <option value="female">{t('profile_page.account.gender_options.female')}</option>
            <option value="other">{t('profile_page.account.gender_options.other')}</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('profile_page.account.dob')}</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label className={styles.formLabel}>{t('profile_page.account.about_me')}</label>
          <textarea
            name="aboutMe"
            value={formData.aboutMe}
            onChange={handleChange}
            className={styles.formInput}
            rows={4}
            placeholder={t('profile_page.account.about_me_placeholder')}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <button className={styles.saveButton} onClick={handleSave}>
          {t('profile_page.account.save_button')}
        </button>
      </div>
    </>
  );

  const renderAddressTab = () => (
    <div>
      <div className={styles.addressHeader}>
        <h3 className={styles.addressTitle}>
          <MapPin size={24} color="#111827" strokeWidth={2} />
          {t('profile_page.address.title')}
        </h3>
        <button
          className={styles.addAddressBtn}
          title={t('profile_page.address.title')}
          onClick={handleAddAddressClick}
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

      <div className={styles.addressGrid}>
        {addresses.length === 0 && (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
            {t('profile_page.address.empty_state')}
          </p>
        )}
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardType}>
                {addr.isDefault
                  ? t('profile_page.address.default_badge')
                  : t('profile_page.address.address_badge')}
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
                    title={t('profile_page.address.set_default')}
                  >
                    {t('profile_page.address.set_default')}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={styles.iconActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddressClick(addr);
                    }}
                    title={t('profile_page.address.edit_tooltip')}
                  >
                    <Edit2 size={18} strokeWidth={2} />
                  </button>
                  <button
                    className={styles.iconActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr._id);
                    }}
                    title={t('profile_page.address.delete_tooltip')}
                    style={{ color: '#DC2626' }}
                  >
                    <Trash2 size={18} strokeWidth={2} />
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
      pending: { class: styles.badgeWarning, text: 'Pending' },
      processing: { class: styles.badgeInfo, text: 'Processing' },
      confirmed: { class: styles.badgeInfo, text: 'Confirmed' },
      packing: { class: styles.badgeInfo, text: 'Packing' },
      shipping: { class: styles.badgeInfo, text: 'Shipping' },
      shipped: { class: styles.badgeInfo, text: 'Shipping' },
      delivered: { class: styles.badgeSuccess, text: 'Delivered' },
      delivered_pending_confirmation: { class: styles.badgeSuccess, text: 'Delivered' },
      completed: { class: styles.badgeSuccess, text: 'Completed' },
      cancelled: { class: styles.badgeDanger, text: 'Cancelled' },
      refunded: { class: styles.badgeWarning, text: 'Refunded' },
    };

    const config = statusConfig[status] || { class: styles.badgeInfo, text: status };
    return <span className={`${styles.badge} ${config.class}`}>{config.text}</span>;
  };

  const renderOrdersTab = () => {
    // Filter orders by status and search query
    const filteredOrders = orders.filter((order) => {
      // Filter by status
      const statusMatch =
        orderStatusFilter === 'all' ||
        (orderStatusFilter === 'pending' && order.status === 'pending') ||
        (orderStatusFilter === 'processing' &&
          ['confirmed', 'processing', 'packing'].includes(order.status)) ||
        (orderStatusFilter === 'shipping' && ['shipping', 'shipped'].includes(order.status)) ||
        (orderStatusFilter === 'delivered' &&
          ['delivered', 'delivered_pending_confirmation'].includes(order.status)) ||
        (orderStatusFilter === 'completed' && order.status === 'completed') ||
        (orderStatusFilter === 'cancelled' && order.status === 'cancelled') ||
        (orderStatusFilter === 'return' &&
          ['return_requested', 'return_approved', 'refunded'].includes(order.status));

      // Filter by search query (product name)
      const searchMatch =
        !orderSearchQuery ||
        order.items?.some((item) =>
          item.productId?.name?.toLowerCase().includes(orderSearchQuery.toLowerCase())
        );

      return statusMatch && searchMatch;
    });

    const orderStatusTabs = [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending Payment' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipping', label: 'Shipping' },
      { key: 'delivered', label: 'Completed' },
      { key: 'cancelled', label: 'Cancelled' },
      { key: 'return', label: 'Return/Refund' },
    ];

    return (
      <div>
        {!selectedOrder ? (
          <>
            {/* Filter Tabs */}
            <div className={styles.orderFilterTabs}>
              {orderStatusTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.orderFilterTab} ${
                    orderStatusFilter === tab.key ? styles.orderFilterTabActive : ''
                  }`}
                  onClick={() => setOrderStatusFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className={styles.orderSearchBar}>
              <Search size={20} color="#6b7280" />
              <input
                type="text"
                placeholder="Search by Shop name, Order ID or Product name"
                className={styles.orderSearchInput}
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
              />
            </div>

            {/* Orders List */}
            <div className={styles.ordersListContainer}>
              {orderLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 font-weight-bold">{t('profile_page.orders.loading')}</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                  <Package size={64} color="#D1D5DB" strokeWidth={1.5} />
                  <h4 style={{ marginTop: '1rem' }}>
                    {orderSearchQuery || orderStatusFilter !== 'all'
                      ? 'No orders found'
                      : t('profile_page.orders.empty_title')}
                  </h4>
                  <p>
                    {orderSearchQuery || orderStatusFilter !== 'all'
                      ? 'Try changing the filter or search keyword'
                      : t('profile_page.orders.empty_msg')}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order._id} className={styles.orderCard}>
                    {/* Order Header */}
                    <div className={styles.orderCardHeader}>
                      <div className={styles.orderCardHeaderLeft}>
                        <Store size={16} color="#B13C36" strokeWidth={2} />
                        <span className={styles.shopName}>
                          {order.items?.[0]?.productId?.sellerId?.fullName || 'GZMart Shop'}
                        </span>
                        <button className={styles.shopChatBtn}>
                          <MessageCircle size={16} strokeWidth={2} />
                          Chat
                        </button>
                        <button className={styles.shopViewBtn}>
                          <Store size={16} strokeWidth={2} />
                          View Shop
                        </button>
                      </div>
                      <div className={styles.orderCardHeaderRight}>
                        <div className={styles.orderCardStatus}>{getStatusBadge(order.status)}</div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className={styles.orderCardBody}>
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className={styles.orderCardItem}
                          onClick={() => handleOrderClick(order._id)}
                        >
                          <img
                            src={item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                            alt={item.productId?.name}
                            className={styles.orderCardItemImage}
                          />
                          <div className={styles.orderCardItemInfo}>
                            <h4 className={styles.orderCardItemName}>
                              {item.productId?.name || 'Product'}
                            </h4>
                            <p className={styles.orderCardItemVariant}>
                              Classification:{' '}
                              {item.tierSelections
                                ? Object.values(item.tierSelections).join(', ')
                                : 'Default'}
                            </p>
                            <p className={styles.orderCardItemQuantity}>x{item.quantity}</p>
                          </div>
                          <div className={styles.orderCardItemPrice}>
                            <span className={styles.orderCardItemOldPrice}>
                              {formatCurrency(item.price * 1.2)}
                            </span>
                            <span className={styles.orderCardItemCurrentPrice}>
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className={styles.orderCardMoreItems}>
                          And {order.items.length - 3} more product(s)...
                        </div>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className={styles.orderCardFooter}>
                      <div className={styles.orderCardTotal}>
                        <span className={styles.orderCardTotalLabel}>Total Amount:</span>
                        <span className={styles.orderCardTotalAmount}>
                          {formatCurrency(order.totalPrice)}
                        </span>
                      </div>
                      <div className={styles.orderCardActions}>
                        <button className={styles.orderCardActionSecondary}>Reorder</button>
                        {order.status === 'completed' && (
                          <button
                            className={styles.orderCardActionSecondary}
                            onClick={() => handleOpenReviewModal(order)}
                          >
                            Review
                          </button>
                        )}
                        <button className={styles.orderCardActionSecondary}>Contact Seller</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className={styles.paginationContainer}>
                <button
                  className={styles.paginationBtn}
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
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
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div>
            {detailsLoading || !selectedOrderDetails ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                Loading details...
              </div>
            ) : (
              <>
                {/* Order Header */}
                <div className={styles.orderDetailsHeader}>
                  <button
                    className={styles.orderDetailsBackBtn}
                    onClick={() => {
                      setSelectedOrder(null);
                      setSelectedOrderDetails(null);
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set('tab', 'orders');
                      nextParams.delete('orderId');
                      setSearchParams(nextParams);
                    }}
                  >
                    <ArrowLeft size={18} strokeWidth={2} />
                    <span>BACK</span>
                  </button>
                  <div className={styles.orderDetailsHeaderInfo}>
                    <span className={styles.orderDetailsOrderNumber}>
                      ORDER ID: {selectedOrderDetails.orderNumber}
                    </span>
                    <span className={styles.orderDetailsHeaderDivider}>|</span>
                    {getStatusBadge(selectedOrderDetails.status)}
                  </div>
                </div>

                {/* Shipment Tracking */}
                <div className={styles.orderDetailsSection}>
                  <OrderTrackingEnhanced
                    order={selectedOrderDetails}
                    onOrderUpdate={(updatedData) => {
                      setSelectedOrderDetails(updatedData);
                      setOrders((prevOrders) =>
                        prevOrders.map((order) =>
                          order._id === updatedData._id ? { ...order, ...updatedData } : order
                        )
                      );
                      handleOrderClick(selectedOrderDetails._id);
                    }}
                  />
                </div>

                {/* Shipping Address */}
                <div className={styles.orderDetailsSection}>
                  <h3 className={styles.orderDetailsSectionTitle}>Delivery Address</h3>
                  <div className={styles.orderDetailsAddressBox}>
                    <div className={styles.orderDetailsAddressHeader}>
                      <div>
                        <p className={styles.orderDetailsAddressName}>
                          {selectedOrderDetails.userId?.fullName || user.fullName}
                        </p>
                        <p className={styles.orderDetailsAddressPhone}>
                          {selectedOrderDetails.userId?.phone || user.phone || '(+84) XXX XXX XXX'}
                        </p>
                      </div>
                    </div>
                    <p className={styles.orderDetailsAddressText}>
                      {selectedOrderDetails.shippingAddress}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className={styles.orderDetailsSection}>
                  <div className={styles.orderDetailsShopHeader}>
                    <div className={styles.orderDetailsShopHeaderLeft}>
                      <Store size={18} color="#B13C36" strokeWidth={2} />
                      <span className={styles.orderDetailsShopName}>
                        {selectedOrderDetails.items?.[0]?.productId?.sellerId?.fullName ||
                          'GZMart Shop'}
                      </span>
                      <button className={styles.orderDetailsShopBtn}>
                        <MessageCircle size={16} strokeWidth={2} />
                        Chat
                      </button>
                      <button className={styles.orderDetailsShopBtn}>View Shop</button>
                    </div>
                  </div>

                  <div className={styles.orderDetailsItemsList}>
                    {selectedOrderDetails.items?.map((item, idx) => (
                      <div key={idx} className={styles.orderDetailsItem}>
                        <img
                          src={item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={item.productId?.name}
                          className={styles.orderDetailsItemImage}
                        />
                        <div className={styles.orderDetailsItemInfo}>
                          <h4 className={styles.orderDetailsItemName}>
                            {item.productId?.name || 'Product'}
                          </h4>
                          <p className={styles.orderDetailsItemVariant}>
                            Classification:{' '}
                            {item.tierSelections
                              ? Object.values(item.tierSelections).join(', ')
                              : 'Default'}
                          </p>
                          <p className={styles.orderDetailsItemQuantity}>x{item.quantity}</p>
                        </div>
                        <div className={styles.orderDetailsItemPriceContainer}>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className={styles.orderDetailsItemOldPrice}>
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                          <span className={styles.orderDetailsItemCurrentPrice}>
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary in same section */}
                  <div className={styles.orderDetailsPricingBox}>
                    <div className={styles.orderDetailsPricingRow}>
                      <span className={styles.orderDetailsPricingLabel}>Merchandise Subtotal</span>
                      <span className={styles.orderDetailsPricingValue}>
                        {formatCurrency(selectedOrderDetails.subtotal)}
                      </span>
                    </div>
                    <div className={styles.orderDetailsPricingRow}>
                      <span className={styles.orderDetailsPricingLabel}>Shipping Fee</span>
                      <span className={styles.orderDetailsPricingValue}>
                        {formatCurrency(selectedOrderDetails.shippingCost)}
                      </span>
                    </div>
                    {selectedOrderDetails.discount > 0 && (
                      <div className={styles.orderDetailsPricingRow}>
                        <span className={styles.orderDetailsPricingLabel}>Discount</span>
                        <span
                          className={styles.orderDetailsPricingValue}
                          style={{ color: '#059669' }}
                        >
                          -{formatCurrency(selectedOrderDetails.discount)}
                        </span>
                      </div>
                    )}
                    <div className={styles.orderDetailsPricingRowTotal}>
                      <span className={styles.orderDetailsPricingLabelTotal}>Order Total</span>
                      <span className={styles.orderDetailsPricingValueTotal}>
                        {formatCurrency(selectedOrderDetails.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className={styles.orderDetailsPaymentBox}>
                    <span className={styles.orderDetailsPaymentLabel}>Payment Method</span>
                    <span className={styles.orderDetailsPaymentValue}>
                      {selectedOrderDetails.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.orderDetailsActions}>
                  <button
                    className={styles.orderDetailsActionPrimary}
                    onClick={() => handleOpenReviewModal(selectedOrderDetails)}
                  >
                    Reorder
                  </button>
                  {selectedOrderDetails.status === 'completed' && (
                    <button
                      className={styles.orderDetailsActionSecondary}
                      onClick={() => handleOpenReviewModal(selectedOrderDetails)}
                    >
                      Add Rating
                    </button>
                  )}
                  <button className={styles.orderDetailsActionSecondary}>Contact Seller</button>
                  {(selectedOrderDetails.status === 'delivered' ||
                    selectedOrderDetails.status === 'completed') && (
                    <button
                      className={styles.orderDetailsActionSecondary}
                      onClick={() => setShowReturnModal(true)}
                    >
                      Request Return/Refund
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <div className={styles.profileContainer}>
          {/* Mobile Navigation Bar */}

          <div className={styles.profileGrid}>
            {/* Sidebar Navigation */}
            <div className={styles.sidebarNav}>
              {/* Avatar and User Info */}
              <div className={styles.avatarHeader}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarImageWrap}>
                    <img src={userAvatar} alt={userDisplayName} className={styles.avatar} />
                    <button
                      className={styles.cameraButton}
                      onClick={() => fileInputRef.current?.click()}
                      title="Change avatar"
                    >
                      <Camera size={12} strokeWidth={2} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                  </div>
                  {avatarFile && (
                    <div className={styles.avatarActionRow}>
                      <button
                        className={styles.saveAvatarBtn}
                        onClick={handleSaveAvatar}
                        disabled={isSavingAvatar}
                      >
                        <Check size={11} strokeWidth={3} />
                        {isSavingAvatar ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className={styles.cancelAvatarBtn}
                        onClick={handleCancelAvatar}
                        disabled={isSavingAvatar}
                      >
                        <X size={11} strokeWidth={3} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h3 className={styles.userName}>{userDisplayName}</h3>
                  <button
                    className={styles.editProfileBtn}
                    onClick={() => handleTabChange('account')}
                  >
                    <Edit2 size={14} strokeWidth={2} />
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Navigation List */}
              <div className={styles.navList}>
                {/* Notifications */}
                <div
                  className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navItemActive : ''}`}
                  onClick={() => handleTabChange('notifications')}
                >
                  <Bell className={styles.navIcon} size={20} strokeWidth={2} />
                  <span className={styles.navText}>Notifications</span>
                </div>

                {/* My Account with Dropdown */}
                <div className={styles.navItemGroup}>
                  <div
                    className={`${styles.navItem} ${styles.navItemParent} ${activeTab === 'account' || activeTab === 'address' ? styles.navItemActive : ''}`}
                    onClick={() => setShowMyAccountDropdown(!showMyAccountDropdown)}
                  >
                    <User className={styles.navIcon} size={20} strokeWidth={2} />
                    <span className={styles.navText}>My Account</span>
                    <ChevronDown
                      className={`${styles.navArrow} ${showMyAccountDropdown ? styles.navArrowExpanded : ''}`}
                      size={16}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Dropdown Items */}
                  {showMyAccountDropdown && (
                    <div className={styles.navDropdown}>
                      <div
                        className={`${styles.navSubItem} ${activeTab === 'account' ? styles.navSubItemActive : ''}`}
                        onClick={() => handleTabChange('account')}
                      >
                        <span className={styles.navText}>Profile</span>
                      </div>
                      <div
                        className={`${styles.navSubItem} ${activeTab === 'address' ? styles.navSubItemActive : ''}`}
                        onClick={() => handleTabChange('address')}
                      >
                        <span className={styles.navText}>Address</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Orders */}
                <div
                  className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
                  onClick={() => handleTabChange('orders')}
                >
                  <Package className={styles.navIcon} size={20} strokeWidth={2} />
                  <span className={styles.navText}>My Orders</span>
                </div>

                {/* GZMart Coin */}
                <div
                  className={`${styles.navItem} ${activeTab === 'coin' ? styles.navItemActive : ''}`}
                  onClick={() => handleTabChange('coin')}
                >
                  <Coins className={styles.navIcon} size={20} strokeWidth={2} />
                  <span className={styles.navText}>GZMart Coin</span>
                </div>

                {/* Become a Seller */}
                {user?.role === 'buyer' && (
                  <div
                    className={styles.navItem}
                    onClick={() => navigate(BUYER_ROUTES.SELLER_APPLICATION)}
                  >
                    <Store className={styles.navIcon} size={20} strokeWidth={2} />
                    <span className={styles.navText}>Become a Seller</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.accountDetailsCard}>
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'account' && renderAccountTab()}
              {activeTab === 'address' && renderAddressTab()}
              {activeTab === 'orders' && renderOrdersTab()}
              {activeTab === 'coin' && renderCoinTab()}
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
            {editingAddress
              ? t('profile_page.address.modal.title_edit')
              : t('profile_page.address.modal.title_add')}
          </h4>
          <button className={styles.modalCloseBtn} onClick={() => setShowAddressModal(false)}>
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <Form>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>
                {t('profile_page.address.modal.receiver_name')}
              </label>
              <input
                type="text"
                name="receiverName"
                value={addressForm.receiverName}
                onChange={handleAddressFormChange}
                placeholder={t('profile_page.address.modal.receiver_name_placeholder')}
                className={styles.modalInput}
              />
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>{t('profile_page.address.modal.phone')}</label>
              <input
                type="text"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressFormChange}
                placeholder={t('profile_page.address.modal.phone_placeholder')}
                className={styles.modalInput}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>
                  {t('profile_page.address.modal.province')}
                </label>
                <select
                  name="provinceCode"
                  value={addressForm.provinceCode}
                  onChange={handleProvinceChange}
                  className={styles.modalSelect}
                >
                  <option value="">{t('profile_page.address.modal.select_province')}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>{t('profile_page.address.modal.ward')}</label>
                <select
                  name="wardCode"
                  value={addressForm.wardCode}
                  onChange={handleWardChange}
                  disabled={!addressForm.provinceCode}
                  className={styles.modalSelect}
                >
                  <option value="">{t('profile_page.address.modal.select_ward')}</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>{t('profile_page.address.modal.street')}</label>
              <input
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleAddressFormChange}
                placeholder={t('profile_page.address.modal.street_placeholder')}
                className={styles.modalInput}
              />
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>
                {t('profile_page.address.modal.specific_address')}
              </label>
              <textarea
                rows={2}
                name="details"
                value={addressForm.details}
                onChange={handleAddressFormChange}
                placeholder={t('profile_page.address.modal.specific_address_placeholder')}
                className={styles.modalTextarea || styles.modalInput}
              />
            </div>

            {/* GPS Location Section */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>
                GPS Location (Optional)
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#6B7280',
                    fontWeight: 400,
                    marginLeft: '0.5rem',
                  }}
                >
                  - For accurate delivery tracking
                </span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className={styles.modalInput}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    cursor: gettingLocation ? 'not-allowed' : 'pointer',
                    backgroundColor: gettingLocation ? '#F3F4F6' : '#EFF6FF',
                    color: '#2563EB',
                    border: '2px dashed #2563EB',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!gettingLocation) {
                      e.currentTarget.style.backgroundColor = '#DBEAFE';
                      e.currentTarget.style.borderColor = '#1D4ED8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!gettingLocation) {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.borderColor = '#2563EB';
                    }
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
                    style={{ animation: gettingLocation ? 'spin 1s linear infinite' : 'none' }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                  </svg>
                  {gettingLocation ? 'Getting location...' : '📍 Use My Current Location'}
                </button>

                {addressForm.lat !== null && addressForm.lng !== null && (
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#16A34A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 500 }}>
                        Lat: {addressForm.lat.toFixed(6)}, Lng: {addressForm.lng.toFixed(6)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddressForm((prev) => ({ ...prev, lat: null, lng: null }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#DC2626',
                      }}
                      title="Remove GPS coordinates"
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
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
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
                  {t('profile_page.address.modal.set_default')}
                </span>
              </label>
            </div>
          </Form>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={() => setShowAddressModal(false)}>
            {t('profile_page.address.modal.cancel')}
          </button>
          <button className={styles.modalSaveBtn} onClick={handleSaveAddress}>
            {editingAddress
              ? t('profile_page.address.modal.update')
              : t('profile_page.address.modal.save')}
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
        orderId={reviewingOrder?._id}
      />

      {/* Return/Refund Request Modal */}
      <ReturnRequestModal
        show={showReturnModal}
        order={selectedOrderDetails}
        onHide={() => setShowReturnModal(false)}
        onSuccess={(_returnRequest) => {
          toast.success('Return request submitted successfully!');
          setShowReturnModal(false);
          // Optionally refresh order details
          if (selectedOrderDetails?._id) {
            handleOrderClick(selectedOrderDetails._id, { syncUrl: false });
          }
        }}
      />
    </div>
  );
};

export default ProfilePage;
