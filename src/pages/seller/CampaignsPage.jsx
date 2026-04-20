import { useState, useEffect, useMemo } from 'react';
import { Form, message, Spin, Input, Button, Modal, Select } from 'antd';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { campaignService } from '../../services/api/campaignService';
import { searchSellers } from '../../services/api/userService';
import { productService } from '../../services/api';
import styles from '@assets/styles/seller/Campaigns.module.css';
import {
  CampaignHeader,
  OverviewStats,
  Toolbar,
  CampaignTable,
  EmptyState,
  CampaignDrawer,
  CampaignDetailDrawer,
  campaignColumns,
  variantColumns,
} from '../../components/seller/CampaignComponents';

/** Product models use `tierIndex` from API; support legacy `tier_index`. */
const formatSellerOptionLabel = (s) => {
  const shop = s.shopName || s.fullName || 'Shop';
  const extra = [s.email, s.phone].filter(Boolean).join(' · ');
  return extra ? `${shop} — ${extra}` : shop;
};

const modelTierIndex = (model) => {
  if (!model) {
    return [];
  }
  if (Array.isArray(model.tierIndex)) {
    return model.tierIndex;
  }
  if (Array.isArray(model.tier_index)) {
    return model.tier_index;
  }
  return [];
};

const CampaignsPage = ({ mode = 'seller' }) => {
  const isAdminMode = mode === 'admin';

  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  /** Admin: lọc campaign theo seller (id từ autocomplete) */
  const [selectedSeller, setSelectedSeller] = useState({ id: '', label: '' });
  const [sellerOptions, setSellerOptions] = useState([]);
  const [sellerSearchLoading, setSellerSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignGroup, setSelectedCampaignGroup] = useState(null);
  const [form] = Form.useForm();
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Overview date range (default: last 7 days)
  const [overviewRange, setOverviewRange] = useState([
    dayjs().subtract(6, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);

  // Product selection states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Multi-step states (Shopee-style)
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignInfo, setCampaignInfo] = useState({
    title: '',
    type: 'flash_sale', // Default campaign type
    timeSlot: null,
    startTime: null,
    endTime: null,
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [variantConfigs, setVariantConfigs] = useState({});
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);
  const [productSearchText, setProductSearchText] = useState('');

  /** Admin: modal dừng campaign — bắt buộc lý do */
  const [adminStopOpen, setAdminStopOpen] = useState(false);
  const [adminStopCampaignId, setAdminStopCampaignId] = useState(null);
  const [adminStopReason, setAdminStopReason] = useState('');
  const [adminStopLoading, setAdminStopLoading] = useState(false);

  /** Admin: modal cảnh cáo seller */
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnCampaignId, setWarnCampaignId] = useState(null);
  const [warnTitle, setWarnTitle] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = productSearchText.trim().toLowerCase();
    if (!q) {
return products;
}
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q)
    );
  }, [products, productSearchText]);

  const variantTableData = useMemo(() => {
    const data = selectedProducts.flatMap((product) => {
      if (!product.models) {
        return [];
      }
      const seenSkus = new Set();
      const uniqueModels = product.models.filter((model) => {
        if (!model.sku || seenSkus.has(model.sku)) {
          return false;
        }
        seenSkus.add(model.sku);
        return true;
      });
      return uniqueModels.map((model) => {
        const key = `${product._id}_${model.sku}`;
        const config = variantConfigs[key] || {};
        return { key, product, model, config };
      });
    });
    return data;
  }, [selectedProducts, variantConfigs]);

  const overviewStats = useMemo(() => {
    const [from, to] = overviewRange;
    const rangeMs = to.diff(from, 'millisecond');
    const prevFrom = from.subtract(rangeMs + 1, 'millisecond');
    const prevTo = from.subtract(1, 'millisecond');

    const inRange = (fs, start, end) => {
      const s = dayjs(fs.startAt);
      return s.isAfter(start) && s.isBefore(end.add(1, 'millisecond'));
    };

    const calcMetrics = (list) => ({
      revenue: list.reduce((s, fs) => s + (fs.soldQuantity || 0) * (fs.salePrice || 0), 0),
      orders: list.reduce((s, fs) => s + (fs.soldQuantity || 0), 0),
      buyers: list.reduce((s, fs) => s + (fs.soldQuantity || 0), 0),
      total: list.reduce((s, fs) => s + (fs.totalQuantity || 0), 0),
    });

    const current = calcMetrics(campaigns.filter((fs) => inRange(fs, from, to)));
    const prev = calcMetrics(campaigns.filter((fs) => inRange(fs, prevFrom, prevTo)));

    const pctChange = (cur, pre) => {
      if (pre === 0) {
return cur > 0 ? 100 : 0;
}
      return Math.round(((cur - pre) / pre) * 10000) / 100;
    };

    const avgSellRate =
      current.total > 0 ? Math.round((current.orders / current.total) * 10000) / 100 : 0;
    const prevSellRate = prev.total > 0 ? Math.round((prev.orders / prev.total) * 10000) / 100 : 0;

    return {
      revenue: current.revenue,
      revenuePct: pctChange(current.revenue, prev.revenue),
      orders: current.orders,
      ordersPct: pctChange(current.orders, prev.orders),
      buyers: current.buyers,
      buyersPct: pctChange(current.buyers, prev.buyers),
      sellRate: avgSellRate,
      sellRatePct: pctChange(avgSellRate, prevSellRate),
    };
  }, [campaigns, overviewRange]);

  const mergedSellerSelectOptions = useMemo(() => {
    if (selectedSeller.id && !sellerOptions.some((o) => o.value === selectedSeller.id)) {
      return [
        {
          value: selectedSeller.id,
          label: selectedSeller.label || selectedSeller.id,
        },
        ...sellerOptions,
      ];
    }
    return sellerOptions;
  }, [selectedSeller.id, selectedSeller.label, sellerOptions]);

  const debouncedSellerSearch = useMemo(
    () =>
      debounce((searchText) => {
        const q = (searchText || '').trim();
        if (q.length < 2) {
          setSellerOptions([]);
          setSellerSearchLoading(false);
          return;
        }
        setSellerSearchLoading(true);
        searchSellers(q, 20)
          .then((rows) => {
            setSellerOptions(
              (rows || []).map((s) => ({
                value: s._id,
                label: formatSellerOptionLabel(s),
              })),
            );
          })
          .catch(() => setSellerOptions([]))
          .finally(() => setSellerSearchLoading(false));
      }, 320),
    [],
  );

  useEffect(
    () => () => {
      debouncedSellerSearch.cancel();
    },
    [debouncedSellerSearch],
  );

  // ── Data fetching ─────────────────────────────────────────────────────────
  /** @param {string} [sellerIdExplicit] - truyền khi vừa đổi seller để tránh stale state */
  const fetchCampaigns = async (page = 1, limit = 10, sellerIdExplicit) => {
    try {
      setLoading(true);
      const params = { page, limit };
      const sid =
        sellerIdExplicit !== undefined && sellerIdExplicit !== null
          ? String(sellerIdExplicit).trim()
          : selectedSeller.id.trim();
      if (isAdminMode && sid) {
        params.sellerId = sid;
      }
      const res = await campaignService.getAll(params);

      let campaignsData = [];
      let pageInfo = { page, limit, total: 0 };

      if (Array.isArray(res)) {
        // Backend trả về array trực tiếp (legacy)
        campaignsData = res;
        pageInfo.total = res.length;
      } else if (res?.data) {
        // Backend trả về object với data đã được group
        campaignsData = Array.isArray(res.data) ? res.data : [];
        pageInfo = {
          page: res.page ?? page,
          limit: res.limit ?? limit,
          total: res.total ?? 0,
        };
      }

      setCampaigns(campaignsData);
      setPagination(pageInfo);
    } catch (error) {
      message.error(`Failed to fetch campaigns: ${error?.message || 'Unknown error'}`);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (campaignId) => {
    try {
      setStatsLoading(true);
      const res = await campaignService.getStats(campaignId);
      setStats(res.data ?? res);
    } catch (error) {
      message.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await productService.getMyProducts({ page: 1, limit: 100, status: 'active' });

      let productsData = [];
      if (Array.isArray(res)) {
        productsData = res;
      } else if (res?.data) {
        productsData = Array.isArray(res.data) ? res.data : [];
      }

      setProducts(productsData);
    } catch (error) {
      message.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (isModalVisible) {
      fetchProducts();
    }
  }, [isModalVisible]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await campaignService.delete(id);
      message.success('Flash sale deleted successfully');
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error('Failed to delete flash sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (group) => {
    try {
      setLoading(true);
      await Promise.all(group.variants.map((r) => campaignService.delete(r._id)));
      message.success(`Deleted campaign with ${group.variants.length} variant(s)`);
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCampaign = async (group) => {
    if (group?.status === 'cancelled') {
      message.warning('Campaign đã bị dừng hoặc hủy — không thể chỉnh sửa.');
      return;
    }
    setIsDetailModalVisible(false);
    setCampaignInfo({
      title: group.campaignTitle || '',
      type: group.type || group.variants?.[0]?.type || 'flash_sale',
      timeSlot: null,
      startTime: dayjs(group.startAt),
      endTime: dayjs(group.endAt),
    });
    const productId = typeof group.productId === 'object' ? group.productId._id : group.productId;
    if (!productId) {
      message.error('Product information not found');
      return;
    }

    try {
      const response = await productService.getById(productId);
      const fullProduct = response.data || response;
      if (!fullProduct?.models) {
        message.error('Product has no variants');
        return;
      }

      setSelectedProducts([fullProduct]);
      const configs = {};
      const keys = [];

      group.variants.forEach((record) => {
        const variantModel = fullProduct.models.find((m) => m.sku === record.variantSku);
        if (variantModel) {
          const k = `${fullProduct._id}_${variantModel.sku}`;
          configs[k] = {
            productId: fullProduct._id,
            variantSku: variantModel.sku,
            tierIndex: modelTierIndex(variantModel),
            originalPrice: variantModel.price,
            salePrice: record.salePrice,
            discountPercent: Math.round(
              ((variantModel.price - record.salePrice) / variantModel.price) * 100
            ),
            quantity: record.totalQuantity,
            stock: variantModel.stock,
            purchaseLimit: record.purchaseLimit || 1,
            enabled: true,
            _campaignId: record._id,
          };
          keys.push(k);
        }
      });

      setVariantConfigs(configs);
      setSelectedVariantKeys(keys);
      setSelectedCampaign({ isCampaign: true, variants: group.variants });
      setCurrentStep(0);
      setIsModalVisible(true);
    } catch (error) {
      message.error(`Failed to load product: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEdit = async (record) => {
    if (record?.status === 'cancelled') {
      message.warning('Campaign đã bị dừng hoặc hủy — không thể chỉnh sửa.');
      return;
    }
    setIsDetailModalVisible(false);
    setSelectedCampaign(record);
    setCampaignInfo({
      title: record.campaignTitle || `Flash Sale - ${record.productId?.name || 'Product'}`,
      type: record.type || 'flash_sale',
      timeSlot: null,
      startTime: dayjs(record.startAt),
      endTime: dayjs(record.endAt),
    });
    const productId =
      typeof record.productId === 'object' ? record.productId._id : record.productId;
    if (!productId) {
      message.error('Product information not found');
      return;
    }

    try {
      const response = await productService.getById(productId);
      const fullProduct = response.data || response;
      if (!fullProduct || !fullProduct.models) {
        message.error('Product has no variants');
        return;
      }

      setSelectedProducts([fullProduct]);
      const variantModel = fullProduct.models.find(
        (m) =>
          m.sku === record.variantSku ||
          JSON.stringify(modelTierIndex(m)) === JSON.stringify(record.tierIndex)
      );

      if (variantModel) {
        const key = `${fullProduct._id}_${variantModel.sku}`;
        setSelectedCampaign({ ...record, variantSku: variantModel.sku });
        setVariantConfigs({
          [key]: {
            productId: fullProduct._id,
            variantSku: variantModel.sku,
            tierIndex: modelTierIndex(variantModel),
            originalPrice: variantModel.price,
            salePrice: record.salePrice,
            discountPercent: Math.round(
              ((variantModel.price - record.salePrice) / variantModel.price) * 100
            ),
            quantity: record.totalQuantity,
            stock: variantModel.stock,
            purchaseLimit: record.purchaseLimit || 1,
            enabled: true,
            _campaignId: record._id,
          },
        });
        setSelectedVariantKeys([key]);
      } else {
        message.warning('Matching variant not found. Please re-select.');
      }
      setCurrentStep(0);
      setIsModalVisible(true);
    } catch (error) {
      message.error(`Failed to load product details: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedCampaign(record);
    setSelectedCampaignGroup(null);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    fetchStats(record._id);
  };

  // Lấy campaign ID từ group hoặc record đơn lẻ
  const resolveCampaignId = (group, record) => {
    if (group?._id) {
return { id: group._id, status: group.status };
}
    if (record?._id) {
return { id: record._id, status: record.status };
}
    return null;
  };

  const handlePause = async (group, record) => {
    const resolved = resolveCampaignId(group, record);
    if (!resolved) {
return;
}
    try {
      await campaignService.pause(resolved.id);
      message.success('Campaign paused successfully');
      setIsDetailModalVisible(false);
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error(error?.message || 'Failed to pause campaign');
    }
  };

  const openWarnModalForGroup = (group) => {
    const resolved = resolveCampaignId(group, null);
    if (!resolved?.id) {
      message.error('Không xác định được campaign');
      return;
    }
    setWarnCampaignId(resolved.id);
    setWarnTitle('');
    setWarnMessage('');
    setWarnOpen(true);
  };

  const submitWarnSeller = async () => {
    const m = warnMessage.trim();
    if (m.length < 10) {
      message.warning('Nội dung cảnh cáo cần ít nhất 10 ký tự');
      return;
    }
    if (!warnCampaignId) {
      return;
    }
    try {
      setWarnLoading(true);
      await campaignService.warnSeller(warnCampaignId, {
        message: m,
        title: warnTitle.trim() || undefined,
      });
      message.success('Đã gửi cảnh cáo tới seller (thông báo + email nếu cấu hình)');
      setWarnOpen(false);
    } catch (error) {
      message.error(error?.message || 'Gửi cảnh cáo thất bại');
    } finally {
      setWarnLoading(false);
    }
  };

  const submitAdminStop = async () => {
    const t = adminStopReason.trim();
    if (t.length < 10) {
      message.warning('Vui lòng nhập lý do dừng campaign (tối thiểu 10 ký tự)');
      return;
    }
    if (!adminStopCampaignId) {
      return;
    }
    try {
      setAdminStopLoading(true);
      await campaignService.stop(adminStopCampaignId, { reason: t });
      message.success('Đã dừng campaign và thông báo cho seller');
      setAdminStopOpen(false);
      setAdminStopReason('');
      setAdminStopCampaignId(null);
      setIsDetailModalVisible(false);
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error(error?.message || 'Không thể dừng campaign');
    } finally {
      setAdminStopLoading(false);
    }
  };

  const handleStop = async (group, record) => {
    const resolved = resolveCampaignId(group, record);
    if (!resolved) {
      return;
    }
    if (isAdminMode) {
      setAdminStopCampaignId(resolved.id);
      setAdminStopReason('');
      setAdminStopOpen(true);
      return;
    }
    try {
      await campaignService.stop(resolved.id);
      message.success('Campaign stopped successfully');
      setIsDetailModalVisible(false);
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error(error?.message || 'Failed to stop campaign');
    }
  };

  const handleResume = async (group, record) => {
    const resolved = resolveCampaignId(group, record);
    if (!resolved) {
return;
}
    try {
      await campaignService.resume(resolved.id);
      message.success('Campaign resumed successfully');
      setIsDetailModalVisible(false);
      fetchCampaigns(pagination.page);
    } catch (error) {
      message.error(error?.message || 'Failed to resume campaign');
    }
  };

  const handleViewCampaign = (group) => {
    setSelectedCampaignGroup(group);
    setSelectedCampaign((group.variants || group.records)?.[0]);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    setStats(null);
  };

  const handleOpenCreateModal = () => {
    if (isAdminMode) {
      return;
    }
    setSelectedCampaign(null);
    setCurrentStep(0);
    setCampaignInfo({ title: '', type: 'flash_sale', timeSlot: null, startTime: null, endTime: null });
    setSelectedProducts([]);
    setVariantConfigs({});
    setSelectedVariantKeys([]);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedCampaign(null);
    setCurrentStep(0);
    setCampaignInfo({ title: '', type: 'flash_sale', timeSlot: null, startTime: null, endTime: null });
    setSelectedProducts([]);
    setVariantConfigs({});
    setSelectedVariantKeys([]);
  };

  const handleAddProduct = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      return;
    }
    if (selectedProducts.find((p) => p._id === productId)) {
      message.warning('Product already added');
      return;
    }

    setSelectedProducts((prev) => [...prev, product]);

    if (product.models && Array.isArray(product.models)) {
      const configs = {};
      product.models.forEach((model) => {
        if (!model.sku) {
          return;
        }
        const key = `${productId}_${model.sku}`;
        configs[key] = {
          productId,
          variantSku: model.sku,
          tierIndex: modelTierIndex(model),
          originalPrice: model.price,
          salePrice: Math.round(model.price * 0.8),
          discountPercent: 20,
          quantity: model.stock,
          stock: model.stock,
          purchaseLimit: 5,
          enabled: true,
        };
      });
      setVariantConfigs((prev) => ({ ...prev, ...configs }));
    } else {
      message.warning('This product has no variants (models)');
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
    setVariantConfigs((prev) => {
      const newConfigs = { ...prev };
      Object.keys(newConfigs).forEach((key) => {
        if (key.startsWith(productId)) {
delete newConfigs[key];
}
      });
      return newConfigs;
    });
  };

  const handleRemoveVariant = async (variantKey) => {
    const config = variantConfigs[variantKey];
    if (!config) {
return;
}
    const pid = config.productId;

    const applyLocalRemove = () => {
      setVariantConfigs((prev) => {
        const next = { ...prev };
        delete next[variantKey];
        const stillHas = Object.values(next).some((c) => c.productId === pid);
        if (!stillHas) {
          queueMicrotask(() =>
            setSelectedProducts((sp) => sp.filter((p) => p._id !== pid))
          );
        }
        return next;
      });
      setSelectedVariantKeys((prev) => prev.filter((k) => k !== variantKey));
    };

    if (config._campaignId) {
      try {
        setLoading(true);
        await campaignService.delete(config._campaignId);
        message.success('Variant removed from flash sale');
        applyLocalRemove();
        fetchCampaigns(pagination.page);
      } catch (error) {
        message.error('Failed to remove variant');
      } finally {
        setLoading(false);
      }
    } else {
      applyLocalRemove();
    }
  };

  const updateVariantConfig = (key, field, value) => {
    setVariantConfigs((prev) => {
      const row = prev[key];
      if (!row) {
return prev;
}
      const list = row.originalPrice;
      const listOk = typeof list === 'number' && list > 0;
      return {
        ...prev,
        [key]: {
          ...row,
          [field]: value,
          ...(field === 'salePrice' && listOk
            ? { discountPercent: Math.round((1 - value / list) * 100) }
            : {}),
          ...(field === 'discountPercent' && listOk
            ? { salePrice: Math.round(list * (1 - value / 100)) }
            : {}),
        },
      };
    });
  };

  const handleBulkUpdate = (field, value) => {
    if (selectedVariantKeys.length === 0) {
      message.warning('Please select at least one variant');
      return;
    }
    selectedVariantKeys.forEach((key) => updateVariantConfig(key, field, value));
    message.success(`Updated ${selectedVariantKeys.length} variant(s)`);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmitCampaign = async () => {
    try {
      setLoading(true);

      // Validate
      if (!campaignInfo.title?.trim()) {
        message.error('Please enter a campaign title');
        setLoading(false);
        return;
      }
      if (!campaignInfo.startTime || !campaignInfo.endTime) {
        message.error('Please select start and end time');
        setLoading(false);
        return;
      }
      if (!dayjs.isDayjs(campaignInfo.startTime) || !dayjs.isDayjs(campaignInfo.endTime)) {
        message.error('Error: Invalid time. Please go back to Step 1 and re-select.');
        setCurrentStep(0);
        setLoading(false);
        return;
      }
      if (campaignInfo.endTime.isBefore(campaignInfo.startTime)) {
        message.error('End time must be after start time');
        setLoading(false);
        return;
      }
      if (!selectedCampaign && campaignInfo.startTime.isBefore(dayjs().subtract(1, 'minute'))) {
        message.error('Start time cannot be in the past');
        setLoading(false);
        return;
      }
      if (selectedProducts.length === 0) {
        message.error('Please add at least one product');
        setLoading(false);
        return;
      }

      const enabledVariants = Object.entries(variantConfigs)
        .filter(([key]) => {
          if (selectedCampaign) {
            return true;
          }
          if (selectedVariantKeys.length > 0) {
            return selectedVariantKeys.includes(key);
          }
          return true;
        })
        .map(([_, config]) => config);

      if (enabledVariants.length === 0) {
        message.error('Please select at least one variant');
        setLoading(false);
        return;
      }

      // EDIT CAMPAIGN MODE
      if (selectedCampaign?.isCampaign) {
        await Promise.all(
          enabledVariants.map((variant) => {
            if (!variant._campaignId) {
return Promise.resolve();
}
            return campaignService.update(variant._campaignId, {
              salePrice: variant.salePrice,
              totalQuantity: variant.quantity,
              purchaseLimit: variant.purchaseLimit,
              startAt: campaignInfo.startTime.toISOString(),
              endAt: campaignInfo.endTime.toISOString(),
              campaignTitle: campaignInfo.title,
            });
          })
        );
        message.success(`Campaign updated (${enabledVariants.length} variant(s))`);
        handleCloseModal();
        fetchCampaigns(pagination.page);
        return;
      }

      // EDIT SINGLE MODE
      if (selectedCampaign) {
        if (enabledVariants.length !== 1) {
          message.warning('Edit mode only supports 1 variant.');
          setLoading(false);
          return;
        }
        const variant = enabledVariants[0];
        const isSameVariant =
          variant.variantSku === selectedCampaign.variantSku ||
          (!variant.variantSku && !selectedCampaign.variantSku);
        if (!isSameVariant) {
          message.warning('Cannot change variant in edit mode.');
          setLoading(false);
          return;
        }

        await campaignService.update(selectedCampaign._id, {
          salePrice: variant.salePrice,
          totalQuantity: variant.quantity,
          purchaseLimit: variant.purchaseLimit,
          startAt: campaignInfo.startTime.toISOString(),
          endAt: campaignInfo.endTime.toISOString(),
          campaignTitle: campaignInfo.title,
        });
        message.success('Flash sale updated successfully');
        handleCloseModal();
        fetchCampaigns(pagination.page);
        return;
      }

      // CREATE MODE
      const variantsByProduct = enabledVariants.reduce((acc, variant) => {
        const pid = variant.productId;
        if (!acc[pid]) {
acc[pid] = [];
}
        acc[pid].push(variant);
        return acc;
      }, {});

      await Promise.all(
        Object.entries(variantsByProduct).map(([productId, variants]) =>
          campaignService.createBatch({
            productId,
            campaignTitle: campaignInfo.title,
            type: campaignInfo.type || 'flash_sale', // Pass campaign type
            startAt: campaignInfo.startTime.toISOString(),
            endAt: campaignInfo.endTime.toISOString(),
            variants: variants.map((v) => {
              const item = {
                variantSku: v.variantSku,
                salePrice: v.salePrice,
                totalQuantity: v.quantity,
                purchaseLimit: v.purchaseLimit,
              };
              if (v.tierIndex) {
item.tierIndex = v.tierIndex;
}
              return item;
            }),
          })
        )
      );

      message.success(
        `Created ${Object.keys(variantsByProduct).length} campaign(s) with ${enabledVariants.length} variant(s) successfully`
      );
      handleCloseModal();
      fetchCampaigns(pagination.page);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
      message.error(
        selectedCampaign
          ? `Failed to update flash sale: ${errorMsg}`
          : `Failed to create flash sale campaign: ${errorMsg}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered & grouped data ───────────────────────────────────────────────
  // Backend trả về campaigns đã được group sẵn
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((item) => {
        const searchLower = searchText.toLowerCase();
        const sellerLabel =
          typeof item.sellerId === 'object' && item.sellerId
            ? `${item.sellerId.shopName || ''} ${item.sellerId.fullName || ''} ${item.sellerId.email || ''}`
            : '';
        const matchesSearch =
          !searchLower ||
          item.productId?.name?.toLowerCase().includes(searchLower) ||
          item.campaignTitle?.toLowerCase().includes(searchLower) ||
          sellerLabel.toLowerCase().includes(searchLower);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'expired'
            ? item.status === 'expired' || item.status === 'ended'
            : statusFilter === 'pending'
              ? item.status === 'pending' || item.status === 'upcoming'
              : item.status === statusFilter);

        let matchesDate = true;
        if (dateRangeFilter?.[0] && dateRangeFilter?.[1]) {
          const itemStart = dayjs(item.startAt);
          const itemEnd = dayjs(item.endAt);
          const filterStart = dateRangeFilter[0].startOf('day');
          const filterEnd = dateRangeFilter[1].endOf('day');
          matchesDate = itemStart.isBefore(filterEnd) && itemEnd.isAfter(filterStart);
        }

        // Filter by campaign type
        const matchesType = typeFilter === 'all' || item.type === typeFilter;

        return matchesSearch && matchesStatus && matchesDate && matchesType;
      }),
    [campaigns, searchText, statusFilter, typeFilter, dateRangeFilter]
  );

  // Backend trả về dữ liệu đã group, dùng trực tiếp
  const groupedCampaigns = filteredCampaigns;

  // ── Table handlers ───────────────────────────────────────────────────────
  const handleTableChange = (newPagination) =>
    fetchCampaigns(newPagination.current, newPagination.pageSize);
  const hasActiveFilters =
    searchText ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    dateRangeFilter ||
    (isAdminMode && selectedSeller.id.trim());

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <CampaignHeader
        groupedCampaigns={groupedCampaigns}
        onCreateClick={handleOpenCreateModal}
        showCreateButton={!isAdminMode}
        title={isAdminMode ? 'Flash Sale — Quản trị toàn hệ thống' : undefined}
        description={
          isAdminMode ? (
            <>
              Giám sát, tạm dừng hoặc gỡ deal: chỉ seller tạo/sửa giá trong trang shop — đúng thông lệ sàn.
            </>
          ) : undefined
        }
      />

      {!isAdminMode && (
        <OverviewStats
          overviewRange={overviewRange}
          setOverviewRange={setOverviewRange}
          overviewStats={overviewStats}
        />
      )}

      {isAdminMode && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Lọc theo seller</span>
          <Select
            showSearch
            allowClear
            placeholder="Tìm theo tên shop, email hoặc số điện thoại…"
            style={{ minWidth: 280, maxWidth: 480, flex: '1 1 280px' }}
            filterOption={false}
            loading={sellerSearchLoading}
            onSearch={(t) => debouncedSellerSearch(t)}
            notFoundContent={
              sellerSearchLoading ? (
                <Spin size="small" />
              ) : (
                <span style={{ color: '#64748b', fontSize: 13 }}>
                  Gõ ít nhất 2 ký tự để tìm seller.
                </span>
              )
            }
            value={selectedSeller.id || undefined}
            options={mergedSellerSelectOptions}
            onChange={(value, option) => {
              if (!value) {
                setSelectedSeller({ id: '', label: '' });
                setSellerOptions([]);
                fetchCampaigns(1, pagination.limit, '');
                return;
              }
              const label =
                typeof option?.label === 'string'
                  ? option.label
                  : mergedSellerSelectOptions.find((o) => o.value === value)?.label || String(value);
              setSelectedSeller({ id: value, label });
              fetchCampaigns(1, pagination.limit, value);
            }}
          />
        </div>
      )}

      <Toolbar
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        campaigns={campaigns}
      />

      <Spin spinning={loading}>
        {filteredCampaigns.length > 0 || loading ? (
          <CampaignTable
            groupedCampaigns={groupedCampaigns}
            pagination={pagination}
            loading={loading}
            campaignColumns={campaignColumns(
              handleViewCampaign,
              handleEditCampaign,
              handleDeleteCampaign,
              {
                showSeller: isAdminMode,
                moderationOnly: isAdminMode,
                onWarnSeller: isAdminMode ? openWarnModalForGroup : undefined,
              }
            )}
            variantColumns={variantColumns(handleEdit, handleDelete, { moderationOnly: isAdminMode })}
            handleTableChange={handleTableChange}
            handleViewCampaign={handleViewCampaign}
            handleViewDetail={handleViewDetail}
          />
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onCreateClick={handleOpenCreateModal}
            showCreateCta={!isAdminMode}
          />
        )}
      </Spin>

      {!isAdminMode && (
        <CampaignDrawer
          open={isModalVisible}
          onClose={handleCloseModal}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          selectedCampaign={selectedCampaign}
          campaignInfo={campaignInfo}
          setCampaignInfo={setCampaignInfo}
          selectedProducts={selectedProducts}
          variantConfigs={variantConfigs}
          selectedVariantKeys={selectedVariantKeys}
          setSelectedVariantKeys={setSelectedVariantKeys}
          productSearchText={productSearchText}
          setProductSearchText={setProductSearchText}
          filteredProducts={filteredProducts}
          variantTableData={variantTableData}
          productsLoading={productsLoading}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
          onUpdateVariantConfig={updateVariantConfig}
          onBulkUpdate={handleBulkUpdate}
          onRemoveVariant={handleRemoveVariant}
          onSubmit={handleSubmitCampaign}
          loading={loading}
        />
      )}

      <CampaignDetailDrawer
        open={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedCampaignGroup(null);
        }}
        selectedCampaign={selectedCampaign}
        selectedCampaignGroup={selectedCampaignGroup}
        stats={stats}
        statsLoading={statsLoading}
        onEditCampaign={handleEditCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPause={handlePause}
        onStop={handleStop}
        onResume={handleResume}
        moderationOnly={isAdminMode}
        onWarnSeller={isAdminMode ? openWarnModalForGroup : undefined}
      />

      {isAdminMode && (
        <>
          <Modal
            title="Dừng campaign — bắt buộc lý do"
            open={adminStopOpen}
            onOk={submitAdminStop}
            onCancel={() => {
              setAdminStopOpen(false);
              setAdminStopReason('');
              setAdminStopCampaignId(null);
            }}
            confirmLoading={adminStopLoading}
            okText="Xác nhận dừng"
            cancelText="Hủy"
            width={520}
          >
            <p style={{ marginBottom: 12, color: '#475569', fontSize: 14 }}>
              Seller sẽ nhận thông báo trong app và email (nếu hệ thống email đã cấu hình). Lý do được lưu
              để đối soát.
            </p>
            <Input.TextArea
              rows={5}
              placeholder="Nhập lý do dừng campaign (tối thiểu 10 ký tự)…"
              value={adminStopReason}
              onChange={(e) => setAdminStopReason(e.target.value)}
              maxLength={4000}
              showCount
            />
          </Modal>

          <Modal
            title="Cảnh cáo seller (vi phạm campaign)"
            open={warnOpen}
            onOk={submitWarnSeller}
            onCancel={() => {
              setWarnOpen(false);
              setWarnTitle('');
              setWarnMessage('');
              setWarnCampaignId(null);
            }}
            confirmLoading={warnLoading}
            okText="Gửi cảnh cáo"
            cancelText="Hủy"
            width={560}
          >
            <p style={{ marginBottom: 8, color: '#475569', fontSize: 14 }}>
              Gửi thông báo trong app và email tới chủ shop. Nội dung tối thiểu 10 ký tự.
            </p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Tiêu đề (tuỳ chọn)</div>
              <Input
                placeholder="VD: Cảnh cáo nội dung flash sale"
                value={warnTitle}
                onChange={(e) => setWarnTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Nội dung chi tiết</div>
              <Input.TextArea
                rows={6}
                placeholder="Mô tả vi phạm, yêu cầu khắc phục…"
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                maxLength={4000}
                showCount
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

CampaignsPage.propTypes = {
  mode: PropTypes.oneOf(['seller', 'admin']),
};

export default CampaignsPage;
