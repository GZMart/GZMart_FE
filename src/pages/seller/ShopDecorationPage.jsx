/**
 * ShopDecorationPage — Live Data-Binding Shop Editor
 *
 * Su dung Redux slice de quan ly pageConfig.
 * Central Preview (PreviewCanvas) tu dong cap nhat khi config thay doi.
 * Drag tu sidebar de them module, drag trong canvas de reorder.
 *
 * Features: auto-save debounce, keyboard shortcuts (Ctrl+S / Ctrl+P / Delete),
 *           drop position indicator in canvas.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusOutlined } from '@ant-design/icons';
import PageTransition from '@components/common/PageTransition';
import CloudinaryUpload from '@components/common/CloudinaryUpload';
import CropModal from '@components/common/CropModal';
import HotspotEditor from '@components/seller/ShopEditor/ConfigComponents/HotspotEditor';
import voucherService from '@services/api/voucherService';
import { productService } from '@services/api/productService';
import { categoryService } from '@services/api/categoryService';
import comboService from '@services/api/comboService';
import addOnDealService from '@services/api/addOnDealService';
import authService from '@services/api/authService';
import { selectUser, updateUser } from '@store/slices/authSlice';
import {
  fetchDecoration,
  saveDecoration,
  publishDecoration,
  selectCurrentModules,
  selectRawModules,
  selectSelectedModule,
  selectIsSaving,
  selectLastSaved,
  addModule,
  removeModule,
  updateModuleProps,
  updateModuleExtra,
  clearSelection,
  selectIsDirty,
} from '@store/slices/shopDecorationSlice';
import { MODULE_TYPES, MODULE_LABELS, MODULE_GROUPS } from '@services/api/shopDecorationService';
import PreviewCanvas from '@components/seller/ShopEditor/PreviewCanvas';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

// ─── Library Item (Sidebar) ────────────────────────────────────────────────────
// Local component props are intentionally simple
/* eslint-disable react/prop-types */
function LibraryItem({ type, icon, label }) {
  const dispatch = useDispatch();
  // Use a counter incremented on BOTH dragStart AND dragEnd, then decremented
  // after the ghost-click macrotask fires. This way, any click arriving while
  // counter > 0 is always treated as a ghost click and ignored.
  const dragCounterRef = useRef(0);

  const handleDragStart = (e) => {
    dragCounterRef.current += 1;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-module-type', type);
  };

  const handleDragEnd = () => {
    // Increment here too so the counter stays > 0 until after the ghost-click
    // macrotask has already run (which always fires after dragend).
    dragCounterRef.current += 1;
    setTimeout(() => {
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    }, 150);
  };

  const handleClick = () => {
    if (dragCounterRef.current > 0) return; // Ghost click — ignore
    dispatch(addModule({ type, insertAt: undefined }));
  };

  return (
    <div
      className={styles.libraryCard}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      title={`Drag to canvas or click to add "${label}"`}
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </div>
  );
}

