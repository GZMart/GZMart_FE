import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { DatePicker, message, Spin, InputNumber } from 'antd';
import dayjs from 'dayjs';
import PageTransition from '@components/common/PageTransition';
import ProductSelectorModal from '@components/seller/vouchers/ProductSelectorModal';
import addOnDealService from '@services/api/addOnDealService';
import styles from '@assets/styles/seller/AddOnDealForm.module.css';

const { RangePicker } = DatePicker;

const AddOnDealForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = location.pathname.includes('/edit/');

  // Steps State
  const [activeStep, setActiveStep] = useState(1);

  // Basic Info State
  const [dealName, setDealName] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [purchaseLimit, setPurchaseLimit] = useState(0); // 0 means unlimited
  const [loading, setLoading] = useState(false);

  // Products State
  const [mainProducts, setMainProducts] = useState([]);
  const [subProducts, setSubProducts] = useState([]);

  // Modal State
  const [showMainModal, setShowMainModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Validation State
  const [errors, setErrors] = useState({});

  // Fetch data for Edit/View
  useEffect(() => {
    if (id && (isEditMode || isViewMode)) {
      fetchDealData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const fetchDealData = async () => {
    setLoading(true);
    try {
      const res = await addOnDealService.getAddOn(id);
      const data = res.data?.data || res.data;
      if (data) {
        setDealName(data.name);
        if (data.startDate && data.endDate) {
          setDateRange([dayjs(data.startDate), dayjs(data.endDate)]);
        }
        setPurchaseLimit(data.purchaseLimit || 0);

        if (data.mainProducts) {
          setMainProducts(
            data.mainProducts.map((p) => ({
              _id: p._id,
              name: p.name,
              images: p.images,
              price: p.originalPrice, // API returns originalPrice populated
            }))
          );
        }

        if (data.subProducts) {
          setSubProducts(
            data.subProducts.map((sp) => {
              const product = sp.productId;
              // For legacy data or just modelId matching
              const model = sp.modelId ? product.models?.find((m) => m._id === sp.modelId) : null;
              const variantName = model ? getVariantName(product, model) : 'Default';

              return {
                _id: `${product._id}-${sp.modelId || 'default'}`,
                productId: product._id,
                modelId: sp.modelId,
                name: product.name,
                variantName,
                images: product.images,
                originalPrice: model ? model.price : product.originalPrice,
                currentStock: model ? model.stock : product.totalStock,
                addOnPrice: sp.price,
                limit: sp.limit,
              };
            })
          );
        }

        // Unlock all steps if editing/viewing
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load deal data');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleMainProductsSelected = (selectedItems) => {
    const newProducts = selectedItems.map((item) => ({
      _id: item._id,
      name: item.name,
      images: item.images,
      price: item.originalPrice || item.price,
    }));

    // Filter duplicates
    setMainProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p._id));
      const uniqueNew = newProducts.filter((p) => !existingIds.has(p._id));
      return [...prev, ...uniqueNew];
    });
  };

  // Helper to generate variant name
  const getVariantName = (product, model) => {
    if (!product.tiers || product.tiers.length === 0 || !model.tierIndex) {
      return 'Default';
    }
    return model.tierIndex
      .map((idx, i) => product.tiers[i]?.options[idx])
      .filter(Boolean)
      .join(' - ');
  };

  const handleSubProductsSelected = (selectedItems) => {
    const newVariants = [];

    selectedItems.forEach((item) => {
      if (item.models && item.models.length > 0) {
        item.models.forEach((model) => {
          const variantName = getVariantName(item, model);
          newVariants.push({
            _id: `${item._id}-${model._id}`, // Unique ID for frontend list
            productId: item._id,
            modelId: model._id,
            name: item.name,
            variantName,
            images: item.images,
            originalPrice: model.price || item.originalPrice || item.price,
            currentStock: model.stock || 0,
            addOnPrice: 0,
            limit: 1,
          });
        });
      } else {
        // Fallback for no models (legacy or flat product)
        newVariants.push({
          _id: `${item._id}-default`,
          productId: item._id,
          modelId: null,
          name: item.name,
          variantName: 'Default',
          images: item.images,
          originalPrice: item.originalPrice || item.price,
          currentStock: item.totalStock || item.stock || 0,
          addOnPrice: 0,
          limit: 1,
        });
      }
    });

    setSubProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p._id));
      const uniqueNew = newVariants.filter((p) => !existingIds.has(p._id));
      return [...prev, ...uniqueNew];
    });
  };

  const removeMainProduct = (id) => {
    if (isViewMode) {
      return;
    }
    setMainProducts((prev) => prev.filter((p) => p._id !== id));
  };

  // Remove sub-product (variant)
  const removeSubProduct = (uniqueId) => {
    if (isViewMode) {
      return;
    }
    setSubProducts((prev) => prev.filter((p) => p._id !== uniqueId));
  };

  // Update sub-product
  const updateSubProduct = (uniqueId, field, value) => {
    if (isViewMode) {
      return;
    }
    setSubProducts((prev) => prev.map((p) => (p._id === uniqueId ? { ...p, [field]: value } : p)));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!dealName.trim()) {
      newErrors.dealName = 'Deal Name is required';
    }
    if (!dateRange[0] || !dateRange[1]) {
      newErrors.dateRange = 'Promotion period is required';
    }

    if (mainProducts.length === 0) {
      message.error('Please add at least one main product');
      return false;
    }
    if (subProducts.length === 0) {
      message.error('Please add at least one add-on product');
      return false;
    }

    // Validate Add-on Prices
    const invalidPrice = subProducts.find((p) => p.addOnPrice >= p.originalPrice);
    if (invalidPrice) {
      message.error(`Add-on price for "${invalidPrice.name}" must be lower than original price`);
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isViewMode) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: dealName,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        purchaseLimit,
        mainProducts: mainProducts.map((p) => p._id),
        subProducts: subProducts.map((p) => ({
          productId: p.productId,
          modelId: p.modelId,
          price: p.addOnPrice,
          limit: p.limit,
        })),
      };

      if (isEditMode) {
        await addOnDealService.updateAddOn(id, payload);
        message.success('Add-on Deal updated successfully');
      } else {
        await addOnDealService.createAddOn(payload);
        message.success('Add-on Deal created successfully');
      }
      navigate('/seller/promotions');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  // Render Steps
  const renderStep1 = () => (
    <Card className={`${styles.section} ${activeStep < 1 ? styles.lockedSection : ''}`}>
      <div className={styles.sectionHeader} onClick={() => setActiveStep(1)}>
        <h5 className={styles.sectionTitle}>
          <span className={styles.stepNumber}>1</span> Basic Information
        </h5>
        <i className={`bi bi-chevron-${activeStep === 1 ? 'up' : 'down'}`}></i>
      </div>
      {activeStep === 1 && (
        <div className={styles.sectionContent}>
          <Form.Group className="mb-3">
            <Form.Label className={styles.label}>Deal Name</Form.Label>
            <Form.Control
              className={`${styles.input} ${errors.dealName ? 'is-invalid' : ''}`}
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              disabled={isViewMode}
              placeholder="Enter promotion name"
            />
            {errors.dealName && <div className="invalid-feedback">{errors.dealName}</div>}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className={styles.label}>Promotion Period</Form.Label>
            <div className="d-block">
              <RangePicker
                className={`${styles.datePicker} ${errors.dateRange ? 'is-invalid' : ''}`}
                showTime
                value={dateRange}
                onChange={setDateRange}
                disabled={isViewMode}
              />
            </div>
            {errors.dateRange && <div className="text-danger small mt-1">{errors.dateRange}</div>}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className={styles.label}>
              Purchase Limit (Add-on items per order)
            </Form.Label>
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                type="number"
                className={styles.input}
                style={{ width: '150px' }}
                value={purchaseLimit}
                onChange={(e) => setPurchaseLimit(Number(e.target.value))}
                disabled={isViewMode}
                min={0}
              />
              <span className={styles.hint}>0 for unlimited</span>
            </div>
          </Form.Group>

          <div className="text-end">
            <Button onClick={() => setActiveStep(2)}>Next: Main Products</Button>
          </div>
        </div>
      )}
    </Card>
  );

  const renderStep2 = () => (
    <Card className={`${styles.section} ${activeStep < 2 ? styles.lockedSection : ''}`}>
      <div className={styles.sectionHeader} onClick={() => setActiveStep(2)}>
        <h5 className={styles.sectionTitle}>
          <span className={styles.stepNumber}>2</span> Main Products
        </h5>
        <i className={`bi bi-chevron-${activeStep === 2 ? 'up' : 'down'}`}></i>
      </div>
      {activeStep === 2 && (
        <div className={styles.sectionContent}>
          <div className="d-flex justify-content-between mb-3">
            <span>Products required to unlock the deal.</span>
            {!isViewMode && (
              <Button
                size="sm"
                onClick={() => setShowMainModal(true)}
                className={styles.addProductBtn}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Products
              </Button>
            )}
          </div>

          {mainProducts.length > 0 ? (
            <Table responsive className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Original Price</th>
                  {!isViewMode && <th className="text-end">Action</th>}
                </tr>
              </thead>
              <tbody>
                {mainProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className={styles.productInfo}>
                        <img
                          src={product.images?.[0] || 'placeholder.jpg'}
                          alt={product.name}
                          className={styles.productImage}
                        />
                        <div className={styles.productName} title={product.name}>
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td>₫{product.price?.toLocaleString()}</td>
                    {!isViewMode && (
                      <td className="text-end">
                        <Button
                          variant="link"
                          className="text-danger p-0 border-0"
                          onClick={() => removeMainProduct(product._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted border rounded bg-light">
              No main products selected.
            </div>
          )}
          <div className="text-end mt-3">
            <Button onClick={() => setActiveStep(3)}>Next: Add-on Products</Button>
          </div>
        </div>
      )}
    </Card>
  );

  const renderStep3 = () => (
    <Card className={`${styles.section} ${activeStep < 3 ? styles.lockedSection : ''}`}>
      <div className={styles.sectionHeader} onClick={() => setActiveStep(3)}>
        <h5 className={styles.sectionTitle}>
          <span className={styles.stepNumber}>3</span> Add-on Products
        </h5>
        <i className={`bi bi-chevron-${activeStep === 3 ? 'up' : 'down'}`}></i>
      </div>
      {activeStep === 3 && (
        <div className={styles.sectionContent}>
          <div className="d-flex justify-content-between mb-3">
            <span>Products to be discounted.</span>
            {!isViewMode && (
              <Button
                size="sm"
                onClick={() => setShowSubModal(true)}
                className={styles.addProductBtn}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Products
              </Button>
            )}
          </div>

          {subProducts.length > 0 ? (
            <Table responsive className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Original Price</th>
                  <th>Add-on Price</th>
                  <th>Limit per Order</th>
                  {!isViewMode && <th className="text-end">Action</th>}
                </tr>
              </thead>
              <tbody>
                {subProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className={styles.productInfo}>
                        <img
                          src={product.images?.[0] || 'placeholder.jpg'}
                          alt={product.name}
                          className={styles.productImage}
                        />
                        <div className={styles.productName} title={product.name}>
                          {product.name}
                          {product.variantName && product.variantName !== 'Default' && (
                            <span className="text-muted d-block small">
                              ({product.variantName})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>₫{product.originalPrice?.toLocaleString()}</td>
                    <td>
                      <InputNumber
                        className={styles.priceInput}
                        value={product.addOnPrice}
                        onChange={(val) => updateSubProduct(product._id, 'addOnPrice', val)}
                        formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/₫\s?|(,*)/g, '')}
                        min={0}
                        disabled={isViewMode}
                      />
                    </td>
                    <td>
                      <InputNumber
                        className={styles.priceInput}
                        style={{ width: '80px' }}
                        value={product.limit}
                        onChange={(val) => updateSubProduct(product._id, 'limit', val)}
                        min={1}
                        disabled={isViewMode}
                      />
                    </td>
                    {!isViewMode && (
                      <td className="text-end">
                        <Button
                          variant="link"
                          className="text-danger p-0 border-0"
                          onClick={() => removeSubProduct(product._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted border rounded bg-light">
              No add-on products selected.
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <PageTransition>
      <Container fluid className={`p-4 ${styles.container}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              {isEditMode
                ? 'Edit Add-on Deal'
                : isViewMode
                  ? 'View Add-on Deal'
                  : 'Create Add-on Deal'}
            </h4>
            <p className="text-muted mb-0">Boost sales by offering discounted add-on products.</p>
          </div>
        </div>

        {renderStep1()}
        {renderStep2()}
        {renderStep3()}

        <div className={styles.footer}>
          <Button
            variant="light"
            className={styles.cancelBtn}
            onClick={() => navigate('/seller/promotions')}
          >
            Cancel
          </Button>
          {!isViewMode && (
            <Button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? <Spin size="small" /> : 'Confirm & Create'}
            </Button>
          )}
        </div>

        <ProductSelectorModal
          visible={showMainModal}
          onCancel={() => setShowMainModal(false)}
          onConfirm={handleMainProductsSelected}
          initialSelectedIds={mainProducts.map((p) => p._id)} // Fixed prop name too if needed, referencing component def: initialSelectedIds
          excludeIds={subProducts.map((p) => p._id)}
        />

        <ProductSelectorModal
          visible={showSubModal}
          onCancel={() => setShowSubModal(false)}
          onConfirm={handleSubProductsSelected}
          initialSelectedIds={subProducts.map((p) => p._id)}
          excludeIds={mainProducts.map((p) => p._id)}
        />
      </Container>
    </PageTransition>
  );
};

export default AddOnDealForm;
