import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// import { Container } from 'react-bootstrap'; // Unused in original but kept if needed
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, updateUserProfile } from '@store/slices/authSlice';
import { orderService } from '@services/api/orderService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';
import addressService from '@services/api/addressService';
import coinService from '@/services/api/coin.service';
import ReturnRequestModal from '@components/buyer/ReturnRequestModal';
import locationService from '@services/api/locationService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Added import
import ReviewModal from '@components/common/ReviewModal';
import socketService from '@services/socket/socketService';
import { addToCart as addToCartApi } from '@services/api/cartService';
import rmaService from '@services/api/rmaService';
import ProfileSidebar from '@/components/buyer/ProfilePage/ProfileSidebar';
import ProfileNotificationsTab from '@/components/buyer/ProfilePage/ProfileNotificationsTab';
import ProfileAccountTab from '@/components/buyer/ProfilePage/ProfileAccountTab';
import ProfileAddressTab from '@/components/buyer/ProfilePage/ProfileAddressTab';
import ProfileOrdersTab from '@/components/buyer/ProfilePage/ProfileOrdersTab';
import ProfileCoinTab from '@/components/buyer/ProfilePage/ProfileCoinTab';
import ProfileAddressDrawer from '@/components/buyer/ProfilePage/ProfileAddressDrawer';
import DisputeCenter from '@/components/disputes/DisputeCenter';
import { geocodeAddressForSave } from '@utils/addressGeocoding';

