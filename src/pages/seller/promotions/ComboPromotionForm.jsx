import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  Table,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Added useParams, useLocation
import { DatePicker, message, Spin } from 'antd'; // Added message, Spin
import dayjs from 'dayjs'; // Added dayjs
import PageTransition from '@components/common/PageTransition';
import ProductSelectorModal from '@components/seller/vouchers/ProductSelectorModal';
import comboService from '@services/api/comboService'; // Added service
import styles from '@assets/styles/seller/ComboPromotionForm.module.css';

const { RangePicker } = DatePicker;

const ComboPromotionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = location.pathname.includes('/edit/');

  // Basic Info State
  const [comboName, setComboName] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [comboType, setComboType] = useState('percent'); // percent | fixed | special
  const [orderLimit, setOrderLimit] = useState('');
  const [loading, setLoading] = useState(false);

  // Tier Discounts State
  const [tiers, setTiers] = useState([{ id: 'tier-1', quantity: '', value: '' }]);

  // Products State
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);

  // Error States
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  // Fetch Data for Edit/View
  // Fetch Data for Edit/View
  useEffect(() => {
    if (id && (isEditMode || isViewMode)) {
      fetchComboData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const fetchComboData = async () => {
    setLoading(true);
    try {
      const res = await comboService.getCombo(id);
      const data = res.data?.data || res.data;
      if (data) {
        setComboName(data.name);
        if (data.startDate && data.endDate) {
          setDateRange([dayjs(data.startDate), dayjs(data.endDate)]);
        }
        setComboType(data.comboType);
        if (data.tiers) {
          setTiers(data.tiers.map((t, idx) => ({ ...t, id: `tier-${idx}` })));
        }
        setOrderLimit(data.orderLimit || '');
        if (data.products) {
          setProducts(
            data.products.map((p) => ({
              _id: p._id,
              name: p.name,
              images: p.images,
              price: p.originalPrice,
              stock:
                p.totalStock !== undefined
                  ? p.totalStock
                  : p.models?.reduce((acc, m) => acc + (m.stock || 0), 0) || 0,
              shippingInfo: 'Fast, Self-pickup', // Mock or real if available
              enabled: true,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load combo data');
    } finally {
      setLoading(false);
    }
  };

  // Add new tier
  const addTier = () => {
    const newTier = {
      id: `tier-${Date.now()}`,
      quantity: '',
      value: '',
    };
    setTiers((prev) => [...prev, newTier]);
  };

  // Remove tier
  const removeTier = (tierId) => {
    if (isViewMode) {
      return;
    }
    if (tiers.length > 1) {
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    }
  };

  // Update tier
  const updateTier = (tierId, field, value) => {
    if (isViewMode) {
      return;
    }
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, [field]: value } : t)));
  };

  // Add products from modal
  const handleAddProducts = (selectedItems) => {
    if (isViewMode) {
      return;
    }
    const newProducts = selectedItems.map((item) => ({
      _id: item._id,
      name: item.name,
      images: item.images,
      price: item.price !== undefined ? item.price : item.originalPrice || 0,
      stock: item.totalStock || item.stock || 0,
      shippingInfo: 'Fast, Self-pickup',
      enabled: true,
    }));

    setProducts((prev) => [
      ...prev,
      ...newProducts.filter((np) => !prev.some((p) => p._id === np._id)),
    ]);
    setShowProductModal(false);
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    if (isViewMode) {
      return;
    }
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Toggle all products
  const toggleSelectAll = (checked) => {
    if (isViewMode) {
      return;
    }
    if (checked) {
      setSelectedProductIds(products.map((p) => p._id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // Toggle product enabled
  const toggleProductEnabled = (productId) => {
    if (isViewMode) {
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Delete product
  const deleteProduct = (productId) => {
    if (isViewMode) {
      return;
    }
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  // Batch actions
  const batchDisable = () => {
    if (isViewMode) {
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.includes(p._id) ? { ...p, enabled: false } : p))
    );
  };

  const batchEnable = () => {
    if (isViewMode) {
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.includes(p._id) ? { ...p, enabled: true } : p))
    );
  };

  const batchDelete = () => {
    if (isViewMode) {
      return;
    }
    if (selectedProductIds.length === 0) {
      message.warning('Please select products to delete');
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete ${selectedProductIds.length} product(s)?`)
    ) {
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!comboName.trim()) {
      newErrors.comboName = 'Combo name is required';
    } else if (comboName.length > 25) {
      newErrors.comboName = 'Combo name must be 25 characters or less';
    }

    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      newErrors.dateRange = 'Combo duration is required';
    }

    // Validate tiers
    tiers.forEach((tier, _idx) => {
      if (!tier.quantity || parseInt(tier.quantity) < 1) {
        newErrors[`tier-${tier.id}-qty`] = 'Quantity must be >= 1';
      }
      if (!tier.value || parseFloat(tier.value) <= 0) {
        newErrors[`tier-${tier.id}-value`] = 'Value must be > 0';
      }
      if (comboType === 'percent' && parseFloat(tier.value) > 99) {
        newErrors[`tier-${tier.id}-value`] = 'Discount cannot exceed 99%';
      }
    });

    if (products.length === 0) {
      newErrors.products = 'Please add at least 1 product';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (isViewMode) {
      return;
    }
    setShowErrors(true);

    if (!validateForm()) {
      message.error('Please check your input');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: comboName,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        comboType,
        tiers: tiers.map((t) => ({ quantity: parseInt(t.quantity), value: parseFloat(t.value) })),
        orderLimit: orderLimit ? parseInt(orderLimit) : 0,
        products: products.map((p) => p._id),
      };

      if (isEditMode) {
        await comboService.updateCombo(id, payload);
        message.success('Combo promotion updated successfully');
      } else {
        await comboService.createCombo(payload);
        message.success('Combo promotion created successfully');
      }
      navigate('/seller/promotions');
    } catch (error) {
      console.error('Submit error:', error);
      message.error(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setLoading(false);
    }
  };

  // Get tier label based on combo type
  const getTierLabel = () => {
    switch (comboType) {
      case 'percent':
        return { prefix: 'Buy', mid: 'products to get', suffix: '% OFF' };
      case 'fixed_price':
        return { prefix: 'Buy', mid: 'products to save', suffix: '₫' };
      case 'special_price':
        return { prefix: 'Buy', mid: 'products for only', suffix: '₫' };
      default:
        return { prefix: 'Buy', mid: 'products to get', suffix: '%' };
    }
  };

  const tierLabel = getTierLabel();

  return (
    <PageTransition>
      <Container fluid className={`p-4 ${styles.container}`}>
        {/* Basic Info Section */}
        <Card className={styles.section}>
          <Card.Body className="p-4">
            <h5 className={styles.sectionTitle}>Basic Information</h5>

            {/* Combo Name */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className={styles.label}>
                Combo Name
              </Form.Label>
              <Col sm={6}>
                <Form.Control
                  type="text"
                  placeholder="Enter combo name"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  maxLength={25}
                  className={styles.input}
                  isInvalid={showErrors && errors.comboName}
                  disabled={isViewMode}
                />
                <Form.Control.Feedback type="invalid">{errors.comboName}</Form.Control.Feedback>
                <Form.Text className={styles.hint}>
                  This name will not be displayed to buyers
                </Form.Text>
                <Form.Text className="text-muted float-end">{comboName.length}/25</Form.Text>
              </Col>
            </Form.Group>

            {/* Date Range */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className={styles.label}>
                Combo Duration
              </Form.Label>
              <Col sm={6}>
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="HH:mm DD-MM-YYYY"
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  className={`${styles.datePicker} w-100`}
                  placeholder={['Start Date', 'End Date']}
                  disabled={isViewMode}
                />
                {showErrors && errors.dateRange && (
                  <div className="invalid-feedback d-block">{errors.dateRange}</div>
                )}
              </Col>
            </Form.Group>

            {/* Combo Type */}
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3} className={styles.label}>
                Combo Type
              </Form.Label>
              <Col sm={9}>
                {/* Combo Type Selection with Dynamic Tiers */}
                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    name="comboType"
                    id="type-percent"
                    label="Percentage Discount"
                    checked={comboType === 'percent'}
                    onChange={() => setComboType('percent')}
                    className={styles.radioOption}
                    disabled={isViewMode}
                  />
                  {comboType === 'percent' && (
                    <div className={styles.tierContainer}>
                      <div className={styles.tierHeader}>
                        <span className={styles.tierHeaderLabel}>Discount Tier</span>
                        <span className={styles.tierHeaderLabel}>Action</span>
                      </div>
                      <div className={styles.tierList}>
                        {tiers.map((tier, index) => (
                          <div key={tier.id} className={styles.tierRow}>
                            <span className={styles.tierIndex}>{index + 1}</span>
                            <span className={styles.tierLabel}>{tierLabel.prefix}</span>
                            <Form.Control
                              type="number"
                              value={tier.quantity}
                              onChange={(e) => updateTier(tier.id, 'quantity', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-qty`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierLabel}>{tierLabel.mid}</span>
                            <Form.Control
                              type="number"
                              value={tier.value}
                              onChange={(e) => updateTier(tier.id, 'value', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              max={comboType === 'percent' ? 99 : undefined}
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-value`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierSuffix}>{tierLabel.suffix}</span>
                            {tiers.length > 1 && !isViewMode && (
                              <OverlayTrigger placement="top" overlay={<Tooltip>Remove</Tooltip>}>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className={`text-danger p-0 ${styles.tierDeleteBtn}`}
                                  onClick={() => removeTier(tier.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        ))}
                      </div>
                      {!isViewMode && (
                        <Button
                          variant="link"
                          size="sm"
                          className={styles.addTierBtn}
                          onClick={addTier}
                        >
                          <i className="bi bi-plus"></i>
                          Add Discount Tier
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    name="comboType"
                    id="type-fixed"
                    label="Fixed Amount Discount"
                    checked={comboType === 'fixed_price'}
                    onChange={() => setComboType('fixed_price')}
                    className={styles.radioOption}
                    disabled={isViewMode}
                  />
                  {comboType === 'fixed_price' && (
                    <div className={styles.tierContainer}>
                      <div className={styles.tierHeader}>
                        <span className={styles.tierHeaderLabel}>Discount Tier</span>
                        <span className={styles.tierHeaderLabel}>Action</span>
                      </div>
                      <div className={styles.tierList}>
                        {tiers.map((tier, index) => (
                          <div key={tier.id} className={styles.tierRow}>
                            <span className={styles.tierIndex}>{index + 1}</span>
                            <span className={styles.tierLabel}>{tierLabel.prefix}</span>
                            <Form.Control
                              type="number"
                              value={tier.quantity}
                              onChange={(e) => updateTier(tier.id, 'quantity', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-qty`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierLabel}>{tierLabel.mid}</span>
                            <Form.Control
                              type="number"
                              value={tier.value}
                              onChange={(e) => updateTier(tier.id, 'value', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-value`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierSuffix}>{tierLabel.suffix}</span>
                            {tiers.length > 1 && !isViewMode && (
                              <OverlayTrigger placement="top" overlay={<Tooltip>Remove</Tooltip>}>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className={`text-danger p-0 ${styles.tierDeleteBtn}`}
                                  onClick={() => removeTier(tier.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        ))}
                      </div>
                      {!isViewMode && (
                        <Button
                          variant="link"
                          size="sm"
                          className={styles.addTierBtn}
                          onClick={addTier}
                        >
                          <i className="bi bi-plus"></i>
                          Add Discount Tier
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    name="comboType"
                    id="type-special"
                    label="Special Price"
                    checked={comboType === 'special_price'}
                    onChange={() => setComboType('special_price')}
                    className={styles.radioOption}
                    disabled={isViewMode}
                  />
                  {comboType === 'special_price' && (
                    <div className={styles.tierContainer}>
                      <div className={styles.tierHeader}>
                        <span className={styles.tierHeaderLabel}>Discount Tier</span>
                        <span className={styles.tierHeaderLabel}>Action</span>
                      </div>
                      <div className={styles.tierList}>
                        {tiers.map((tier, index) => (
                          <div key={tier.id} className={styles.tierRow}>
                            <span className={styles.tierIndex}>{index + 1}</span>
                            <span className={styles.tierLabel}>{tierLabel.prefix}</span>
                            <Form.Control
                              type="number"
                              value={tier.quantity}
                              onChange={(e) => updateTier(tier.id, 'quantity', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-qty`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierLabel}>{tierLabel.mid}</span>
                            <Form.Control
                              type="number"
                              value={tier.value}
                              onChange={(e) => updateTier(tier.id, 'value', e.target.value)}
                              className={styles.tierInput}
                              min="1"
                              placeholder="0"
                              isInvalid={showErrors && errors[`tier-${tier.id}-value`]}
                              disabled={isViewMode}
                            />
                            <span className={styles.tierSuffix}>{tierLabel.suffix}</span>
                            {tiers.length > 1 && !isViewMode && (
                              <OverlayTrigger placement="top" overlay={<Tooltip>Remove</Tooltip>}>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className={`text-danger p-0 ${styles.tierDeleteBtn}`}
                                  onClick={() => removeTier(tier.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        ))}
                      </div>
                      {!isViewMode && (
                        <Button
                          variant="link"
                          size="sm"
                          className={styles.addTierBtn}
                          onClick={addTier}
                        >
                          <i className="bi bi-plus"></i>
                          Add Discount Tier
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Col>
            </Form.Group>

            {/* Order Limit */}
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={3} className={styles.label}>
                Order Limit
              </Form.Label>
              <Col sm={6}>
                <Form.Control
                  type="number"
                  placeholder="Enter limit (optional)"
                  value={orderLimit}
                  onChange={(e) => setOrderLimit(e.target.value)}
                  className={styles.input}
                  min="1"
                  disabled={isViewMode}
                />
                <Form.Text className={styles.hint}>
                  Maximum number of combo purchases per buyer
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
                <h5 className={styles.sectionTitle}>Combo Products</h5>
                <span className={styles.hint}>
                  Products in this combo must share the same shipping channel
                </span>
              </div>
              {!isViewMode && (
                <Button
                  className={styles.addProductBtn}
                  size="sm"
                  onClick={() => setShowProductModal(true)}
                >
                  <i className="bi bi-plus me-1"></i>
                  Add Products
                </Button>
              )}
            </div>

            {products.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="bi bi-box-seam text-muted mb-3" style={{ fontSize: '48px' }}></i>
                <p className="text-muted mb-3">No products added yet</p>
                {!isViewMode && (
                  <Button
                    className={styles.addProductBtn}
                    onClick={() => setShowProductModal(true)}
                  >
                    <i className="bi bi-plus me-1"></i>
                    Add Products
                  </Button>
                )}
                {showErrors && errors.products && (
                  <div className="invalid-feedback d-block text-center mt-2">{errors.products}</div>
                )}
              </div>
            ) : (
              <>
                <div className="text-muted small mb-2">Total: {products.length} product(s)</div>

                {/* Batch Actions */}
                {!isViewMode && (
                  <div className={styles.batchRow}>
                    <div className={styles.batchLabel}>
                      <Form.Check
                        type="checkbox"
                        label="Select All"
                        className="fw-medium"
                        checked={
                          products.length > 0 && selectedProductIds.length === products.length
                        }
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                      <div className="text-muted small">{selectedProductIds.length} selected</div>
                    </div>
                    <div className={styles.batchActions}>
                      <Button variant="outline-secondary" size="sm" onClick={batchDisable}>
                        Disable Selected
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={batchEnable}>
                        Enable Selected
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={batchDelete}>
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                <Table className={styles.productTable}>
                  <thead>
                    <tr>
                      {!isViewMode && <th style={{ width: '40px' }}></th>}
                      <th>Product</th>
                      <th>Price</th>
                      <th>
                        Stock
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Available inventory</Tooltip>}
                        >
                          <i className="bi bi-question-circle ms-1"></i>
                        </OverlayTrigger>
                      </th>
                      <th>Shipping Info</th>
                      <th>Status</th>
                      {!isViewMode && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        {!isViewMode && (
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedProductIds.includes(product._id)}
                              onChange={() => toggleProductSelection(product._id)}
                            />
                          </td>
                        )}
                        <td>
                          <div className={styles.productInfo}>
                            <img
                              src={product.images?.[0] || 'https://via.placeholder.com/48'}
                              alt={product.name}
                              className={styles.productImage}
                            />
                            <div>
                              <div className={styles.productName}>{product.name}</div>
                              <div className={styles.productCode}>SKU: {product._id}</div>
                            </div>
                          </div>
                        </td>
                        <td>₫{product.price?.toLocaleString()}</td>
                        <td>{product.stock}</td>
                        <td>{product.shippingInfo}</td>
                        <td>
                          <Form.Check
                            type="switch"
                            checked={product.enabled}
                            onChange={() => toggleProductEnabled(product._id)}
                            className={styles.enableSwitch}
                            disabled={isViewMode}
                          />
                        </td>
                        {!isViewMode && (
                          <td>
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
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </Card.Body>
        </Card>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <Button
            variant="outline-secondary"
            className={styles.cancelBtn}
            onClick={() => navigate('/seller/promotions')}
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? <Spin size="small" /> : 'Confirm'}
            </Button>
          )}
        </div>

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

export default ComboPromotionForm;
