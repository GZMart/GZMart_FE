import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tag,
  Statistic,
  Row,
  Col,
  message,
  Empty,
  Spin,
  Select,
  Dropdown,
  Avatar,
  Space,
  Steps,
  Checkbox,
  Switch,
  Alert,
  Progress,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  SearchOutlined,
  MinusCircleOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { flashsaleService } from '../../services/api/flashsaleService';
import { productService } from '../../services/api';
import styles from '../../assets/styles/seller/FlashSales.module.css';

const FlashSalesPage = () => {
  const [loading, setLoading] = useState(false);
  const [flashSales, setFlashSales] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
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
    timeSlot: null,
    startTime: null,
    endTime: null,
  });

  // Selected products with variants configuration
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [variantConfigs, setVariantConfigs] = useState({});
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);

  // Compute variant table data with debug logging
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

    const current = calcMetrics(flashSales.filter((fs) => inRange(fs, from, to)));
    const prev = calcMetrics(flashSales.filter((fs) => inRange(fs, prevFrom, prevTo)));

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
  }, [flashSales, overviewRange]);

  // Compute variant table data with debug logging
  const variantTableData = useMemo(() => {
    const data = selectedProducts.flatMap((product) => {
      if (!product.models) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('⚠️ Product has no models:', {
            productId: product._id,
            productName: product.name,
            product,
          });
        }
        return [];
      }
      // Deduplicate by SKU — keep only first occurrence of each SKU
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
        return {
          key,
          product,
          model,
          config,
        };
      });
    });

    if (import.meta.env.DEV && selectedProducts.length > 0) {
      // eslint-disable-next-line no-console
      console.log('📊 Variant table data:', {
        selectedProductsCount: selectedProducts.length,
        selectedProducts: selectedProducts.map((p) => ({
          id: p._id,
          name: p.name,
          modelsCount: p.models?.length || 0,
        })),
        variantConfigsKeys: Object.keys(variantConfigs),
        tableDataCount: data.length,
        tableData: data,
      });
    }

    return data;
  }, [selectedProducts, variantConfigs]);

  // Fetch flash sales
  const fetchFlashSales = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await flashsaleService.getAll({ page, limit });

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('📦 Flash Sales API Response:', res);
        // eslint-disable-next-line no-console
        console.log('📦 Response type:', typeof res);
        // eslint-disable-next-line no-console
        console.log('📦 Response keys:', res ? Object.keys(res) : 'null');
      }

      // Handle different response structures
      let flashSalesData = [];
      let pageInfo = { page, limit, total: 0 };

      if (Array.isArray(res)) {
        // Direct array response
        flashSalesData = res;
      } else if (res?.data) {
        // Has data property
        flashSalesData = Array.isArray(res.data) ? res.data : [];
        pageInfo = {
          page: res.page ?? res.pagination?.page ?? page,
          limit: res.limit ?? res.pagination?.limit ?? limit,
          total: res.total ?? res.pagination?.total ?? flashSalesData.length,
        };
      }

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('✅ Flash Sales Data (count):', flashSalesData.length);
        // eslint-disable-next-line no-console
        console.log('✅ First flash sale sample:', flashSalesData[0]);
      }

      setFlashSales(flashSalesData);
      setPagination(pageInfo);

      if (flashSalesData.length === 0 && import.meta.env.DEV) {
        console.warn('⚠️ Backend returned empty data - no flash sales available');
      }
    } catch (error) {
      console.error('❌ Error fetching flash sales:', error);

      if (import.meta.env.DEV) {
        console.error('❌ Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      }

      message.error(`Failed to fetch flash sales: ${error?.message || 'Unknown error'}`);
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats for selected flash sale
  const fetchStats = async (flashSaleId) => {
    try {
      setStatsLoading(true);
      const res = await flashsaleService.getStats(flashSaleId);
      // `res` is already the backend JSON
      setStats(res.data ?? res);
    } catch (error) {
      message.error('Failed to load statistics');
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  // Fetch products when modal opens
  useEffect(() => {
    if (isModalVisible) {
      fetchProducts();
    }
  }, [isModalVisible]);

  // Fetch products for selection
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
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // OLD: Handle create/update (replaced by handleSubmitCampaign)
  /*
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const data = {
        productId: values.productId,
        salePrice: values.salePrice,
        totalQuantity: values.totalQuantity,
        startAt: values.startAt.toISOString(),
        endAt: values.endAt.toISOString(),
      };

      if (selectedFlashSale) {
        await flashsaleService.update(selectedFlashSale._id, data);
        message.success('Flash sale updated successfully');
      } else {
        await flashsaleService.create(data);
        message.success('Flash sale created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedFlashSale(null);
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error(selectedFlashSale ? 'Failed to update flash sale' : 'Failed to create flash sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  */

  // Handle delete (single variant)
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await flashsaleService.delete(id);
      message.success('Flash sale deleted successfully');
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error('Failed to delete flash sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete all variants in a campaign group
  const handleDeleteCampaign = async (group) => {
    try {
      setLoading(true);
      await Promise.all(group.records.map((r) => flashsaleService.delete(r._id)));
      message.success(`Deleted campaign with ${group.records.length} variant(s)`);
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error('Failed to delete campaign');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit all variants in a campaign group
  const handleEditCampaign = async (group) => {
    setIsDetailModalVisible(false);

    setCampaignInfo({
      title: group.campaignTitle || '',
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

      group.records.forEach((record) => {
        const variantModel = fullProduct.models.find((m) => m.sku === record.variantSku);
        if (variantModel) {
          const k = `${fullProduct._id}_${variantModel.sku}`;
          configs[k] = {
            productId: fullProduct._id,
            variantSku: variantModel.sku,
            tierIndex: variantModel.tier_index,
            originalPrice: variantModel.price,
            salePrice: record.salePrice,
            discountPercent: Math.round(
              ((variantModel.price - record.salePrice) / variantModel.price) * 100
            ),
            quantity: record.totalQuantity,
            stock: variantModel.stock,
            purchaseLimit: record.purchaseLimit || 1,
            enabled: true,
            _flashSaleId: record._id,
          };
          keys.push(k);
        }
      });

      setVariantConfigs(configs);
      setSelectedVariantKeys(keys);
      setSelectedFlashSale({ isCampaign: true, records: group.records });
    } catch (error) {
      message.error(`Failed to load product: ${error?.message || 'Unknown error'}`);
      return;
    }

    setCurrentStep(0);
    setIsModalVisible(true);
  };

  // Handle edit - populate 2-step modal with flash sale data
  const handleEdit = async (record) => {
    // Close stats modal immediately when editing
    setIsDetailModalVisible(false);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🔧 Edit flash sale record:', {
        record,
        productId: record.productId,
        productIdType: typeof record.productId,
        productModels: record.productId?.models,
        variantSku: record.variantSku,
        variantSkuType: typeof record.variantSku,
        tierIndex: record.tierIndex,
        flashSaleId: record._id,
      });
    }

    // Populate campaign info from flash sale record
    setCampaignInfo({
      title: record.campaignTitle || `Flash Sale - ${record.productId?.name || 'Product'}`,
      timeSlot: null,
      startTime: dayjs(record.startAt),
      endTime: dayjs(record.endAt),
    });

    // Get product ID (handle both populated object and ID string)
    const productId =
      typeof record.productId === 'object' ? record.productId._id : record.productId;

    if (!productId) {
      message.error('Product information not found');
      return;
    }

    try {
      // Fetch full product details to get models array
      const response = await productService.getById(productId);

      // Handle response structure (might be wrapped in data property)
      const fullProduct = response.data || response;

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('✅ Fetched full product:', {
          response,
          fullProduct,
          id: fullProduct._id,
          name: fullProduct.name,
          modelsCount: fullProduct.models?.length,
          models: fullProduct.models,
        });
      }

      if (!fullProduct || !fullProduct.models) {
        message.error('Product has no variants');
        return;
      }

      setSelectedProducts([fullProduct]);

      // Find variant by SKU or tierIndex
      const variantModel = fullProduct.models.find(
        (m) =>
          m.sku === record.variantSku ||
          JSON.stringify(m.tier_index) === JSON.stringify(record.tierIndex)
      );

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('🔍 Variant search result:', {
          searchSku: record.variantSku,
          searchTierIndex: record.tierIndex,
          allModels: fullProduct.models.map((m) => ({ sku: m.sku, tierIndex: m.tier_index })),
          foundVariant: variantModel,
        });
      }

      if (variantModel) {
        const key = `${fullProduct._id}_${variantModel.sku}`;
        const config = {
          productId: fullProduct._id,
          variantSku: variantModel.sku,
          tierIndex: variantModel.tier_index,
          originalPrice: variantModel.price,
          salePrice: record.salePrice,
          discountPercent: Math.round(
            ((variantModel.price - record.salePrice) / variantModel.price) * 100
          ),
          quantity: record.totalQuantity,
          stock: variantModel.stock,
          purchaseLimit: record.purchaseLimit || 1,
          enabled: true,
        };

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('✅ Variant config created:', {
            key,
            config,
            originalFlashSaleSku: record.variantSku,
            variantModelSku: variantModel.sku,
            skuMatch: variantModel.sku === record.variantSku,
          });
        }

        // Set selectedFlashSale with the correct variantSku from the variant model
        setSelectedFlashSale({
          ...record,
          variantSku: variantModel.sku, // Ensure we use the SKU from the variant model
        });

        setVariantConfigs({ [key]: config });
        setSelectedVariantKeys([key]);
      } else {
        message.warning('Matching variant not found. Please re-select.');
      }
    } catch (error) {
      console.error('❌ Error fetching product details:', error);
      message.error(`Failed to load product details: ${error?.message || 'Unknown error'}`);
    }

    // Open modal at Step 0 to allow editing campaign info
    setCurrentStep(0);
    setIsModalVisible(true);
  };

  // Handle detail view (single SKU)
  const handleViewDetail = (record) => {
    setSelectedFlashSale(record);
    setSelectedCampaignGroup(null);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    fetchStats(record._id);
  };

  // Handle detail view for a full campaign group (all SKUs)
  const handleViewCampaign = (group) => {
    setSelectedCampaignGroup(group);
    setSelectedFlashSale(group.records[0]);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    setStats(null);
  };

  // Open create modal (reset all state to avoid leftover from view/edit)
  const handleOpenCreateModal = () => {
    setSelectedFlashSale(null);
    setCurrentStep(0);
    setCampaignInfo({ title: '', timeSlot: null, startTime: null, endTime: null });
    setSelectedProducts([]);
    setVariantConfigs({});
    setSelectedVariantKeys([]);
    setIsModalVisible(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedFlashSale(null);
    setCurrentStep(0);
    setCampaignInfo({ title: '', timeSlot: null, startTime: null, endTime: null });
    setSelectedProducts([]);
    setVariantConfigs({});
    setSelectedVariantKeys([]);
  };

  // Handle add product to campaign
  const handleAddProduct = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      return;
    }

    // Check if already added
    if (selectedProducts.find((p) => p._id === productId)) {
      message.warning('Product already added to the list');
      return;
    }

    setSelectedProducts((prev) => [...prev, product]);

    // Initialize variant configs for this product
    if (product.models && Array.isArray(product.models)) {
      const configs = {};
      product.models.forEach((model) => {
        if (!model.sku) {
          console.warn('Model missing SKU:', model);
          return; // Skip models without SKU
        }
        const key = `${productId}_${model.sku}`; // Use SKU for unique key
        configs[key] = {
          productId,
          variantSku: model.sku,
          tierIndex: model.tier_index,
          originalPrice: model.price,
          salePrice: Math.round(model.price * 0.8), // 20% discount suggestion
          discountPercent: 20,
          quantity: model.stock, // Allow full stock quantity
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

  // Handle remove product
  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
    // Remove variant configs
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

  // Update variant config
  const updateVariantConfig = (key, field, value) => {
    setVariantConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
        // Auto-calculate discount percent when price changes
        ...(field === 'salePrice'
          ? {
              discountPercent: Math.round((1 - value / prev[key].originalPrice) * 100),
            }
          : {}),
        // Auto-calculate price when discount percent changes
        ...(field === 'discountPercent'
          ? {
              salePrice: Math.round(prev[key].originalPrice * (1 - value / 100)),
            }
          : {}),
      },
    }));
  };

  // Bulk update selected variants
  const handleBulkUpdate = (field, value) => {
    if (selectedVariantKeys.length === 0) {
      message.warning('Please select at least one variant');
      return;
    }

    selectedVariantKeys.forEach((key) => {
      updateVariantConfig(key, field, value);
    });

    message.success(`Updated ${selectedVariantKeys.length} variant(s)`);
  };

  // Get variant display name
  const getVariantName = (product, tierIndex) => {
    // No tier variations - this is a simple product
    if (!product.tier_variations || !Array.isArray(product.tier_variations)) {
      return '';
    }

    // No tier index selected
    if (!tierIndex || !Array.isArray(tierIndex)) {
      return '';
    }

    // Build variant name from tier selections
    try {
      const nameParts = [];
      tierIndex.forEach((idx, tier) => {
        if (product.tier_variations[tier] && product.tier_variations[tier].options) {
          const option = product.tier_variations[tier].options[idx];
          if (option) {
            nameParts.push(option);
          }
        }
      });
      return nameParts.join(' - ');
    } catch (error) {
      console.warn('Error building variant name:', error);
      return '';
    }
  };

  // Submit multi-product flash sale
  const handleSubmitCampaign = async () => {
    try {
      setLoading(true);

      // Validate campaign info exists
      if (!campaignInfo.title || campaignInfo.title.trim() === '') {
        message.error('Please enter a campaign title');
        setLoading(false);
        return;
      }

      if (!campaignInfo.startTime || !campaignInfo.endTime) {
        message.error('Please select start and end time');
        setLoading(false);
        return;
      }

      // Validate dayjs objects
      if (!dayjs.isDayjs(campaignInfo.startTime) || !dayjs.isDayjs(campaignInfo.endTime)) {
        // eslint-disable-next-line no-console
        console.error('❌ Invalid dayjs objects:', {
          startTime: campaignInfo.startTime,
          endTime: campaignInfo.endTime,
          startTimeType: typeof campaignInfo.startTime,
          endTimeType: typeof campaignInfo.endTime,
        });
        message.error('Error: Invalid time. Please go back to Step 1 and re-select.');
        setCurrentStep(0);
        setLoading(false);
        return;
      }

      // Validate time logic
      if (campaignInfo.endTime.isBefore(campaignInfo.startTime)) {
        message.error('End time must be after start time');
        setLoading(false);
        return;
      }

      // Allow current time or future time (with 1 minute tolerance)
      if (campaignInfo.startTime.isBefore(dayjs().subtract(1, 'minute'))) {
        message.error('Start time cannot be in the past');
        setLoading(false);
        return;
      }

      // Validate products
      if (selectedProducts.length === 0) {
        message.error('Please add at least one product');
        setLoading(false);
        return;
      }

      // Get variants to submit:
      // - Edit mode: use enabled status as before
      // - Create mode: use selectedVariantKeys (checkbox selection); fallback to all enabled if none selected
      const enabledVariants = Object.entries(variantConfigs)
        .filter(([key, config]) => {
          if (selectedFlashSale) {
            return config.enabled;
          }
          // Create mode: respect checkbox selection if any rows are checked
          if (selectedVariantKeys.length > 0) {
            return selectedVariantKeys.includes(key);
          }
          return config.enabled;
        })
        .map(([_, config]) => config);

      if (enabledVariants.length === 0) {
        message.error(
          selectedVariantKeys.length === 0
            ? 'Please select at least one variant (check the rows in the table)'
            : 'No valid variant selected'
        );
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('🚀 Submitting flash sale:', {
          mode: selectedFlashSale ? 'EDIT' : 'CREATE',
          flashSaleId: selectedFlashSale?._id,
          campaignInfo: {
            title: campaignInfo.title,
            startTime: campaignInfo.startTime?.format('YYYY-MM-DD HH:mm'),
            endTime: campaignInfo.endTime?.format('YYYY-MM-DD HH:mm'),
            startISO: campaignInfo.startTime?.toISOString(),
            endISO: campaignInfo.endTime?.toISOString(),
          },
          enabledVariants: enabledVariants.map((v) => ({
            productId: v.productId,
            sku: v.variantSku,
            price: v.salePrice,
            qty: v.quantity,
          })),
          totalVariants: enabledVariants.length,
        });
      }

      // EDIT CAMPAIGN MODE: Update all variants in a campaign at once
      if (selectedFlashSale?.isCampaign) {
        const updatePromises = enabledVariants.map((variant) => {
          if (!variant._flashSaleId) {
            return Promise.resolve();
          }
          return flashsaleService.update(variant._flashSaleId, {
            salePrice: variant.salePrice,
            totalQuantity: variant.quantity,
            purchaseLimit: variant.purchaseLimit,
            startAt: campaignInfo.startTime.toISOString(),
            endAt: campaignInfo.endTime.toISOString(),
            campaignTitle: campaignInfo.title,
          });
        });
        await Promise.all(updatePromises);
        message.success(`Campaign updated (${enabledVariants.length} variant(s))`);
        handleCloseModal();
        fetchFlashSales(pagination.page);
        return;
      }

      // EDIT MODE: Update existing flash sale (single variant)
      if (selectedFlashSale) {
        if (enabledVariants.length !== 1) {
          message.warning('Edit mode only supports 1 variant. Please select exactly 1 variant.');
          setLoading(false);
          return;
        }

        const variant = enabledVariants[0];

        // Debug: Log variant SKUs for comparison
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('🔍 SKU Comparison:', {
            formVariantSku: variant.variantSku,
            originalFlashSaleSku: selectedFlashSale.variantSku,
            areEqual: variant.variantSku === selectedFlashSale.variantSku,
            formVariantSkuType: typeof variant.variantSku,
            originalSkuType: typeof selectedFlashSale.variantSku,
          });
        }

        // Verify we're updating the same variant (allow if both are null/undefined)
        const isSameVariant =
          variant.variantSku === selectedFlashSale.variantSku ||
          (!variant.variantSku && !selectedFlashSale.variantSku);

        if (!isSameVariant) {
          message.warning('Cannot change variant in edit mode. Please create a new flash sale.');
          setLoading(false);
          return;
        }

        const updatePayload = {
          salePrice: variant.salePrice,
          totalQuantity: variant.quantity,
          purchaseLimit: variant.purchaseLimit,
          startAt: campaignInfo.startTime.toISOString(),
          endAt: campaignInfo.endTime.toISOString(),
          campaignTitle: campaignInfo.title,
        };

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('📦 Update flash sale payload:', updatePayload);
        }

        await flashsaleService.update(selectedFlashSale._id, updatePayload);
        message.success('Flash sale updated successfully');
        handleCloseModal();
        fetchFlashSales(pagination.page);
        return;
      }

      // CREATE MODE: Group selected variants by productId → one batch request per product
      // This creates ONE flash sale campaign per product that contains all selected SKUs.
      const variantsByProduct = enabledVariants.reduce((acc, variant) => {
        const pid = variant.productId;
        if (!acc[pid]) {
          acc[pid] = [];
        }
        acc[pid].push(variant);
        return acc;
      }, {});

      const batchPromises = Object.entries(variantsByProduct).map(([productId, variants]) => {
        const payload = {
          productId,
          campaignTitle: campaignInfo.title,
          startAt: campaignInfo.startTime.toISOString(),
          endAt: campaignInfo.endTime.toISOString(),
          variants: variants.map((v) => {
            const variantItem = {
              variantSku: v.variantSku,
              salePrice: v.salePrice,
              totalQuantity: v.quantity,
              purchaseLimit: v.purchaseLimit,
            };
            if (v.tierIndex) {
              variantItem.tierIndex = v.tierIndex;
            }
            return variantItem;
          }),
        };

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('📦 Batch flash sale payload:', payload);
        }

        return flashsaleService.createBatch(payload);
      });

      await Promise.all(batchPromises);

      const totalVariants = enabledVariants.length;
      const totalProducts = Object.keys(variantsByProduct).length;
      message.success(
        `Created ${totalProducts} flash sale campaign(s) with ${totalVariants} variant(s) successfully`
      );
      handleCloseModal();
      fetchFlashSales(pagination.page);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
      message.error(
        selectedFlashSale
          ? `Failed to update flash sale: ${errorMsg}`
          : `Failed to create flash sale campaign: ${errorMsg}`
      );

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('❌ Flash sale creation error:', {
          error,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Status config helper
  const statusConfig = {
    pending: { color: 'blue', label: 'Upcoming' },
    upcoming: { color: 'blue', label: 'Upcoming' },
    active: { color: 'green', label: 'Active' },
    ended: { color: 'default', label: 'Ended' },
    expired: { color: 'default', label: 'Ended' },
    cancelled: { color: 'red', label: 'Cancelled' },
  };

  // Campaign-level (parent) columns
  const campaignColumns = [
    {
      title: 'Campaign / Product',
      key: 'campaign',
      width: 220,
      render: (_, group) => (
        <div>
          <div style={{ fontWeight: 600 }}>{group.campaignTitle || group.productId?.name}</div>
          {group.campaignTitle && (
            <div style={{ color: '#888', fontSize: 12 }}>{group.productId?.name}</div>
          )}
          <Tag color="blue" style={{ marginTop: 4 }}>
            {group.skuCount} SKU{group.skuCount > 1 ? 's' : ''}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 150,
      render: (_, group) => (
        <div className={styles.priceColumn}>
          <div className={styles.salePrice}>
            {group.salePrice === group.salePriceMax
              ? `${group.salePrice?.toLocaleString('vi-VN')} ₫`
              : `${group.salePrice?.toLocaleString('vi-VN')} – ${group.salePriceMax?.toLocaleString('vi-VN')} ₫`}
          </div>
          <div className={styles.originalPrice}>
            {group.productId?.originalPrice?.toLocaleString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      title: 'Total Qty',
      key: 'quantity',
      width: 140,
      render: (_, group) => (
        <div className={styles.quantityColumn}>
          <span className={styles.sold}>
            {group.soldQuantity} / {group.totalQuantity}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${group.totalQuantity ? (group.soldQuantity / group.totalQuantity) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      width: 200,
      render: (_, group) => (
        <div className={styles.timeColumn}>
          <div>Start: {dayjs(group.startAt).format('DD/MM HH:mm')}</div>
          <div>End: {dayjs(group.endAt).format('DD/MM HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, group) => {
        const cfg = statusConfig[group.status] || { color: 'default', label: group.status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_, group) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Campaign',
            onClick: (e) => {
              e?.domEvent?.stopPropagation();
              handleEditCampaign(group);
            },
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete Campaign',
            danger: true,
            onClick: (e) => {
              e?.domEvent?.stopPropagation();
              handleDeleteCampaign(group);
            },
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  // Variant-level (child) columns shown when expanding a campaign row
  const variantColumns = [
    {
      title: 'SKU',
      dataIndex: 'variantSku',
      key: 'sku',
      width: 160,
      render: (sku) => (sku ? <Tag>{sku}</Tag> : <span style={{ color: '#aaa' }}>—</span>),
    },
    {
      title: 'Sale Price',
      key: 'price',
      width: 140,
      render: (_, r) => (
        <div className={styles.priceColumn}>
          <div className={styles.salePrice}>{r.salePrice?.toLocaleString('vi-VN')} ₫</div>
          <div className={styles.originalPrice}>{r.originalPrice?.toLocaleString('vi-VN')}</div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 140,
      render: (_, r) => (
        <div className={styles.quantityColumn}>
          <span className={styles.sold}>
            {r.soldQuantity} / {r.totalQuantity}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${r.totalQuantity ? (r.soldQuantity / r.totalQuantity) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const cfg = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, r) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: (e) => {
              e?.domEvent?.stopPropagation();
              handleEdit(r);
            },
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: (e) => {
              e?.domEvent?.stopPropagation();
              handleDelete(r._id);
            },
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  const handleTableChange = (newPagination) => {
    fetchFlashSales(newPagination.current, newPagination.pageSize);
  };

  // Filter flash sales by search text, status, and date range
  const hasActiveFilters = searchText || statusFilter !== 'all' || dateRangeFilter;

  const filteredFlashSales = flashSales.filter((item) => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      !searchLower ||
      item.productId?.name?.toLowerCase().includes(searchLower) ||
      item.variantSku?.toLowerCase().includes(searchLower) ||
      item.campaignTitle?.toLowerCase().includes(searchLower);

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

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Group flash sales by campaign (same product + campaignTitle + start + end = 1 campaign)
  const groupedFlashSales = useMemo(() => {
    const groups = {};
    filteredFlashSales.forEach((record) => {
      const pid = typeof record.productId === 'object' ? record.productId?._id : record.productId;
      const key = `${pid}_${record.campaignTitle || ''}_${record.startAt}_${record.endAt}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          productId: record.productId,
          campaignTitle: record.campaignTitle,
          startAt: record.startAt,
          endAt: record.endAt,
          records: [],
        };
      }
      groups[key].records.push(record);
    });

    return Object.values(groups).map((g) => {
      const totalQty = g.records.reduce((s, r) => s + (r.totalQuantity || 0), 0);
      const totalSold = g.records.reduce((s, r) => s + (r.soldQuantity || 0), 0);
      const priceMin = Math.min(...g.records.map((r) => r.salePrice || 0));
      const priceMax = Math.max(...g.records.map((r) => r.salePrice || 0));
      const statusOrder = {
        active: 3,
        pending: 2,
        upcoming: 2,
        expired: 1,
        ended: 1,
        cancelled: 0,
      };
      const topStatus = g.records.reduce(
        (best, r) => ((statusOrder[r.status] || 0) > (statusOrder[best] || 0) ? r.status : best),
        g.records[0]?.status
      );
      return {
        ...g,
        totalQuantity: totalQty,
        soldQuantity: totalSold,
        salePrice: priceMin,
        salePriceMax: priceMax,
        status: topStatus,
        skuCount: g.records.length,
      };
    });
  }, [filteredFlashSales]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Flash Sale Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
          Create Flash Sale
        </Button>
      </div>

      {/* Overview Stats Banner - Shopee style */}
      <Card style={{ marginBottom: 12, background: '#fff' }} bodyStyle={{ padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartOutlined style={{ color: '#f5222d', fontSize: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Shop Flash Sale Overview</span>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              ({overviewRange[0].format('DD-MM-YYYY')} to {overviewRange[1].format('DD-MM-YYYY')}
              GMT+7)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DatePicker.RangePicker
              size="small"
              value={overviewRange}
              onChange={(vals) => vals && setOverviewRange(vals)}
              format="DD/MM/YYYY"
              allowClear={false}
              presets={[
                {
                  label: 'Last 7 days',
                  value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')],
                },
                {
                  label: 'Last 30 days',
                  value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')],
                },
                { label: 'This month', value: [dayjs().startOf('month'), dayjs().endOf('day')] },
              ]}
            />
          </div>
        </div>
        <Row gutter={[0, 0]} style={{ borderTop: '1px solid #f0f0f0' }}>
          {[
            {
              label: 'Revenue',
              value: `${overviewStats.revenue.toLocaleString('vi-VN')} ₫`,
              pct: overviewStats.revenuePct,
              tip: 'Total revenue from flash sales (sold quantity × flash sale price)',
            },
            {
              label: 'Orders',
              value: overviewStats.orders,
              pct: overviewStats.ordersPct,
              tip: 'Total number of products sold in flash sales',
            },
            {
              label: 'Buyers',
              value: overviewStats.buyers,
              pct: overviewStats.buyersPct,
              tip: 'Estimated buyers (based on sold quantity)',
            },
            {
              label: 'Sell Rate',
              value: `${overviewStats.sellRate} %`,
              pct: overviewStats.sellRatePct,
              tip: 'Average sell rate: sold / total flash sale quantity',
            },
          ].map((item, idx) => (
            <Col
              xs={24}
              sm={12}
              md={6}
              key={idx}
              style={{
                padding: '16px 24px',
                borderRight: idx < 3 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <Tooltip title={item.tip}>
                <div style={{ color: '#595959', fontSize: 13, marginBottom: 4, cursor: 'default' }}>
                  {item.label} <span style={{ color: '#bfbfbf', fontSize: 11 }}>ⓘ</span>
                </div>
              </Tooltip>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#262626', lineHeight: 1.3 }}>
                {item.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                so với kỳ trước{' '}
                {item.pct > 0 ? (
                  <span style={{ color: '#52c41a', fontWeight: 600 }}>
                    <RiseOutlined /> +{item.pct}%
                  </span>
                ) : item.pct < 0 ? (
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    <FallOutlined /> {item.pct}%
                  </span>
                ) : (
                  <span style={{ color: '#8c8c8c' }}>0.00%</span>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Main content */}
      <Card className={styles.card} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Search by product name, SKU, campaign..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 300 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 195 }}
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Upcoming / Pending', value: 'pending' },
              { label: 'Expired / Ended', value: 'expired' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
          <DatePicker.RangePicker
            value={dateRangeFilter}
            onChange={setDateRangeFilter}
            placeholder={['Campaign start', 'Campaign end']}
            allowClear
            style={{ maxWidth: 280 }}
          />
          {hasActiveFilters && (
            <Button
              onClick={() => {
                setSearchText('');
                setStatusFilter('all');
                setDateRangeFilter(null);
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      <Card className={styles.card}>
        <Spin spinning={loading}>
          {filteredFlashSales.length > 0 || loading ? (
            <Table
              columns={campaignColumns}
              dataSource={groupedFlashSales}
              rowKey="key"
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: groupedFlashSales.length,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} campaign(s)`,
              }}
              onChange={handleTableChange}
              size="small"
              onRow={(group) => ({
                onClick: () => handleViewCampaign(group),
                style: { cursor: 'pointer' },
              })}
              expandable={{
                expandedRowRender: (group) => (
                  <Table
                    columns={variantColumns}
                    dataSource={group.records}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                    style={{ marginLeft: 48 }}
                    onRow={(record) => ({
                      onClick: () => handleViewDetail(record),
                      style: { cursor: 'pointer' },
                    })}
                  />
                ),
                rowExpandable: (group) => group.skuCount > 1,
              }}
            />
          ) : (
            <Empty
              description={
                hasActiveFilters
                  ? 'No matching flash sales found'
                  : 'No flash sales yet. Create your first flash sale!'
              }
              style={{ padding: '48px 24px' }}
            >
              {!hasActiveFilters && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                    💡 No flash sale data yet. Click &ldquo;Create Flash Sale&rdquo; to get started.
                  </p>
                </div>
              )}
            </Empty>
          )}
        </Spin>
      </Card>

      {/* Create/Edit Flash Sale Campaign Modal - Shopee Style */}
      <Modal
        title={selectedFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale Campaign'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        width={1200}
        footer={null}
        destroyOnClose
      >
        <Steps
          current={currentStep}
          items={[
            { title: 'Basic Info', icon: <InfoCircleOutlined /> },
            { title: 'Products', icon: <PlusOutlined /> },
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* Step 1: Campaign Info */}
        {currentStep === 0 && (
          <div>
            {selectedFlashSale && (
              <Alert
                message="Edit Mode"
                description="You are editing a flash sale. Start and end times CANNOT be changed after creation. You can only edit the price, quantity, and purchase limit."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form layout="vertical">
              <Form.Item
                label="Campaign Title"
                required
                help="Internal name, not visible to buyers"
              >
                <Input
                  placeholder="E.g.: Weekend Flash Sale, Black Friday Flash Sale..."
                  value={campaignInfo.title}
                  onChange={(e) => setCampaignInfo((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={100}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Start Time"
                    required
                    help={selectedFlashSale ? '🔒 Time cannot be changed after creation' : ''}
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      value={campaignInfo.startTime}
                      onChange={(val) => setCampaignInfo((prev) => ({ ...prev, startTime: val }))}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      disabled={!!selectedFlashSale}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="End Time"
                    required
                    help={selectedFlashSale ? '🔒 Time cannot be changed after creation' : ''}
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      value={campaignInfo.endTime}
                      onChange={(val) => setCampaignInfo((prev) => ({ ...prev, endTime: val }))}
                      disabledDate={(current) => {
                        if (!campaignInfo.startTime) {
                          return current && current < dayjs();
                        }
                        return current && current <= campaignInfo.startTime;
                      }}
                      disabled={!!selectedFlashSale}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {!selectedFlashSale && (
                <Alert
                  message="Notes"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Discount range: 5% - 90%</li>
                      <li>Minimum promotion quantity: 1 product</li>
                      <li>Start time must be at or after the current time</li>
                      <li>⚠️ Time CANNOT be changed after creating a flash sale</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </Form>

            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  // Strict validation before moving to Step 2
                  if (!campaignInfo.title || campaignInfo.title.trim() === '') {
                    message.warning('Please enter a campaign title');
                    return;
                  }
                  if (!campaignInfo.startTime) {
                    message.warning('Please select a start time');
                    return;
                  }
                  if (!campaignInfo.endTime) {
                    message.warning('Please select an end time');
                    return;
                  }

                  // Skip time validation in edit mode since times are disabled
                  if (!selectedFlashSale) {
                    if (campaignInfo.endTime.isBefore(campaignInfo.startTime)) {
                      message.warning('End time must be after start time');
                      return;
                    }
                    // Allow current time or future time (with 1 minute tolerance)
                    if (campaignInfo.startTime.isBefore(dayjs().subtract(1, 'minute'))) {
                      message.warning('Start time cannot be in the past');
                      return;
                    }
                  }

                  if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.log('✅ Step 1 validated, moving to Step 2:', {
                      title: campaignInfo.title,
                      startTime: campaignInfo.startTime.format('YYYY-MM-DD HH:mm'),
                      endTime: campaignInfo.endTime.format('YYYY-MM-DD HH:mm'),
                    });
                  }

                  setCurrentStep(1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Products & Variants */}
        {currentStep === 1 && (
          <div>
            {/* Campaign Info Summary */}
            <Alert
              message={
                <div>
                  <strong>📅 {campaignInfo.title}</strong>
                </div>
              }
              description={
                <div style={{ fontSize: '13px' }}>
                  <div>
                    🕒 Start: <strong>{campaignInfo.startTime?.format('DD/MM/YYYY HH:mm')}</strong>
                    {' → '}
                    End: <strong>{campaignInfo.endTime?.format('DD/MM/YYYY HH:mm')}</strong>
                  </div>
                  {!selectedFlashSale ? (
                    <div
                      style={{ marginTop: 4, color: '#1890ff', cursor: 'pointer' }}
                      onClick={() => setCurrentStep(0)}
                    >
                      ✏️ Edit campaign info
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: '12px' }}>
                      🔒 Time cannot be changed after creating a flash sale
                    </div>
                  )}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card
              title="Flash Sale Products"
              extra={
                <span style={{ fontSize: '14px', color: '#666' }}>
                  You have selected {selectedProducts.length} product(s)
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              {selectedFlashSale && (
                <Alert
                  message="Edit Mode"
                  description={
                    <div>
                      <p style={{ margin: 0, marginBottom: 8 }}>
                        You are editing a flash sale for 1 variant. You cannot add other products in
                        this mode.
                      </p>
                      <p style={{ margin: 0, color: '#faad14', fontWeight: 500 }}>
                        ⚠️ Can only edit: <strong>Flash Sale Price</strong>,{' '}
                        <strong>Quantity</strong>, and <strong>Purchase Limit/Order</strong>
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8c8c8c' }}>
                        🔒 Time and product cannot be changed
                      </p>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Select
                showSearch
                disabled={!!selectedFlashSale}
                placeholder={
                  selectedFlashSale
                    ? '🔒 Không thể thêm sản phẩm ở chế độ chỉnh sửa'
                    : '🔍 Tìm và thêm sản phẩm vào chương trình...'
                }
                style={{ width: '100%', marginBottom: 16 }}
                optionFilterProp="children"
                loading={productsLoading}
                onChange={handleAddProduct}
                value={null}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={products.map((product) => ({
                  value: product._id,
                  label: product.name,
                  product,
                }))}
                optionRender={(option) => (
                  <Space>
                    <Avatar src={option.data.product.images?.[0]} shape="square" size={40} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.data.product.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        SKU: {option.data.product.sku}
                      </div>
                    </div>
                  </Space>
                )}
              />

              {selectedProducts.length === 0 ? (
                <Empty description="No products yet. Add products to the campaign!" />
              ) : (
                <>
                  {/* Bulk Edit Controls */}
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      background: '#f5f5f5',
                      borderRadius: 8,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Bulk Edit:</span>
                    <InputNumber
                      placeholder="Discount %"
                      min={5}
                      max={90}
                      addonAfter="%"
                      style={{ width: 140 }}
                      onChange={(val) => val && handleBulkUpdate('discountPercent', val)}
                    />
                    <InputNumber
                      placeholder="Quantity"
                      min={1}
                      max={999999}
                      style={{ width: 120 }}
                      onChange={(val) => val && handleBulkUpdate('quantity', val)}
                    />
                    <InputNumber
                      placeholder="Limit/Order"
                      min={1}
                      style={{ width: 130 }}
                      onChange={(val) => val && handleBulkUpdate('purchaseLimit', val)}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      ({selectedVariantKeys.length} selected)
                    </span>
                  </div>

                  {/* Variant Table */}
                  <Table
                    dataSource={variantTableData}
                    columns={[
                      {
                        title: (
                          <Checkbox
                            checked={selectedVariantKeys.length > 0}
                            indeterminate={
                              selectedVariantKeys.length > 0 &&
                              selectedVariantKeys.length < Object.keys(variantConfigs).length
                            }
                            disabled={!!selectedFlashSale}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVariantKeys(Object.keys(variantConfigs));
                              } else {
                                setSelectedVariantKeys([]);
                              }
                            }}
                          />
                        ),
                        width: 50,
                        render: (_, record) => (
                          <Checkbox
                            checked={selectedVariantKeys.includes(record.key)}
                            disabled={!!selectedFlashSale}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVariantKeys((prev) => [...prev, record.key]);
                              } else {
                                setSelectedVariantKeys((prev) =>
                                  prev.filter((k) => k !== record.key)
                                );
                              }
                            }}
                          />
                        ),
                      },
                      {
                        title: 'Variant',
                        width: 250,
                        render: (_, record) => {
                          const variantName = getVariantName(
                            record.product,
                            record.model.tier_index
                          );
                          return (
                            <Space>
                              <Avatar src={record.product.images?.[0]} shape="square" size={48} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: 2 }}>
                                  {record.product.name}
                                </div>
                                {variantName && (
                                  <div
                                    style={{ fontSize: '12px', color: '#1890ff', marginBottom: 2 }}
                                  >
                                    📦 {variantName}
                                  </div>
                                )}
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                  SKU: {record.model.sku || 'N/A'}
                                </div>
                              </div>
                            </Space>
                          );
                        },
                      },
                      {
                        title: 'Original Price',
                        dataIndex: ['model', 'price'],
                        width: 100,
                        render: (price) => `₫${price?.toLocaleString('vi-VN')}`,
                      },
                      {
                        title: 'Flash Sale Price',
                        width: 140,
                        render: (_, record) => (
                          <InputNumber
                            value={record.config.salePrice}
                            min={Math.round(record.model.price * 0.1)}
                            max={Math.round(record.model.price * 0.95)}
                            formatter={(value) => `₫${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/₫\s?|(,*)/g, '')}
                            onChange={(val) => updateVariantConfig(record.key, 'salePrice', val)}
                            style={{ width: '100%' }}
                          />
                        ),
                      },
                      {
                        title: 'Discount',
                        width: 100,
                        render: (_, record) => (
                          <InputNumber
                            value={record.config.discountPercent}
                            min={5}
                            max={90}
                            addonAfter="%"
                            onChange={(val) =>
                              updateVariantConfig(record.key, 'discountPercent', val)
                            }
                            style={{ width: '100%' }}
                          />
                        ),
                      },
                      {
                        title: 'Sale Qty',
                        width: 100,
                        render: (_, record) => (
                          <InputNumber
                            value={record.config.quantity}
                            min={1}
                            max={999999}
                            onChange={(val) => updateVariantConfig(record.key, 'quantity', val)}
                            style={{ width: '100%' }}
                          />
                        ),
                      },
                      {
                        title: 'Stock',
                        dataIndex: ['model', 'stock'],
                        width: 80,
                        render: (stock) => <span>{stock}</span>,
                      },
                      {
                        title: 'Purchase Limit',
                        width: 100,
                        render: (_, record) => (
                          <InputNumber
                            value={record.config.purchaseLimit}
                            min={1}
                            onChange={(val) =>
                              updateVariantConfig(record.key, 'purchaseLimit', val)
                            }
                            style={{ width: '100%' }}
                          />
                        ),
                      },
                      {
                        title: 'Enable',
                        width: 80,
                        render: (_, record) => (
                          <Switch
                            checked={record.config.enabled}
                            onChange={(checked) =>
                              updateVariantConfig(record.key, 'enabled', checked)
                            }
                          />
                        ),
                      },
                      {
                        title: '',
                        width: 60,
                        render: (_, record) => (
                          <Button
                            type="text"
                            danger
                            disabled={!!selectedFlashSale}
                            icon={<MinusCircleOutlined />}
                            onClick={() => handleRemoveProduct(record.product._id)}
                            title={
                              selectedFlashSale
                                ? 'Cannot remove product in edit mode'
                                : 'Remove product'
                            }
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                    scroll={{ y: 400 }}
                    size="small"
                  />
                </>
              )}
            </Card>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={() => setCurrentStep(0)} style={{ marginRight: 8 }}>
                Back
              </Button>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmitCampaign}
                disabled={selectedProducts.length === 0}
              >
                {selectedFlashSale ? 'Update Flash Sale' : 'Create Flash Sale'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal - Flash Sale Statistics */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊 {selectedCampaignGroup ? 'Campaign Detail' : 'Flash Sale Statistics'}</span>
            {selectedCampaignGroup ? (
              <Tag color="blue">{selectedCampaignGroup.skuCount} SKU(s)</Tag>
            ) : (
              selectedFlashSale && (
                <Tag color={selectedFlashSale.status === 'active' ? 'green' : 'default'}>
                  {selectedFlashSale.status === 'active' ? 'Active' : selectedFlashSale.status}
                </Tag>
              )
            )}
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedCampaignGroup(null);
        }}
        footer={
          selectedCampaignGroup ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setIsDetailModalVisible(false);
                  setSelectedCampaignGroup(null);
                  handleEditCampaign(selectedCampaignGroup);
                }}
              >
                Edit Campaign
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setIsDetailModalVisible(false);
                  setSelectedCampaignGroup(null);
                  handleDeleteCampaign(selectedCampaignGroup);
                }}
              >
                Delete Campaign
              </Button>
            </div>
          ) : null
        }
        width={900}
      >
        {/* CAMPAIGN VIEW: show all SKUs */}
        {selectedCampaignGroup ? (
          <div style={{ padding: '8px 0' }}>
            {/* Product + campaign info */}
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {selectedFlashSale?.productId?.images?.[0] && (
                  <Avatar src={selectedFlashSale.productId.images[0]} shape="square" size={64} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{selectedFlashSale?.productId?.name}</h3>
                  {selectedCampaignGroup.campaignTitle && (
                    <p style={{ margin: '4px 0 0', color: '#1890ff', fontSize: 13 }}>
                      🎯 {selectedCampaignGroup.campaignTitle}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
                    🕒 {dayjs(selectedCampaignGroup.startAt).format('DD/MM/YYYY HH:mm')} →{' '}
                    {dayjs(selectedCampaignGroup.endAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
                <Tag
                  color={
                    selectedCampaignGroup.status === 'active'
                      ? 'green'
                      : selectedCampaignGroup.status === 'pending'
                        ? 'blue'
                        : 'default'
                  }
                  style={{ fontSize: 13, padding: '2px 10px' }}
                >
                  {selectedCampaignGroup.status}
                </Tag>
              </div>
            </Card>

            {/* Aggregated totals */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Total Sold / Qty</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>
                    {selectedCampaignGroup.soldQuantity} / {selectedCampaignGroup.totalQuantity}
                  </div>
                  <Progress
                    percent={
                      selectedCampaignGroup.totalQuantity
                        ? Math.round(
                            (selectedCampaignGroup.soldQuantity /
                              selectedCampaignGroup.totalQuantity) *
                              100
                          )
                        : 0
                    }
                    size="small"
                    showInfo={false}
                    strokeColor="#52c41a"
                    style={{ marginTop: 4 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Price Range</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f5222d' }}>
                    {selectedCampaignGroup.salePrice === selectedCampaignGroup.salePriceMax
                      ? `${selectedCampaignGroup.salePrice?.toLocaleString('vi-VN')} ₫`
                      : `${selectedCampaignGroup.salePrice?.toLocaleString('vi-VN')} – ${selectedCampaignGroup.salePriceMax?.toLocaleString('vi-VN')} ₫`}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>SKUs in Campaign</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
                    {selectedCampaignGroup.skuCount}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* SKU table */}
            <Table
              columns={[
                {
                  title: 'SKU',
                  dataIndex: 'variantSku',
                  key: 'sku',
                  render: (sku) =>
                    sku ? <Tag color="blue">{sku}</Tag> : <span style={{ color: '#aaa' }}>—</span>,
                },
                {
                  title: 'Sale Price',
                  key: 'price',
                  render: (_, r) => (
                    <span style={{ color: '#f5222d', fontWeight: 600 }}>
                      {r.salePrice?.toLocaleString('vi-VN')} ₫
                    </span>
                  ),
                },
                {
                  title: 'Sold / Qty',
                  key: 'qty',
                  render: (_, r) => (
                    <div>
                      <span>
                        {r.soldQuantity} / {r.totalQuantity}
                      </span>
                      <Progress
                        percent={
                          r.totalQuantity ? Math.round((r.soldQuantity / r.totalQuantity) * 100) : 0
                        }
                        size="small"
                        showInfo={false}
                        style={{ marginTop: 2 }}
                      />
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => {
                    const cfg = {
                      pending: { color: 'blue', label: 'Upcoming' },
                      active: { color: 'green', label: 'Active' },
                      expired: { color: 'default', label: 'Ended' },
                      cancelled: { color: 'red', label: 'Cancelled' },
                    }[status] || { color: 'default', label: status };
                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                  },
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  align: 'center',
                  render: (_, r) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setIsDetailModalVisible(false);
                          setSelectedCampaignGroup(null);
                          handleEdit(r);
                        }}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setIsDetailModalVisible(false);
                          setSelectedCampaignGroup(null);
                          handleDelete(r._id);
                        }}
                      />
                    </Space>
                  ),
                },
              ]}
              dataSource={selectedCampaignGroup.records}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </div>
        ) : (
          /* SINGLE SKU STATS VIEW */
          <Spin spinning={statsLoading}>
            {stats ? (
              <div style={{ padding: '8px 0' }}>
                {/* Product Info Card */}
                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {selectedFlashSale?.productId?.images?.[0] && (
                      <Avatar
                        src={selectedFlashSale.productId.images[0]}
                        shape="square"
                        size={64}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        {selectedFlashSale?.productId?.name}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 13 }}>
                        {selectedFlashSale?.variantSku ? (
                          <>
                            <strong>Variant SKU:</strong>{' '}
                            <Tag color="blue" style={{ marginLeft: 4 }}>
                              {selectedFlashSale.variantSku}
                            </Tag>
                          </>
                        ) : selectedFlashSale?.productId?.sku ? (
                          <>
                            <strong>SKU:</strong> {selectedFlashSale.productId.sku}
                          </>
                        ) : (
                          <span style={{ color: '#999' }}>SKU: N/A</span>
                        )}
                      </p>
                      {selectedFlashSale?.campaignTitle && (
                        <p style={{ margin: '4px 0 0 0', color: '#1890ff', fontSize: 13 }}>
                          🎯 {selectedFlashSale.campaignTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Price & Discount Stats */}
                <Card title="Price & Discount" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Flash Sale Price"
                        value={stats.salePrice}
                        suffix="₫"
                        valueStyle={{ fontSize: 18, color: '#f5222d', fontWeight: 'bold' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Original Price"
                        value={stats.originalPrice}
                        suffix="₫"
                        valueStyle={{
                          fontSize: 16,
                          color: '#8c8c8c',
                          textDecoration: 'line-through',
                        }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Discount %"
                        value={stats.discountPercent}
                        suffix="%"
                        valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
                        prefix="-"
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Savings"
                        value={stats.discountAmount}
                        suffix="₫"
                        valueStyle={{ fontSize: 16, color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Sales Performance */}
                <Card title="Sales Performance" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Sold / Total"
                        value={stats.soldQuantity}
                        suffix={`/ ${stats.totalQuantity}`}
                        valueStyle={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Sell Rate"
                        value={stats.soldPercentage}
                        suffix="%"
                        valueStyle={{
                          fontSize: 18,
                          color: stats.soldPercentage > 50 ? '#52c41a' : '#faad14',
                        }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Remaining"
                        value={stats.remainingQuantity}
                        valueStyle={{
                          fontSize: 18,
                          color: stats.remainingQuantity < 10 ? '#ff4d4f' : '#faad14',
                        }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Estimated Revenue"
                        value={(stats.soldQuantity * stats.salePrice).toLocaleString('vi-VN')}
                        suffix="₫"
                        valueStyle={{ fontSize: 16, color: '#722ed1', fontWeight: 'bold' }}
                      />
                    </Col>
                  </Row>

                  {/* Progress Bar */}
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>Sales Progress</span>
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>
                        {stats.soldQuantity} / {stats.totalQuantity}
                      </span>
                    </div>
                    <Progress
                      percent={stats.soldPercentage}
                      strokeColor={
                        stats.soldPercentage > 80
                          ? '#52c41a'
                          : stats.soldPercentage > 50
                            ? '#1890ff'
                            : '#faad14'
                      }
                      format={(pct) => `${pct}%`}
                      size={['100%', 20]}
                    />
                  </div>
                </Card>

                {/* Time Information */}
                <Card title="Time" size="small">
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                          🕒 Start
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {dayjs(stats.startAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                          ⏰ End
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {dayjs(stats.endAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </Col>
                    {stats.timeRemaining && stats.timeRemaining > 0 && (
                      <Col span={24}>
                        <Alert
                          message={
                            <span>
                              ⏳ Time remaining:{' '}
                              <strong>
                                {Math.floor(stats.timeRemaining / 3600000)} hour(s){' '}
                                {Math.floor((stats.timeRemaining % 3600000) / 60000)} minute(s)
                              </strong>
                            </span>
                          }
                          type="info"
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              </div>
            ) : (
              <Empty description="No statistics data available" />
            )}
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default FlashSalesPage;