const sanitizeOrderId = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  return raw.split('?')[0].split('&')[0].trim();
};

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
  const missingReturnRequestOrderIdsRef = useRef(new Set());

  // Order API State
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnRequest, setActiveReturnRequest] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Order Filter & Search State
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewSubmitting] = useState(false);
  const [reorderLoadingId, setReorderLoadingId] = useState(null);

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
  const trackedOrderIds = useMemo(() => {
    const ids = new Set(orders.map((order) => order?._id).filter(Boolean));

    if (selectedOrder?.id) {
      ids.add(sanitizeOrderId(selectedOrder.id));
    }

    if (selectedOrderDetails?._id) {
      ids.add(sanitizeOrderId(selectedOrderDetails._id));
    }

    const queryOrderId = searchParams.get('orderId');
    if (queryOrderId) {
      ids.add(sanitizeOrderId(queryOrderId));
    }

    return Array.from(ids).filter(Boolean);
  }, [orders, searchParams, selectedOrder, selectedOrderDetails]);

  const trackedOrderIdsKey = useMemo(
    () => trackedOrderIds.slice().sort().join(','),
    [trackedOrderIds]
  );

  useEffect(() => {
    if (!isAuthenticated || !user || activeTab !== 'orders' || trackedOrderIds.length === 0) {
      return;
    }

    socketService.connect(user?._id);
    socketService.setUserId(user?._id);

    const cleanupListeners = [];

    const applyOrderStatusUpdate = (data) => {
      if (!data?.orderId || !data?.status) {
        return;
      }

      if (!trackedOrderIds.includes(data.orderId)) {
        return;
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === data.orderId ? { ...o, status: data.status, ...data } : o))
      );

      setSelectedOrderDetails((prev) => {
        if (prev?._id === data.orderId) {
          return { ...prev, status: data.status, ...data };
        }
        return prev;
      });

      const orderNum = data.orderNumber || data.orderId.slice(-6);
    };

    // Chỉ listen vào sự kiện cụ thể cho từng order, không cần listen ORDER_STATUS_UPDATED
    trackedOrderIds.forEach((trackedOrderId) => {
      const orderStatusEventName = `order:status:${trackedOrderId}`;
      socketService.on(orderStatusEventName, applyOrderStatusUpdate);
      cleanupListeners.push(() => socketService.off(orderStatusEventName, applyOrderStatusUpdate));
    });

    // Listen for order arrived events of all tracked orders
    trackedOrderIds.forEach((trackedOrderId) => {
      const arrivedEventName = `order:arrived:${trackedOrderId}`;

      const handleArrivedUpdate = (data) => {
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
      };

      socketService.on(arrivedEventName, handleArrivedUpdate);

      cleanupListeners.push(() => socketService.off(arrivedEventName, handleArrivedUpdate));
    });

    // Cleanup
    return () => {
      cleanupListeners.forEach((cleanup) => cleanup());
    };
  }, [activeTab, isAuthenticated, trackedOrderIds, trackedOrderIdsKey, user]);

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
      const addressData = { ...addressForm };
      const geocodedAddress = await geocodeAddressForSave(addressData);

      if (geocodedAddress) {
        addressData.location = geocodedAddress.location;
        addressData.formattedAddress = geocodedAddress.formattedAddress;
      } else if (editingAddress?.location) {
        addressData.location = editingAddress.location;
        addressData.formattedAddress = editingAddress.formattedAddress;
      }

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
    [addr.formattedAddress, addr.details, addr.street, addr.wardName, addr.provinceName]
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
      const safeOrderId = sanitizeOrderId(orderId);

      if (!safeOrderId) {
        return;
      }

      if (syncUrl) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'orders');
        nextParams.set('orderId', safeOrderId);
        setSearchParams(nextParams);
      }

      setSelectedOrder({ id: safeOrderId });
      setDetailsLoading(true);
      try {
        const response = await orderService.getOrderById(safeOrderId);
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

  useEffect(() => {
    const fetchActiveReturnRequest = async () => {
      if (!selectedOrderDetails?._id) {
        setActiveReturnRequest(null);
        return;
      }

      const orderStatus = String(selectedOrderDetails?.status || '').toLowerCase();
      const canOrderShowReturnAction = [
        'delivered',
        'delivered_pending_confirmation',
        'completed',
        'return_requested',
        'return_approved',
        'return_in_transit',
        'returned',
        'refunded',
        'exchange_requested',
      ].includes(orderStatus);

      if (!canOrderShowReturnAction) {
        setActiveReturnRequest(null);
        return;
      }

      if (missingReturnRequestOrderIdsRef.current.has(selectedOrderDetails._id)) {
        setActiveReturnRequest(null);
        return;
      }

      try {
        const response = await rmaService.getOrderReturnRequest(selectedOrderDetails._id);
        setActiveReturnRequest(response.data || null);
      } catch (error) {
        if (error?.response?.status === 404) {
          missingReturnRequestOrderIdsRef.current.add(selectedOrderDetails._id);
        }
        setActiveReturnRequest(null);
      }
    };

    fetchActiveReturnRequest();
  }, [selectedOrderDetails?._id, selectedOrderDetails?.status]);

  // Open order details directly from URL: /buyer/profile?tab=orders&orderId=<id>
  useEffect(() => {
    if (!isAuthenticated || !user || activeTab !== 'orders') {
      return;
    }

    const rawOrderIdFromUrl = searchParams.get('orderId');
    if (!rawOrderIdFromUrl) {
      return;
    }

    const orderIdFromUrl = sanitizeOrderId(rawOrderIdFromUrl);
    if (!orderIdFromUrl) {
      return;
    }

    if (rawOrderIdFromUrl !== orderIdFromUrl) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('orderId', orderIdFromUrl);
      if (rawOrderIdFromUrl.includes('trackingDebug=1') && !nextParams.get('trackingDebug')) {
        nextParams.set('trackingDebug', '1');
      }
      setSearchParams(nextParams);
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

  const getVariantFromTierSelections = (tierSelections = {}, fallbackItem = {}) => {
    const entries = Object.entries(tierSelections || {});

    const findValueByKeywords = (keywords) => {
      const matched = entries.find(([key]) => {
        const normalized = String(key).toLowerCase();
        return keywords.some((keyword) => normalized.includes(keyword));
      });

      return matched?.[1] || null;
    };

    const color =
      findValueByKeywords(['color', 'mau', 'màu']) ||
      fallbackItem.color ||
      fallbackItem.variantColor;
    const size =
      findValueByKeywords(['size', 'kich', 'kích']) ||
      fallbackItem.size ||
      fallbackItem.variantSize;

    return { color, size };
  };

  const getSellerIdFromOrderItem = (item) => {
    const seller = item?.productId?.sellerId;
    return seller?._id || seller || null;
  };

  const buildChatProductInfoFromOrderItem = (item) => {
    const product = item?.productId;
    const productId = product?._id || product;

    if (!productId) {
      return null;
    }

    const variantText = item?.tierSelections
      ? Object.values(item.tierSelections).filter(Boolean).join(', ')
      : '';

    return {
      productId,
      name: product?.name || 'Purchased Product',
      image: product?.images?.[0] || 'https://via.placeholder.com/80',
      price: Number(item?.price || 0),
      originalPrice: Number(item?.originalPrice || item?.price || 0),
      variant: variantText || undefined,
    };
  };

  const handleContactSeller = useCallback(
    (orderData, preferredSellerId = null) => {
      const sourceOrder = orderData || selectedOrderDetails;
      const orderItems = sourceOrder?.items || [];

      if (orderItems.length === 0) {
        toast.error('No purchased product found to share in chat.');
        return;
      }

      const fallbackSellerId = getSellerIdFromOrderItem(orderItems[0]);
      const sellerId = preferredSellerId || fallbackSellerId;

      if (!sellerId) {
        toast.error('Unable to determine seller for this order.');
        return;
      }

      const sellerItems = orderItems.filter(
        (item) => String(getSellerIdFromOrderItem(item) || '') === String(sellerId)
      );

      const productInfos = (sellerItems.length > 0 ? sellerItems : orderItems)
        .map(buildChatProductInfoFromOrderItem)
        .filter(Boolean);

      if (productInfos.length === 0) {
        toast.error('No valid product can be attached to chat.');
        return;
      }

      const openChatEvent = new CustomEvent('openChatWithShop', {
        detail: {
          shopId: sellerId,
          productInfos,
          autoSendProductMessages: true,
          orderId: sourceOrder?._id,
        },
      });

      window.dispatchEvent(openChatEvent);
    },
    [selectedOrderDetails]
  );

  const handleReorder = async (orderData) => {
    const sourceOrder = orderData || selectedOrderDetails;
    const orderItems = sourceOrder?.items || [];

    if (!sourceOrder?._id || orderItems.length === 0) {
      toast.error('This order has no items to reorder');
      return;
    }

    setReorderLoadingId(sourceOrder._id);

    let successCount = 0;
    let failedCount = 0;

    for (const item of orderItems) {
      const productId = item?.productId?._id || item?.productId;
      const quantity = Number(item?.quantity || 1);
      const { color, size } = getVariantFromTierSelections(item?.tierSelections, item);

      if (!productId || !quantity) {
        failedCount += 1;
        continue;
      }

      try {
        await addToCartApi({ productId, quantity, color, size });
        successCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error('Reorder item failed:', {
          productId,
          quantity,
          color,
          size,
          error,
        });
      }
    }

    setReorderLoadingId(null);

    if (successCount === 0) {
      toast.error('Unable to reorder. Some products/variants may no longer be available.');
      return;
    }

    if (failedCount > 0) {
      toast.warning(
        `Added ${successCount} item(s) to cart. ${failedCount} item(s) could not be reordered.`
      );
    } else {
      toast.success('Reorder successful. Items have been added to your cart.');
    }

    navigate(BUYER_ROUTES.CART);
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

  const renderTabContent = () => {
    if (activeTab === 'notifications') {
      return <ProfileNotificationsTab />;
    }

    if (activeTab === 'account') {
      return (
        <ProfileAccountTab t={t} formData={formData} onChange={handleChange} onSave={handleSave} />
      );
    }

    if (activeTab === 'address') {
      return (
        <ProfileAddressTab
          t={t}
          addresses={addresses}
          onAddAddress={handleAddAddressClick}
          onSetDefaultAddress={handleSetDefaultAddress}
          onEditAddress={handleEditAddressClick}
          onDeleteAddress={handleDeleteAddress}
          formatAddressString={formatAddressString}
        />
      );
    }

    if (activeTab === 'orders') {
      return (
        <ProfileOrdersTab
          t={t}
          orders={orders}
          orderLoading={orderLoading}
          orderStatusFilter={orderStatusFilter}
          setOrderStatusFilter={setOrderStatusFilter}
          orderSearchQuery={orderSearchQuery}
          setOrderSearchQuery={setOrderSearchQuery}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          selectedOrderDetails={selectedOrderDetails}
          setSelectedOrderDetails={setSelectedOrderDetails}
          detailsLoading={detailsLoading}
          pagination={pagination}
          handlePageChange={handlePageChange}
          handleOrderClick={handleOrderClick}
          handleContactSeller={handleContactSeller}
          handleReorder={handleReorder}
          reorderLoadingId={reorderLoadingId}
          handleOpenReviewModal={handleOpenReviewModal}
          activeReturnRequest={activeReturnRequest}
          setShowReturnModal={setShowReturnModal}
          navigate={navigate}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          user={user}
          formatCurrency={formatCurrency}
          setOrders={setOrders}
        />
      );
    }

    if (activeTab === 'reports') {
      return <DisputeCenter mode="buyer" embedded />;
    }

    return (
      <ProfileCoinTab
        coinBalance={coinBalance}
        coinTransactions={coinTransactions}
        coinLoading={coinLoading}
        coinHistoryFilter={coinHistoryFilter}
        onFilterChange={setCoinHistoryFilter}
      />
    );
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <div className={styles.profileContainer}>
          {/* Mobile Navigation Bar */}

          <div className={styles.profileGrid}>
            <ProfileSidebar
              activeTab={activeTab}
              user={user}
              userAvatar={userAvatar}
              userDisplayName={userDisplayName}
              showMyAccountDropdown={showMyAccountDropdown}
              onToggleMyAccountDropdown={() => setShowMyAccountDropdown((prev) => !prev)}
              setShowMyAccountDropdown={setShowMyAccountDropdown}
              onTabChange={handleTabChange}
              onBecomeSeller={() => navigate(BUYER_ROUTES.SELLER_APPLICATION)}
              fileInputRef={fileInputRef}
              avatarFile={avatarFile}
              onImageChange={handleImageChange}
              onSaveAvatar={handleSaveAvatar}
              onCancelAvatar={handleCancelAvatar}
              isSavingAvatar={isSavingAvatar}
            />

            {/* Main Content Area */}
            <div className={styles.accountDetailsCard}>{renderTabContent()}</div>
          </div>
        </div>
      </div>
      <ProfileAddressDrawer
        t={t}
        show={showAddressModal}
        onHide={() => setShowAddressModal(false)}
        editingAddress={editingAddress}
        addressForm={addressForm}
        onAddressFormChange={handleAddressFormChange}
        savedAddresses={addresses}
        provinces={provinces}
        wards={wards}
        onProvinceChange={handleProvinceChange}
        onWardChange={handleWardChange}
        onSaveAddress={handleSaveAddress}
      />
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
          setActiveReturnRequest(_returnRequest || null);
          if (selectedOrderDetails?._id) {
            missingReturnRequestOrderIdsRef.current.delete(selectedOrderDetails._id);
          }
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
