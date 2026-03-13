import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  InputGroup,
  Table,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import PageTransition from '@components/common/PageTransition';
import ProductSelectorModal from '@components/seller/vouchers/ProductSelectorModal';
import shopProgramService from '@services/api/shopProgramService';
import styles from '@assets/styles/seller/ShopProgramForm.module.css';

const { RangePicker } = DatePicker;

const ShopProgramForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = location.pathname.includes('/edit/');

  // Form State
  const [programName, setProgramName] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBatchSettings, setShowBatchSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch Data for Edit/View
  useEffect(() => {
    if (id && (isEditMode || isViewMode)) {
      fetchProgramData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const fetchProgramData = async () => {
    setLoading(true);
    try {
      const res = await shopProgramService.getProgram(id);
      const data = res.data?.data || res.data;

      if (data) {
        setProgramName(data.name);
        if (data.startDate && data.endDate) {
          setDateRange([dayjs(data.startDate), dayjs(data.endDate)]);
        }

        if (data.products) {
          const mappedProducts = data.products.map((p) => {
            const product = p.productId || {};
            const variants = p.variants || [];
            const models = product.models || [];

            return {
              _id: product._id,
              name: product.productName || product.name, // Fallback to snapshot name if product deleted?
              images: product.images || [], // Should use snapshot image theoretically but structure uses product ref
              originalPrice: product.price || 0,
              variants: variants.map((v) => {
                // Find current stock from model
                // v.variantId format: "productId-index"
                const parts = v.variantId.split('-');
                const idx = parseInt(parts[parts.length - 1]);
                const model = models[idx] || {};
                // Use current stock if available, else 0 (safeguard)
                const currentStock =
                  model.stock !== undefined ? model.stock : product.totalStock || 0;

                return {
                  id: v.variantId,
                  name: v.variantName,
                  originalPrice: v.originalPrice,
                  salePrice: v.salePrice,
                  discount: v.discount,
                  discountType: v.discountType,
                  stock: currentStock,
                  promoQty: v.promoQty,
                  promoQtyType: v.promoQty > 0 ? 'limited' : 'unlimited', // Infer type? Or assume limited based on logic
                  orderLimit: v.orderLimit,
                  orderLimitType: v.orderLimit ? 'limited' : 'unlimited',
                  enabled: v.enabled,
                };
              }),
            };
          });
          // Adjust promoQtyType logic: if stock > promoQty, it might be limited.
          // Wait, if saved promoQty is 0 and stock is > 0, it likely meant unlimited?
          // Or check backend default.
          // Actually, if saved promoQty is > 0, set type 'limited'.
          // If saved promoQty == 0?? Backend saves 0 for unlimited? Or equal to stock?
          // In handleAddProducts, it sets promoQty = stock.
          // So effectively it's always "limited" to stock initially.
          // If user chose "Unlimited" in UI, frontend usually sets it to available stock?
          // Let's check `applyBatchSettings`.
          // If `batchPromoQtyType === 'unlimited'`, it clears `promoQty` (sets to empty string).
          // But variant validation sets errors if empty? No.
          // Let's stick to mapped data.
          setProducts(mappedProducts);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load program data');
    } finally {
      setLoading(false);
    }
  };

  // Batch Settings State
  const [batchDiscount, setBatchDiscount] = useState('');
  const [batchPromoQtyType, setBatchPromoQtyType] = useState('unlimited');
  const [batchPromoQty, setBatchPromoQty] = useState('');
  const [batchOrderLimitType, setBatchOrderLimitType] = useState('unlimited');
  const [batchOrderLimit, setBatchOrderLimit] = useState('');

  // Error States
  const [variantErrors, setVariantErrors] = useState({}); // { variantId: { field: errorMessage } }
  const [batchErrors, setBatchErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  // Add products from modal
  const handleAddProducts = (selectedItems) => {
    const newProducts = selectedItems.map((item) => ({
      _id: item._id,
      name: item.name,
      images: item.images,
      originalPrice: item.price || item.originalPrice,
      variants: item.models?.map((m, idx) => ({
        id: `${item._id}-${idx}`,
        name: m.name || `Variant ${idx + 1}`,
        originalPrice: m.price || item.originalPrice,
        salePrice: m.price || item.originalPrice,
        discount: 0,
        discountType: 'fixed',
        stock: m.stock || 0,
        promoQty: m.stock || 0,
        orderLimit: null,
        enabled: true,
      })) || [
        {
          id: `${item._id}-0`,
          name: 'Default',
          originalPrice: item.price || item.originalPrice,
          salePrice: item.price || item.originalPrice,
          discount: 0,
          discountType: 'fixed',
          stock: item.totalStock || 0,
          promoQty: item.totalStock || 0,
          orderLimit: null,
          enabled: true,
        },
      ],
    }));

    setProducts((prev) => [
      ...prev,
      ...newProducts.filter((np) => !prev.some((p) => p._id === np._id)),
    ]);
    setShowProductModal(false);
  };

  // Validate a single variant
  const validateVariant = (variant, stock) => {
    const errors = {};

    // Sale Price Validation
    if (variant.salePrice <= 0) {
      errors.salePrice = 'Sale price must be greater than 0';
    } else if (variant.salePrice >= variant.originalPrice) {
      errors.salePrice = 'Sale price must be less than original price';
    }

    // Discount Validation
    if (variant.discountType === 'percent') {
      if (variant.discount < 1 || variant.discount > 99) {
        errors.discount = 'Discount must be between 1% and 99%';
      }
    } else {
      if (variant.discount <= 0) {
        errors.discount = 'Discount must be greater than 0';
      } else if (variant.discount >= variant.originalPrice) {
        errors.discount = 'Discount must be less than original price';
      }
    }

    // Promo Quantity Validation - relaxed when stock = 0
    if (variant.promoQtyType === 'limited') {
      const qty = parseInt(variant.promoQty);
      if (isNaN(qty) || qty < 0) {
        errors.promoQty = 'Must be at least 0';
      } else if (stock > 0 && qty > stock) {
        errors.promoQty = `Max ${stock}`;
      }
    }

    return errors;
  };

  // Update variant field
  const updateVariant = (productId, variantId, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) {
          return p;
        }
        return {
          ...p,
          variants: p.variants.map((v) => {
            if (v.id !== variantId) {
              return v;
            }
            const updated = { ...v, [field]: value };

            // Auto-calculate discount when salePrice changes
            if (field === 'salePrice') {
              updated.discount = v.originalPrice - value;
              updated.discountType = 'fixed';
            }
            // Auto-calculate salePrice when discount changes
            if (field === 'discount') {
              if (updated.discountType === 'percent') {
                updated.salePrice = v.originalPrice * (1 - value / 100);
              } else {
                updated.salePrice = v.originalPrice - value;
              }
            }

            // Validate
            const errors = validateVariant(updated, v.stock);
            setVariantErrors((prev) => ({
              ...prev,
              [variantId]: errors,
            }));

            return updated;
          }),
        };
      })
    );
  };

  // Toggle variant enabled
  const toggleVariant = (productId, variantId) => {
    updateVariant(
      productId,
      variantId,
      'enabled',
      !products.find((p) => p._id === productId)?.variants.find((v) => v.id === variantId)?.enabled
    );
  };

  // Apply batch settings to ALL products/variants
  const applyBatchSettings = () => {
    const errors = {};
    if (batchDiscount && (parseFloat(batchDiscount) < 1 || parseFloat(batchDiscount) > 99)) {
      errors.discount = '1-99%';
    }
    if (batchPromoQtyType === 'limited' && (!batchPromoQty || parseInt(batchPromoQty) < 1)) {
      errors.promoQty = 'min 1';
    }
    if (batchOrderLimitType === 'limited' && (!batchOrderLimit || parseInt(batchOrderLimit) < 1)) {
      errors.orderLimit = 'min 1';
    }

    if (Object.keys(errors).length > 0) {
      setBatchErrors(errors);
      return;
    }
    setBatchErrors({});

    setProducts((prev) =>
      prev.map((p) => {
        const shouldApply = selectedProductIds.length === 0 || selectedProductIds.includes(p._id);
        if (!shouldApply) {
          return p;
        }

        return {
          ...p,
          orderLimitType: batchOrderLimitType,
          orderLimit: batchOrderLimitType === 'limited' ? batchOrderLimit : '',
          variants: p.variants.map((v) => {
            const updated = { ...v };
            if (batchDiscount) {
              updated.discount = parseFloat(batchDiscount);
              updated.discountType = 'percent'; // Only % for batch
              updated.salePrice = v.originalPrice * (1 - parseFloat(batchDiscount) / 100);
            }
            updated.promoQtyType = batchPromoQtyType;
            if (batchPromoQtyType === 'limited' && batchPromoQty) {
              updated.promoQty = parseInt(batchPromoQty);
            } else {
              updated.promoQty = '';
            }

            // Update variant errors
            const vErrors = validateVariant(updated, v.stock);
            setVariantErrors((prevErrors) => ({
              ...prevErrors,
              [v.id]: vErrors,
            }));

            return updated;
          }),
        };
      })
    );
  };

  // Delete product
  const deleteProduct = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setVariantErrors((prev) => {
        const next = { ...prev };
        product.variants.forEach((v) => delete next[v.id]);
        return next;
      });
    }
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  // Delete selected products
  const deleteSelectedProducts = () => {
    if (selectedProductIds.length === 0) {
      alert('Please select products to delete');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedProductIds.length} selected product(s)?`
      )
    ) {
      setVariantErrors((prev) => {
        const next = { ...prev };
        products.forEach((p) => {
          if (selectedProductIds.includes(p._id)) {
            p.variants.forEach((v) => delete next[v.id]);
          }
        });
        return next;
      });
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
    }
  };

  // Toggle select all
  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedProductIds(products.map((p) => p._id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!programName) {
      message.error('Program name is required.');
      isValid = false;
    }
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error('Promotion period is required.');
      isValid = false;
    }
    if (products.length === 0) {
      message.error('Please add at least one product.');
      isValid = false;
    }
    const hasVariantErrors = Object.values(variantErrors).some(
      (err) => Object.keys(err).length > 0
    );
    if (hasVariantErrors) {
      message.error('Please fix errors in the product table.');
      isValid = false;
    }
    return isValid;
  };

  // Handle Submit
  const handleSubmit = async () => {
    setShowErrors(true);
    if (isViewMode) {
      return; // Prevent submit in view mode
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create or Update program
      let programId;
      if (isEditMode) {
        await shopProgramService.updateProgram(id, {
          name: programName,
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
        });
        programId = id;
      } else {
        const programRes = await shopProgramService.createProgram({
          name: programName,
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
        });
        programId = programRes.data?.data?._id || programRes.data?._id || programRes._id;
      }

      // 2. Add products / Update products
      // For simple Edit implementation:
      // - Retrieve existing products is handled (fetched).
      // - New products added? Logic below checks IDs.
      // - If Edit Mode, we need to handle existing vs new?
      // - Current `addProducts` adds NEW products.
      // - We should check which products are new in state vs originally fetched.
      // - BUT, for now, let's assume `addProducts` safely skips existing (backend check).
      // - AND we need to update variants for ALL products (existing + new).
      // - `addProducts` creates variants for new ones.
      // - We'll call `addProducts` with ALL current product IDs. Backend skips existing? Yes.

      const productIds = products.map((p) => p._id);
      await shopProgramService.addProducts(programId, productIds);

      // 3. Update Variants (Batch update for all to ensure savings)
      // We need to construct batch settings payload or call update per product
      // `batchUpdateVariants` expects `variantIds` and `settings`.
      // But here we have specific settings per variant.
      // So we must loop and call `updateProductVariants` or similar.
      // Or create a new endpoint for "Bulk Update All Program Variants".
      // Service `batchUpdateVariants` is for applying SAME settings to many.
      // Service `updateProductVariants` takes `variants` array.

      // Parallel update for all products
      await Promise.all(
        products.map((p) =>
          shopProgramService.updateProductVariants(
            programId,
            p._id,
            p.variants.map((v) => ({
              variantId: v.id,
              salePrice: v.salePrice,
              discount: v.discount,
              discountType: v.discountType,
              promoQty: v.promoQty === '' ? v.stock : v.promoQty, // Handle empty as stock/unlimited?
              orderLimit: v.orderLimit,
              enabled: v.enabled,
            }))
          )
        )
      );

      message.success(
        isEditMode ? 'Program updated successfully!' : 'Program created successfully!'
      );
      navigate('/seller/promotions');
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save program';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <Container fluid className={`p-4 ${styles.container}`}>
        {/* Basic Info Section */}
        <Card className={styles.section}>
          <Card.Body className="p-4">
            <h5 className={styles.sectionTitle}>Basic Information</h5>

            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className={styles.label}>
                Program Name
              </Form.Label>
              <Col sm={6}>
                <Form.Control
                  type="text"
                  placeholder=""
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  maxLength={150}
                  className={styles.input}
                  isInvalid={showErrors && !programName}
                />
                <Form.Control.Feedback type="invalid">
                  Program name is required
                </Form.Control.Feedback>
                <Form.Text className="text-muted float-end">{programName.length}/150</Form.Text>
              </Col>
              <Col sm={3}>
                <span className={styles.hint}>Program name will not be shown to buyers.</span>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className={styles.label}>
                Promotion Period
              </Form.Label>
              <Col sm={6}>
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="HH:mm DD-MM-YYYY"
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  className={styles.datePicker}
                  style={{ width: '100%' }}
                />
                <Form.Text className="text-muted">
                  Program duration cannot exceed 180 days.
                </Form.Text>
              </Col>
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Products Section */}
        <Card className={styles.section}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className={styles.sectionTitle}>Promotion Products</h5>
                <span className={styles.productCount}>Total {products.length} product(s)</span>
              </div>
              <div className="d-flex gap-2">
                {products.length > 0 && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowBatchSettings(!showBatchSettings)}
                  >
                    <i className={`bi bi-chevron-${showBatchSettings ? 'up' : 'down'} me-1`}></i>
                    Batch Settings
                  </Button>
                )}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowProductModal(true)}
                >
                  <i className="bi bi-plus me-1"></i>
                  Add Products
                </Button>
              </div>
            </div>

            {/* Batch Settings Row - only show when toggle is on and has products */}
            {showBatchSettings && products.length > 0 && (
              <div className={styles.batchRow}>
                <div className={styles.batchLabel}>
                  <Form.Check
                    type="checkbox"
                    label="Batch Settings"
                    className="fw-medium"
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  <div className="text-muted small">
                    {selectedProductIds.length} product(s) selected
                  </div>
                </div>
                <div className={styles.batchFields}>
                  <div className={styles.batchField}>
                    <div className="small text-muted mb-1">Discount</div>
                    <InputGroup size="sm">
                      <Form.Control
                        type="number"
                        value={batchDiscount}
                        onChange={(e) => {
                          setBatchDiscount(e.target.value);
                          if (batchErrors.discount) {
                            setBatchErrors((prev) => ({ ...prev, discount: null }));
                          }
                        }}
                        placeholder="0"
                        isInvalid={!!batchErrors.discount}
                        min="1"
                        max="99"
                      />
                      <InputGroup.Text>%OFF</InputGroup.Text>
                      <Form.Control.Feedback type="invalid">
                        {batchErrors.discount}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </div>
                  <div className={styles.batchField}>
                    <div className="small text-muted mb-1">Promo Quantity</div>
                    <div className="d-flex align-items-center gap-1">
                      <Form.Select
                        size="sm"
                        value={batchPromoQtyType}
                        onChange={(e) => setBatchPromoQtyType(e.target.value)}
                        style={{ maxWidth: '90px' }}
                      >
                        <option value="unlimited">No limit</option>
                        <option value="limited">Limited</option>
                      </Form.Select>
                      {batchPromoQtyType === 'limited' && (
                        <div className="position-relative">
                          <Form.Control
                            type="number"
                            size="sm"
                            value={batchPromoQty}
                            onChange={(e) => {
                              setBatchPromoQty(e.target.value);
                              if (batchErrors.promoQty) {
                                setBatchErrors((prev) => ({ ...prev, promoQty: null }));
                              }
                            }}
                            placeholder="Qty"
                            style={{ maxWidth: '70px' }}
                            min="1"
                            isInvalid={!!batchErrors.promoQty}
                          />
                          <Form.Control.Feedback type="invalid" tooltip>
                            {batchErrors.promoQty}
                          </Form.Control.Feedback>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.batchField}>
                    <div className="small text-muted mb-1">Order Limit / Customer</div>
                    <div className="d-flex align-items-center gap-1">
                      <Form.Select
                        size="sm"
                        value={batchOrderLimitType}
                        onChange={(e) => setBatchOrderLimitType(e.target.value)}
                        style={{ maxWidth: '90px' }}
                      >
                        <option value="unlimited">No limit</option>
                        <option value="limited">Limited</option>
                      </Form.Select>
                      {batchOrderLimitType === 'limited' && (
                        <div className="position-relative">
                          <Form.Control
                            type="number"
                            size="sm"
                            value={batchOrderLimit}
                            onChange={(e) => {
                              setBatchOrderLimit(e.target.value);
                              if (batchErrors.orderLimit) {
                                setBatchErrors((prev) => ({ ...prev, orderLimit: null }));
                              }
                            }}
                            placeholder="Limit"
                            style={{ maxWidth: '70px' }}
                            min="1"
                            isInvalid={!!batchErrors.orderLimit}
                          />
                          <Form.Control.Feedback type="invalid" tooltip>
                            {batchErrors.orderLimit}
                          </Form.Control.Feedback>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.batchActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={applyBatchSettings}
                      className={styles.applyBtn}
                    >
                      <i className="bi bi-check2-all me-1"></i>
                      Apply
                    </Button>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Delete selected products</Tooltip>}
                    >
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className={styles.deleteBtn}
                        onClick={deleteSelectedProducts}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </OverlayTrigger>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table - only show when has products */}
            {products.length > 0 && (
              <div className={styles.tableWrapper}>
                <Table className={styles.productTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <Form.Check type="checkbox" />
                      </th>
                      <th>Product Name</th>
                      <th>Original Price</th>
                      <th>Sale Price</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>
                        Promo Qty{' '}
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id="promo-qty-tooltip">
                              Number of products reserved for this Promotion Program. To ensure
                              enough stock for the program, this quantity will be deducted from
                              total stock until program ends. If set to &quot;No limit&quot;, all
                              products will be sold at discount price throughout the program.
                            </Tooltip>
                          }
                        >
                          <i
                            className="bi bi-question-circle text-muted"
                            style={{ fontSize: '12px', cursor: 'help' }}
                          ></i>
                        </OverlayTrigger>
                      </th>
                      <th>
                        Order Limit{' '}
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id="order-limit-tooltip">
                              Maximum number of products a customer can purchase in this Discount
                              Program.
                            </Tooltip>
                          }
                        >
                          <i
                            className="bi bi-question-circle text-muted"
                            style={{ fontSize: '12px', cursor: 'help' }}
                          ></i>
                        </OverlayTrigger>
                      </th>
                      <th>Enable</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <React.Fragment key={product._id}>
                        {/* Product Header Row */}
                        <tr className={styles.productRow}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedProductIds.includes(product._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds((prev) => [...prev, product._id]);
                                } else {
                                  setSelectedProductIds((prev) =>
                                    prev.filter((id) => id !== product._id)
                                  );
                                }
                              }}
                            />
                          </td>
                          <td colSpan={6}>
                            <div className="d-flex align-items-center">
                              <img
                                src={product.images?.[0] || 'https://via.placeholder.com/40'}
                                alt=""
                                className={styles.productImage}
                              />
                              <span className="ms-2 fw-medium">{product.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <Form.Select
                                size="sm"
                                className={styles.limitSelect}
                                value={product.orderLimitType || 'unlimited'}
                                onChange={(e) => {
                                  setProducts((prev) =>
                                    prev.map((p) =>
                                      p._id === product._id
                                        ? { ...p, orderLimitType: e.target.value }
                                        : p
                                    )
                                  );
                                }}
                                disabled={isViewMode}
                              >
                                <option value="unlimited">No limit</option>
                                <option value="limited">Limited</option>
                              </Form.Select>
                              {product.orderLimitType === 'limited' && (
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  className={styles.orderLimitInput}
                                  value={product.orderLimit || ''}
                                  onChange={(e) => {
                                    setProducts((prev) =>
                                      prev.map((p) =>
                                        p._id === product._id
                                          ? { ...p, orderLimit: e.target.value }
                                          : p
                                      )
                                    );
                                  }}
                                  placeholder="Limit"
                                  min="1"
                                  disabled={isViewMode}
                                />
                              )}
                            </div>
                          </td>
                          <td></td>
                          <td>
                            {!isViewMode && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Remove product</Tooltip>}
                              >
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  onClick={() => deleteProduct(product._id)}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '16px' }}></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                          </td>
                        </tr>

                        {/* Variant Rows */}
                        {product.variants.map((variant) => (
                          <tr key={variant.id} className={styles.variantRow}>
                            <td></td>
                            <td className={styles.variantName}>{variant.name}</td>
                            <td className={styles.originalPrice}>
                              ₫{variant.originalPrice.toLocaleString()}
                            </td>
                            <td>
                              <InputGroup size="sm" className={styles.priceInput} hasValidation>
                                <InputGroup.Text>₫</InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  value={variant.salePrice}
                                  onChange={(e) =>
                                    updateVariant(
                                      product._id,
                                      variant.id,
                                      'salePrice',
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  isInvalid={!!variantErrors[variant.id]?.salePrice}
                                  min="1"
                                  disabled={isViewMode}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {variantErrors[variant.id]?.salePrice}
                                </Form.Control.Feedback>
                              </InputGroup>
                            </td>
                            <td>
                              <InputGroup size="sm" className={styles.discountInput} hasValidation>
                                <InputGroup.Text>OR</InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  value={variant.discount}
                                  onChange={(e) =>
                                    updateVariant(
                                      product._id,
                                      variant.id,
                                      'discount',
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  isInvalid={!!variantErrors[variant.id]?.discount}
                                  min="1"
                                  max={variant.discountType === 'percent' ? 99 : undefined}
                                  disabled={isViewMode}
                                />
                                <InputGroup.Text>%OFF</InputGroup.Text>
                                <Form.Control.Feedback type="invalid">
                                  {variantErrors[variant.id]?.discount}
                                </Form.Control.Feedback>
                              </InputGroup>
                            </td>
                            <td className={styles.stockCell}>{variant.stock}</td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <Form.Select
                                  size="sm"
                                  className={styles.promoQtySelect}
                                  value={variant.promoQtyType || 'unlimited'}
                                  onChange={(e) =>
                                    updateVariant(
                                      product._id,
                                      variant.id,
                                      'promoQtyType',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                >
                                  <option value="unlimited">No limit</option>
                                  <option value="limited">Limited</option>
                                </Form.Select>
                                {variant.promoQtyType === 'limited' && (
                                  <div className="position-relative">
                                    <Form.Control
                                      type="number"
                                      size="sm"
                                      className={styles.promoQtyInput}
                                      value={variant.promoQty || ''}
                                      onChange={(e) =>
                                        updateVariant(
                                          product._id,
                                          variant.id,
                                          'promoQty',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Qty"
                                      min="1"
                                      isInvalid={!!variantErrors[variant.id]?.promoQty}
                                      disabled={isViewMode}
                                    />
                                    <Form.Control.Feedback type="invalid" tooltip>
                                      {variantErrors[variant.id]?.promoQty}
                                    </Form.Control.Feedback>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <Form.Select
                                  size="sm"
                                  className={styles.limitSelect}
                                  value={variant.orderLimitType || 'unlimited'}
                                  onChange={(e) =>
                                    updateVariant(
                                      product._id,
                                      variant.id,
                                      'orderLimitType',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                >
                                  <option value="unlimited">No limit</option>
                                  <option value="limited">Limited</option>
                                </Form.Select>
                                {variant.orderLimitType === 'limited' && (
                                  <div className="position-relative">
                                    <Form.Control
                                      type="number"
                                      size="sm"
                                      className={styles.orderLimitInput}
                                      value={variant.orderLimit || ''}
                                      onChange={(e) =>
                                        updateVariant(
                                          product._id,
                                          variant.id,
                                          'orderLimit',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Limit"
                                      min="1"
                                      isInvalid={!!variantErrors[variant.id]?.orderLimit}
                                      disabled={isViewMode}
                                    />
                                    <Form.Control.Feedback type="invalid" tooltip>
                                      {variantErrors[variant.id]?.orderLimit}
                                    </Form.Control.Feedback>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <Form.Check
                                type="switch"
                                checked={variant.enabled}
                                onChange={() => toggleVariant(product._id, variant.id)}
                                className={styles.enableSwitch}
                                disabled={isViewMode}
                              />
                            </td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {!isViewMode && (
          <div className={styles.stickyFooter}>
            <div className="container-fluid px-4">
              <div className="d-flex justify-content-end gap-3 align-items-center h-100">
                <Button variant="outline-secondary" onClick={() => navigate('/seller/promotions')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5"
                >
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isEditMode ? (
                    'Update Program'
                  ) : (
                    'Create Program'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Selector Modal */}
        <ProductSelectorModal
          visible={showProductModal}
          onCancel={() => setShowProductModal(false)}
          onConfirm={handleAddProducts}
          initialSelectedIds={products.map((p) => p._id)}
        />
      </Container>
    </PageTransition>
  );
};

export default ShopProgramForm;
