import { useState, useEffect, useMemo } from 'react';
import { Form, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { flashsaleService } from '../../services/api/flashsaleService';
import { productService } from '../../services/api';
import styles from '@assets/styles/seller/FlashSales.module.css';
import {
  FlashSalesHeader,
  OverviewStats,
  Toolbar,
  CampaignTable,
  EmptyState,
  FlashSaleDrawer,
  FlashSaleDetailDrawer,
  campaignColumns,
  variantColumns,
} from '../../components/seller/FlashSaleComponents';

/** Product models use `tierIndex` from API; support legacy `tier_index`. */
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

const FlashSalesPage = () => {
  // ── State ────────────────────────────────────────────────────────────────
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

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [variantConfigs, setVariantConfigs] = useState({});
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);
  const [productSearchText, setProductSearchText] = useState('');

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
        if (import.meta.env.DEV) {
console.warn('⚠️ Product has no models:', {
            productId: product._id,
            productName: product.name,
          });
}
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

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchFlashSales = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await flashsaleService.getAll({ page, limit });

      let flashSalesData = [];
      let pageInfo = { page, limit, total: 0 };

      if (Array.isArray(res)) {
        flashSalesData = res;
      } else if (res?.data) {
        flashSalesData = Array.isArray(res.data) ? res.data : [];
        pageInfo = {
          page: res.page ?? res.pagination?.page ?? page,
          limit: res.limit ?? res.pagination?.limit ?? limit,
          total: res.total ?? res.pagination?.total ?? flashSalesData.length,
        };
      }

      setFlashSales(flashSalesData);
      setPagination(pageInfo);
    } catch (error) {
      message.error(`Failed to fetch flash sales: ${error?.message || 'Unknown error'}`);
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (flashSaleId) => {
    try {
      setStatsLoading(true);
      const res = await flashsaleService.getStats(flashSaleId);
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
    fetchFlashSales();
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
      await flashsaleService.delete(id);
      message.success('Flash sale deleted successfully');
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error('Failed to delete flash sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (group) => {
    try {
      setLoading(true);
      await Promise.all(group.records.map((r) => flashsaleService.delete(r._id)));
      message.success(`Deleted campaign with ${group.records.length} variant(s)`);
      fetchFlashSales(pagination.page);
    } catch (error) {
      message.error('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

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
            _flashSaleId: record._id,
          };
          keys.push(k);
        }
      });

      setVariantConfigs(configs);
      setSelectedVariantKeys(keys);
      setSelectedFlashSale({ isCampaign: true, records: group.records });
      setCurrentStep(0);
      setIsModalVisible(true);
    } catch (error) {
      message.error(`Failed to load product: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEdit = async (record) => {
    setIsDetailModalVisible(false);
    setSelectedFlashSale(record);
    setCampaignInfo({
      title: record.campaignTitle || `Flash Sale - ${record.productId?.name || 'Product'}`,
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
        setSelectedFlashSale({ ...record, variantSku: variantModel.sku });
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
            _flashSaleId: record._id,
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
    setSelectedFlashSale(record);
    setSelectedCampaignGroup(null);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    fetchStats(record._id);
  };

  const handleViewCampaign = (group) => {
    setSelectedCampaignGroup(group);
    setSelectedFlashSale(group.records[0]);
    setIsModalVisible(false);
    setIsDetailModalVisible(true);
    setStats(null);
  };

  const handleOpenCreateModal = () => {
    setSelectedFlashSale(null);
    setCurrentStep(0);
    setCampaignInfo({ title: '', timeSlot: null, startTime: null, endTime: null });
    setSelectedProducts([]);
    setVariantConfigs({});
    setSelectedVariantKeys([]);
    setIsModalVisible(true);
  };

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

    if (config._flashSaleId) {
      try {
        setLoading(true);
        await flashsaleService.delete(config._flashSaleId);
        message.success('Variant removed from flash sale');
        applyLocalRemove();
        fetchFlashSales(pagination.page);
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
      if (!selectedFlashSale && campaignInfo.startTime.isBefore(dayjs().subtract(1, 'minute'))) {
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
          if (selectedFlashSale) {
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
      if (selectedFlashSale?.isCampaign) {
        await Promise.all(
          enabledVariants.map((variant) => {
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
          })
        );
        message.success(`Campaign updated (${enabledVariants.length} variant(s))`);
        handleCloseModal();
        fetchFlashSales(pagination.page);
        return;
      }

      // EDIT SINGLE MODE
      if (selectedFlashSale) {
        if (enabledVariants.length !== 1) {
          message.warning('Edit mode only supports 1 variant.');
          setLoading(false);
          return;
        }
        const variant = enabledVariants[0];
        const isSameVariant =
          variant.variantSku === selectedFlashSale.variantSku ||
          (!variant.variantSku && !selectedFlashSale.variantSku);
        if (!isSameVariant) {
          message.warning('Cannot change variant in edit mode.');
          setLoading(false);
          return;
        }

        await flashsaleService.update(selectedFlashSale._id, {
          salePrice: variant.salePrice,
          totalQuantity: variant.quantity,
          purchaseLimit: variant.purchaseLimit,
          startAt: campaignInfo.startTime.toISOString(),
          endAt: campaignInfo.endTime.toISOString(),
          campaignTitle: campaignInfo.title,
        });
        message.success('Flash sale updated successfully');
        handleCloseModal();
        fetchFlashSales(pagination.page);
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
          flashsaleService.createBatch({
            productId,
            campaignTitle: campaignInfo.title,
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
        `Created ${Object.keys(variantsByProduct).length} flash sale campaign(s) with ${enabledVariants.length} variant(s) successfully`
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
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered & grouped data ───────────────────────────────────────────────
  const filteredFlashSales = useMemo(
    () =>
      flashSales.filter((item) => {
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
      }),
    [flashSales, searchText, statusFilter, dateRangeFilter]
  );

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

  // ── Table handlers ───────────────────────────────────────────────────────
  const handleTableChange = (newPagination) =>
    fetchFlashSales(newPagination.current, newPagination.pageSize);
  const hasActiveFilters = searchText || statusFilter !== 'all' || dateRangeFilter;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <FlashSalesHeader
        groupedFlashSales={groupedFlashSales}
        onCreateClick={handleOpenCreateModal}
      />

      <OverviewStats
        overviewRange={overviewRange}
        setOverviewRange={setOverviewRange}
        overviewStats={overviewStats}
      />

      <Toolbar
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        flashSales={flashSales}
      />

      <Spin spinning={loading}>
        {filteredFlashSales.length > 0 || loading ? (
          <CampaignTable
            groupedFlashSales={groupedFlashSales}
            pagination={pagination}
            loading={loading}
            campaignColumns={campaignColumns(
              handleViewCampaign,
              handleEditCampaign,
              handleDeleteCampaign
            )}
            variantColumns={variantColumns(handleEdit, handleDelete)}
            handleTableChange={handleTableChange}
            handleViewCampaign={handleViewCampaign}
            handleViewDetail={handleViewDetail}
          />
        ) : (
          <EmptyState hasActiveFilters={hasActiveFilters} onCreateClick={handleOpenCreateModal} />
        )}
      </Spin>

      <FlashSaleDrawer
        open={isModalVisible}
        onClose={handleCloseModal}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        selectedFlashSale={selectedFlashSale}
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

      <FlashSaleDetailDrawer
        open={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedCampaignGroup(null);
        }}
        selectedFlashSale={selectedFlashSale}
        selectedCampaignGroup={selectedCampaignGroup}
        stats={stats}
        statsLoading={statsLoading}
        onEditCampaign={handleEditCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default FlashSalesPage;
