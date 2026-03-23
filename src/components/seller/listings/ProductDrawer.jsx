import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Form, Row, Col } from 'react-bootstrap';
import { productService } from '../../../services/api/productService';
import { categoryService } from '../../../services/api/categoryService';
import { attributeService } from '../../../services/api/attributeService';
import TiersEditor from './TiersEditor';
import VariantsTable from './VariantsTable';
import AiPriceSuggestModal from './AiPriceSuggestModal';
import AiPriceDetailModal from './AiPriceDetailModal';
import RichTextEditor from '../../common/RichTextEditor';
import styles from '../../../assets/styles/seller/ProductDrawer.module.css';

const ProductDrawer = ({ show, onHide, onSuccess, editingProduct }) => {
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
  const [shippingPerVariant, setShippingPerVariant] = useState(false);
  const [productWeight, setProductWeight] = useState(0);
  const [productWeightUnit, setProductWeightUnit] = useState('gr');
  const [productDim, setProductDim] = useState({ length: 0, width: 0, height: 0 });
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);
  const [preOrderDays, setPreOrderDays] = useState(2);
  const [aiModalShow, setAiModalShow] = useState(false);
  const [aiVariantDetail, setAiVariantDetail] = useState(null);

  const isEditMode = !!editingProduct;
  // Ref to skip generateModels when tiers are loaded from edit mode (prevent overwriting backend models)
  const skipGenerateModelsRef = useRef(false);

  // Fetch categories on mount + body scroll lock
  useEffect(() => {
    if (show) {
      fetchCategories();
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [show]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingProduct && show) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        categoryId:
          editingProduct.categoryId &&
          typeof editingProduct.categoryId === 'object'
            ? editingProduct.categoryId._id
            : editingProduct.categoryId || '',
        // If AI suggested price was applied, pre-fill with it so seller can review
        originalPrice: editingProduct._suggestedPrice || editingProduct.originalPrice || '',
        // costPrice lives in models[0].costPrice (synced from InventoryItem).
        // Product schema has no top-level costPrice — read from first model.
        costPrice: editingProduct.models?.[0]?.costPrice || '',
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

        skipGenerateModelsRef.current = true; // Don't regenerate models from backend data
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

      // Set attribute values - will be properly merged in fetchAttributes
      // Store raw backend attributes for merging after definitions are fetched
      const rawAttributes = editingProduct.attributes || [];

      // Fetch attributes for the category
      const categoryId =
        editingProduct.categoryId &&
        typeof editingProduct.categoryId === 'object'
          ? editingProduct.categoryId._id
          : editingProduct.categoryId;

      if (categoryId) {
        fetchAttributes(categoryId, rawAttributes);
      }

      // Pre-fill shipping & pre-order
      setPreOrderEnabled((editingProduct.preOrderDays || 0) > 0);
      setPreOrderDays(editingProduct.preOrderDays || 2);
      const w = editingProduct.weight ?? 0;
      const wu = editingProduct.weightUnit || 'gr';
      setProductWeight(wu === 'kg' ? w * 1000 : w);
      setProductWeightUnit('gr');
      setProductDim({
        length: editingProduct.dimLength || 0,
        width: editingProduct.dimWidth || 0,
        height: editingProduct.dimHeight || 0,
      });
      // If any model has per-variant weight/dim, show per-variant
      const hasModelShipping = (editingProduct.models || []).some(
        (m) => (m.weight && m.weight > 0) || m.dimLength || m.dimWidth || m.dimHeight
      );
      setShippingPerVariant(!!hasModelShipping);
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
      setShippingPerVariant(false);
      setProductWeight(0);
      setProductWeightUnit('gr');
      setProductDim({ length: 0, width: 0, height: 0 });
      setPreOrderEnabled(false);
      setPreOrderDays(2);
    }
  }, [editingProduct, show]);

  // Generate models when tiers change (but not during edit mode initialization)
  useEffect(() => {
    if (productType === 'variant' && tiers.length > 0) {
      if (skipGenerateModelsRef.current) {
        skipGenerateModelsRef.current = false; // Consume the flag
        return;
      }
      generateModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateModels is stable, deps would cause loops
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

    // Create a map of existing models by tierIndex for preservation
    const existingModelsMap = new Map();
    models.forEach((model) => {
      if (model.tierIndex && Array.isArray(model.tierIndex)) {
        const key = model.tierIndex.join('-');
        existingModelsMap.set(key, model);
      }
    });

    // Generate cartesian product
    const cartesian = (...arrays) =>
      arrays.reduce((acc, array) => acc.flatMap((x) => array.map((y) => [...x, y])), [[]]);

    const tierIndices = validTiers.map((tier) => tier.options.map((_, index) => index));
    const combinations = cartesian(...tierIndices);

    const newModels = combinations.map((tierIndex) => {
      const key = tierIndex.join('-');
      const existingModel = existingModelsMap.get(key);

      // If model exists, preserve its values (stock, price, sku, etc.)
      if (existingModel) {
        return {
          ...existingModel,
          tierIndex, // Ensure tierIndex is correct
        };
      }

      // Create new model with default values
      return {
        tierIndex,
        price: parseFloat(formData.originalPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        stock: 0,
        sku: '',
      };
    });

    setModels(newModels);
  };

  const fetchCategories = async () => {
    try {
      // Match Admin Attribute Management: use tree endpoint and flatten with depth.
      const response = await categoryService.getTree();

      if (response.success) {
        const flat = [];
        const flatten = (nodes, depth = 0) => {
          (nodes || []).forEach((node) => {
            flat.push({ ...node, depth });
            if (node.children?.length) {
              flatten(node.children, depth + 1);
            }
          });
        };

        flatten(response.data || []);
        setCategories(flat);
      } else {
        setCategories([]);
      }
    } catch (error) {
      // Fallback to flat list if tree endpoint fails.
      try {
        const fallback = await categoryService.getAll({ status: 'active' });
        if (fallback.success) {
          setCategories((fallback.data || []).map((cat) => ({ ...cat, depth: 0 })));
          return;
        }
      } catch {}

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
    if (sizeChartPreview) {
      URL.revokeObjectURL(sizeChartPreview);
    }
    setSizeChart(null);
    setSizeChartPreview(null);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
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
      if (!file.type.startsWith('video/')) {
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        return false;
      }
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

  // [Batch AI] Apply AI-suggested prices to selected models
  const handleAiBatchApply = (changes) => {
    const priceMap = new Map(changes.map((c) => [c.modelId, c.suggestedPrice]));
    setModels((prev) =>
      prev.map((m) => {
        const newPrice = priceMap.get(m._id?.toString());
        return newPrice != null ? { ...m, price: newPrice } : m;
      })
    );
  };
  const fetchAttributes = async (categoryId, existingAttributes = []) => {
    try {
      const response = await attributeService.getByCategory(categoryId);

      if (response.success && response.data) {
        // Sort by displayOrder
        const sortedAttrs = response.data.sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        setAttributes(sortedAttrs);

        // If we have existing attribute values (edit mode), merge them using the fetched definitions
        if (existingAttributes.length > 0) {
          const attrObj = {};
          sortedAttrs.forEach((def) => {
            // Try to match saved attribute by slug, then by label/name
            const saved = existingAttributes.find(
              (a) =>
                a.slug === def.slug ||
                a.key === def.slug ||
                a.label === def.name ||
                a.name === def.name
            );
            if (saved && saved.value !== undefined && saved.value !== null) {
              attrObj[def.slug] = {
                slug: def.slug,
                label: def.name,
                value: saved.value,
                type: def.type,
              };
            }
          });

          setAttributeValues(attrObj);
        }
      } else {
        setAttributes([]);
      }
    } catch (error) {
      setAttributes([]);
    }
  };

  const handleAttributeChange = (attributeSlug, value, attributeName, attributeType) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeSlug]: { slug: attributeSlug, label: attributeName, value, type: attributeType },
    }));
  };

  const validateForm = (forcedStatus) => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (forcedStatus !== 'draft') {
      if (!formData.categoryId) {
        newErrors.categoryId = 'Category is required';
      }

      // Price is required only for simple products — variant prices are set in VariantsTable
      if (productType === 'simple') {
        if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
          newErrors.originalPrice = 'Valid price is required';
        }
      }
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

    // For simple products, stock is required only on CREATE
    // In edit mode, stock is controlled via the Inventory page
    if (forcedStatus !== 'draft' && productType === 'simple' && !isEditMode) {
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

      // Validate models: skip stock check in edit mode (stock is managed by Inventory)
      const invalidModels = models.filter(
        (model) => !model.price || model.price <= 0 || (!isEditMode && model.stock < 0)
      );
      if (invalidModels.length > 0) {
        newErrors.models = `${invalidModels.length} variant(s) have invalid price${!isEditMode ? ' or stock' : ''}`;
      }

      // Every SKU must have an image (unless saving as draft)
      if (forcedStatus !== 'draft') {
        const noImageCount = models.filter((m) => !m.imageFile && !m.image).length;
        if (noImageCount > 0) {
          newErrors.modelImages = `${noImageCount} SKU${noImageCount !== 1 ? 's are' : ' is'} missing an image. Add an image to every variant before publishing.`;
        }
      }
    }

    // Simple product must have at least 1 product image (unless saving as draft)
    if (forcedStatus !== 'draft' && productType === 'simple' && imagePreviews.length === 0) {
      newErrors.images = 'At least one product image is required before publishing.';
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

  const handleSubmit = async (e, forcedStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm(forcedStatus)) {
      return;
    }

    setLoading(true);

    try {
      // Convert attribute values to array format
      const attributesArray = Object.values(attributeValues).filter(
        (attr) => attr.value !== undefined && attr.value !== '' && attr.value !== null
      );

      // Prepare models based on product type
      // In edit mode, costPrice is NEVER sent — it is owned by InventoryItem
      // and synced back to Product.models via the Inventory adjust flow.
      let productModels;
      // Normalize stock to avoid NaN/null — backend uses totalStock for status (active vs out_of_stock)
      const safeStock = (val) => Math.max(0, parseInt(val, 10) || 0);

      if (productType === 'simple') {
        productModels = [
          {
            ...(formData.sku.trim() && { sku: formData.sku.trim().toUpperCase() }),
            price: parseFloat(formData.originalPrice) || 0,
            ...(!isEditMode && formData.costPrice
              ? { costPrice: parseFloat(formData.costPrice) }
              : {}),
            stock: safeStock(formData.stock),
            tierIndex: [],
            weight: productWeight || 0,
            weightUnit: 'gr',
            dimLength: productDim.length || 0,
            dimWidth: productDim.width || 0,
            dimHeight: productDim.height || 0,
          },
        ];
      } else {
        productModels = models.map((model) => ({
          ...(model._id && { _id: model._id }),
          tierIndex: model.tierIndex,
          price: parseFloat(model.price),
          ...(!isEditMode && model.costPrice ? { costPrice: parseFloat(model.costPrice) } : {}),
          stock: safeStock(model.stock),
          ...(model.sku && model.sku.trim() && { sku: model.sku.trim().toUpperCase() }),
          ...(!model.imageFile && model.image && { image: model.image }),
          ...(shippingPerVariant
            ? {
                weight: model.weight ?? 0,
                weightUnit: 'gr',
                dimLength: model.dimLength ?? 0,
                dimWidth: model.dimWidth ?? 0,
                dimHeight: model.dimHeight ?? 0,
              }
            : {
                weight: productWeight || 0,
                weightUnit: 'gr',
                dimLength: productDim.length || 0,
                dimWidth: productDim.width || 0,
                dimHeight: productDim.height || 0,
              }),
        }));
      }

      // Check if we have files to upload
      const hasVariantImages = productType === 'variant' && models.some((m) => m.imageFile);
      const hasFiles = sizeChart || images.length > 0 || hasVariantImages;

      let response;

      if (hasFiles) {
        // Use FormData when uploading files
        const formDataToSend = new FormData();

        // Append text fields
        formDataToSend.append('name', formData.name.trim());
        formDataToSend.append('description', formData.description.trim());
        if (formData.categoryId) {
          formDataToSend.append('categoryId', formData.categoryId);
        }
        formDataToSend.append('originalPrice', parseFloat(formData.originalPrice) || 0);
        // formDataToSend.append('status', 'draft');

        // Append tags
        if (formData.tags) {
          const tagsArray = formData.tags.split(',').map((tag) => tag.trim());
          formDataToSend.append('tags', JSON.stringify(tagsArray));
        }

        // Append attributes
        if (attributesArray.length > 0) {
          formDataToSend.append('attributes', JSON.stringify(attributesArray));
        }

        formDataToSend.append('preOrderDays', preOrderEnabled ? preOrderDays : 0);
        if (!shippingPerVariant) {
          formDataToSend.append('weight', productWeight || 0);
          formDataToSend.append('weightUnit', 'gr');
          formDataToSend.append('dimLength', productDim.length || 0);
          formDataToSend.append('dimWidth', productDim.width || 0);
          formDataToSend.append('dimHeight', productDim.height || 0);
        }

        // Append tiers (for variant products)
        if (productType === 'variant') {
          const tiersData = tiers.map((tier) => ({
            name: tier.name,
            options: tier.options.map((opt) => opt.value),
          }));
          formDataToSend.append('tiers', JSON.stringify(tiersData));
        }

        // Append models (without imageFile which is not serializable)
        const modelsData = productModels.map((model) =>
          Object.fromEntries(
            Object.entries(model).filter(([k]) => k !== 'imageFile' && k !== 'imagePreview')
          )
        );
        formDataToSend.append('models', JSON.stringify(modelsData));

        // Append variant images with tierIndex mapping
        if (hasVariantImages) {
          models.forEach((model) => {
            if (model.imageFile) {
              // Use field name: variantImages[tierIndex]
              const tierIndexKey = model.tierIndex.join('-');
              formDataToSend.append(
                `variantImages[${tierIndexKey}]`,
                model.imageFile,
                `variant-${tierIndexKey}.${model.imageFile.name.split('.').pop()}`
              );
            }
          });
        }

        // Append sizeChart file if present
        if (sizeChart) {
          formDataToSend.append('sizeChart', sizeChart);
        }

        // Append images files if present
        if (images.length > 0) {
          images.forEach((image) => {
            formDataToSend.append('images', image);
          });
        }
        
        if (forcedStatus) {
          formDataToSend.append('status', forcedStatus);
        }

        response = isEditMode
          ? await productService.update(editingProduct._id, formDataToSend)
          : await productService.create(formDataToSend);
      } else {
        // Use JSON when no files - easier for backend
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          ...(formData.categoryId && { categoryId: formData.categoryId }),
          originalPrice: parseFloat(formData.originalPrice) || 0,
          tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()) : [],
          attributes: attributesArray,
          preOrderDays: preOrderEnabled ? preOrderDays : 0,
          ...(!shippingPerVariant && {
            weight: productWeight || 0,
            weightUnit: 'gr',
            dimLength: productDim.length || 0,
            dimWidth: productDim.width || 0,
            dimHeight: productDim.height || 0,
          }),
          tiers:
            productType === 'variant'
              ? tiers.map((tier) => ({
                  name: tier.name,
                  options: tier.options.map((opt) => opt.value),
                }))
              : [],
          models: productModels,
          ...(forcedStatus && { status: forcedStatus }),
        };

        response = isEditMode
          ? await productService.update(editingProduct._id, productData)
          : await productService.create(productData);
      }

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
        if (sizeChartPreview) {
          URL.revokeObjectURL(sizeChartPreview);
        }
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        videoPreviews.forEach((url) => URL.revokeObjectURL(url));
        // Clean up variant image previews
        models.forEach((model) => {
          if (model.imagePreview) {
            URL.revokeObjectURL(model.imagePreview);
          }
        });
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
      setShippingPerVariant(false);
      setProductWeight(0);
      setProductWeightUnit('gr');
      setProductDim({ length: 0, width: 0, height: 0 });
      setPreOrderEnabled(false);
      setPreOrderDays(2);
      // Clean up variant image previews before clearing models
      models.forEach((model) => {
        if (model.imagePreview) {
          URL.revokeObjectURL(model.imagePreview);
        }
      });
      setModels([]);
      setErrors({});
      // Clean up file previews
      if (sizeChartPreview) {
        URL.revokeObjectURL(sizeChartPreview);
      }
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

  // ── Save-guard: all SKUs need images ──────────────────────────
  const missingVariantImages =
    productType === 'variant' ? models.filter((m) => !m.imageFile && !m.image).length : 0;
  const missingProductImage = productType === 'simple' && imagePreviews.length === 0;
  const publishBlocked = missingVariantImages > 0 || missingProductImage;
  const publishBlockReason =
    missingVariantImages > 0
      ? `${missingVariantImages} SKU${missingVariantImages !== 1 ? 's are' : ' is'} missing an image`
      : missingProductImage
        ? 'Add at least one product image to publish'
        : '';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`${styles.drawerBackdrop} ${show ? styles.drawerBackdropVisible : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className={`${styles.drawerPanel} ${show ? styles.drawerPanelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? 'Edit Product' : 'Add New Product'}
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <button
              type="button"
              className={styles.drawerCloseBtn}
              onClick={handleClose}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 4L4 10M4 4l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div>
              <h2 className={styles.drawerTitle}>
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className={styles.drawerSubtitle}>
                {isEditMode
                  ? 'Update product details below'
                  : 'Fill in the details to list a new product'}
              </p>
            </div>
          </div>
          <div className={styles.drawerHeaderRight}>
            {isEditMode && <span className={styles.editingBadge}>Editing</span>}
            <button
              type="button"
              className={styles.drawerDraftBtn}
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={loading}
            >
              Save Draft
            </button>
            <button
              type="button"
              className={styles.drawerSaveBtn}
              onClick={(e) => handleSubmit(e, isEditMode && editingProduct?.status === 'draft' ? 'active' : null)}
              disabled={loading || publishBlocked}
              title={publishBlockReason || undefined}
            >
              {loading ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.spinIcon}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  {isEditMode ? (editingProduct?.status === 'draft' ? 'Publishing...' : 'Updating...') : 'Saving...'}
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isEditMode ? (editingProduct?.status === 'draft' ? 'Publish Product' : 'Update Product') : 'Publish Product'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className={styles.drawerBody}>
          <Form onSubmit={handleSubmit}>
            {errors.submit && (
              <div className={`${styles.alert} ${styles.alertDanger}`} role="alert">
                {errors.submit}
              </div>
            )}
            <div>
              {/* ── Basic Info ── */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>1</span>Basic Information
              </div>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <label className={styles.formLabel}>
                      Product Name <span className={styles.required}>*</span>
                    </label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      isInvalid={!!errors.name}
                      placeholder="e.g. Premium Cotton T-Shirt"
                      disabled={loading}
                      className={`${styles.formControl} ${errors.name ? styles.invalid : ''}`}
                    />
                    {errors.name && <div className={styles.invalidFeedback}>{errors.name}</div>}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <label className={styles.formLabel}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    <Form.Select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      isInvalid={!!errors.categoryId}
                      disabled={loading}
                      className={`${styles.formControl} ${errors.categoryId ? styles.invalid : ''}`}
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.depth > 0 ? `${'  '.repeat(cat.depth * 2)}› ` : ''}
                          {cat.name}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.categoryId && (
                      <div className={styles.invalidFeedback}>{errors.categoryId}</div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <label className={styles.formLabel}>Product Type</label>
                    <div className={styles.typeSwitcher}>
                      <button
                        type="button"
                        className={`${styles.typeBtn} ${productType === 'simple' ? styles.typeBtnActive : ''}`}
                        onClick={() => setProductType('simple')}
                        disabled={loading}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        Simple
                      </button>
                      <button
                        type="button"
                        className={`${styles.typeBtn} ${productType === 'variant' ? styles.typeBtnActive : ''}`}
                        onClick={() => setProductType('variant')}
                        disabled={loading}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Variants
                      </button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Pricing & Stock ── */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>2</span>Pricing &amp; Stock
              </div>

              {productType === 'variant' ? (
                /* Variant mode: price is set per-variant in the table below */
                <div className={styles.variantPricingPlaceholder}>
                  <svg className={styles.variantPricingPlaceholderIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span>Price is set individually for each variant in the <strong>Variations</strong> table below.</span>
                </div>
              ) : (
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <label className={styles.formLabel}>
                        Price (₫) <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputAddon}>
                        <span className={styles.addonPrefix}>₫</span>
                        <Form.Control
                          type="number"
                          name="originalPrice"
                          value={formData.originalPrice}
                          onChange={handleChange}
                          isInvalid={!!errors.originalPrice}
                          placeholder="150000"
                          min="0"
                          disabled={loading}
                          className={`${styles.formControl} ${styles.withPrefix} ${errors.originalPrice ? styles.invalid : ''}`}
                        />
                      </div>
                      {errors.originalPrice && (
                        <div className={styles.invalidFeedback}>{errors.originalPrice}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <label className={styles.formLabel}>
                        Cost Price (₫)
                        {isEditMode && <span className={styles.lockBadge}>Locked</span>}
                      </label>
                      <div className={styles.inputAddon}>
                        <span className={styles.addonPrefix}>₫</span>
                        <Form.Control
                          type="number"
                          name="costPrice"
                          value={formData.costPrice}
                          onChange={handleChange}
                          placeholder="80000"
                          min="0"
                          disabled={loading || isEditMode}
                          readOnly={isEditMode}
                          className={`${styles.formControl} ${styles.withPrefix}`}
                        />
                      </div>
                      {isEditMode &&
                        (() => {
                          const src = editingProduct?.models?.[0]?.costSource;
                          const poId = editingProduct?.models?.[0]?.costSourcePoId;
                          return (
                            <div className={styles.stockLockedNote}>
                              {src === 'po' && poId ? (
                                <>
                                  <span className={styles.costSourceBadgePo}>via PO</span>
                                  {' · '}
                                  <a
                                    href="/seller/erp/purchase-orders"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View POs ↗
                                  </a>
                                </>
                              ) : (
                                <>
                                  <span className={styles.costSourceBadgeManual}>Manual</span>
                                  {' · update via '}
                                  <a
                                    href="/seller/inventory"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Inventory
                                  </a>
                                </>
                              )}
                            </div>
                          );
                        })()}
                    </Form.Group>
                  </Col>
                  {productType === 'simple' && (
                    <>
                      <Col md={2}>
                        <Form.Group className="mb-3">
                          <label className={styles.formLabel}>
                            Stock{' '}
                            {isEditMode ? (
                              <span className={styles.lockBadge}>Locked</span>
                            ) : (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <Form.Control
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            isInvalid={!!errors.stock}
                            placeholder="100"
                            min="0"
                            disabled={loading || isEditMode}
                            readOnly={isEditMode}
                            className={`${styles.formControl} ${errors.stock ? styles.invalid : ''}`}
                          />
                          {isEditMode ? (
                            <div className={styles.stockLockedNote}>
                              Via{' '}
                              <a href="/seller/inventory" target="_blank" rel="noopener noreferrer">
                                Inventory
                              </a>
                            </div>
                          ) : (
                            errors.stock && (
                              <div className={styles.invalidFeedback}>{errors.stock}</div>
                            )
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <label className={styles.formLabel}>
                            SKU <span className={styles.optionalBadge}>Optional</span>
                          </label>
                          <Form.Control
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            isInvalid={!!errors.sku}
                            placeholder="Auto-generated if left blank"
                            disabled={loading}
                            className={`${styles.formControl} ${styles.monoInput} ${errors.sku ? styles.invalid : ''}`}
                          />
                          {errors.sku && <div className={styles.invalidFeedback}>{errors.sku}</div>}
                        </Form.Group>
                      </Col>
                    </>
                  )}
                </Row>
              )}

              {/* ── Details ── */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>3</span>Details
              </div>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <label className={styles.formLabel}>Tags</label>
                    <Form.Control
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="shirt, cotton, summer..."
                      disabled={loading}
                      className={styles.formControl}
                    />
                    <p className={styles.textMuted}>Separate tags with commas</p>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <label className={styles.formLabel}>Description</label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(html) =>
                        setFormData((prev) => ({ ...prev, description: html || '' }))
                      }
                      placeholder="Mô tả sản phẩm... Có thể thêm ảnh bằng nút 📷 trên thanh công cụ"
                      disabled={loading}
                      minHeight={200}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Vận chuyển (Shipping) ── */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>4</span>Vận chuyển
              </div>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="shippingPerVariant"
                      label="Thiết lập cân nặng &amp; kích thước cho từng phân loại"
                      checked={shippingPerVariant}
                      onChange={(e) => setShippingPerVariant(e.target.checked)}
                      disabled={loading || productType !== 'variant'}
                      className={styles.shippingToggle}
                    />
                    {productType !== 'variant' && (
                      <p className={styles.textMuted}>
                        Chỉ áp dụng cho sản phẩm có phân loại (biến thể)
                      </p>
                    )}
                  </Form.Group>
                </Col>
                {!shippingPerVariant && (
                  <>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <label className={styles.formLabel}>Cân nặng (Sau khi đóng gói)</label>
                        <div className={styles.weightUnitRow}>
                          <Form.Control
                            type="number"
                            min="0"
                            step={productWeightUnit === 'gr' ? 1 : 0.01}
                            value={
                              productWeightUnit === 'gr'
                                ? productWeight || ''
                                : productWeight / 1000 || ''
                            }
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setProductWeight(
                                productWeightUnit === 'gr' ? v : Math.round(v * 1000)
                              );
                            }}
                            disabled={loading}
                            className={styles.formControl}
                          />
                          <Form.Select
                            value={productWeightUnit}
                            onChange={(e) => setProductWeightUnit(e.target.value)}
                            disabled={loading}
                            className={styles.unitSelect}
                          >
                            <option value="gr">gr</option>
                            <option value="kg">kg</option>
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <label className={styles.formLabel}>
                          Kích thước đóng gói (R × D × C cm)
                        </label>
                        <div className={styles.dimRow}>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="R"
                            value={productDim.length || ''}
                            onChange={(e) =>
                              setProductDim((d) => ({
                                ...d,
                                length: parseFloat(e.target.value) || 0,
                              }))
                            }
                            disabled={loading}
                            className={styles.dimInput}
                          />
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="D"
                            value={productDim.width || ''}
                            onChange={(e) =>
                              setProductDim((d) => ({
                                ...d,
                                width: parseFloat(e.target.value) || 0,
                              }))
                            }
                            disabled={loading}
                            className={styles.dimInput}
                          />
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="C"
                            value={productDim.height || ''}
                            onChange={(e) =>
                              setProductDim((d) => ({
                                ...d,
                                height: parseFloat(e.target.value) || 0,
                              }))
                            }
                            disabled={loading}
                            className={styles.dimInput}
                          />
                        </div>
                        <p className={styles.dimWarning}>
                          Phí vận chuyển thực tế sẽ thay đổi nếu bạn nhập sai kích thước
                        </p>
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>

              {/* ── Hàng Đặt Trước (Pre-order) ── */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>5</span>Hàng Đặt Trước
              </div>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <div className={styles.radioGroup}>
                      <Form.Check
                        type="radio"
                        id="preOrderNo"
                        name="preOrder"
                        label="Không"
                        checked={!preOrderEnabled}
                        onChange={() => setPreOrderEnabled(false)}
                        disabled={loading}
                      />
                      <Form.Check
                        type="radio"
                        id="preOrderYes"
                        name="preOrder"
                        label="Đồng ý"
                        checked={preOrderEnabled}
                        onChange={() => setPreOrderEnabled(true)}
                        disabled={loading}
                      />
                    </div>
                    {preOrderEnabled && (
                      <div className={styles.preOrderDaysRow}>
                        <Form.Control
                          type="number"
                          min="1"
                          value={preOrderDays}
                          onChange={(e) =>
                            setPreOrderDays(Math.max(1, parseInt(e.target.value, 10) || 2))
                          }
                          disabled={loading}
                          className={styles.formControl}
                          style={{ width: 80 }}
                        />
                        <span className={styles.preOrderText}>
                          Tôi sẽ gửi hàng trong {preOrderDays} ngày (không bao gồm ngày nghỉ lễ, Tết
                          và những ngày đơn vị vận chuyển không làm việc)
                        </span>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Attributes (if any) ── */}
              {attributes.length > 0 && (
                <>
                  <div className={styles.sectionHeader}>Attributes</div>
                  <Row>
                    {attributes.map((attr) => (
                      <Col md={4} key={attr._id}>
                        {renderAttributeField(attr)}
                      </Col>
                    ))}
                  </Row>
                </>
              )}

              {/* ── Variations ── */}
              {productType === 'variant' && (
                <>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionNum}>4</span>Variations
                  </div>
                  {errors.tiers && (
                    <div className={`${styles.alert} ${styles.alertDanger}`}>{errors.tiers}</div>
                  )}
                  <TiersEditor tiers={tiers} onChange={setTiers} disabled={loading} />
                  {models.length > 0 && (
                    <>
                      <div className={styles.variantCountBadge}>
                        <span>
                          {models.length} variant{models.length !== 1 ? 's' : ''} generated
                          {models.length > 200 && (
                            <span className={styles.overLimitBadge}> (max 200)</span>
                          )}
                        </span>
                        {models.length > 0 && !loading && (
                          <button
                            type="button"
                            className={styles.aiSuggestBtn}
                            onClick={() => setAiModalShow(true)}
                            title="AI đề xuất giá cho tất cả variants"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
                            </svg>
                            Suggest All
                          </button>
                        )}
                      </div>
                      {errors.models && (
                        <div className={`${styles.alert} ${styles.alertDanger}`}>
                          {errors.models}
                        </div>
                      )}
                      <VariantsTable
                        models={models}
                        onChange={setModels}
                        tiers={tiers}
                        disabled={loading}
                        isEditMode={isEditMode}
                        showShippingColumns={shippingPerVariant}
                      />
                      {missingVariantImages > 0 && (
                        <div className={`${styles.alert} ${styles.alertWarning}`}>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <strong>
                            {missingVariantImages} SKU{missingVariantImages !== 1 ? 's are' : ' is'}{' '}
                            missing an image.
                          </strong>
                          &nbsp;Upload an image for every variant — Save will be unlocked once all
                          SKUs have images.
                        </div>
                      )}
                      {errors.modelImages && (
                        <div className={`${styles.alert} ${styles.alertDanger}`}>
                          {errors.modelImages}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Media ── */}
              <div className={styles.sectionHeader}>Media</div>
              <div className={styles.mediaRow}>
                {/* Size Chart */}
                <div className={styles.mediaBlock}>
                  <div className={styles.mediaBlockHeader}>
                    <span className={styles.mediaBlockTitle}>Size Chart</span>
                    <span className={styles.mediaBlockHint}>Optional</span>
                  </div>
                  {sizeChartPreview ? (
                    <div className={styles.previewSingle}>
                      <img
                        src={sizeChartPreview}
                        alt="Size chart"
                        className={styles.previewSingleImg}
                      />
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={handleRemoveSizeChart}
                        aria-label="Remove"
                      >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M12 4L4 12M4 4l8 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`${styles.uploadZone} ${loading || !!sizeChart ? styles.uploadDisabled : ''}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSizeChartUpload}
                        disabled={loading || !!sizeChart}
                        className={styles.fileInputHidden}
                      />
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className={styles.uploadZoneText}>Click to upload</span>
                    </label>
                  )}
                </div>

                {/* Images */}
                <div className={styles.mediaBlock} style={{ flex: 2 }}>
                  <div className={styles.mediaBlockHeader}>
                    <span className={styles.mediaBlockTitle}>
                      Product Images{' '}
                      <span className={styles.mediaCount}>{imagePreviews.length}/10</span>
                    </span>
                    <span className={styles.mediaBlockHint}>
                      {productType === 'simple' ? (
                        <span className={styles.required}>Required</span>
                      ) : (
                        'Max 10 · 5MB'
                      )}
                    </span>
                  </div>
                  <div className={styles.imageGrid}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className={styles.imageThumb}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={styles.imageThumbImg}
                        />
                        {index === 0 && <span className={styles.primaryBadge}>Main</span>}
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemoveImage(index)}
                          aria-label="Remove"
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M12 4L4 12M4 4l8 8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 10 && (
                      <label
                        className={`${styles.imageAddBtn} ${loading ? styles.uploadDisabled : ''}`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImagesUpload}
                          disabled={loading || images.length >= 10}
                          className={styles.fileInputHidden}
                        />
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </label>
                    )}
                  </div>
                  {errors.images && (
                    <div className={styles.invalidFeedback} style={{ marginTop: '0.375rem' }}>
                      {errors.images}
                    </div>
                  )}
                  {productType === 'simple' && missingProductImage && !errors.images && (
                    <p
                      className={styles.textMuted}
                      style={{ marginTop: '0.25rem', color: '#d97706' }}
                    >
                      ⚠ At least one image is required to save
                    </p>
                  )}
                </div>

                {/* Videos */}
                <div className={styles.mediaBlock}>
                  <div className={styles.mediaBlockHeader}>
                    <span className={styles.mediaBlockTitle}>
                      Videos <span className={styles.mediaCount}>{videoPreviews.length}/3</span>
                    </span>
                    <span className={styles.mediaBlockHint}>Max 3 · 50MB</span>
                  </div>
                  {videoPreviews.length > 0 && (
                    <div className={styles.videoList}>
                      {videoPreviews.map((preview, index) => (
                        <div key={index} className={styles.videoItem}>
                          <video src={preview} className={styles.videoPreview} controls />
                          <span className={styles.videoName}>{videos[index]?.name}</span>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => handleRemoveVideo(index)}
                            aria-label="Remove"
                          >
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M12 4L4 12M4 4l8 8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {videoPreviews.length < 3 && (
                    <label
                      className={`${styles.uploadZone} ${loading || videos.length >= 3 ? styles.uploadDisabled : ''}`}
                    >
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideosUpload}
                        disabled={loading || videos.length >= 3}
                        className={styles.fileInputHidden}
                      />
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" />
                      </svg>
                      <span className={styles.uploadZoneText}>Click to upload video</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={(e) => handleSubmit(e, isEditMode && editingProduct?.status === 'draft' ? 'active' : null)}
            disabled={loading || publishBlocked}
            title={publishBlockReason || undefined}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
            {publishBlocked && !loading && (
              <span className={styles.saveBtnHint}>&nbsp;· {publishBlockReason}</span>
            )}
          </button>
        </div>
      </div>

      <AiPriceSuggestModal
        show={aiModalShow}
        product={{
          id: editingProduct?._id || formData.sku || 'new-product',
          name: formData.name || 'Sản phẩm mới',
          _raw: editingProduct || { tiers, models },
          tiers,
          models,
        }}
        onApply={handleAiBatchApply}
        onClose={() => setAiModalShow(false)}
        onViewDetail={({ detailResult, batchData }) => {
          setAiVariantDetail({
            detailResult,
            batchData,
            productSnapshot: {
              id: editingProduct?._id || formData.sku || 'new-product',
              name: formData.name || 'Sản phẩm mới',
            },
          });
        }}
      />

      {aiVariantDetail && (
        <AiPriceDetailModal
          show
          data={{
            suggestedPrice: aiVariantDetail.detailResult.suggestedPrice,
            reasoning: aiVariantDetail.detailResult.reasoning,
            riskLevel: aiVariantDetail.detailResult.riskLevel,
            warning: aiVariantDetail.detailResult.warning,
            warningMessage: aiVariantDetail.detailResult.warningMessage,
            discountPct: aiVariantDetail.detailResult.discountPct,
            marketData: aiVariantDetail.batchData.marketData,
            competitors: aiVariantDetail.batchData.competitors,
            product: {
              ...aiVariantDetail.batchData.product,
              currentPrice: aiVariantDetail.detailResult.currentPrice,
              modelId: aiVariantDetail.detailResult.modelId,
              modelSku: aiVariantDetail.detailResult.sku,
            },
          }}
          product={{
            id: aiVariantDetail.productSnapshot?.id,
            name: aiVariantDetail.productSnapshot?.name,
            price: aiVariantDetail.detailResult.currentPrice,
          }}
          onApply={() => setAiVariantDetail(null)}
          onClose={() => setAiVariantDetail(null)}
        />
      )}
    </>,
    document.body
  );
};

export default ProductDrawer;