// ─── Image list editor (for carousel / multi-banner modules) ──────────────────
// UI aligned with "Banner quay vòng": reorder, card with image + overlay toolbar, link below.
function ImageListEditor({
  images = [],
  onChange,
  maxItems = 10,
  addButtonLabel,
  linkOptions,
  aspectRatio,
}) {
  const [cropEditingIndex, setCropEditingIndex] = useState(null);
  const pendingUploadRef = useRef(null);
  const [openPicker, setOpenPicker] = useState({ type: null, index: null });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [addons, setAddons] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const handleImageChange = useCallback(
    (index, url) => {
      const updated = images.map((img, i) => (i === index ? { ...img, url } : img));
      onChange(updated);
    },
    [images, onChange]
  );

  // Called when user clicks "Change image" on an existing banner.
  // We trigger the hidden CloudinaryUpload input so the current image stays visible until the upload succeeds.
  const handleRequestNewImage = useCallback(
    (index) => {
      const wrapper = document.querySelector(`[data-change-img-idx="${index}"]`);
      if (wrapper) {
        const input = wrapper.querySelector('input[type="file"]');
        if (input) input.click();
      }
    },
    []
  );

  const handleLinkChange = useCallback(
    (index, link) => {
      const updated = images.map((img, i) => (i === index ? { ...img, link } : img));
      onChange(updated);
    },
    [images, onChange]
  );

  const handleAddImage = useCallback(() => {
    if (images.length >= maxItems) {
      toast.warning(`Maximum ${maxItems} images.`);
      return;
    }
    onChange([...images, { url: '', link: '' }]);
  }, [images, maxItems, onChange]);

  const handleRemoveImage = useCallback(
    (index) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange]
  );

  const handleMoveUp = useCallback(
    (index) => {
      if (index <= 0) return;
      const next = [...images];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange(next);
    },
    [images, onChange]
  );

  const handleMoveDown = useCallback(
    (index) => {
      if (index >= images.length - 1) return;
      const next = [...images];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChange(next);
    },
    [images, onChange]
  );

  const PRESET_LINKS = [
    { value: '', label: 'Select path from...(Custom)' },
    { value: '__product__', label: 'Product page' },
    { value: '__category__', label: 'Category in Shop' },
    { value: '__custom__', label: 'Link / Redirect' },
    { value: '__combo__', label: 'Promotion Combo' },
    { value: '__voucher__', label: 'Discount code' },
    { value: '__addon__', label: 'Add-on Deal' },
  ];
  const opts = linkOptions || PRESET_LINKS;

  const getLinkSelectValue = (link) => {
    if (!link) return '';
    if (link.startsWith('/product/')) return '__product__';
    if (link.startsWith('/category/')) return '__category__';
    if (link.startsWith('/combo/')) return '__combo__';
    if (link.startsWith('/voucher/')) return '__voucher__';
    if (link.startsWith('/addon/')) return '__addon__';
    const found = opts.find((o) => o.value && o.value !== '__custom__' && o.value === link);
    return found ? link : '__custom__';
  };

  // Open product picker
  const openProductPicker = useCallback(async (index) => {
    setPickerLoading(true);
    try {
      const res = await productService.getMyProducts({ status: 'active', limit: 100 });
      if (res.success) {
        setProducts(res.data || []);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setPickerLoading(false);
    }
    setOpenPicker({ type: 'product', index });
  }, []);

  // Open category picker - only show categories that have products in this shop
  const openCategoryPicker = useCallback(async (index) => {
    setPickerLoading(true);
    try {
      // Get all categories
      const categoryRes = await categoryService.getAll({ status: 'active' });
      // Get all products to find which categories have products
      const productRes = await productService.getMyProducts({ status: 'active', limit: 1000 });

      if (categoryRes.success && productRes.success) {
        const allCategories = categoryRes.data || [];
        const allProducts = productRes.data || [];

        // Get unique category IDs from products - handle different possible structures
        const categoryIdsWithProducts = new Set();
        allProducts.forEach((product) => {
          // Direct categoryId field - can be string ID or object with _id/id
          if (product.categoryId) {
            if (typeof product.categoryId === 'object' && product.categoryId !== null) {
              // categoryId is an object (e.g., { _id: '...', name: '...' })
              if (product.categoryId._id) categoryIdsWithProducts.add(String(product.categoryId._id));
              if (product.categoryId.id) categoryIdsWithProducts.add(String(product.categoryId.id));
            } else {
              // categoryId is a string ID
              categoryIdsWithProducts.add(String(product.categoryId));
            }
          }
          // Nested category object (e.g., product.category._id)
          if (product.category && typeof product.category === 'object') {
            if (product.category._id) categoryIdsWithProducts.add(String(product.category._id));
            if (product.category.id) categoryIdsWithProducts.add(String(product.category.id));
          }
          // Array of categories (e.g., product.categories)
          if (product.categories && Array.isArray(product.categories)) {
            product.categories.forEach((cat) => {
              if (cat._id) categoryIdsWithProducts.add(String(cat._id));
              if (cat.id) categoryIdsWithProducts.add(String(cat.id));
              if (typeof cat === 'string') categoryIdsWithProducts.add(String(cat));
            });
          }
        });

        // Filter categories to only those with products
        const categoriesWithProducts = allCategories.filter((cat) =>
          categoryIdsWithProducts.has(String(cat._id || cat.id))
        );

        setCategories(categoriesWithProducts);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setPickerLoading(false);
    }
    setOpenPicker({ type: 'category', index });
  }, []);

  // Open voucher picker
  const openVoucherPicker = useCallback(async (index) => {
    setPickerLoading(true);
    try {
      const res = await voucherService.getVouchers({ status: 'active', limit: 100 });
      if (res.success) {
        setVouchers(res.data?.vouchers || res.data || []);
      } else {
        setVouchers([]);
      }
    } catch {
      setVouchers([]);
    } finally {
      setPickerLoading(false);
    }
    setOpenPicker({ type: 'voucher', index });
  }, []);

  // Open combo picker
  const openComboPicker = useCallback(async (index) => {
    setPickerLoading(true);
    try {
      const res = await comboService.getCombos({ status: 'active', limit: 100 });
      if (res.success) {
        setCombos(res.data?.combos || res.data || []);
      } else {
        setCombos([]);
      }
    } catch {
      setCombos([]);
    } finally {
      setPickerLoading(false);
    }
    setOpenPicker({ type: 'combo', index });
  }, []);

  // Open addon picker
  const openAddonPicker = useCallback(async (index) => {
    setPickerLoading(true);
    try {
      const res = await addOnDealService.getAddOns({ status: 'active', limit: 100 });
      if (res.success) {
        setAddons(res.data?.addons || res.data || []);
      } else {
        setAddons([]);
      }
    } catch {
      setAddons([]);
    } finally {
      setPickerLoading(false);
    }
    setOpenPicker({ type: 'addon', index });
  }, []);

  // Handle link type selection - open picker or update link
  const handleLinkTypeSelect = useCallback(
    (index, linkType) => {
      if (linkType === '__product__') {
        openProductPicker(index);
      } else if (linkType === '__category__') {
        openCategoryPicker(index);
      } else if (linkType === '__voucher__') {
        openVoucherPicker(index);
      } else if (linkType === '__combo__') {
        openComboPicker(index);
      } else if (linkType === '__addon__') {
        openAddonPicker(index);
      } else if (linkType === '__custom__') {
        const updated = images.map((img, i) =>
          i === index ? { ...img, link: img.link || '', linkName: undefined } : img
        );
        onChange(updated);
      } else {
        const updated = images.map((img, i) =>
          i === index ? { ...img, link: linkType, linkName: undefined } : img
        );
        onChange(updated);
      }
    },
    [
      images,
      onChange,
      openProductPicker,
      openCategoryPicker,
      openVoucherPicker,
      openComboPicker,
      openAddonPicker,
    ]
  );

  // Apply product selection
  const handleProductSelect = useCallback(
    (productId, productName) => {
      if (openPicker.index !== null) {
        const updated = images.map((img, i) =>
          i === openPicker.index
            ? { ...img, link: `/product/${productId}`, linkName: productName }
            : img
        );
        onChange(updated);
      }
      setOpenPicker({ type: null, index: null });
      setProducts([]);
    },
    [openPicker.index, images, onChange]
  );

  // Apply category selection
  const handleCategorySelect = useCallback(
    (categoryId, categoryName) => {
      if (openPicker.index !== null) {
        const updated = images.map((img, i) =>
          i === openPicker.index
            ? { ...img, link: `/category/${categoryId}`, linkName: categoryName }
            : img
        );
        onChange(updated);
      }
      setOpenPicker({ type: null, index: null });
      setCategories([]);
    },
    [openPicker.index, images, onChange]
  );

  // Apply voucher selection
  const handleVoucherSelect = useCallback(
    (voucherId, voucherName) => {
      if (openPicker.index !== null) {
        const updated = images.map((img, i) =>
          i === openPicker.index
            ? { ...img, link: `/voucher/${voucherId}`, linkName: voucherName }
            : img
        );
        onChange(updated);
      }
      setOpenPicker({ type: null, index: null });
      setVouchers([]);
    },
    [openPicker.index, images, onChange]
  );

  // Apply combo selection
  const handleComboSelect = useCallback(
    (comboId, comboName) => {
      if (openPicker.index !== null) {
        const updated = images.map((img, i) =>
          i === openPicker.index ? { ...img, link: `/combo/${comboId}`, linkName: comboName } : img
        );
        onChange(updated);
      }
      setOpenPicker({ type: null, index: null });
      setCombos([]);
    },
    [openPicker.index, images, onChange]
  );

  // Apply addon selection
  const handleAddonSelect = useCallback(
    (addonId, addonName) => {
      if (openPicker.index !== null) {
        const updated = images.map((img, i) =>
          i === openPicker.index ? { ...img, link: `/addon/${addonId}`, linkName: addonName } : img
        );
        onChange(updated);
      }
      setOpenPicker({ type: null, index: null });
      setAddons([]);
    },
    [openPicker.index, images, onChange]
  );

  const closePicker = useCallback(() => {
    setOpenPicker({ type: null, index: null });
    setProducts([]);
    setCategories([]);
    setVouchers([]);
    setCombos([]);
    setAddons([]);
  }, []);

  return (
    <div className={styles.formGroup}>
      <label className={styles.configSectionLabel}>
        Image list ({images.length}/{maxItems})
      </label>
      <div className={styles.imageListWrap}>
        {images.map((img, index) => (
          <div key={index} className={styles.bannerCard}>
            <div className={styles.bannerCardReorder}>
              <button
                type="button"
                className={styles.reorderBtn}
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                title="Move up"
                aria-label="Move up"
              >
                <i className="bi bi-chevron-up" />
              </button>
              <button
                type="button"
                className={styles.reorderBtn}
                onClick={() => handleMoveDown(index)}
                disabled={index === images.length - 1}
                title="Move down"
                aria-label="Move down"
              >
                <i className="bi bi-chevron-down" />
              </button>
            </div>
            <div className={styles.bannerCardMain}>
              {img.url ? (
                <div className={styles.bannerCardPreview}>
                  <img src={img.url} alt="" className={styles.bannerCardImg} />
                  <button
                    type="button"
                    className={styles.bannerCardEditBtn}
                    onClick={() => setCropEditingIndex(index)}
                    title="Edit"
                  >
                    <i className="bi bi-pencil" />
                    <span>Edit</span>
                  </button>
                  <div className={styles.bannerCardToolbar}>
                    {aspectRatio && (
                      <button
                        type="button"
                        className={styles.bannerCardToolbarBtn}
                        onClick={() => setCropEditingIndex(index)}
                        title="Crop image"
                      >
                        <i className="bi bi-crop" />
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.bannerCardToolbarBtn}
                      onClick={() => handleRequestNewImage(index)}
                      title="Change image"
                    >
                      <i className="bi bi-folder2" />
                    </button>
                    <button
                      type="button"
                      className={styles.bannerCardToolbarBtn}
                      onClick={() => handleRemoveImage(index)}
                      title="Delete"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                  {/* Hidden CloudinaryUpload for Change Image */}
                  <div style={{ display: 'none' }} data-change-img-idx={index}>
                    <CloudinaryUpload
                      value=""
                      onChange={(url) => handleImageChange(index, url)}
                      aspectRatio={aspectRatio}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.bannerCardUpload} data-banner-idx={index} style={{ position: 'relative' }}>
                  <CloudinaryUpload
                    value=""
                    onChange={(url) => handleImageChange(index, url)}
                    hint="Banner"
                    aspectRatio={aspectRatio}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    title="Delete item"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      color: '#ef4444' // explicit red color for visibility
                    }}
                  >
                    <i className="bi bi-trash" style={{ fontSize: 13 }} />
                  </button>
                </div>
              )}
              <div className={styles.bannerCardLink}>
                <select
                  className={styles.imageListLinkSelect}
                  value={getLinkSelectValue(img.link)}
                  onChange={(e) => handleLinkTypeSelect(index, e.target.value)}
                >
                  {opts.map((o) => (
                    <option key={String(o.value)} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {(getLinkSelectValue(img.link) === '__product__' ||
                  getLinkSelectValue(img.link) === '__category__' ||
                  getLinkSelectValue(img.link) === '__voucher__' ||
                  getLinkSelectValue(img.link) === '__combo__' ||
                  getLinkSelectValue(img.link) === '__addon__') && (
                  <div
                    className={styles.imageListLinkItemSelect}
                    onClick={() => {
                      const linkType = getLinkSelectValue(img.link);
                      if (linkType === '__product__') {
                        openProductPicker(index);
                      } else if (linkType === '__category__') {
                        openCategoryPicker(index);
                      } else if (linkType === '__voucher__') {
                        openVoucherPicker(index);
                      } else if (linkType === '__combo__') {
                        openComboPicker(index);
                      } else if (linkType === '__addon__') {
                        openAddonPicker(index);
                      }
                    }}
                  >
                    <span>{img.linkName || 'Select item...'}</span>
                    <i className="bi bi-chevron-up" />
                  </div>
                )}
                {getLinkSelectValue(img.link) === '__custom__' && (
                  <input
                    type="text"
                    className={styles.imageListLink}
                    value={typeof img.link === 'string' ? img.link : ''}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="Enter URL (e.g., /category/shirt)"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        {images.length < maxItems && (
          <button type="button" className={styles.addBannerBtn} onClick={handleAddImage}>
            <PlusOutlined />
            {addButtonLabel || `Add image/video (${images.length}/${maxItems})`}
          </button>
        )}
      </div>
      {cropEditingIndex !== null && images[cropEditingIndex]?.url && (
        <CropModal
          imageUrl={images[cropEditingIndex].url}
          aspectRatio={aspectRatio}
          onApply={(url) => {
            handleImageChange(cropEditingIndex, url);
            setCropEditingIndex(null);
          }}
          onClose={() => setCropEditingIndex(null)}
        />
      )}

      {/* Product Picker Modal */}
      {openPicker.type === 'product' && (
        <ProductPickerModal
          products={products}
          loading={pickerLoading}
          onSelect={handleProductSelect}
          onClose={closePicker}
        />
      )}

      {/* Category Picker Modal */}
      {openPicker.type === 'category' && (
        <CategoryPickerModal
          categories={categories}
          loading={pickerLoading}
          onSelect={handleCategorySelect}
          onClose={closePicker}
        />
      )}

      {/* Voucher Picker Modal */}
      {openPicker.type === 'voucher' && (
        <VoucherPickerModalForImage
          vouchers={vouchers}
          loading={pickerLoading}
          onSelect={handleVoucherSelect}
          onClose={closePicker}
        />
      )}

      {/* Combo Picker Modal */}
      {openPicker.type === 'combo' && (
        <ComboPickerModal
          combos={combos}
          loading={pickerLoading}
          onSelect={handleComboSelect}
          onClose={closePicker}
        />
      )}

      {/* Addon Picker Modal */}
      {openPicker.type === 'addon' && (
        <AddonPickerModal
          addons={addons}
          loading={pickerLoading}
          onSelect={handleAddonSelect}
          onClose={closePicker}
        />
      )}
    </div>
  );
}

// ─── Discount Module Config (merged with VOUCHER) ───────────────────────────

function DiscountModuleConfig({ module, onUpdate }) {
  const { props = {} } = module;
  const update = (propsUpdate) => onUpdate(propsUpdate);

  const [showPicker, setShowPicker] = useState(false);
  const isAuto = props.source !== 'manual';

  const handleApplyVouchers = (voucherData) => {
    // voucherData can be array of IDs (backward compat) or array of objects {id, code, ...}
    const ids =
      Array.isArray(voucherData) && voucherData.length > 0 && typeof voucherData[0] === 'object'
        ? voucherData.map((v) => v._id || v.id)
        : voucherData;
    // Store only id -> code mapping as a flat object to avoid deep nesting
    const voucherCodes =
      Array.isArray(voucherData) && voucherData.length > 0 && typeof voucherData[0] === 'object'
        ? voucherData.reduce((acc, v) => {
            const id = v._id || v.id;
            if (id && v.code) {
              acc[id] = v.code;
            }
            return acc;
          }, {})
        : {};
    update({ ...props, voucherIds: ids, voucherCodes });
    setShowPicker(false);
  };

  return (
    <>
      {/* ── Discount source ── */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Voucher source</label>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isAuto ? styles.toggleBtnActive : ''}`}
            onClick={() => update({ ...props, source: 'auto', voucherIds: [] })}
          >
            <i className="bi bi-magic" /> Auto
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isAuto ? styles.toggleBtnActive : ''}`}
            onClick={() => update({ ...props, source: 'manual' })}
          >
            <i className="bi bi-hand-index-thumb" /> Manual
          </button>
        </div>
      </div>

      {isAuto ? (
        /* ── Auto: display limit ── */
        <>
          <div className={styles.formGroup}>
            <p className={styles.hintText}>
              <i className="bi bi-robot" />
              System automatically displays active vouchers for the shop.
            </p>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Maximum vouchers to display</label>
            <input
              type="number"
              className={styles.formInput}
              value={props.displayLimit ?? 5}
              min={1}
              max={20}
              onChange={(e) =>
                update({ ...props, displayLimit: parseInt(e.target.value, 10) || 5 })
              }
            />
          </div>
        </>
      ) : (
        /* ── Manual: select vouchers manually ── */
        <>
          <div className={styles.formGroup}>
            <p className={styles.hintText}>
              <i className="bi bi-ticket-perforated" />
              Select active vouchers from Marketing Channel. Maximum 5 vouchers.
            </p>
          </div>
          <div className={styles.formGroup}>
            <span className={styles.configSectionLabel}>
              Selected vouchers ({(props.voucherIds || []).length}/5)
            </span>
            {(props.voucherIds || []).map((vid, i) => {
              // Get voucher code from flat mapping object, fallback to ID
              const voucherCodes = props.voucherCodes || {};
              const displayText = voucherCodes[vid] || vid;
              return (
                <div key={vid} className={styles.selectedProductItem}>
                  <span className={styles.selectedProductIndex}>{i + 1}</span>
                  <span className={styles.selectedProductId}>{displayText}</span>
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => {
                      const newIds = (props.voucherIds || []).filter((id) => id !== vid);
                      const newCodes = { ...voucherCodes };
                      delete newCodes[vid];
                      update({
                        ...props,
                        voucherIds: newIds,
                        voucherCodes: newCodes,
                      });
                    }}
                  >
                    <i className="bi bi-x" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              className={styles.addImageBtn}
              onClick={() => setShowPicker(true)}
            >
              <PlusOutlined /> Select vouchers
            </button>
          </div>
        </>
      )}

      {showPicker && (
        <VoucherPickerModal
          selectedIds={props.voucherIds || []}
          onApply={handleApplyVouchers}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── Right Panel: Module Config ───────────────────────────────────────────────

function ModuleConfigPanel({ module, onUpdate, onDelete }) {
  const { type, props = {}, isEnabled = true } = module || {};
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);

  const update = useCallback(
    (changes) => {
      if (!module) return;
      onUpdate({ id: module.id, changes });
    },
    [module, onUpdate]
  );

  const updateProps = useCallback(
    (propsUpdate) => {
      if (!module) return;
      onUpdate({ id: module.id, props: { ...module.props, ...propsUpdate } });
    },
    [module, onUpdate]
  );

  if (!module) {
    return (
      <div className={styles.rightPanel}>
        <div className={styles.rightHeader}>
          <h3 className={styles.rightTitle}>Module Configuration</h3>
          <p className={styles.rightSubtitle}>Select a module to configure</p>
        </div>
        <div className={styles.emptyState}>
          <i
            className="bi bi-cursor-fill"
            style={{ fontSize: 28, display: 'block', marginBottom: 8 }}
          />
          Select a module in canvas to edit
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            Hoặc click vào ảnh bìa phía trên để đổi ảnh bìa shop
          </p>
        </div>
      </div>
    );
  }

  const isAutoWidget = [
    MODULE_TYPES.VOUCHER,
    MODULE_TYPES.FLASH_DEALS,
    MODULE_TYPES.ADDON_DEALS,
    MODULE_TYPES.COMBO_PROMOS,
    MODULE_TYPES.DISCOUNT, // DISCOUNT now uses VOUCHER logic (auto-fetch vouchers)
  ].includes(type);

  return (
    <div className={styles.rightPanel}>
      <div className={styles.rightHeader}>
        <h3 className={styles.rightTitle}>Module Configuration</h3>
        <p className={styles.rightSubtitle}>{MODULE_LABELS[type]}</p>
      </div>
      <div className={styles.rightDesc}>
        {isAutoWidget
          ? 'Content is automatically fetched from the system. Just configure the display settings.'
          : 'Set up content for this module.'}
      </div>

      <div className={styles.configForm}>
        {/* Mandatory modules notice */}
        {[MODULE_TYPES.DISCOUNT, MODULE_TYPES.SUGGESTED_FOR_YOU].includes(type) && (
          <div className={styles.formGroup}>
            <p className={styles.hintText}>
              <i className="bi bi-info-circle" />
              This is a mandatory module that always appears first and cannot be removed or
              modified.
            </p>
          </div>
        )}

        {/* Visibility - DISCOUNT and VOUCHER are always visible (mandatory) */}
        {![MODULE_TYPES.DISCOUNT, MODULE_TYPES.SUGGESTED_FOR_YOU].includes(type) && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                checked={!!isEnabled}
                onChange={(e) => update({ isEnabled: e.target.checked })}
              />{' '}
              Show on homepage
            </label>
          </div>
        )}

        {/* ── Discount (merged with VOUCHER - auto or manual source) ── */}
        {type === MODULE_TYPES.DISCOUNT && (
          <DiscountModuleConfig module={module} onUpdate={updateProps} />
        )}

        {/* ── Title + Content for TEXT / IMAGE_TEXT ── */}
        {[MODULE_TYPES.TEXT, MODULE_TYPES.IMAGE_TEXT].includes(type) && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input
                type="text"
                className={styles.formInput}
                value={props.title || ''}
                onChange={(e) => updateProps({ title: e.target.value })}
                placeholder="Enter title..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Content</label>
              <textarea
                className={styles.formTextarea}
                value={props.content || ''}
                onChange={(e) => updateProps({ content: e.target.value })}
                placeholder="Enter content..."
              />
            </div>
          </>
        )}

        {/* ── Aspect Ratio for IMAGE_TEXT ── */}
        {type === MODULE_TYPES.IMAGE_TEXT && (
          <div className={styles.formGroup}>
            <span className={styles.configSectionLabel}>Aspect ratio</span>
            <div className={styles.aspectRatioGroup}>
              {[
                { value: '1:1', label: '1:1' },
                { value: '16:9', label: '16:9' },
                { value: '4:3', label: '4:3' },
                { value: '2:1', label: '2:1' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.aspectRatioBtn} ${(props.aspectRatio || '1:1') === value ? styles.aspectRatioBtnActive : ''}`}
                  onClick={() => updateProps({ aspectRatio: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Image for BANNER_SINGLE ── */}
        {type === MODULE_TYPES.BANNER_SINGLE &&
          (() => {
            const imgs = props.images?.length
              ? props.images
              : props.image
                ? [{ url: props.image, link: props.link || '' }]
                : [];
            return (
              <ImageListEditor
                images={imgs}
                onChange={(newImgs) => {
                  updateProps({ images: newImgs, image: undefined, link: undefined });
                }}
                maxItems={1}
                aspectRatio="16:6"
                addButtonLabel="Upload image"
                linkOptions={[
                  { value: '', label: 'Select path...' },
                  { value: '/', label: 'Home' },
                  { value: '/products', label: 'Products' },
                  { value: '/categories', label: 'Categories' },
                  { value: '/about', label: 'About' },
                  { value: '__custom__', label: 'Custom (enter URL)' },
                ]}
              />
            );
          })()}

        {/* ── Image for IMAGE_TEXT ── */}
        {type === MODULE_TYPES.IMAGE_TEXT &&
          (() => {
            const imgs = props.images?.length
              ? props.images
              : props.image
                ? [{ url: props.image, link: props.link || '' }]
                : [];
            return (
              <ImageListEditor
                images={imgs}
                onChange={(newImgs) => {
                  updateProps({ images: newImgs, image: undefined, link: undefined });
                }}
                maxItems={1}
                aspectRatio={props.aspectRatio || '1:1'}
                addButtonLabel="Upload image"
                linkOptions={[
                  { value: '', label: 'Select path...' },
                  { value: '/', label: 'Home' },
                  { value: '/products', label: 'Products' },
                  { value: '/categories', label: 'Categories' },
                  { value: '__custom__', label: 'Custom (enter URL)' },
                ]}
              />
            );
          })()}

        {/* ── Banner Carousel ── */}
        {type === MODULE_TYPES.BANNER_CAROUSEL && (
          <>
            <div className={styles.uploadRequirements}>
              <span className={styles.uploadRequirementsTitle}>
                <i className="bi bi-camera" /> Image specifications
              </span>
              <ul className={styles.uploadRequirementsList}>
                <li>
                  <strong>Image:</strong> ≤2MB, maximum 2000×2000px. Formats: JPG, JPEG, PNG, GIF.
                </li>
                <li>
                  <strong>Video:</strong> ≤30MB, maximum 1280×1280px, 10–60 seconds. Format: MP4.
                </li>
                <li>
                  <strong>Quantity:</strong> Maximum 6 images/videos.
                </li>
              </ul>
            </div>

            {/* Aspect ratio */}
            <div className={styles.formGroup}>
              <span className={styles.configSectionLabel}>Aspect ratio</span>
              <div className={styles.aspectRatioGroup}>
                {[
                  { value: '2:1', label: '2:1' },
                  { value: '16:9', label: '16:9' },
                  { value: '1:1', label: '1:1' },
                  { value: '3:2', label: '3:2' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.aspectRatioBtn} ${(props.aspectRatio || '2:1') === value ? styles.aspectRatioBtnActive : ''}`}
                    onClick={() => updateProps({ aspectRatio: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image list */}
            <ImageListEditor
              images={props.images || []}
              onChange={(imgs) => updateProps({ images: imgs })}
              maxItems={6}
              addButtonLabel={`Add image/video (${(props.images || []).length}/6)`}
              aspectRatio={props.aspectRatio || '2:1'}
            />

            {/* Autoplay */}
            <div className={styles.formGroup}>
              <div className={styles.toggleRow}>
                <span>Auto rotate images</span>
                <div
                  className={`${styles.toggleTrack} ${props.autoplay ? styles.toggleTrackOn : ''}`}
                  onClick={() => updateProps({ autoplay: !props.autoplay })}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
              {props.autoplay && (
                <>
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={500}
                    value={props.interval || 4000}
                    onChange={(e) => updateProps({ interval: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                  <span className={styles.hintText}>
                    Interval: {(props.interval || 4000) / 1000} seconds
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Banner Multi ── */}
        {type === MODULE_TYPES.BANNER_MULTI && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Number of columns</label>
              <select
                className={styles.formInput}
                value={props.columns || 2}
                onChange={(e) => updateProps({ columns: parseInt(e.target.value, 10) })}
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <ImageListEditor
              images={props.images || []}
              onChange={(imgs) => updateProps({ images: imgs })}
              maxItems={props.columns || 2}
              addButtonLabel={`Add image (${(props.images || []).length}/${props.columns || 2})`}
            />
          </>
        )}

        {/* ── Banner Hotspot ── */}
        {type === MODULE_TYPES.BANNER_HOTSPOT &&
          (() => {
            const imgs = props.images?.length
              ? props.images
              : props.image
                ? [{ url: props.image, link: '' }]
                : [];
            return (
              <>
                <ImageListEditor
                  images={imgs}
                  onChange={(newImgs) => {
                    updateProps({ images: newImgs, image: newImgs[0]?.url || '' });
                  }}
                  maxItems={1}
                  aspectRatio="16:7"
                  addButtonLabel="Upload background image"
                />

                {/* Hotspot status */}
                <div className={styles.formGroup}>
                  <span className={styles.configSectionLabel}>
                    Hotspot areas — {(props.hotspots || []).length}/10
                  </span>
                  {(props.hotspots || []).length > 0 ? (
                    <div className={styles.hotspotStatusList}>
                      {(props.hotspots || []).map((h, i) => (
                        <div key={i} className={styles.hotspotStatusItem}>
                          <span className={styles.hotspotIndex}>{i + 1}</span>
                          <span className={styles.hotspotCoords}>
                            X: {Math.round(h.x)}% · Y: {Math.round(h.y)}%
                          </span>
                          <span
                            className={`${styles.hotspotLink} ${!h.link ? styles.hotspotLinkMissing : ''}`}
                          >
                            {h.link ? h.link : '⚠ No link'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.hintText}>
                      <i className="bi bi-info-circle" />
                      No hotspot areas yet. Click the button below to open the editor.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className={`${styles.topBtnPrimary} ${styles.fullWidth}`}
                  onClick={() => setShowHotspotEditor(true)}
                  disabled={!props.image}
                  style={{ marginBottom: 8 }}
                >
                  <i className="bi bi-pin-map" />
                  {props.hotspots?.length > 0 ? 'Edit Hotspot' : 'Create Hotspot'}
                </button>
                {!props.image && (
                  <p className={styles.hintText} style={{ color: '#ef4444' }}>
                    Please upload background image first
                  </p>
                )}

                {showHotspotEditor && (
                  <HotspotEditor
                    image={props.image || props.images?.[0]?.url || ''}
                    hotspots={props.hotspots || []}
                    onSave={(hotspots) => {
                      updateProps({ hotspots });
                      setShowHotspotEditor(false);
                    }}
                  />
                )}
              </>
            );
          })()}

        {/* ── Title + Hide Title for Product Modules ── */}
        {[
          MODULE_TYPES.FEATURED_PRODUCTS,
          MODULE_TYPES.BEST_SELLING,
          MODULE_TYPES.NEW_PRODUCTS,
          MODULE_TYPES.FLASH_DEALS,
          MODULE_TYPES.ADDON_DEALS,
          MODULE_TYPES.COMBO_PROMOS,
        ].includes(type) && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input
                type="text"
                className={styles.formInput}
                value={props.title || ''}
                onChange={(e) => updateProps({ title: e.target.value })}
                placeholder="Enter module title..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  checked={!props.hideTitle}
                  onChange={(e) => updateProps({ hideTitle: !e.target.checked })}
                />{' '}
                Show title
              </label>
            </div>
          </>
        )}

        {/* ── Title + Hide Title for Category Modules ── */}
        {[MODULE_TYPES.FEATURED_CATEGORIES, MODULE_TYPES.CATEGORY_LIST].includes(type) && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input
                type="text"
                className={styles.formInput}
                value={props.title || ''}
                onChange={(e) => updateProps({ title: e.target.value })}
                placeholder="Enter module title..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  checked={!props.hideTitle}
                  onChange={(e) => updateProps({ hideTitle: !e.target.checked })}
                />{' '}
                Show title
              </label>
            </div>
          </>
        )}
      </div>

      {!module.isMandatory && (
        <div className={styles.rightFooter}>
          <button
            type="button"
            className={styles.deleteBlockBtn}
            onClick={() => {
              onDelete(module.id);
            }}
          >
            <i className="bi bi-trash" /> Remove module
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Cover Photo Editor Panel ──────────────────────────────────────────────────

function CoverPhotoPanel({ coverUrl, onChangeCoverUrl, onClose }) {
  const [cropEditorOpen, setCropEditorOpen] = useState(false);

  const handleUploadSuccess = useCallback(
    (url) => {
      if (!url) return;
      onChangeCoverUrl(url);
    },
    [onChangeCoverUrl]
  );

  const handleRemove = useCallback(() => {
    onChangeCoverUrl('');
  }, [onChangeCoverUrl]);

  const handleChangeImage = useCallback(() => {
    // To change image via CloudinaryUpload, we need to click its hidden input
    // But since CloudinaryUpload shows preview when value is truthy, we must click it directly
    const wrapper = document.querySelector('[data-cover-upload]');
    if (wrapper) {
      const input = wrapper.querySelector('input[type="file"]');
      if (input) input.click();
    }
  }, []);

  return (
    <div className={styles.rightPanel}>
      <div className={styles.rightHeader}>
        <h3 className={styles.rightTitle}>Shop Cover Photo</h3>
        <p className={styles.rightSubtitle}>Update your shop's hero banner</p>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#6b7280',
          }}
        >
          <i className="bi bi-x" />
        </button>
      </div>

      <div className={styles.rightScroll}>
        <div className={styles.uploadRequirements}>
          <span className={styles.uploadRequirementsTitle}>
            <i className="bi bi-camera" /> Image specifications
          </span>
          <ul className={styles.uploadRequirementsList}>
            <li>
              <strong>Size:</strong> Recommended 1200×300px (4:1) or wider.
            </li>
            <li>
              <strong>File:</strong> ≤2MB (JPG, JPEG, PNG).
            </li>
            <li>Shows at the top of your shop profile across all devices.</li>
          </ul>
        </div>

        <div className={styles.formGroup} style={{ marginTop: 24 }}>
          <label className={styles.configSectionLabel}>Current Cover Photo</label>
            <div className={styles.bannerCard} style={{ marginTop: 8 }}>
              <div className={styles.bannerCardMain}>
                {coverUrl ? (
                  <div className={styles.bannerCardPreview} style={{ aspectRatio: '4/1', background: '#f8fafc' }}>
                    <img src={coverUrl} alt="Cover" className={styles.bannerCardImg} />
                    <button
                      type="button"
                      className={styles.bannerCardEditBtn}
                      onClick={() => setCropEditorOpen(true)}
                      title="Edit"
                    >
                      <i className="bi bi-pencil" />
                      <span>Edit</span>
                    </button>
                    <div className={styles.bannerCardToolbar}>
                      <button
                        type="button"
                        className={styles.bannerCardToolbarBtn}
                        onClick={() => setCropEditorOpen(true)}
                        title="Crop image"
                      >
                        <i className="bi bi-crop" />
                      </button>
                      <button
                        type="button"
                        className={styles.bannerCardToolbarBtn}
                        onClick={handleChangeImage}
                        title="Change image"
                      >
                        <i className="bi bi-folder2" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.bannerCardToolbarBtn} text-red-400 border-red-400 hover:text-red-500 hover:border-red-500`}
                        onClick={handleRemove}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                    {/* Hidden CloudinaryUpload for "Change Image" button to target */}
                    <div style={{ display: 'none' }} data-cover-upload>
                      <CloudinaryUpload value="" onChange={handleUploadSuccess} aspectRatio="4:1" />
                    </div>
                  </div>
                ) : (
                  <div className={styles.bannerCardUpload} data-cover-upload>
                    <CloudinaryUpload
                      value=""
                      onChange={handleUploadSuccess}
                      hint="Upload Cover"
                      aspectRatio="4:1"
                    />
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
      
      {cropEditorOpen && coverUrl && (
        <CropModal
          imageUrl={coverUrl}
          aspectRatio="4:1"
          onApply={(newUrl) => {
            handleUploadSuccess(newUrl);
            setCropEditorOpen(false);
          }}
          onClose={() => setCropEditorOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopDecorationPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userId = user?._id;

  // Redux selectors
  const modules = useSelector(selectCurrentModules);
  const rawModules = useSelector(selectRawModules);
  const selectedModule = useSelector(selectSelectedModule);
  const isSaving = useSelector(selectIsSaving);
  const lastSaved = useSelector(selectLastSaved);

  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [pendingCoverUrl, setPendingCoverUrl] = useState(undefined);

  // Fetch decoration on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchDecoration());
    }
  }, [dispatch, userId]);

  // ── Debounced auto-save (3s after last change) ─────────────────────────
  const autoSaveTimerRef = useRef(null);
  const isDirty = useSelector(selectIsDirty);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      dispatch(saveDecoration({ modules: rawModules, widgets: {} }));
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawModules, isDirty]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S → Save
      if (ctrl && e.key === 's') {
        e.preventDefault();
        dispatch(saveDecoration({ modules, widgets: {} }));
      }
      // Ctrl/Cmd + Shift + P → Publish
      if (ctrl && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        dispatch(publishDecoration());
      }
      // Delete / Backspace → Delete selected module
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModule) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return;
        if (selectedModule.isMandatory) {
          toast.info('This module cannot be removed.');
          return;
        }
        dispatch(removeModule(selectedModule.id));
        toast.success('Module deleted.');
      }
      // Escape → Clear selection
      if (e.key === 'Escape') {
        dispatch(clearSelection());
      }
    },
    [dispatch, rawModules, selectedModule]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Cover Photo Edit Handling ─────────────────────────────────────────────
  useEffect(() => {
    const handleCoverClick = () => {
      dispatch(clearSelection()); // Clear module selection
      setShowCoverEditor(true);
    };

    window.addEventListener('shopCoverClick', handleCoverClick);
    return () => window.removeEventListener('shopCoverClick', handleCoverClick);
  }, [dispatch]);

  // Hide cover editor if a module is picked
  useEffect(() => {
    if (selectedModule) {
      setShowCoverEditor(false);
    }
  }, [selectedModule]);

  // ── Module actions (Redux dispatch) ──────────────────────────────────────
  const handleUpdateModule = useCallback(
    ({ id, props, changes }) => {
      if (props !== undefined) {
        dispatch(updateModuleProps({ id, props }));
      } else if (changes !== undefined) {
        dispatch(updateModuleExtra({ id, changes }));
      }
    },
    [dispatch]
  );

  const handleDeleteModule = useCallback(
    (moduleId) => {
      dispatch(removeModule(moduleId));
      toast.success('Module removed.');
    },
    [dispatch]
  );

  // ── Validate: prevent publish if placeholder images exist ────────────────────
  const validateNoPlaceholders = useCallback((modulesToCheck) => {
    const placeholderPattern = /placehold\.co/i;
    const imageModules = [
      MODULE_TYPES.BANNER_SINGLE,
      MODULE_TYPES.BANNER_CAROUSEL,
      MODULE_TYPES.BANNER_MULTI,
      MODULE_TYPES.IMAGE_TEXT,
      MODULE_TYPES.BANNER_HOTSPOT,
    ];

    for (const module of modulesToCheck) {
      if (!module.isEnabled) continue;
      if (!imageModules.includes(module.type)) continue;

      const { props = {} } = module;

      // BANNER_SINGLE, IMAGE_TEXT, BANNER_HOTSPOT: check props.image
      if (props.image && placeholderPattern.test(props.image)) {
        return {
          valid: false,
          message: `Module "${MODULE_LABELS[module.type]}" is still using placeholder images. Please upload real images before publishing.`,
        };
      }

      // BANNER_CAROUSEL, BANNER_MULTI: check props.images[]
      if (props.images && Array.isArray(props.images)) {
        for (const img of props.images) {
          const url = typeof img === 'string' ? img : img?.url || '';
          if (url && placeholderPattern.test(url)) {
            return {
              valid: false,
              message: `Module "${MODULE_LABELS[module.type]}" has placeholder images in the list. Please replace with real images.`,
            };
          }
        }
      }
    }

    return { valid: true };
  }, []);

  // ── Save & publish ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    try {
      await dispatch(saveDecoration({ modules: rawModules, widgets: {} })).unwrap();
      toast.success('Draft saved successfully.');
    } catch (err) {
      toast.error(err || 'Failed to save draft.');
    }
  }, [dispatch, rawModules]);

  const handlePublish = useCallback(async () => {
    const validation = validateNoPlaceholders(modules);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    try {
      // If there are pending cover photo changes, save them
      if (pendingCoverUrl !== undefined) {
        await authService.updateProfile({ profileImage: pendingCoverUrl });
        dispatch(updateUser({ ...user, profileImage: pendingCoverUrl }));
        setPendingCoverUrl(undefined);
      }

      await dispatch(publishDecoration()).unwrap();
      toast.success('Published successfully!');
    } catch (err) {
      toast.error(err || 'Failed to publish.');
    }
  }, [dispatch, modules, validateNoPlaceholders, pendingCoverUrl, user]);

  const handlePreview = useCallback(() => {
    if (!userId) {
      toast.info('Shop information not found.');
      return;
    }
    window.open(`/shop/${userId}`, '_blank', 'noopener,noreferrer');
  }, [userId]);

  const formatTime = (date) => {
    if (!date) {
      return 'Not saved';
    }
    const d = new Date(date);
    return `Last saved: ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}></div>
          <div className={styles.topBarRight}>
            <div className={styles.lastSaved}>
              <i className="bi bi-cloud-check-fill" />
              {formatTime(lastSaved)}
            </div>
            <div className={styles.topActions}>
              <button type="button" className={styles.topBtn} onClick={handlePreview}>
                <i className="bi bi-eye" /> Preview
              </button>
              <button
                type="button"
                className={styles.topBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className={styles.topBtnPrimary}
                onClick={handlePublish}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </header>

        {/* ── Main 3-column ──────────────────────────────────────────── */}
        <div className={styles.main}>
          {/* Left: Module Library ─────────────────────── */}
          <aside className={styles.leftPanel}>
            <div className={styles.leftPanelScroll}>
              <div className={styles.panelHeader}>
                <p className={styles.panelTitle}>Module Library</p>
                <p className={styles.panelSubtitle}>Drag to canvas or click to add module</p>
              </div>

              {/* Module groups */}
              {MODULE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className={styles.sectionTitle}>{group.label}</p>
                  <div className={styles.libraryGrid}>
                    {group.items.map(({ type, icon }) => (
                      <LibraryItem key={type} type={type} icon={icon} label={MODULE_LABELS[type]} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Center: Live Preview Canvas ─────────────────────────────── */}
          <PreviewCanvas pendingCoverUrl={pendingCoverUrl} />

          {/* Right: Config panel ─────────────────────────────────────── */}
          {showCoverEditor ? (
            <CoverPhotoPanel 
              coverUrl={pendingCoverUrl !== undefined ? pendingCoverUrl : (user?.profileImage || '')}
              onChangeCoverUrl={setPendingCoverUrl}
              onClose={() => setShowCoverEditor(false)} 
            />
          ) : (
            <ModuleConfigPanel
              module={selectedModule}
              onUpdate={handleUpdateModule}
              onDelete={handleDeleteModule}
              onCoverClick={() => setShowCoverEditor(true)}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// ─── Voucher Picker Modal ────────────────────────────────────────────────────

function VoucherPickerModal({ selectedIds = [], onApply, onClose }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [tab, setTab] = useState('active'); // 'active' | 'upcoming' | 'expired'
  const maxSelect = 5;

  // Sync selected state when selectedIds prop changes
  useEffect(() => {
    setSelected(new Set(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const params = tab === 'all' ? {} : { status: tab };
        const res = await voucherService.getVouchers(params);
        setVouchers(res.success ? res.data : []);
      } catch {
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [tab]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSelect) {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = vouchers.filter((v) => {
    if (tab === 'active') return v.status === 'active';
    if (tab === 'upcoming') return v.status === 'upcoming';
    if (tab === 'expired') return v.status === 'expired';
    return true;
  });

  const handleApply = () => {
    // Return only simple flat objects with id and code - avoid passing full mongoose documents
    const selectedVouchers = filtered
      .filter((v) => selected.has(v._id || v.id))
      .map((v) => ({
        id: v._id || v.id,
        code: v.code || '',
      }));
    onApply(selectedVouchers);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.voucherModalHeader}>
          <h3>Select vouchers</h3>
          <span className={styles.voucherModalCount}>
            {selected.size}/{maxSelect}
          </span>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.voucherModalTabs}>
          {[
            { key: 'active', label: 'Active' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'expired', label: 'Expired' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.voucherTabBtn} ${tab === key ? styles.voucherTabBtnActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-ticket-perforated" />
              <p>No vouchers available</p>
            </div>
          ) : (
            filtered.map((v) => {
              const isSelected = selected.has(v._id || v.id);
              const isDisabled = !isSelected && selected.size >= maxSelect;
              return (
                <div
                  key={v._id || v.id}
                  className={`
                    ${styles.voucherModalItem}
                    ${isSelected ? styles.voucherModalItemSelected : ''}
                    ${isDisabled ? styles.voucherModalItemDisabled : ''}
                  `}
                  onClick={() => !isDisabled && toggle(v._id || v.id)}
                >
                  <div className={styles.voucherCheckCircle}>
                    {isSelected && <i className="bi bi-check" />}
                  </div>
                  <div className={styles.voucherModalItemBody}>
                    <div className={styles.voucherModalItemCode}>{v.code}</div>
                    <div className={styles.voucherModalItemDesc}>
                      {v.discountType === 'percentage'
                        ? `${v.discountValue}%`
                        : `${v.discountValue.toLocaleString('vi-VN')}đ`}
                      {v.minOrder > 0 && ` | Order from ${v.minOrder.toLocaleString('en-US')}đ`}
                    </div>
                  </div>
                  <span
                    className={`${styles.voucherStatusBadge} ${styles[`voucherStatus_${v.status}`]}`}
                  >
                    {v.status === 'active'
                      ? 'Active'
                      : v.status === 'upcoming'
                        ? 'Upcoming'
                        : 'Expired'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.voucherModalFooter}>
          <button type="button" className={styles.voucherModalCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.voucherModalConfirm} onClick={handleApply}>
            Apply ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Picker Modal ────────────────────────────────────────────────────

function ProductPickerModal({ products, loading, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.voucherModalHeader}>
          <h3>Select Product</h3>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : products.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-box-seam" />
              <p>No products available</p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p._id || p.id}
                className={styles.voucherModalItem}
                onClick={() => onSelect(p._id || p.id, p.name)}
              >
                <div className={styles.voucherModalItemBody}>
                  <div className={styles.voucherModalItemCode}>{p.name}</div>
                  <div className={styles.voucherModalItemDesc}>
                    {p.price ? `${p.price.toLocaleString()}đ` : 'No price'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Picker Modal ────────────────────────────────────────────────────

function CategoryPickerModal({ categories, loading, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.voucherModalHeader}>
          <h3>Select Category</h3>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-folder" />
              <p>No categories available</p>
            </div>
          ) : (
            categories.map((c) => (
              <div
                key={c._id || c.id}
                className={styles.voucherModalItem}
                onClick={() => onSelect(c._id || c.id, c.name)}
              >
                <div className={styles.voucherModalItemBody}>
                  <div className={styles.voucherModalItemCode}>{c.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Voucher Picker Modal for Image Link ────────────────────────────────────────

function VoucherPickerModalForImage({ vouchers, loading, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.voucherModalHeader}>
          <h3>Select Voucher</h3>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : vouchers.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-ticket-perforated" />
              <p>No vouchers available</p>
            </div>
          ) : (
            vouchers.map((v) => (
              <div
                key={v._id || v.id}
                className={styles.voucherModalItem}
                onClick={() =>
                  onSelect(v._id || v.id, v.code || v.name || `Voucher ${v._id || v.id}`)
                }
              >
                <div className={styles.voucherModalItemBody}>
                  <div className={styles.voucherModalItemCode}>
                    {v.code || v.name || `Voucher ${v._id || v.id}`}
                  </div>
                  <div className={styles.voucherModalItemDesc}>
                    {v.discountType === 'percentage'
                      ? `${v.discountValue}%`
                      : `${v.discountValue?.toLocaleString('vi-VN') || 0}đ`}
                    {v.minOrder > 0 && ` | Order from ${v.minOrder.toLocaleString('en-US')}đ`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Combo Picker Modal ──────────────────────────────────────────────────────────

function ComboPickerModal({ combos, loading, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.voucherModalHeader}>
          <h3>Select Combo</h3>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : combos.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-box-seam" />
              <p>No combos available</p>
            </div>
          ) : (
            combos.map((c) => (
              <div
                key={c._id || c.id}
                className={styles.voucherModalItem}
                onClick={() => onSelect(c._id || c.id, c.name || `Combo ${c._id || c.id}`)}
              >
                <div className={styles.voucherModalItemBody}>
                  <div className={styles.voucherModalItemCode}>
                    {c.name || `Combo ${c._id || c.id}`}
                  </div>
                  <div className={styles.voucherModalItemDesc}>
                    {c.price ? `${c.price.toLocaleString()}đ` : 'No price'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Addon Picker Modal ──────────────────────────────────────────────────────────

function AddonPickerModal({ addons, loading, onSelect, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.voucherModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.voucherModalHeader}>
          <h3>Select Add-on Deal</h3>
          <button type="button" className={styles.voucherModalClose} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={styles.voucherModalList}>
          {loading ? (
            <div className={styles.voucherModalLoading}>
              <span>Loading...</span>
            </div>
          ) : addons.length === 0 ? (
            <div className={styles.voucherModalEmpty}>
              <i className="bi bi-gift" />
              <p>No add-on deals available</p>
            </div>
          ) : (
            addons.map((a) => (
              <div
                key={a._id || a.id}
                className={styles.voucherModalItem}
                onClick={() => onSelect(a._id || a.id, a.name || `Add-on ${a._id || a.id}`)}
              >
                <div className={styles.voucherModalItemBody}>
                  <div className={styles.voucherModalItemCode}>
                    {a.name || `Add-on ${a._id || a.id}`}
                  </div>
                  <div className={styles.voucherModalItemDesc}>
                    {a.price ? `${a.price.toLocaleString()}đ` : 'No price'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
