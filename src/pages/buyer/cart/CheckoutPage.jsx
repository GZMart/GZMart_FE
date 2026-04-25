import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { geocodeAddressForSave } from '@utils/addressGeocoding';
import useAddressAutocomplete from '@hooks/useAddressAutocomplete';
import AddressAutocompleteDropdown from '@components/common/AddressAutocompleteDropdown';
import { applyAddressSuggestion, applyGoongSuggestion } from '@utils/addressAutocomplete';

const randomDeliveryWindow = (minDays, maxDays) => {
  const start = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const end = Math.min(maxDays, start + Math.floor(Math.random() * 2) + 1);
  return `${start}-${end} days`;
};

const SYSTEM_VOUCHER_TYPES = ['system_shipping', 'system_order', 'system_vip_daily'];

function isSystemVoucherType(type) {
  return SYSTEM_VOUCHER_TYPES.includes(type);
}

/** API `eligible` can omit min-order checks; enforce minBasketPrice against cart subtotal in UI. */
function voucherEligibleForCartSubtotal(voucher, cartSubtotal) {
  if (!voucher) {
    return false;
  }
  const min = Number(voucher.minBasketPrice);
  if (!Number.isNaN(min) && min > 0 && cartSubtotal < min) {
    return false;
  }
  return Boolean(voucher.eligible);
}

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

  // Separate persisted cart items from live-only items
  const rawItems = location.state?.selectedItems || allCartItems;
  const cartItems = rawItems; // still used for display

  // Extract live-only items (have temp IDs starting with 'live_')
  const liveItems = useMemo(
    () =>
      (rawItems || []).filter((item) => {
        const id = item._id || item.id;
        return id && String(id).startsWith('live_');
      }),
    [rawItems]
  );

  // Real cart item IDs (filter out the fake 'live_' prefixes used in live session checkout)
  const realCartItemIds = useMemo(
    () =>
      (rawItems || [])
        .map((item) => item._id || item.id)
        .filter((id) => id && !String(id).startsWith('live_')),
    [rawItems]
  );

  // Live session context — voucher is passed directly from LiveQuickBuySheet
  const fromLiveSession = location.state?.fromLiveSession || null;
  const preSelectedLiveVoucher = location.state?.preSelectedLiveVoucher || null;

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
        const response = await voucherService.getApplicableVouchers({
          cartItemIds: realCartItemIds,
        });
        if (response.success) {
          const vouchers = response.data || [];
          setApplicableVouchers(vouchers);

          const subtotal = cartItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
            0
          );

          // Auto-select the best shop voucher (only from saved vouchers)
          const eligibleShopVouchers = vouchers.filter(
            (v) =>
              voucherEligibleForCartSubtotal(v, subtotal) &&
              v.isSaved &&
              !v.isLiveVoucher &&
              (v.type === 'shop' || v.type === 'private')
          );
          // Auto-select best saved shop voucher per seller
          const shopAutoMap = {};
          for (const group of sellerGroups) {
            const sid = group.sellerId;
            const sellerSub = sellerSubtotals[sid] || 0;
            const best = eligibleShopVouchers
              .filter((v) => v.shopId === sid && (!v.minBasketPrice || sellerSub >= v.minBasketPrice))
              .reduce((prev, cur) => (!prev || cur.estimatedSaving > prev.estimatedSaving ? cur : prev), null);
            if (best) shopAutoMap[sid] = best._id;
          }
          if (Object.keys(shopAutoMap).length > 0) {
            setSelectedShopVoucherBySeller(shopAutoMap);
          }
          if (Object.keys(shopAutoMap).length === 0) {
            const eligibleSystem = vouchers.filter(
              (v) =>
                voucherEligibleForCartSubtotal(v, subtotal) && isSystemVoucherType(v.type)
            );
            if (eligibleSystem.length > 0) {
              const bestSystem = eligibleSystem.reduce((prev, current) =>
                prev.estimatedSaving > current.estimatedSaving ? prev : current
              );
              setSelectedSystemVoucherId(bestSystem._id);
            }
          }

          // Auto-select the best product voucher (only from saved vouchers)
          const eligibleProductVouchers = vouchers.filter(
            (v) =>
              voucherEligibleForCartSubtotal(v, subtotal) &&
              v.isSaved &&
              !v.isLiveVoucher &&
              v.type === 'product'
          );
          if (eligibleProductVouchers.length > 0) {
            const bestProductVoucher = eligibleProductVouchers.reduce((prev, current) =>
              prev.estimatedSaving > current.estimatedSaving ? prev : current
            );
            setSelectedProductVoucherId(bestProductVoucher._id);
          }

          // Auto-select the best buyer voucher (only from saved vouchers - new_buyer, repeat_buyer, follower)
          const eligibleBuyerVouchers = vouchers.filter(
            (v) =>
              voucherEligibleForCartSubtotal(v, subtotal) &&
              v.isSaved &&
              !v.isLiveVoucher &&
              (v.type === 'new_buyer' || v.type === 'repeat_buyer' || v.type === 'follower')
          );
          if (eligibleBuyerVouchers.length > 0) {
            const bestBuyerVoucher = eligibleBuyerVouchers.reduce((prev, current) =>
              prev.estimatedSaving > current.estimatedSaving ? prev : current
            );
            setSelectedBuyerVoucherId(bestBuyerVoucher._id);
          }

          // Auto-select the best live voucher (must be saved + active session)
          if (!preSelectedLiveVoucher) {
            const eligibleLiveVouchers = vouchers.filter(
              (v) => v.isLiveVoucher && v.isSaved && voucherEligibleForCartSubtotal(v, subtotal)
            );
            if (eligibleLiveVouchers.length > 0) {
              const bestLiveVoucher = eligibleLiveVouchers.reduce((prev, current) =>
                prev.estimatedSaving > current.estimatedSaving ? prev : current
              );
              setSelectedLiveVoucherId(bestLiveVoucher._id);
            }
          }
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
  }, [cartItems, realCartItemIds]);

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
      const addressData = { ...addressForm };
      const geocodedAddress = await geocodeAddressForSave(addressData);

      if (geocodedAddress) {
        addressData.location = geocodedAddress.location;
        addressData.formattedAddress = geocodedAddress.formattedAddress;
      } else if (editingAddress?.location) {
        addressData.location = editingAddress.location;
        addressData.formattedAddress = editingAddress.formattedAddress;
      }

      let response;
      if (editingAddress) {
        response = await addressService.updateAddress(editingAddress._id, addressData);
      } else {
        response = await addressService.createAddress(addressData);
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

  const handleAddressSuggestionSelect = async (suggestion) => {
    const resolvedSuggestion = await resolveSuggestionDetails(suggestion);
    setAddressForm((prev) =>
      resolvedSuggestion.source === 'goong'
        ? applyGoongSuggestion({
            suggestion: resolvedSuggestion,
            activeField: addressSuggestionField,
            provinces,
            wards,
            currentFormValues: prev,
          })
        : {
            ...prev,
            ...applyAddressSuggestion(resolvedSuggestion),
          }
    );
    setAddressSuggestionField(null);
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

  // Default COD: PayOS returns 400 if server has no PAYOS_* keys (common in local dev).
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingCompany, setShippingCompany] = useState('ghn');
  const [includeGiftBox, setIncludeGiftBox] = useState(false);
  const [includeCoin, setIncludeCoin] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalView, setAddressModalView] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingAddress, setEditingAddress] = useState(null);
  const [showCheckoutErrorModal, setShowCheckoutErrorModal] = useState(false);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState('');

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

  const {
    activeField: addressSuggestionField,
    setActiveField: setAddressSuggestionField,
    suggestions: addressSuggestions,
    showSuggestions: showAddressSuggestions,
    resolveSuggestionDetails,
  } = useAddressAutocomplete({
    addresses,
    formValues: addressForm,
    excludeId: editingAddress?._id || null,
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

  // Voucher state — live voucher is a fixed "live" slot (always applied from session)
  // Shop and product vouchers are user-selectable (auto-best on mount when not from live)
  const [applicableVouchers, setApplicableVouchers] = useState([]);
  /** Map sellerId → voucherId; mỗi seller tối đa 1 mã shop/private */
  const [selectedShopVoucherBySeller, setSelectedShopVoucherBySeller] = useState({});
  /** Tối đa 1 mã sàn: system_shipping | system_order | system_vip_daily */
  const [selectedSystemVoucherId, setSelectedSystemVoucherId] = useState(null);
  const [selectedProductVoucherId, setSelectedProductVoucherId] = useState(null);
  // Buyer vouchers: new_buyer, repeat_buyer, follower — separate slot
  const [selectedBuyerVoucherId, setSelectedBuyerVoucherId] = useState(null);
  // Live voucher — passed from LiveQuickBuySheet or from saved+active session
  const [selectedLiveVoucherId, setSelectedLiveVoucherId] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [showVoucherDrawer, setShowVoucherDrawer] = useState(false);
  // When multi-seller, tracks which seller's shop voucher drawer is open
  const [activeSellerDrawer, setActiveSellerDrawer] = useState(null);

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

  // Shipping companies data (Vietnam)
  const shippingCompanies = useMemo(
    () => [
      {
        id: 'ghn',
        name: 'Giao Hang Nhanh (GHN)',
        logo: '/ghn.png',
        deliveryTime: randomDeliveryWindow(1, 3),
        shippingCost: 0,
        insurance: true,
      },
      {
        id: 'ghtk',
        name: 'Giao Hang Tiet Kiem (GHTK)',
        logo: '/ghtk.png',
        deliveryTime: randomDeliveryWindow(2, 4),
        shippingCost: 15000,
        insurance: true,
      },
      {
        id: 'viettel_post',
        name: 'Viettel Post',
        logo: '/viettelpost.png',
        deliveryTime: randomDeliveryWindow(2, 5),
        shippingCost: 22000,
        insurance: false,
      },
    ],
    []
  );

  // Order summary state
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shippingCost: 0,
    tax: 0,
    discount: 0,
    total: 0,
  });

  // For pure live cart (no persisted cart items), compute subtotal locally
  const isPureLiveCart = realCartItemIds.length === 0 && liveItems.length > 0;
  const localSubtotal = isPureLiveCart
    ? liveItems.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0)
    : (rawItems || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  // Group cart items by seller for per-seller voucher UI
  const sellerGroups = useMemo(() => {
    const groups = new Map(); // Map<sellerId, { sellerId, shopName, items }>
    for (const item of (rawItems || [])) {
      const sid = item.sellerId?.toString() || '__unknown__';
      if (!groups.has(sid)) {
        groups.set(sid, {
          sellerId: sid,
          shopName: item.sellerName || 'Shop',
          items: [],
        });
      }
      groups.get(sid).items.push(item);
    }
    return Array.from(groups.values());
  }, [rawItems]);

  // Per-seller subtotals for minBasketPrice checks
  const sellerSubtotals = useMemo(() => {
    const map = {};
    for (const item of (rawItems || [])) {
      const sid = item.sellerId?.toString() || '__unknown__';
      map[sid] = (map[sid] || 0) + (item.price || 0) * (item.quantity || 1);
    }
    return map; // { [sellerId]: subtotal }
  }, [rawItems]);

  const isMultiSeller = sellerGroups.length > 1;
  const getSelectedVoucherIds = useCallback(() => {
    const ids = [];
    // System voucher — 1 toàn giỏ
    if (selectedSystemVoucherId) {
      const v = applicableVouchers.find((x) => x._id === selectedSystemVoucherId);
      if (v && isSystemVoucherType(v.type)) {
        ids.push(selectedSystemVoucherId);
      }
    }
    // Shop vouchers — 1 per seller
    for (const vid of Object.values(selectedShopVoucherBySeller)) {
      if (!vid) continue;
      const v = applicableVouchers.find((x) => x._id === vid);
      if (v && (v.type === 'shop' || v.type === 'private')) {
        ids.push(vid);
      }
    }
    if (selectedProductVoucherId) ids.push(selectedProductVoucherId);
    if (selectedBuyerVoucherId) ids.push(selectedBuyerVoucherId);
    // Live voucher is NOT included here — it's sent as liveSessionVoucherId separately
    return ids;
  }, [
    applicableVouchers,
    selectedShopVoucherBySeller,
    selectedSystemVoucherId,
    selectedProductVoucherId,
    selectedBuyerVoucherId,
  ]);

  // Drop shop/product/buyer selection if cart no longer meets min order (or API eligibility changed)
  useEffect(() => {
    if (!applicableVouchers.length) {
      return;
    }
    setSelectedShopVoucherBySeller((prev) => {
      const next = { ...prev };
      for (const [sid, vid] of Object.entries(next)) {
        if (!vid) continue;
        const v = applicableVouchers.find((x) => x._id === vid);
        const sellerSub = sellerSubtotals[sid] || 0;
        if (!v || !v.eligible || (v.minBasketPrice > 0 && sellerSub < v.minBasketPrice)) {
          next[sid] = null;
        }
      }
      return next;
    });
    setSelectedSystemVoucherId((id) => {
      if (!id) {
        return id;
      }
      const v = applicableVouchers.find((x) => x._id === id);
      return v &&
        voucherEligibleForCartSubtotal(v, localSubtotal) &&
        isSystemVoucherType(v.type)
        ? id
        : null;
    });
    setSelectedProductVoucherId((id) => {
      if (!id) {
        return id;
      }
      const v = applicableVouchers.find((x) => x._id === id);
      return v && voucherEligibleForCartSubtotal(v, localSubtotal) ? id : null;
    });
    setSelectedBuyerVoucherId((id) => {
      if (!id) {
        return id;
      }
      const v = applicableVouchers.find((x) => x._id === id);
      return v && voucherEligibleForCartSubtotal(v, localSubtotal) ? id : null;
    });
  }, [localSubtotal, applicableVouchers, sellerSubtotals]);

  // Fetch order preview when city/state, cart, or vouchers change
  useEffect(() => {
    const fetchPreview = async () => {
      // Resolve resolved voucher objects from IDs
      // Resolve tất cả shop vouchers đang được chọn (mỗi seller 1 mã)
      const resolvedShopVouchers = Object.entries(selectedShopVoucherBySeller)
        .map(([sid, vid]) => {
          if (!vid) return null;
          return applicableVouchers.find(
            (v) => v._id === vid && (v.type === 'shop' || v.type === 'private') && v.shopId === sid
          ) || null;
        })
        .filter(Boolean);
      const resolvedProductVoucher =
        applicableVouchers.find((v) => v._id === selectedProductVoucherId) || null;
      const resolvedBuyerVoucher =
        applicableVouchers.find((v) => v._id === selectedBuyerVoucherId) || null;
      const resolvedLiveVoucher =
        applicableVouchers.find((v) => v._id === selectedLiveVoucherId) || null;
      const resolvedSystemVoucher =
        applicableVouchers.find(
          (v) => v._id === selectedSystemVoucherId && isSystemVoucherType(v.type)
        ) || null;

      // Helper: compute discount from a single voucher against a subtotal
      const calcDiscount = (voucher, sub) => {
        if (!voucher) {
          return 0;
        }
        if (voucher.discountType === 'percent') {
          return Math.min(
            sub * (Number(voucher.discountValue) / 100),
            Number(voucher.maxDiscountAmount) || Infinity
          );
        }
        return Number(voucher.discountValue) || 0;
      };

      const selectedShipping = shippingCompanies.find((c) => c.id === shippingCompany);
      const previewShippingCost = selectedShipping ? selectedShipping.shippingCost : 0;
      const rawSubtotal = cartItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

      // Skip API when there are no real persisted cart items (live session flow)
      if (realCartItemIds.length === 0) {
        const liveDiscount = calcDiscount(
          resolvedLiveVoucher || preSelectedLiveVoucher,
          rawSubtotal
        );
        const afterLive = rawSubtotal - liveDiscount;
        const systemDiscount = calcDiscount(resolvedSystemVoucher, afterLive);
        const afterSystem = afterLive - systemDiscount;
        const shopDiscount = resolvedShopVouchers.reduce((sum, v) => {
          const sid = v.shopId?.toString() || '__unknown__';
          const sellerSub = sellerSubtotals[sid] || 0;
          return sum + calcDiscount(v, sellerSub);
        }, 0);
        const afterShop = afterSystem - shopDiscount;
        const productDiscount = calcDiscount(resolvedProductVoucher, afterShop);
        const afterProduct = afterShop - productDiscount;
        const buyerDiscount = calcDiscount(resolvedBuyerVoucher, afterProduct);
        const totalDiscount =
          liveDiscount + systemDiscount + shopDiscount + productDiscount + buyerDiscount;

        setOrderSummary({
          subtotal: rawSubtotal,
          shippingCost: previewShippingCost,
          tax: 0,
          discount: totalDiscount,
          total: Math.max(0, rawSubtotal + previewShippingCost - totalDiscount),
        });
        return;
      }

      const city = customerInfo.state;
      try {
        const response = await orderService.previewOrder({
          city,
          shippingCost: previewShippingCost,
          giftBoxFee: includeGiftBox ? 11000 : 0,
          voucherIds: getSelectedVoucherIds(),
          cartItemIds: realCartItemIds,
          useCoin: includeCoin,
        });
        if (response.success) {
          // Stack live voucher discount on top of API totals (use resolved from saved list, fallback to preSelectedLiveVoucher)
          const apiSubtotal = response.data.subtotal ?? rawSubtotal;
          const liveDiscount = calcDiscount(
            resolvedLiveVoucher || preSelectedLiveVoucher,
            apiSubtotal
          );
          setOrderSummary({
            ...response.data,
            discount: (response.data.discount || 0) + liveDiscount,
            total: Math.max(0, (response.data.total ?? apiSubtotal) - liveDiscount),
          });
        }
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error('Failed to fetch order preview:', error);
        }
        const systemDiscount = calcDiscount(resolvedSystemVoucher, rawSubtotal);
        const afterSys = rawSubtotal - systemDiscount;
        const shopDiscount = resolvedShopVouchers.reduce((sum, v) => {
          const sid = v.shopId?.toString() || '__unknown__';
          const sellerSub = sellerSubtotals[sid] || 0;
          return sum + calcDiscount(v, sellerSub);
        }, 0);
        const afterShop = afterSys - shopDiscount;
        const productDiscount = calcDiscount(resolvedProductVoucher, afterShop);
        const afterProduct = afterShop - productDiscount;
        const buyerDiscount = calcDiscount(resolvedBuyerVoucher, afterProduct);
        const totalDiscount =
          systemDiscount + shopDiscount + productDiscount + buyerDiscount;
        setOrderSummary({
          subtotal: rawSubtotal,
          shippingCost: previewShippingCost,
          tax: 0,
          discount: totalDiscount,
          total: Math.max(0, rawSubtotal + previewShippingCost - totalDiscount),
        });
      }
    };

    if (cartItems.length > 0) {
      fetchPreview();
    }
  }, [
    customerInfo.state,
    cartItems,
    localSubtotal,
    getSelectedVoucherIds,
    shippingCompany,
    includeGiftBox,
    includeCoin,
    shippingCompanies,
    applicableVouchers,
    selectedShopVoucherBySeller,
    selectedSystemVoucherId,
    selectedProductVoucherId,
    selectedBuyerVoucherId,
    selectedLiveVoucherId,
    preSelectedLiveVoucher,
    realCartItemIds,
  ]);

  // Get selected shipping company cost
  const selectedShippingCompany = shippingCompanies.find((c) => c.id === shippingCompany);
  const selectedShippingCost = selectedShippingCompany ? selectedShippingCompany.shippingCost : 0;

  // Values for display (use selected shipping cost instead of backend)
  const { subtotal, tax, discount } = orderSummary;
  const giftBoxPrice = includeGiftBox ? 11000 : 0;
  const coinDeduction = includeCoin ? orderSummary.coinEstimate || 0 : 0;
  const finalTotal =
    subtotal + selectedShippingCost + tax - discount + giftBoxPrice - coinDeduction;

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

  const openCheckoutErrorModal = (message) => {
    setCheckoutErrorMessage(message || 'Failed to create order');
    setShowCheckoutErrorModal(true);
  };

  const handleCheckoutErrorGoHome = () => {
    setShowCheckoutErrorModal(false);
    navigate(PUBLIC_ROUTES.HOME);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('[CHECKOUT-DEBUG] 📝 handleSubmit called, currentStep:', currentStep);

    if (currentStep === 1) {
      if (!customerInfo.address) {
        openCheckoutErrorModal('Please select a shipping address before proceeding.');
        setAddressModalView('list');
        setShowAddressModal(true);
        return;
      }
      handleNext();
    } else if (currentStep === 2) {
      handleNext();
    } else if (currentStep === 3) {
      // console.log('[CHECKOUT-DEBUG] 🛒 Step 3 - Creating order...');
      setIsProcessing(true);
      const orderData = {
        shippingAddress: `${customerInfo.address}, ${customerInfo.state}, ${customerInfo.country}`,
        city: customerInfo.state,
        paymentMethod,
        shippingMethod: selectedShippingCompany?.name || shippingCompany,
        shippingCost: selectedShippingCost,
        includeGiftBox,
        giftBoxFee: giftBoxPrice,
        notes: '',
        voucherIds: getSelectedVoucherIds(),
        cartItemIds: realCartItemIds,
        useCoin: includeCoin,
        // Pass live items directly so BE can create order items without CartItem lookup
        liveItems: liveItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          price: item.price,
          image: item.image,
        })),
        liveSessionVoucherId: preSelectedLiveVoucher?._id || selectedLiveVoucherId || null,
        fromLiveSession: fromLiveSession || null,
      };

      try {
        // console.log('[CHECKOUT-DEBUG] 📤 Calling orderService.createOrder with:', orderData);
        const response = await orderService.createOrder(orderData);
        // console.log('[CHECKOUT-DEBUG] ✅ Order created successfully:', response);

        if (response.success) {
          const orderId = response.data._id;
          const amountDue = response?.payment?.amountDue ?? response?.data?.totalPrice ?? 0;
          const fullyPaidByCoin =
            response?.payment?.fullyPaidByCoin === true || Number(amountDue) <= 0;

          // If PayOS payment method, create payment link and redirect
          if (paymentMethod === 'payos' && !fullyPaidByCoin) {
            try {
              const paymentResponse = await paymentService.createPaymentLink(orderId);
              if (paymentResponse.success && paymentResponse.data.checkoutUrl) {
                // Redirect to PayOS checkout page
                window.location.href = paymentResponse.data.checkoutUrl;
                return;
              }
            } catch (paymentError) {
              console.error('Failed to create payment link:', paymentError);
              openCheckoutErrorModal(
                'Failed to create payment link. Please try again or choose another payment method.'
              );
              setIsProcessing(false);
              return;
            }
          }

          // For other payment methods (COD, VNPay), go to confirmation page
          // console.log('[CHECKOUT-DEBUG] 🧭 Navigating to order confirmation:', orderId);
          navigate(BUYER_ROUTES.ORDER_CONFIRMATION.replace(':orderId', orderId));
        }
      } catch (error) {
        console.error('Failed to create order', error?.response?.data || error);
        const serverMsg =
          error?.response?.data?.message || error?.response?.data?.error || error.message;
        openCheckoutErrorModal(serverMsg || 'Failed to create order');
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
                  'repeating-linear-gradient(45deg, #B13C36, #B13C36 33px, #fff 33px, #fff 46px, #741E20 46px, #741E20 79px, #fff 79px, #fff 92px)',
              }}
            />
            <Card.Body className="p-4">
              <div className="d-flex align-items-start gap-3">
                <div className="mt-1" style={{ color: '#741E20', fontSize: '1.2rem' }}>
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0" style={{ color: '#741E20' }}>
                      Shipping Address
                    </h5>
                    <Button
                      variant="link"
                      className="text-decoration-none p-0 fw-bold"
                      style={{ color: '#B13C36' }}
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
              className="mt-3 px-4 rounded-pill text-white border-0 fw-semibold"
              onClick={() => {
                setAddressModalView('list');
                setShowAddressModal(true);
              }}
              style={{ backgroundColor: '#B13C36' }}
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
                className="border"
                style={{
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === method.id ? '#fffdfc' : '#FFFFFF',
                  borderColor: paymentMethod === method.id ? '#741E20' : '#dee2e6',
                  borderWidth: paymentMethod === method.id ? '2px' : '1px',
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
                className="border"
                style={{
                  cursor: 'pointer',
                  backgroundColor: shippingCompany === company.id ? '#fffdfc' : '#FFFFFF',
                  borderColor: shippingCompany === company.id ? '#741E20' : '#dee2e6',
                  borderWidth: shippingCompany === company.id ? '2px' : '1px',
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
        {/* Shopping items — grouped by seller */}
        <div className="mb-4">
          <h5 className="mb-3">Shopping items</h5>
          {sellerGroups.map((group) => {
            const sellerVouchers = applicableVouchers.filter(
              (v) => (v.type === 'shop' || v.type === 'private') && v.shopId === group.sellerId,
            );
            const currentVid = selectedShopVoucherBySeller[group.sellerId] || null;
            const selectedV = currentVid
              ? applicableVouchers.find((v) => v._id === currentVid)
              : null;
            const sellerSub = sellerSubtotals[group.sellerId] || 0;

            return (
              <div
                key={group.sellerId}
                className="mb-3 rounded-3"
                style={{ border: '1px solid #eee', overflow: 'hidden' }}
              >
                {/* Seller header */}
                {isMultiSeller && (
                  <div
                    className="px-3 py-2 d-flex align-items-center gap-2"
                    style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}
                  >
                    <i className="bi bi-shop" style={{ color: '#B13C36', fontSize: '0.9rem' }} />
                    <span className="fw-semibold small" style={{ color: '#444' }}>
                      {group.shopName}
                    </span>
                  </div>
                )}

                {/* Items */}
                <div className="d-flex flex-column gap-3 p-3">
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <Row className="align-items-center">
                        <Col xs="auto">
                          <img
                            src={item.image || '/placeholder-image.png'}
                            alt={item.name}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-image.png'; }}
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
                                  style={{ width: '16px', height: '16px', backgroundColor: item.colorCode || '#ccc', border: '1px solid #ddd' }}
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
                          <div className="fw-bold">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>

                {/* Inline shop voucher picker — always shown in product group */}
                {sellerVouchers.length > 0 && (
                  <div
                    className="px-3 py-2 d-flex align-items-center justify-content-between"
                    style={{ borderTop: '1px dashed #eee', backgroundColor: '#fff9f8' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-tag-fill" style={{ color: '#B13C36', fontSize: '0.85rem' }} />
                      {selectedV ? (
                        <span className="small fw-semibold" style={{ color: '#B13C36' }}>
                          {selectedV.name}
                          {selectedV.estimatedSaving > 0 && (
                            <span className="ms-1 text-muted fw-normal">
                              (-{formatCurrency(selectedV.estimatedSaving)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="small text-muted">Chọn mã giảm giá shop</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {selectedV && (
                        <button
                          className="btn btn-link btn-sm p-0 text-muted"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() =>
                            setSelectedShopVoucherBySeller((prev) => ({ ...prev, [group.sellerId]: null }))
                          }
                        >
                          <i className="bi bi-x-circle" />
                        </button>
                      )}
                      <Button
                        variant="link"
                        className="p-0 text-decoration-none"
                        style={{ fontSize: '0.8rem', color: '#B13C36', fontWeight: 600 }}
                        onClick={() => {
                          setActiveSellerDrawer(group.sellerId);
                          setShowVoucherDrawer(true);
                        }}
                      >
                        {selectedV ? 'Đổi' : 'Chọn'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              {shippingCompanies.find((s) => s.id === shippingCompany)?.name || 'GHN'}
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
        // Auto-select only if this basket meets min order + API eligibility
        if (voucherEligibleForCartSubtotal(v, localSubtotal)) {
          if (v.type === 'shop' || v.type === 'private') {
            const vid = v.shopId?.toString() || '__unknown__';
            setSelectedShopVoucherBySeller((prev) => ({ ...prev, [vid]: v._id }));
          } else if (isSystemVoucherType(v.type)) {
            setSelectedSystemVoucherId(v._id);
          } else if (v.type === 'product') {
            setSelectedProductVoucherId(v._id);
          }
        }
        setManualCode('');
      }
    } catch (error) {
      setCodeError(error.response?.data?.message || error.message || 'Invalid voucher code');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSaveAndUseVoucher = async (e, voucher) => {
    e.stopPropagation();
    if (!customerInfo.email) {
      // Basic login check or just assume logged in since they are in checkout
    }
    try {
      if (!voucher.isSaved) {
        await voucherService.saveVoucher(voucher._id);
        setApplicableVouchers((prev) =>
          prev.map((v) => (v._id === voucher._id ? { ...v, isSaved: true } : v))
        );
      }
      // Auto use only when usable for current subtotal
      if (!voucherEligibleForCartSubtotal(voucher, localSubtotal)) {
        return;
      }
      if (voucher.type === 'shop' || voucher.type === 'private') {
        const sid = voucher.shopId?.toString() || '__unknown__';
        setSelectedShopVoucherBySeller((prev) => ({ ...prev, [sid]: voucher._id }));
      } else if (isSystemVoucherType(voucher.type)) {
        setSelectedSystemVoucherId(voucher._id);
      } else if (voucher.type === 'product') {
        setSelectedProductVoucherId(voucher._id);
      } else if (['new_buyer', 'repeat_buyer', 'follower'].includes(voucher.type)) {
        setSelectedBuyerVoucherId(voucher._id);
      }
    } catch (error) {
      console.error('Failed to save voucher:', error);
    }
  };

  // Render Voucher Section (Minimized in Checkout Sidebar)
  const renderVoucherSection = () => {
    // Per-seller selected shop vouchers
    const selectedShopVouchersBySellerResolved = sellerGroups.map((group) => {
      const vid = selectedShopVoucherBySeller[group.sellerId];
      const voucher = vid
        ? applicableVouchers.find((v) => v._id === vid && (v.type === 'shop' || v.type === 'private'))
        : null;
      return { sellerId: group.sellerId, shopName: group.shopName, voucher };
    });
    const selectedSystemVoucher =
      applicableVouchers.find(
        (v) => v._id === selectedSystemVoucherId && isSystemVoucherType(v.type)
      ) || null;
    const selectedProductVoucher =
      applicableVouchers.find((v) => v._id === selectedProductVoucherId) || null;
    const selectedBuyerVoucher =
      applicableVouchers.find((v) => v._id === selectedBuyerVoucherId) || null;

    const shopSlotBadge = (v) => {
      if (!v) {
        return 'SHOP';
      }
      if (v.type === 'system_vip_daily') {
        return 'VIP';
      }
      if (v.type === 'system_order') {
        return 'ORDER';
      }
      if (v.type === 'system_shipping') {
        return 'SHIP';
      }
      return 'SHOP';
    };

    const voucherTypeInfo = {
      new_buyer: { label: 'NEW', color: '#9c27b0', bg: '#f3e5f5' },
      repeat_buyer: { label: 'VIP', color: '#f57c00', bg: '#fff3e0' },
      follower: { label: 'FAN', color: '#e91e63', bg: '#fce4ec' },
    };

    return (
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div
            className="d-flex align-items-center gap-2"
            style={{ fontSize: '0.95rem', fontWeight: 600 }}
          >
            <i className="bi bi-tag-fill" style={{ color: '#B13C36', fontSize: '1.1rem' }}></i>
            <span style={{ color: '#2b2b2b' }}>GZMart Vouchers</span>
          </div>
          <Button
            variant="link"
            className="p-0 text-decoration-none"
            style={{ fontSize: '0.85rem', color: '#B13C36', fontWeight: 600 }}
            onClick={() => setShowVoucherDrawer(true)}
          >
            Select Voucher
          </Button>
        </div>

        {voucherLoading && (
          <div className="text-center py-2">
            <Spinner animation="border" size="sm" className="me-2" />
            <small className="text-muted">Loading vouchers...</small>
          </div>
        )}

        {!voucherLoading && (
          <div className="d-flex flex-column gap-2">
            {/* Live session voucher — always applied, cannot be deselected */}
            {preSelectedLiveVoucher && (
              <div
                className="d-flex align-items-start gap-3 p-2 rounded-3 border-0"
                style={{
                  background: 'linear-gradient(135deg, #B13C36 0%, #7a2820 100%)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.25)',
                          borderRadius: '0.35rem',
                          padding: '0.2em 0.5em',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          color: '#fff',
                        }}
                      >
                        LIVE
                      </span>
                      <span
                        className="fw-semibold text-truncate"
                        style={{ color: '#fff', maxWidth: '160px' }}
                      >
                        {preSelectedLiveVoucher.name}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.78rem',
                      marginTop: '4px',
                    }}
                  >
                    {preSelectedLiveVoucher.discountType === 'percent'
                      ? `Save ${preSelectedLiveVoucher.discountValue}%`
                      : `Save ${new Intl.NumberFormat('en-US').format(preSelectedLiveVoucher.discountValue)}đ`}
                  </div>
                </div>
              </div>
            )}

            {/* Show Selected Shop Voucher */}
            {selectedSystemVoucher && (
              <div
                className="d-flex align-items-start gap-3 p-2 rounded-3 border-0"
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.1)',
                  fontSize: '0.85rem',
                }}
              >
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        bg=""
                        style={{
                          backgroundColor: '#b45309',
                          fontSize: '0.7rem',
                          padding: '0.35em 0.5em',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {shopSlotBadge(selectedSystemVoucher)}
                      </Badge>
                      <span
                        className="fw-semibold text-truncate"
                        style={{ color: '#333', maxWidth: '160px' }}
                      >
                        {selectedSystemVoucher.name}
                      </span>
                    </div>
                    <i
                      className="bi bi-x-circle-fill text-muted"
                      style={{ cursor: 'pointer', fontSize: '1rem' }}
                      onClick={() => setSelectedSystemVoucherId(null)}
                      title="Bỏ chọn"
                    />
                  </div>
                  <div
                    style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 600, marginTop: 6 }}
                  >
                    - {formatCurrency(selectedSystemVoucher.estimatedSaving || 0)}
                  </div>
                </div>
              </div>
            )}

            {/* Shop voucher chips không hiển thị ở sidebar — chọn inline trong product list */}

            {/* Show Selected Product Voucher */}
            {selectedProductVoucher && (
              <div
                className="d-flex align-items-start gap-3 p-2 rounded-3 border-0"
                style={{
                  backgroundColor: '#fffdfc',
                  boxShadow: '0 2px 8px rgba(177, 60, 54, 0.08)',
                  fontSize: '0.85rem',
                }}
              >
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        bg=""
                        style={{
                          backgroundColor: '#B13C36',
                          fontSize: '0.7rem',
                          padding: '0.35em 0.5em',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                        }}
                      >
                        PRODUCT
                      </Badge>
                      <span
                        className="fw-semibold text-truncate"
                        style={{ color: '#333', maxWidth: '160px' }}
                      >
                        {selectedProductVoucher.name}
                      </span>
                    </div>
                    {/* Clear Button */}
                    <i
                      className="bi bi-x-circle-fill text-muted"
                      style={{ cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.target.style.color = '#B13C36')}
                      onMouseLeave={(e) => (e.target.style.color = '#6c757d')}
                      onClick={() => setSelectedProductVoucherId(null)}
                      title="Deselect"
                    ></i>
                  </div>
                  <div
                    style={{
                      color: '#B13C36',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginTop: '6px',
                    }}
                  >
                    - {formatCurrency(selectedProductVoucher.estimatedSaving)}
                  </div>
                </div>
              </div>
            )}

            {/* Show Selected Buyer Voucher (new_buyer, repeat_buyer, follower) */}
            {selectedBuyerVoucher &&
              (() => {
                const info = voucherTypeInfo[selectedBuyerVoucher.type] || {
                  label: 'BUYER',
                  color: '#9c27b0',
                  bg: '#f3e5f5',
                };
                return (
                  <div
                    className="d-flex align-items-start gap-3 p-2 rounded-3 border-0"
                    style={{
                      backgroundColor: info.bg,
                      boxShadow: `0 2px 8px ${info.color}20`,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <Badge
                            bg=""
                            style={{
                              backgroundColor: info.color,
                              fontSize: '0.7rem',
                              padding: '0.35em 0.5em',
                              fontWeight: 600,
                              letterSpacing: '0.5px',
                            }}
                          >
                            {info.label}
                          </Badge>
                          <span
                            className="fw-semibold text-truncate"
                            style={{ color: '#333', maxWidth: '160px' }}
                          >
                            {selectedBuyerVoucher.name}
                          </span>
                        </div>
                        {/* Clear Button */}
                        <i
                          className="bi bi-x-circle-fill text-muted"
                          style={{ cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => (e.target.style.color = info.color)}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#6c757d';
                          }}
                          onClick={() => setSelectedBuyerVoucherId(null)}
                          title="Deselect"
                        ></i>
                      </div>
                      <div
                        style={{
                          color: info.color,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          marginTop: '6px',
                        }}
                      >
                        - {formatCurrency(selectedBuyerVoucher.estimatedSaving)}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {!selectedSystemVoucher &&
              !selectedProductVoucher &&
              !selectedBuyerVoucher && (
              <div
                className="text-muted small text-center py-2"
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px dashed #dee2e6',
                }}
              >
                No voucher selected
              </div>
            )}
          </div>
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
          <div className="d-flex justify-content-between mb-2" style={{ color: '#B13C36' }}>
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
            {includeGiftBox && <small className="text-muted ms-4">+{formatCurrency(11000)}</small>}
          </div>
        )}

        {currentStep < 3 && (
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              id="useCoin"
              label="Use GZCoin Available"
              checked={includeCoin}
              onChange={(e) => setIncludeCoin(e.target.checked)}
            />
            {includeCoin && orderSummary.coinEstimate > 0 && (
              <small className="text-muted ms-4">
                -{formatCurrency(orderSummary.coinEstimate)}
              </small>
            )}
          </div>
        )}

        {currentStep === 3 && includeGiftBox && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Pack in a Gift Box</span>
            <span className="fw-semibold">+{formatCurrency(11000)}</span>
          </div>
        )}

        <hr />

        <div className="d-flex justify-content-between mb-4">
          <span className="fw-bold fs-5">Total Price</span>
          <span className="fw-bold fs-5" style={{ color: '#741E20' }}>
            {formatCurrency(finalTotal)}
          </span>
        </div>

        <div className="d-flex gap-2">
          <Button
            className={`border-0 text-white ${currentStep === 1 ? 'w-100 fw-bold' : 'flex-fill fw-bold'}`}
            onClick={handleSubmit}
            disabled={
              cartItems.length === 0 || isProcessing || (currentStep === 1 && !customerInfo.address)
            }
            style={{ backgroundColor: '#B13C36' }}
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
      <style>
        {`
          .checkout-page .form-check-input:checked {
            background-color: #B13C36 !important;
            border-color: #B13C36 !important;
          }

          /* Voucher Drawer */
          .voucher-drawer-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 1040;
            animation: fadeIn 0.2s ease;
          }

          .voucher-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 480px;
            max-width: 100vw;
            background: #fafbfe;
            z-index: 1041;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .voucher-drawer.open {
            transform: translateX(0);
          }

          .voucher-drawer .drawer-handle {
            width: 40px;
            height: 4px;
            background: #dee2e6;
            border-radius: 2px;
            margin: 12px auto 0;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          .checkout-page .form-check-input:checked {
            background-color: #B13C36 !important;
            border-color: #B13C36 !important;
          }
        `}
      </style>
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
        {/* VOUCHER SELECTION DRAWER */}
        {showVoucherDrawer && (
          <div className="voucher-drawer-overlay" onClick={() => { setShowVoucherDrawer(false); setActiveSellerDrawer(null); }} />
        )}
        <div className={`voucher-drawer${showVoucherDrawer ? ' open' : ''}`}>
          {/* Drawer handle */}
          <div className="drawer-handle" />

          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ borderBottom: '1px solid #eee', background: '#fff', flexShrink: 0 }}
          >
            <div className="d-flex align-items-center gap-2">
              <i
                className="bi bi-ticket-perforated-fill"
                style={{ color: '#B13C36', fontSize: '1.2rem' }}
              ></i>
              <span className="fw-bold fs-5" style={{ color: '#2b2b2b' }}>
                Select Discount Code
              </span>
            </div>
            <button
              onClick={() => { setShowVoucherDrawer(false); setActiveSellerDrawer(null); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#888',
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div
            className="flex-grow-1"
            style={{ overflowY: 'auto', backgroundColor: '#fafbfe', padding: '1.5rem' }}
          >
            {/* Manual Code Input inside Modal */}
            <div
              className="d-flex gap-2 mb-4 p-3 rounded-3 bg-white"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <Form.Control
                type="text"
                placeholder="Enter discount code..."
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                style={{ padding: '0.6rem 1rem', fontSize: '0.95rem', borderColor: '#e4e4e4' }}
                className="border-end-0 shadow-none"
              />
              <Button
                className="border-0 text-white"
                style={{
                  backgroundColor: '#B13C36',
                  whiteSpace: 'nowrap',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                }}
                onClick={handleApplyCode}
                disabled={codeLoading || !manualCode.trim()}
              >
                {codeLoading ? <Spinner animation="border" size="sm" /> : 'Apply'}
              </Button>
            </div>
            {codeError && (
              <small className="text-danger d-block mt-[-10px] mb-3 fw-medium px-1">
                {codeError}
              </small>
            )}

            {/* List of Vouchers */}
            <div
              style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '8px' }}
              className="custom-scrollbar"
            >
              {/* Shop Vouchers — in drawer only for single-seller; multi-seller uses inline picker per group */}
              {sellerGroups
                .filter((group) => !activeSellerDrawer || activeSellerDrawer === group.sellerId)
                .map((group) => {
                  const sellerVouchers = applicableVouchers.filter(
                    (v) => (v.type === 'shop' || v.type === 'private') && v.shopId === group.sellerId,
                  );
                  if (sellerVouchers.length === 0) return null;
                const sellerSub = sellerSubtotals[group.sellerId] || 0;
                const currentVid = selectedShopVoucherBySeller[group.sellerId] || null;

                return (
                  <div key={group.sellerId} className="mb-4">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-shop me-2" style={{ color: '#B13C36' }}></i>
                      <h6 className="mb-0 fw-bold" style={{ color: '#444' }}>
                        {isMultiSeller ? group.shopName : 'Shop Vouchers'}
                      </h6>
                      <span className="ms-2 badge rounded-pill" style={{ backgroundColor: '#ffe9e6', color: '#B13C36' }}>
                        {sellerVouchers.length}
                      </span>
                    </div>
                    {sellerVouchers.map((v) => {
                      const cartOk = v.eligible && (!v.minBasketPrice || sellerSub >= v.minBasketPrice);
                      const isSel = currentVid === v._id;
                      return (
                        <div
                          key={v._id}
                          className={`d-flex align-items-center justify-content-between p-3 rounded-4 mb-3 ${!cartOk ? 'opacity-50' : 'bg-white shadow-sm'}`}
                          style={{
                            border: isSel ? '2px solid #B13C36' : '1px solid transparent',
                            cursor: cartOk ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            position: 'relative', overflow: 'hidden',
                          }}
                          onClick={() => {
                            if (!cartOk) return;
                            if (!v.isSaved) return;
                            setSelectedShopVoucherBySeller((prev) => ({
                              ...prev,
                              [group.sellerId]: isSel ? null : v._id,
                            }));
                            // Auto-close drawer after selection when opened from inline picker
                            if (activeSellerDrawer) {
                              setShowVoucherDrawer(false);
                              setActiveSellerDrawer(null);
                            }
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                              backgroundColor: '#B13C36', opacity: isSel ? 1 : 0.2,
                            }}
                          />
                          <div className="d-flex align-items-center gap-3 flex-grow-1 ps-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 54, height: 54, backgroundColor: '#fff5f0', color: '#B13C36', border: '1px solid #ffeada' }}
                            >
                              <i className="bi bi-shop fs-4"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold text-truncate" style={{ color: '#2b2b2b', fontSize: '1rem', maxWidth: 200 }}>
                                {v.name}
                              </div>
                              <div className="text-muted small mt-1">
                                {v.minBasketPrice > 0
                                  ? `Min. đơn ${formatCurrency(v.minBasketPrice)}`
                                  : 'Không yêu cầu đơn tối thiểu'}
                              </div>
                              {cartOk && v.estimatedSaving > 0 && (
                                <div className="mt-1 d-inline-block px-2 py-1 rounded"
                                  style={{ backgroundColor: '#ffe9e6', color: '#B13C36', fontSize: '0.75rem', fontWeight: 700 }}>
                                  Tiết kiệm {formatCurrency(v.estimatedSaving)}
                                </div>
                              )}
                              {!cartOk && (
                                <div className="text-danger mt-1" style={{ fontSize: '0.75rem' }}>
                                  {v.ineligibleReason || (v.minBasketPrice > 0 ? `Cần tối thiểu ${formatCurrency(v.minBasketPrice)}` : '')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ms-3 flex-shrink-0 pe-2">
                            {!v.isSaved ? (
                              <Button
                                size="sm"
                                className="fw-semibold px-3"
                                style={{ backgroundColor: '#B13C36', borderColor: '#B13C36', fontSize: '0.85rem', borderRadius: '6px' }}
                                onClick={(e) => handleSaveAndUseVoucher(e, v)}
                                disabled={!cartOk}
                              >
                                Save
                              </Button>
                            ) : (
                              <div className="form-check m-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id={`shop-v-${v._id}`}
                                  name={`shopVoucher_${group.sellerId}`}
                                  checked={isSel}
                                  disabled={!cartOk}
                                  onChange={() => {}}
                                  style={{ width: '1.4em', height: '1.4em', cursor: 'pointer', accentColor: '#B13C36' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {applicableVouchers.filter((v) => v.type === 'product').length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <h6 className="mb-0 fw-bold" style={{ color: '#444' }}>
                      Product Vouchers
                    </h6>
                    <span
                      className="ms-2 badge rounded-pill"
                      style={{ backgroundColor: '#ffe9e6', color: '#B13C36' }}
                    >
                      {applicableVouchers.filter((v) => v.type === 'product').length}
                    </span>
                  </div>
                  {applicableVouchers
                    .filter((v) => v.type === 'product')
                    .map((v) => {
                      const cartOk = voucherEligibleForCartSubtotal(v, localSubtotal);
                      return (
                        <div
                          key={v._id}
                          className={`d-flex align-items-center justify-content-between p-3 rounded-4 mb-3 ${
                            !cartOk ? 'opacity-50' : 'bg-white shadow-sm'
                          }`}
                          style={{
                            border:
                              selectedProductVoucherId === v._id
                                ? '2px solid #B13C36'
                                : '1px solid transparent',
                            cursor: cartOk ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            if (!cartOk) {
                              return;
                            }
                            if (!v.isSaved) {
                              return; // Must save first
                            }
                            setSelectedProductVoucherId(
                              selectedProductVoucherId === v._id ? null : v._id
                            );
                          }}
                        >
                          {/* Decorative edge */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4px',
                              backgroundColor: '#B13C36',
                              opacity: selectedProductVoucherId === v._id ? 1 : 0.2,
                            }}
                          ></div>

                          <div className="d-flex align-items-center gap-3 flex-grow-1 ps-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '54px',
                                height: '54px',
                                backgroundColor: '#fff5f0',
                                color: '#B13C36',
                                border: '1px solid #ffeada',
                              }}
                            >
                              <i className="bi bi-box-seam fs-4"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div
                                className="fw-bold text-truncate"
                                style={{ color: '#2b2b2b', fontSize: '1rem', maxWidth: '200px' }}
                              >
                                {v.name}
                              </div>
                              <div className="text-muted small mt-1">
                                {v.minBasketPrice > 0
                                  ? `Min. Order ${formatCurrency(v.minBasketPrice)}`
                                  : 'No minimum required'}
                              </div>
                              {cartOk && v.estimatedSaving > 0 && (
                                <div
                                  className="mt-1 d-inline-block px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: '#ffe9e6',
                                    color: '#B13C36',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Save {formatCurrency(v.estimatedSaving)}
                                </div>
                              )}
                              {!cartOk &&
                                (() => {
                                  const min = Number(v.minBasketPrice);
                                  const line =
                                    v.eligible &&
                                    !Number.isNaN(min) &&
                                    min > 0 &&
                                    localSubtotal < min
                                      ? `Requires min. order ${formatCurrency(min)} (current ${formatCurrency(localSubtotal)})`
                                      : v.ineligibleReason;
                                  return line ? (
                                    <div
                                      className="text-danger mt-1 fw-medium"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      {line}
                                    </div>
                                  ) : null;
                                })()}
                            </div>
                          </div>

                          <div className="ms-3 flex-shrink-0 text-end pe-2">
                            {!v.isSaved ? (
                              <Button
                                size="sm"
                                className="fw-semibold px-3"
                                style={{
                                  backgroundColor: '#B13C36',
                                  borderColor: '#B13C36',
                                  fontSize: '0.85rem',
                                  borderRadius: '6px',
                                }}
                                onClick={(e) => handleSaveAndUseVoucher(e, v)}
                                disabled={!cartOk}
                              >
                                Save
                              </Button>
                            ) : (
                              <div className="form-check m-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id={`prod-v-${v._id}`}
                                  name="modalProductVoucher"
                                  checked={selectedProductVoucherId === v._id}
                                  disabled={!cartOk}
                                  onChange={() => {}}
                                  style={{
                                    width: '1.4em',
                                    height: '1.4em',
                                    cursor: 'pointer',
                                    accentColor: '#B13C36',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* System Vouchers: shipping, order, VIP subscription daily */}
              {applicableVouchers.filter((v) => isSystemVoucherType(v.type)).length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <h6 className="mb-0 fw-bold" style={{ color: '#444' }}>
                      System Vouchers
                    </h6>
                    <span
                      className="ms-2 badge rounded-pill"
                      style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
                    >
                      {applicableVouchers.filter((v) => isSystemVoucherType(v.type)).length}
                    </span>
                  </div>
                  <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                    Chỉ chọn 1 mã hệ thống (freeship / giảm đơn / VIP) mỗi đơn.
                  </p>
                  {applicableVouchers
                    .filter((v) => isSystemVoucherType(v.type))
                    .map((v) => {
                      const cartOk = voucherEligibleForCartSubtotal(v, localSubtotal);
                      const isSel = selectedSystemVoucherId === v._id;
                      return (
                        <div
                          key={v._id}
                          className={`d-flex align-items-center justify-content-between p-3 rounded-4 mb-3 ${
                            !cartOk ? 'opacity-50' : 'bg-white shadow-sm'
                          }`}
                          style={{
                            border: isSel ? '2px solid #B13C36' : '1px solid transparent',
                            cursor: cartOk ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            if (!cartOk) {
                              return;
                            }
                            setSelectedSystemVoucherId((prev) => (prev === v._id ? null : v._id));
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4px',
                              backgroundColor: '#0891b2',
                              opacity: isSel ? 1 : 0.2,
                            }}
                          />
                          <div className="d-flex align-items-center gap-3 flex-grow-1 ps-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '54px',
                                height: '54px',
                                backgroundColor: '#e0f2fe',
                                color: '#0891b2',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              <i
                                className={
                                  v.type === 'system_shipping'
                                    ? 'bi bi-truck fs-4'
                                    : v.type === 'system_vip_daily'
                                      ? 'bi bi-gem fs-4'
                                      : 'bi bi-box-seam fs-4'
                                }
                              ></i>
                            </div>
                            <div className="flex-grow-1">
                              <div
                                className="fw-bold text-truncate"
                                style={{ color: '#2b2b2b', fontSize: '1rem', maxWidth: '200px' }}
                              >
                                {v.name}
                              </div>
                              <div className="text-muted small mt-1">
                                {v.minBasketPrice > 0
                                  ? `Min. Order ${formatCurrency(v.minBasketPrice)}`
                                  : 'No minimum required'}
                              </div>
                              {cartOk && v.estimatedSaving > 0 && (
                                <div
                                  className="mt-1 d-inline-block px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0891b2',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Save {formatCurrency(v.estimatedSaving)}
                                </div>
                              )}
                              {!cartOk && v.ineligibleReason && (
                                <div
                                  className="text-danger mt-1 fw-medium"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {v.ineligibleReason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ms-3 flex-shrink-0 text-end pe-2">
                            <div className="form-check m-0">
                              <input
                                type="radio"
                                className="form-check-input"
                                name="checkoutSystemVoucher"
                                checked={isSel}
                                disabled={!cartOk}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', accentColor: '#0891b2' }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Buyer Vouchers: new_buyer, repeat_buyer, follower */}
              {applicableVouchers.filter((v) =>
                ['new_buyer', 'repeat_buyer', 'follower'].includes(v.type)
              ).length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <h6 className="mb-0 fw-bold" style={{ color: '#444' }}>
                      Special Vouchers
                    </h6>
                    <span
                      className="ms-2 badge rounded-pill"
                      style={{ backgroundColor: '#f3e5f5', color: '#9c27b0' }}
                    >
                      {
                        applicableVouchers.filter((v) =>
                          ['new_buyer', 'repeat_buyer', 'follower'].includes(v.type)
                        ).length
                      }
                    </span>
                  </div>
                  {applicableVouchers
                    .filter((v) => ['new_buyer', 'repeat_buyer', 'follower'].includes(v.type))
                    .map((v) => {
                      const cartOk = voucherEligibleForCartSubtotal(v, localSubtotal);
                      const voucherTypeInfo = {
                        new_buyer: { label: 'New Buyer', icon: 'bi-person-plus' },
                        repeat_buyer: { label: 'Repeat Buyer', icon: 'bi-arrow-repeat' },
                        follower: { label: 'Follower', icon: 'bi-heart' },
                      };
                      const info = voucherTypeInfo[v.type] || { label: v.type, icon: 'bi-ticket' };
                      const isEligible = v.eligible !== false;
                      const notMetReason =
                        v.ineligibleReason ||
                        (!isEligible
                          ? v.type === 'new_buyer'
                            ? 'You already have completed orders'
                            : v.type === 'repeat_buyer'
                              ? `Complete ${v.minOrderCount || 2} orders to unlock`
                              : 'Follow this shop to unlock'
                          : !cartOk && v.minBasketPrice > 0
                            ? `Min. order ${formatCurrency(v.minBasketPrice)} (current ${formatCurrency(localSubtotal)})`
                            : null);
                      return (
                        <div
                          key={v._id}
                          className={`d-flex align-items-center justify-content-between p-3 rounded-4 mb-3 ${
                            !isEligible || !cartOk ? 'opacity-50' : 'bg-white shadow-sm'
                          }`}
                          style={{
                            border:
                              selectedBuyerVoucherId === v._id
                                ? '2px solid #B13C36'
                                : '1px solid transparent',
                            cursor: isEligible && cartOk ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            if (!isEligible || !cartOk) {
                              return;
                            }
                            if (!v.isSaved) {
                              return;
                            }
                            setSelectedBuyerVoucherId(
                              selectedBuyerVoucherId === v._id ? null : v._id
                            );
                          }}
                        >
                          {/* Decorative edge */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4px',
                              backgroundColor: '#9c27b0',
                              opacity: selectedBuyerVoucherId === v._id ? 1 : 0.2,
                            }}
                          ></div>

                          <div className="d-flex align-items-center gap-3 flex-grow-1 ps-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '54px',
                                height: '54px',
                                backgroundColor: '#f3e5f5',
                                color: '#9c27b0',
                                border: '1px solid #e1bee7',
                              }}
                            >
                              <i className={`bi ${info.icon} fs-4`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div
                                className="fw-bold text-truncate"
                                style={{ color: '#2b2b2b', fontSize: '1rem', maxWidth: '200px' }}
                              >
                                {v.name}
                              </div>
                              <div className="text-muted small mt-1">
                                {v.minBasketPrice > 0
                                  ? `Min. Order ${formatCurrency(v.minBasketPrice)}`
                                  : 'No minimum required'}
                              </div>
                              {cartOk && isEligible && v.estimatedSaving > 0 && (
                                <div
                                  className="mt-1 d-inline-block px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: '#f3e5f5',
                                    color: '#9c27b0',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Save {formatCurrency(v.estimatedSaving)}
                                </div>
                              )}
                              {(!cartOk || !isEligible) && notMetReason && (
                                <div
                                  className="mt-1 d-inline-flex align-items-center gap-1 px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: '#fff3cd',
                                    color: '#856404',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <i className="bi bi-info-circle"></i>
                                  {notMetReason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ms-3 flex-shrink-0 text-end pe-2">
                            {!v.isSaved ? (
                              <Button
                                size="sm"
                                className="fw-semibold px-3"
                                style={{
                                  backgroundColor: isEligible && cartOk ? '#9c27b0' : '#6c757d',
                                  borderColor: isEligible && cartOk ? '#9c27b0' : '#6c757d',
                                  fontSize: '0.85rem',
                                  borderRadius: '6px',
                                }}
                                onClick={(e) => handleSaveAndUseVoucher(e, v)}
                                disabled={!isEligible || !cartOk}
                              >
                                {!isEligible ? 'Locked' : !cartOk ? 'Locked' : 'Save'}
                              </Button>
                            ) : (
                              <div className="form-check m-0">
                                <input
                                  type="radio"
                                  className="form-check-input"
                                  checked={selectedBuyerVoucherId === v._id}
                                  onChange={() => {}}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid #eee', background: '#fff', flexShrink: 0 }}
          >
            <Button
              className="w-100 py-2 fw-bold border-0 text-white"
              style={{
                backgroundColor: '#B13C36',
                borderRadius: '8px',
                fontSize: '1.05rem',
              }}
              onClick={() => setShowVoucherDrawer(false)}
            >
              CONFIRM
            </Button>
          </div>
        </div>
      </Container>

      <Modal
        show={showCheckoutErrorModal}
        onHide={() => setShowCheckoutErrorModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Checkout unavailable</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">{checkoutErrorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCheckoutErrorModal(false)}>
            Stay here
          </Button>
          <Button variant="primary" onClick={handleCheckoutErrorGoHome}>
            Go back home and keep shopping
          </Button>
        </Modal.Footer>
      </Modal>

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
                      autoComplete="name"
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
                      autoComplete="tel"
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

              <Form.Group className="mb-3 position-relative">
                <Form.Control
                  type="text"
                  placeholder="Street Name"
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressFormChange}
                  onFocus={() => setAddressSuggestionField('street')}
                  onBlur={() => setTimeout(() => setAddressSuggestionField(null), 150)}
                  autoComplete="address-line1"
                  className="py-2"
                />
                <AddressAutocompleteDropdown
                  show={showAddressSuggestions && addressSuggestionField === 'street'}
                  suggestions={addressSuggestions}
                  onSelect={handleAddressSuggestionSelect}
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Specific Address"
                  name="details"
                  value={addressForm.details}
                  onChange={handleAddressFormChange}
                  onFocus={() => setAddressSuggestionField('details')}
                  onBlur={() => setTimeout(() => setAddressSuggestionField(null), 150)}
                  autoComplete="address-line2"
                  className="py-2"
                />
                <AddressAutocompleteDropdown
                  show={showAddressSuggestions && addressSuggestionField === 'details'}
                  suggestions={addressSuggestions}
                  onSelect={handleAddressSuggestionSelect}
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
            className="px-4 py-2 border-0 text-white fw-semibold"
            style={{ backgroundColor: '#B13C36' }}
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
