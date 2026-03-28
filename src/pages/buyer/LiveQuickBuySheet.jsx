import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { addToCartFromLive } from '@store/slices/cartSlice';
import { orderService } from '@services/api/orderService';
import { productService } from '@services/api/productService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/buyer/LiveQuickBuySheet.module.css';

const sheetVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// ── Same variant logic as ProductDetailsPage ─────────────────────────────────
const findModel = (detail, tierIndex) => {
  if (!detail?.models || !tierIndex?.length) {
return null;
}
  return detail.models.find(
    (m) =>
      m.tierIndex &&
      m.tierIndex.length === tierIndex.length &&
      m.tierIndex.every((val, i) => val === tierIndex[i]),
  );
};

const getPriceRange = (detail) => {
  if (!detail?.models?.length) {
    const p = detail?.price ?? detail?.originalPrice ?? 0;
    return { min: Number(p) || 0, max: Number(p) || 0 };
  }
  const prices = detail.models.map((m) => Number(m.price) || 0);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

/** Fallback when live session payload has no unit price on the root */
const resolveLiveUnitPrice = (live) => {
  if (!live) {
return 0;
}
  const nested = live.productId && typeof live.productId === 'object' ? live.productId : null;
  const sale = live.price != null && !Number.isNaN(Number(live.price)) ? Number(live.price) : null;
  const orig = live.originalPrice != null && !Number.isNaN(Number(live.originalPrice)) ? Number(live.originalPrice) : null;
  if (sale != null && sale > 0) {
return sale;
}
  if (orig != null && orig > 0) {
return orig;
}
  if (nested) {
    const ns = nested.price != null && !Number.isNaN(Number(nested.price)) ? Number(nested.price) : null;
    const no = nested.originalPrice != null && !Number.isNaN(Number(nested.originalPrice)) ? Number(nested.originalPrice) : null;
    if (ns != null && ns > 0) {
return ns;
}
    if (no != null && no > 0) {
return no;
}
  }
  return 0;
};

const deriveColorSize = (detail, selectedTierIndex) => {
  let color = 'Default';
  let size = 'Default';
  if (!detail?.tier_variations?.length) {
return { color, size };
}
  detail.tier_variations.forEach((tier, idx) => {
    const selectedOption = tier.options?.[selectedTierIndex[idx]];
    if (selectedOption == null) {
return;
}
    const tierNameLower = String(tier.name || '').toLowerCase();
    if (
      tierNameLower.includes('color') ||
      tierNameLower.includes('màu') ||
      tierNameLower.includes('mau')
    ) {
      color = selectedOption;
    } else if (
      tierNameLower.includes('size') ||
      tierNameLower.includes('kích') ||
      tierNameLower.includes('kich')
    ) {
      size = selectedOption;
    }
  });
  return { color, size };
};

const buildVariantLabel = (color, size) => {
  const parts = [color, size].filter((v) => v && v !== 'Default');
  return parts.length > 0 ? parts.join(' / ') : null;
};

const LiveQuickBuySheet = ({
  show,
  onHide,
  product: liveProduct,
  liveVouchers = [],
  sessionId,
  user,
  onAddToLiveCart,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    email: '', firstName: '', lastName: '', phone: '', address: '',
  });
  const [selectedLiveVoucher, setSelectedLiveVoucher] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('ghn');
  const [submitting, setSubmitting] = useState(false);

  const [detailProduct, setDetailProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState([]);
  const [activeModel, setActiveModel] = useState(null);

  // Fetch full product (tiers, models, prices) when sheet opens
  useEffect(() => {
    if (!show || !liveProduct?._id) {
return undefined;
}

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    productService
      .getById(liveProduct._id)
      .then((res) => {
        const raw = res?.data?.data || res?.data || res;
        if (cancelled || !raw?._id) {
return;
}

        const tiers = raw.tiers || [];
        const initialSelection = tiers.length > 0 ? tiers.map(() => 0) : [];

        const transformed = {
          ...raw,
          tier_variations: tiers,
          models: raw.models || [],
        };

        setDetailProduct(transformed);
        setSelectedTierIndex(initialSelection);

        if (initialSelection.length > 0) {
          const model = findModel(transformed, initialSelection);
          setActiveModel(model || null);
        } else if (transformed.models?.length === 1) {
          setActiveModel(transformed.models[0]);
        } else {
          setActiveModel(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailError('Không tải được biến thể sản phẩm');
          setDetailProduct(null);
          setSelectedTierIndex([]);
          setActiveModel(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
setDetailLoading(false);
}
      });

    return () => {
      cancelled = true;
    };
  }, [show, liveProduct?._id]);

  useEffect(() => {
    if (!show) {
      setQuantity(1);
      setSelectedLiveVoucher(null);
      setDetailProduct(null);
      setDetailError(null);
      setSelectedTierIndex([]);
      setActiveModel(null);
    }
  }, [show]);

  // Fetch customer info on sheet open
  useEffect(() => {
    if (!show) {
return;
}
    orderService
      .getCheckoutInfo()
      .then((res) => {
        if (res.success) {
          const d = res.data;
          setCustomerInfo({
            email: d.email || '',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            phone: d.phone || '',
            address: d.address || '',
          });
        }
      })
      .catch(() => {});
  }, [show]);

  const isOptionDisabled = useCallback(
    (tierLevel, optionIndex) => {
      if (!detailProduct?.models) {
return false;
}
      const targetIndices = [...selectedTierIndex];
      targetIndices[tierLevel] = optionIndex;
      const matchingModel = findModel(detailProduct, targetIndices);
      if (!matchingModel) {
return true;
}
      return matchingModel.stock <= 0;
    },
    [detailProduct, selectedTierIndex],
  );

  const handleTierChange = useCallback(
    (tierLevel, optionIndex) => {
      if (!detailProduct || isOptionDisabled(tierLevel, optionIndex)) {
return;
}
      const newIndex = [...selectedTierIndex];
      newIndex[tierLevel] = optionIndex;
      setSelectedTierIndex(newIndex);
      const matchingModel = findModel(detailProduct, newIndex);
      setActiveModel(matchingModel || null);
    },
    [detailProduct, selectedTierIndex, isOptionDisabled],
  );

  const unitPrice = useMemo(() => {
    if (activeModel && Number(activeModel.price) > 0) {
      return Number(activeModel.price);
    }
    if (detailProduct) {
      const { min } = getPriceRange(detailProduct);
      if (min > 0) {
return min;
}
    }
    return resolveLiveUnitPrice(liveProduct);
  }, [activeModel, detailProduct, liveProduct]);

  const originalListPrice = useMemo(() => {
    const fromLive =
      liveProduct?.originalPrice != null && !Number.isNaN(Number(liveProduct.originalPrice))
        ? Number(liveProduct.originalPrice)
        : null;
    const fromDetail =
      detailProduct?.originalPrice != null && !Number.isNaN(Number(detailProduct.originalPrice))
        ? Number(detailProduct.originalPrice)
        : null;
    const o = fromDetail ?? fromLive;
    return o != null && o > 0 ? o : null;
  }, [liveProduct, detailProduct]);

  const displayImage = useMemo(() => {
    const liveImg =
      liveProduct?.thumbnail || liveProduct?.images?.[0] || liveProduct?.image;
    const tier0 = detailProduct?.tier_variations?.[0];
    const idx = selectedTierIndex[0];
    if (tier0?.images?.length && idx != null && tier0.images[idx]) {
      return tier0.images[idx];
    }
    return detailProduct?.images?.[0] || liveImg || '/placeholder.jpg';
  }, [liveProduct, detailProduct, selectedTierIndex]);

  const { color: selectedColor, size: selectedSize } = useMemo(
    () => deriveColorSize(detailProduct, selectedTierIndex),
    [detailProduct, selectedTierIndex],
  );

  const maxStock = useMemo(() => {
    if (activeModel != null) {
return Math.max(0, activeModel.stock || 0);
}
    if (detailProduct?.stock != null) {
return Math.max(0, detailProduct.stock);
}
    return 99;
  }, [activeModel, detailProduct]);

  useEffect(() => {
    if (quantity > maxStock && maxStock > 0) {
setQuantity(maxStock);
}
  }, [maxStock, quantity]);

  const computeLocalPreview = useCallback(() => {
    const subtotal = unitPrice * quantity;
    let discount = 0;
    if (selectedLiveVoucher) {
      if (selectedLiveVoucher.discountType === 'percent') {
        discount = Math.min(
          subtotal * (Number(selectedLiveVoucher.discountValue) / 100),
          Number(selectedLiveVoucher.maxDiscount) || Infinity,
        );
      } else {
        discount = Number(selectedLiveVoucher.discountValue) || 0;
      }
    }
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
  }, [unitPrice, quantity, selectedLiveVoucher]);

  const localPreview = computeLocalPreview();
  const displaySubtotal = localPreview.subtotal;
  const displayDiscount = localPreview.discount;
  const displayTotal = localPreview.total;

  const handleQuantityChange = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      const cap = maxStock > 0 ? maxStock : 99;
      return Math.max(1, Math.min(cap, next));
    });
  };

  const handleApplyVoucher = (voucher) => {
    setSelectedLiveVoucher(voucher);
  };

  const handleRemoveVoucher = () => {
    setSelectedLiveVoucher(null);
  };

  const needsVariantSelection =
    detailProduct?.tier_variations?.length > 0 && !activeModel;

  const canCheckout =
    !detailLoading &&
    unitPrice > 0 &&
    !needsVariantSelection &&
    maxStock > 0;

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/live/${sessionId}` } });
      return;
    }

    if (!liveProduct?._id) {
return;
}

    if (detailProduct?.tier_variations?.length > 0) {
      if (!activeModel) {
        toast.error('Vui lòng chọn đủ phân loại hàng');
        return;
      }
    }

    if (maxStock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    setSubmitting(true);

    try {
      if (activeModel) {
        const stockRes = await productService.checkStockAvailability(
          liveProduct._id,
          activeModel._id,
          quantity,
        );
        if (!stockRes.data?.available) {
          toast.error(
            `Không đủ hàng. Còn lại: ${stockRes.data?.currentStock ?? 0}`,
          );
          setSubmitting(false);
          return;
        }
      }

      const color = selectedColor;
      const size = selectedSize;

      if (onAddToLiveCart) {
        const computedPrice = activeModel ? Number(activeModel.price) : unitPrice;
        onAddToLiveCart({
          productId: liveProduct._id,
          name: detailProduct?.name || liveProduct.name,
          image: displayImage,
          price: computedPrice,
          quantity,
          color,
          size,
          variantLabel: buildVariantLabel(color, size),
        });
      } else {
        await dispatch(
          addToCartFromLive({
            productId: liveProduct._id,
            quantity,
            price: unitPrice,
            color,
            size,
            image: displayImage,
            name: detailProduct?.name || liveProduct.name,
          }),
        ).unwrap();

        navigate('/buyer/checkout', {
          state: {
            selectedItems: [
              {
                id: `live_${Date.now()}`,
                productId: liveProduct._id,
                name: detailProduct?.name || liveProduct.name,
                image: displayImage,
                price: unitPrice,
                quantity,
                color,
                size,
              },
            ],
            preSelectedLiveVoucher: selectedLiveVoucher,
            fromLiveSession: sessionId,
          },
        });

        onHide();
      }
    } catch (e) {
      const msg =
        typeof e === 'string'
          ? e
          : e?.message || 'Không thêm được vào giỏ hàng';
      toast.error(msg);
      console.error('Failed to add to cart:', e);
      setSubmitting(false);
    }
  };

  if (!liveProduct) {
return null;
}

  const displayName = detailProduct?.name || liveProduct.name;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className={styles['lqbs-backdrop']}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onHide}
          />

          <motion.div
            className={styles['lqbs-sheet']}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles['lqbs-handle']} />

            <div className={styles['lqbs-header']}>
              <span className={styles['lqbs-header-title']}>Mua ngay</span>
              <button className={styles['lqbs-close']} onClick={onHide} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Product summary */}
            <div className={styles['lqbs-product-row']}>
              <img
                src={displayImage}
                alt={displayName}
                className={styles['lqbs-product-img']}
              />
              <div className={styles['lqbs-product-info']}>
                <div className={styles['lqbs-product-name']}>{displayName}</div>
                {detailLoading ? (
                  <div className={styles['lqbs-product-price']}>Đang tải giá…</div>
                ) : (
                  <div className={styles['lqbs-product-price']}>
                    {formatCurrency(unitPrice)}
                  </div>
                )}
                {originalListPrice != null &&
                  originalListPrice > unitPrice &&
                  unitPrice > 0 && (
                  <div className={styles['lqbs-product-original']}>
                    {formatCurrency(originalListPrice)}
                  </div>
                )}
              </div>
              <div className={styles['lqbs-qty-wrap']}>
                <button
                  className={styles['lqbs-qty-btn']}
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className={styles['lqbs-qty-val']}>{quantity}</span>
                <button
                  className={styles['lqbs-qty-btn']}
                  onClick={() => handleQuantityChange(1)}
                  disabled={maxStock > 0 ? quantity >= maxStock : false}
                >
                  +
                </button>
              </div>
            </div>

            {detailError && (
              <div className={styles['lqbs-detail-error']}>{detailError}</div>
            )}

            <div className={styles['lqbs-body']}>
              {/* Variants — same data model as ProductDetailsPage */}
              {detailProduct?.tier_variations?.map((tier, tierIdx) => (
                <div key={tierIdx} className={styles['lqbs-tier-section']}>
                  <div className={styles['lqbs-tier-label']}>{tier.name}</div>
                  <div className={styles['lqbs-tier-options']}>
                    {tier.options?.map((option, optIdx) => {
                      const isSelected = selectedTierIndex[tierIdx] === optIdx;
                      const isDisabled = isOptionDisabled(tierIdx, optIdx);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={`${styles['lqbs-tier-option']} ${isSelected ? styles['lqbs-tier-option--active'] : ''} ${isDisabled ? styles['lqbs-tier-option--disabled'] : ''}`}
                          onClick={() => handleTierChange(tierIdx, optIdx)}
                          disabled={isDisabled}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {liveVouchers.length > 0 && (
                <div className={styles['lqbs-section']}>
                  <div className={styles['lqbs-section-title']}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    Voucher Live
                  </div>

                  {selectedLiveVoucher ? (
                    <div className={styles['lqbs-applied-voucher']}>
                      <div className={styles['lqbs-applied-voucher-left']}>
                        <div className={styles['lqbs-applied-voucher-tag']}>
                          {selectedLiveVoucher.discountType === 'percent'
                            ? `${selectedLiveVoucher.discountValue}%`
                            : formatCurrency(selectedLiveVoucher.discountValue)}
                        </div>
                        <div className={styles['lqbs-applied-voucher-info']}>
                          <div className={styles['lqbs-applied-voucher-name']}>{selectedLiveVoucher.name}</div>
                          <div className={styles['lqbs-applied-voucher-code']}>{selectedLiveVoucher.code}</div>
                        </div>
                      </div>
                      <button type="button" className={styles['lqbs-voucher-remove']} onClick={handleRemoveVoucher}>
                        Bỏ
                      </button>
                    </div>
                  ) : (
                    <div className={styles['lqbs-voucher-list']}>
                      {liveVouchers.map((v) => {
                        const canUse = displaySubtotal >= (Number(v.minBasketPrice) || 0);
                        return (
                          <div
                            key={v._id}
                            className={`${styles['lqbs-voucher-chip']} ${!canUse ? styles['lqbs-voucher-chip--disabled'] : ''}`}
                            onClick={() => canUse && handleApplyVoucher(v)}
                            role="presentation"
                          >
                            <span className={styles['lqbs-voucher-chip-discount']}>
                              {v.discountType === 'percent' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                            </span>
                            <span className={styles['lqbs-voucher-chip-name']}>{v.name}</span>
                            {!canUse && (
                              <span className={styles['lqbs-voucher-chip-hint']}>
                                Tối thiểu {formatCurrency(v.minBasketPrice)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className={styles['lqbs-section']}>
                <div className={styles['lqbs-section-title']}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Thông tin người mua
                </div>

                <div className={styles['lqbs-form-grid']}>
                  <div className={styles['lqbs-form-row']}>
                    <input
                      className={styles['lqbs-input']}
                      placeholder="Họ"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo((p) => ({ ...p, lastName: e.target.value }))}
                    />
                    <input
                      className={styles['lqbs-input']}
                      placeholder="Tên"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <input
                    className={styles['lqbs-input']}
                    type="tel"
                    placeholder="Số điện thoại"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <input
                    className={styles['lqbs-input']}
                    type="email"
                    placeholder="Email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))}
                  />
                  <input
                    className={styles['lqbs-input']}
                    placeholder="Địa chỉ"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles['lqbs-section']}>
                <div className={styles['lqbs-section-title']}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Phương thức vận chuyển (ước tính)
                </div>
                <div className={styles['lqbs-shipping-options']}>
                  {[
                    { id: 'ghn', label: 'Giao Hàng Nhanh (GHN)' },
                    { id: 'ghtk', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
                    { id: 'viettel', label: 'Viettel Post' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`${styles['lqbs-shipping-option']} ${shippingMethod === opt.id ? styles['lqbs-shipping-option--active'] : ''}`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={shippingMethod === opt.id}
                        onChange={() => setShippingMethod(opt.id)}
                        className={styles['lqbs-shipping-radio']}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <p className={styles['lqbs-shipping-note']}>
                  Phí vận chuyển chính xác sẽ được tính ở bước thanh toán.
                </p>
              </div>
            </div>

            <div className={styles['lqbs-footer']}>
              <div className={styles['lqbs-totals']}>
                <div className={styles['lqbs-total-row']}>
                  <span>Tạm tính</span>
                  <span>{formatCurrency(displaySubtotal)}</span>
                </div>
                {displayDiscount > 0 && (
                  <div className={`${styles['lqbs-total-row']} ${styles['lqbs-total-row--discount']}`}>
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(displayDiscount)}</span>
                  </div>
                )}
                <div className={`${styles['lqbs-total-row']} ${styles['lqbs-total-row--grand']}`}>
                  <span>Tổng tạm</span>
                  <span>{formatCurrency(displayTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                className={styles['lqbs-buy-btn']}
                onClick={handleBuyNow}
                disabled={submitting || detailLoading || !canCheckout}
              >
                {submitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Tiến hành thanh toán
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

LiveQuickBuySheet.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  product: PropTypes.object,
  liveVouchers: PropTypes.arrayOf(PropTypes.object).isRequired,
  sessionId: PropTypes.string.isRequired,
  user: PropTypes.object,
  onAddToLiveCart: PropTypes.func,
};

LiveQuickBuySheet.defaultProps = {
  onAddToLiveCart: null,
};

export default LiveQuickBuySheet;
