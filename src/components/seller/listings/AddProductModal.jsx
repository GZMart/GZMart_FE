import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Nav } from 'react-bootstrap';
import { productService } from '../../../services/api/productService';
import { categoryService } from '../../../services/api/categoryService';
import { attributeService } from '../../../services/api/attributeService';
import TiersEditor from './TiersEditor';
import VariantsTable from './VariantsTable';
import styles from '../../../assets/styles/seller/AddProductModal.module.css';

const AddProductModal = ({ show, onHide, onSuccess, editingProduct }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [productType, setProductType] = useState('simple'); // 'simple' or 'variant'
  const [tiers, setTiers] = useState([]);
  const [models, setModels] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    originalPrice: '',
    costPrice: '',
    stock: '',
    tags: '',
    sku: '',
  });
  const [errors, setErrors] = useState({});
  const [sizeChart, setSizeChart] = useState(null);
  const [sizeChartPreview, setSizeChartPreview] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  const isEditMode = !!editingProduct;

  // Fetch categories on mount
  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingProduct && show) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        categoryId:
          typeof editingProduct.categoryId === 'object'
            ? editingProduct.categoryId._id
            : editingProduct.categoryId || '',
        originalPrice: editingProduct.originalPrice || '',
        costPrice: editingProduct.costPrice || '',
        stock: editingProduct.stock || '',
        tags: editingProduct.tags?.join(', ') || '',
        sku: editingProduct.sku || '',
      });

      // Set product type and tiers/models
      if (editingProduct.tiers && editingProduct.tiers.length > 0) {
        setProductType('variant');

        // Transform tiers to the format expected by TiersEditor
        // Backend format: { name: "Color", options: ["Red", "Blue"] }
        // Frontend format: { type: "COLOR", name: "Color", options: [{value: "Red", isCustom: false}, {value: "Blue", isCustom: false}] }

        // Map tier name to type key
        const nameToTypeMap = {
          Color: 'COLOR',
          Size: 'SIZE',
          Gender: 'GENDER',
        };

        const transformedTiers = editingProduct.tiers.map((tier) => {
          const tierType = nameToTypeMap[tier.name] || 'COLOR'; // Default to COLOR if not found

          return {
            type: tierType,
            name: tier.name,
            options: (Array.isArray(tier.options) ? tier.options : []).map((opt) => ({
              value: typeof opt === 'string' ? opt : opt.value,
              isCustom: false,
            })),
          };
        });

        setTiers(transformedTiers);
        setModels(editingProduct.models || []);
      } else {
        setProductType('simple');
        setTiers([]);
        setModels([]);
      }

      // Set images (convert URLs to preview format)
      if (editingProduct.images && editingProduct.images.length > 0) {
        setImagePreviews(editingProduct.images);
      }

      // Set size chart
      if (editingProduct.sizeChart) {
        setSizeChartPreview(editingProduct.sizeChart);
      }

      // Set videos
      if (editingProduct.videos && editingProduct.videos.length > 0) {
        setVideoPreviews(editingProduct.videos);
      }

      // Set attribute values
      if (editingProduct.attributes) {
        setAttributeValues(editingProduct.attributes);
      }

      // Fetch attributes for the category
      const categoryId =
        typeof editingProduct.categoryId === 'object'
          ? editingProduct.categoryId._id
          : editingProduct.categoryId;

      if (categoryId) {
        fetchAttributes(categoryId);
      }
    } else if (!show) {
      // Reset form when modal closes
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        originalPrice: '',
        costPrice: '',
        stock: '',
        tags: '',
        sku: '',
      });
      setProductType('simple');
      setTiers([]);
      setModels([]);
      setSizeChart(null);
      setSizeChartPreview(null);
      setImages([]);
      setImagePreviews([]);
      setVideos([]);
      setVideoPreviews([]);
      setAttributeValues({});
      setErrors({});
    }
  }, [editingProduct, show]);

  // Generate models when tiers change
  useEffect(() => {
    if (productType === 'variant' && tiers.length > 0) {
      generateModels();
    }
  }, [tiers, productType]);

  const generateModels = () => {
    // Validate tiers - filter out empty options, keep tiers with at least one valid option
    const validTiers = tiers
      .map((tier) => ({
        ...tier,
        options: tier.options.filter((opt) => opt.value && opt.value.trim()),
      }))
      .filter((tier) => tier.name.trim() && tier.options.length > 0);

    if (validTiers.length === 0) {
      setModels([]);
      return;
    }

    // Generate cartesian product
    const cartesian = (...arrays) => {
      return arrays.reduce((acc, array) => acc.flatMap((x) => array.map((y) => [...x, y])), [[]]);
    };

    const tierIndices = validTiers.map((tier) => tier.options.map((_, index) => index));
    const combinations = cartesian(...tierIndices);

    const newModels = combinations.map((tierIndex) => ({
      tierIndex,
      price: parseFloat(formData.originalPrice) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      stock: 0,
      sku: '',
    }));

    setModels(newModels);
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();

      if (response.success) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle category change - get attributes from category
    if (name === 'categoryId' && value) {
      const selectedCategory = categories.find((cat) => cat._id === value);
      if (selectedCategory?.attributeTemplates) {
        // Use attributeTemplates from category
        const sortedAttrs = selectedCategory.attributeTemplates
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .map((attr) => ({
            ...attr,
            _id: attr.slug, // Use slug as _id for key
          }));
        setAttributes(sortedAttrs);
      } else {
        // Fallback: fetch from API
        fetchAttributes(value);
      }
      setAttributeValues({}); // Reset attribute values
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  const handleSizeChartUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, sizeChart: 'Please select an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, sizeChart: 'Image size must be less than 5MB' }));
        return;
      }
      setSizeChart(file);
      setSizeChartPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, sizeChart: null }));
    }
  };

  const handleRemoveSizeChart = () => {
    if (sizeChartPreview) URL.revokeObjectURL(sizeChartPreview);
    setSizeChart(null);
    setSizeChartPreview(null);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length + images.length > 10) {
      setErrors((prev) => ({ ...prev, images: 'Maximum 10 images allowed' }));
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, images: null }));
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideosUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('video/')) return false;
      if (file.size > 50 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length + videos.length > 3) {
      setErrors((prev) => ({ ...prev, videos: 'Maximum 3 videos allowed' }));
      return;
    }

    setVideos((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setVideoPreviews((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, videos: null }));
  };

  const handleRemoveVideo = (index) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };
  const fetchAttributes = async (categoryId) => {
    try {
      const response = await attributeService.getByCategory(categoryId);

      if (response.success && response.data) {
        // Sort by displayOrder
        const sortedAttrs = response.data.sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        setAttributes(sortedAttrs);
      } else {
        setAttributes([]);
      }
    } catch (error) {
      console.error('❌ Error fetching attributes:', error);
      setAttributes([]);
    }
  };

  const handleAttributeChange = (attributeSlug, value, attributeName, attributeType) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeSlug]: { label: attributeName, value, type: attributeType },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
      newErrors.originalPrice = 'Valid price is required';
    }

    // Validate required attributes
    attributes.forEach((attr) => {
      if (attr.isRequired) {
        const value = attributeValues[attr.slug]?.value;
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[`attr_${attr.slug}`] = `${attr.name} is required`;
        }
      }
    });

    // For simple products, stock is required
    if (productType === 'simple') {
      if (!formData.stock || parseInt(formData.stock) < 0) {
        newErrors.stock = 'Valid stock quantity is required';
      }
    }

    // For variant products, validate tiers and models
    if (productType === 'variant') {
      if (tiers.length === 0) {
        newErrors.tiers = 'At least one tier is required for variant products';
      } else if (tiers.length > 3) {
        newErrors.tiers = 'Maximum 3 tiers allowed';
      }

      // Validate each tier - options are now {value, isCustom} objects
      tiers.forEach((tier, index) => {
        if (!tier.name.trim()) {
          newErrors[`tier_${index}_name`] = `Tier ${index + 1} name is required`;
        }
        if (
          tier.options.length === 0 ||
          tier.options.some((opt) => !opt.value || !opt.value.trim())
        ) {
          newErrors[`tier_${index}_options`] = `Tier ${index + 1} must have valid options`;
        }
        if (tier.options.length > 20) {
          newErrors[`tier_${index}_options`] = `Tier ${index + 1} cannot have more than 20 options`;
        }
      });

      // Validate models
      if (models.length === 0) {
        newErrors.models = 'No variants generated. Please add tiers and options.';
      } else if (models.length > 200) {
        newErrors.models = `Too many variants (${models.length}). Maximum 200 allowed.`;
      }

      // Validate each model has price and stock
      const invalidModels = models.filter(
        (model) => !model.price || model.price <= 0 || model.stock < 0
      );
      if (invalidModels.length > 0) {
        newErrors.models = `${invalidModels.length} variant(s) have invalid price or stock`;
      }
    }

    // SKU is optional - backend will auto-generate if not provided

    // Validate required attributes
    attributes.forEach((attr) => {
      if (attr.isRequired) {
        const value = attributeValues[attr.slug]?.value;
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[`attr_${attr.slug}`] = `${attr.name} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert attribute values to array format
      const attributesArray = Object.values(attributeValues).filter(
        (attr) => attr.value !== undefined && attr.value !== ''
      );

      // Prepare models based on product type
      let productModels;
      if (productType === 'simple') {
        // Simple product - single model
        productModels = [
          {
            ...(formData.sku.trim() && { sku: formData.sku.trim().toUpperCase() }),
            price: parseFloat(formData.originalPrice),
            costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
            stock: parseInt(formData.stock),
            tierIndex: [],
          },
        ];
      } else {
        // Variant product - multiple models from tiers
        productModels = models.map((model) => ({
          tierIndex: model.tierIndex,
          price: parseFloat(model.price),
          ...(model.costPrice && { costPrice: parseFloat(model.costPrice) }),
          stock: parseInt(model.stock),
          ...(model.sku && model.sku.trim() && { sku: model.sku.trim().toUpperCase() }),
        }));
      }

      // Prepare product data for API - convert tiers to backend format
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        originalPrice: parseFloat(formData.originalPrice),
        tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()) : [],
        attributes: attributesArray,
        tiers:
          productType === 'variant'
            ? tiers.map((tier) => ({
                name: tier.name,
                options: tier.options.map((opt) => opt.value), // Extract value from {value, isCustom}
              }))
            : [],
        models: productModels,
        status: 'draft',
      };

      const response = isEditMode
        ? await productService.update(editingProduct._id, productData)
        : await productService.create(productData);

      if (response.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          categoryId: '',
          originalPrice: '',
          costPrice: '',
          stock: '',
          tags: '',
          sku: '',
        });
        setAttributes([]);
        setAttributeValues({});
        setProductType('simple');
        setTiers([]);
        setModels([]);
        setErrors({});
        // Clean up file previews
        if (sizeChartPreview) URL.revokeObjectURL(sizeChartPreview);
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        videoPreviews.forEach((url) => URL.revokeObjectURL(url));
        setSizeChart(null);
        setSizeChartPreview(null);
        setImages([]);
        setImagePreviews([]);
        setVideos([]);
        setVideoPreviews([]);
        onSuccess && onSuccess(response.data);
        onHide();
      } else {
        setErrors({
          submit:
            response.message ||
            (isEditMode ? 'Failed to update product' : 'Failed to create product'),
        });
      }
    } catch (error) {
      console.error(
        isEditMode ? '❌ Error updating product:' : '❌ Error creating product:',
        error
      );
      setErrors({
        submit:
          error.message || (isEditMode ? 'Failed to update product' : 'Failed to create product'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        originalPrice: '',
        costPrice: '',
        stock: '',
        tags: '',
        sku: '',
      });
      setAttributes([]);
      setAttributeValues({});
      setProductType('simple');
      setTiers([]);
      setModels([]);
      setErrors({});
      // Clean up file previews
      if (sizeChartPreview) URL.revokeObjectURL(sizeChartPreview);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      videoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setSizeChart(null);
      setSizeChartPreview(null);
      setImages([]);
      setImagePreviews([]);
      setVideos([]);
      setVideoPreviews([]);
      onHide();
    }
  };

  // Render dynamic attribute field
  const renderAttributeField = (attribute) => {
    const { _id, name, slug, type, options, isRequired } = attribute;
    const errorKey = `attr_${slug}`;
    const value = attributeValues[slug]?.value || '';

    switch (type) {
      case 'select':
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Label>
              {name} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Select
              value={value}
              onChange={(e) => handleAttributeChange(slug, e.target.value, name, type)}
              isInvalid={!!errors[errorKey]}
              disabled={loading}
            >
              <option value="">Select {name}</option>
              {options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors[errorKey]}</Form.Control.Feedback>
          </Form.Group>
        );

      case 'multiselect':
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Label>
              {name} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                handleAttributeChange(slug, selected, name, type);
              }}
              isInvalid={!!errors[errorKey]}
              disabled={loading}
              size={Math.min(options?.length || 3, 5)}
            >
              {options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">Hold Ctrl/Cmd to select multiple</Form.Text>
            <Form.Control.Feedback type="invalid">{errors[errorKey]}</Form.Control.Feedback>
          </Form.Group>
        );

      case 'number':
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Label>
              {name} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="number"
              value={value}
              onChange={(e) => handleAttributeChange(slug, e.target.value, name, type)}
              isInvalid={!!errors[errorKey]}
              placeholder={`Enter ${name.toLowerCase()}`}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">{errors[errorKey]}</Form.Control.Feedback>
          </Form.Group>
        );

      case 'date':
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Label>
              {name} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="date"
              value={value}
              onChange={(e) => handleAttributeChange(slug, e.target.value, name, type)}
              isInvalid={!!errors[errorKey]}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">{errors[errorKey]}</Form.Control.Feedback>
          </Form.Group>
        );

      case 'boolean':
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Check
              type="checkbox"
              label={name}
              checked={!!value}
              onChange={(e) => handleAttributeChange(slug, e.target.checked, name, type)}
              disabled={loading}
            />
          </Form.Group>
        );

      case 'text':
      default:
        return (
          <Form.Group className="mb-3" key={_id}>
            <Form.Label>
              {name} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="text"
              value={value}
              onChange={(e) => handleAttributeChange(slug, e.target.value, name, type)}
              isInvalid={!!errors[errorKey]}
              placeholder={`Enter ${name.toLowerCase()}`}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">{errors[errorKey]}</Form.Control.Feedback>
          </Form.Group>
        );
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Product' : 'Add New Product'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="alert alert-danger" role="alert">
              {errors.submit}
            </div>
          )}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Product Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  placeholder="Enter product name"
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Category <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  isInvalid={!!errors.categoryId}
                  disabled={loading}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Type</Form.Label>
                <Nav variant="pills" className="mb-2">
                  <Nav.Item>
                    <Nav.Link
                      active={productType === 'simple'}
                      onClick={() => setProductType('simple')}
                      disabled={loading}
                    >
                      Simple Product
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={productType === 'variant'}
                      onClick={() => setProductType('variant')}
                      disabled={loading}
                    >
                      Product with Variations
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Price (₫) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  isInvalid={!!errors.originalPrice}
                  placeholder="150000"
                  min="0"
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">{errors.originalPrice}</Form.Control.Feedback>
                {productType === 'variant' && (
                  <Form.Text className="text-muted">Base price for variants</Form.Text>
                )}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Cost Price (₫)</Form.Label>
                <Form.Control
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  placeholder="80000"
                  min="0"
                  disabled={loading}
                />
                {productType === 'variant' && (
                  <Form.Text className="text-muted">Base cost price for variants</Form.Text>
                )}
              </Form.Group>
            </Col>

            {productType === 'simple' && (
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Stock <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    isInvalid={!!errors.stock}
                    placeholder="100"
                    min="0"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">{errors.stock}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}

            {productType === 'simple' && (
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>SKU (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    isInvalid={!!errors.sku}
                    placeholder="Auto-generated if left blank"
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">Leave blank to auto-generate</Form.Text>
                  <Form.Control.Feedback type="invalid">{errors.sku}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
          </Row>

          {/* Tiers Section - only for variant products */}
          {productType === 'variant' && (
            <>
              <hr className="my-4" />
              <h6 className="mb-3 text-muted">Product Variations</h6>
              {errors.tiers && <div className="alert alert-danger">{errors.tiers}</div>}
              <TiersEditor tiers={tiers} onChange={setTiers} disabled={loading} />

              {models.length > 0 && (
                <>
                  <hr className="my-4" />
                  <h6 className="mb-3 text-muted">
                    Variants ({models.length} {models.length > 200 && '⚠️ Exceeds max 200'})
                  </h6>
                  {errors.models && <div className="alert alert-danger">{errors.models}</div>}
                  <VariantsTable
                    models={models}
                    onChange={setModels}
                    tiers={tiers}
                    disabled={loading}
                  />
                </>
              )}
            </>
          )}

          {/* Dynamic Attributes Section */}
          {attributes.length > 0 && (
            <>
              <hr className="my-4" />
              <h6 className="mb-3 text-muted">Product Attributes</h6>
              <Row>
                {attributes.map((attr) => (
                  <Col md={12} key={attr._id}>
                    {renderAttributeField(attr)}
                  </Col>
                ))}
              </Row>
            </>
          )}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Media Upload Section */}
          <hr className="my-4" />
          <h6 className="mb-3 text-muted">Product Media</h6>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Size Chart (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleSizeChartUpload}
                  disabled={loading || sizeChart}
                  isInvalid={!!errors.sizeChart}
                />
                <Form.Control.Feedback type="invalid">{errors.sizeChart}</Form.Control.Feedback>
                <Form.Text className="text-muted">Max 5MB. PNG, JPG, JPEG</Form.Text>
                {sizeChartPreview && (
                  <div className="mt-2 position-relative" style={{ maxWidth: '200px' }}>
                    <img
                      src={sizeChartPreview}
                      alt="Size chart preview"
                      style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveSizeChart}
                      className="position-absolute top-0 end-0 m-1"
                      style={{ padding: '0.2rem 0.5rem' }}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Product Images (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  disabled={loading || images.length >= 10}
                  isInvalid={!!errors.images}
                />
                <Form.Control.Feedback type="invalid">{errors.images}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Max 10 images, 5MB each. PNG, JPG, JPEG
                </Form.Text>
                {imagePreviews.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="position-relative" style={{ width: '100px' }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                          className="position-absolute top-0 end-0 m-1"
                          style={{ padding: '0.2rem 0.5rem' }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Product Videos (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideosUpload}
                  disabled={loading || videos.length >= 3}
                  isInvalid={!!errors.videos}
                />
                <Form.Control.Feedback type="invalid">{errors.videos}</Form.Control.Feedback>
                <Form.Text className="text-muted">Max 3 videos, 50MB each. MP4, MOV, AVI</Form.Text>
                {videoPreviews.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="position-relative" style={{ width: '150px' }}>
                        <video
                          src={preview}
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                          controls
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveVideo(index)}
                          className="position-absolute top-0 end-0 m-1"
                          style={{ padding: '0.2rem 0.5rem' }}
                        >
                          ×
                        </Button>
                        <small className="d-block text-muted mt-1">{videos[index]?.name}</small>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <Form.Control
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="test, product, new (comma-separated)"
                  disabled={loading}
                />
                <Form.Text className="text-muted">Separate tags with commas</Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
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
            'Update Product'
          ) : (
            'Add Product'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProductModal;
