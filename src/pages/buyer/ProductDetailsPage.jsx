import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Image } from 'antd';
import { useTranslation } from 'react-i18next';
import { addToCart } from '../../store/slices/cartSlice';
import Breadcrumb from '../../components/common/Breadcrumb';
import ProductCard from '../../components/common/ProductCard';
import ShopInfoCard from '../../components/common/ShopInfoCard';
import RequireLoginModal from '../../components/common/RequireLoginModal';
import ProductReviewSection from '../../components/buyer/ProductReviewSection';
import { productService } from '../../services/api';
import { flashsaleService } from '../../services/api/flashsaleService';
import * as favouriteService from '../../services/api/favouriteService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/ProductDetailsPage.module.css';

const getShippingMethods = (t) => [
  {
    name: t('product_details.shipping_method.free.name'),
    description: t('product_details.shipping_method.free.description'),
    icon: 'bi-truck',
  },
  {
    name: t('product_details.shipping_method.express.name'),
    description: t('product_details.shipping_method.express.description'),
    icon: 'bi-lightning',
  },
  {
    name: t('product_details.shipping_method.pickup.name'),
    description: t('product_details.shipping_method.pickup.description'),
    icon: 'bi-shop',
  },
];

const isInStock = (product, activeModel) => {
  if (activeModel && activeModel.stock !== undefined) {
    return activeModel.stock > 0;
  }
  return product && product.stock > 0;
};

const getPriceRange = (product) => {
  if (!product || !product.models || product.models.length === 0) {
    return { min: product?.price || 0, max: product?.price || 0 };
  }
  const prices = product.models.map((m) => m.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const findModel = (product, tierIndex) => {
  if (!product || !product.models || !tierIndex || tierIndex.length === 0) {
    return null;
  }
  // Backend models use 'tierIndex' (e.g., [0, 1])
  return product.models.find(
    (m) =>
      m.tierIndex &&
      m.tierIndex.length === tierIndex.length &&
      m.tierIndex.every((val, i) => val === tierIndex[i])
  );
};

const getProductImages = (product) => {
  if (!product) {
    return [];
  }
  // Prefer images from the first tier (usually Color) if available and populated
  if (product.tier_variations && product.tier_variations.length > 0) {
    const firstTier = product.tier_variations[0];
    if (firstTier.images && firstTier.images.length > 0) {
      // Flatten or collect images? Usually tier images are one per option.
      // Shopee logic: Main Product Images + Tier Images?
      // For now, return product images, but clicking a color variant changes the main image.
      return product.images || [];
    }
  }
  return product.images || (product.image ? [product.image] : []);
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState([]); // [tier0_index, tier1_index]
  const [hoveredTierIndex, setHoveredTierIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [showSizeChart, setShowSizeChart] = useState(false);

  const [product, setProduct] = useState(null);
  const [flashSale, setFlashSale] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeModel, setActiveModel] = useState(null); // The specifically selected variant
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const user = useSelector((state) => state.auth.user);

  // Fetch product details
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchFlashSale = async (productId) => {
          if (!productId) return null;
          try {
            // First try to fetch from getActive
            const response = await flashsaleService.getActive();
            const allFlashSales = Array.isArray(response) ? response : response.data?.data || response.data || [];

            // Find flash sale for this product
            const flashSale = allFlashSales.find(fs => {
              const prodId = fs.productId?._id || fs.productId?.id || fs.productId;
              return prodId === productId;
            });

            if (flashSale) {
              console.log('✅ Flash sale found for product:', flashSale);
              return flashSale;
            }

            return null;
          } catch (err) {
            console.error('Error fetching flash sales:', err);
            return null;
          }
        };

        const [productResponse, relatedResponse, frequentlyBoughtResponse] = await Promise.all([
          productService.getById(id),
          productService.getRelatedProducts(id, 8).catch(() => ({ data: [] })),
          productService.getFeaturedProducts(4).catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const productData = productResponse.data?.data || productResponse.data || productResponse;

        // Fetch flash sale data by matching product ID
        console.log('🔍 Product ID:', productData?._id);
        const flashSaleData = await fetchFlashSale(productData?._id);
        if (flashSaleData) {
          setFlashSale(flashSaleData);
        } else {
          console.log('⚠️ No active flash sale found for this product');
        }

        if (!productData || !productData._id) {
          setError('Product not found');
          return;
        }

        // Map Backend 'tiers' to Frontend 'tier_variations'
        // Ensure tiers have 'name', 'options', 'images'
        const tiers = productData.tiers || [];

        // Find default active model (first one with stock, or just first one)
        const defaultModel =
          productData.models?.find((m) => m.stock > 0) || productData.models?.[0] || {};

        // Initial selection: if tiers exist, select 0,0... or null if user must select
        // Usually better to select the first valid option or nothing.
        // Let's default to [0, 0] if tiers exist so user sees a price immediately.
        const initialSelection = tiers.length > 0 ? tiers.map(() => 0) : [];

        const transformed = {
          ...productData,
          id: productData._id,
          tier_variations: tiers,
          models: productData.models || [],
          price: productData.originalPrice || 0,
          flashSale: productData.flashSale || {
            timeText: 'FLASH SALE STARTS IN 21:00, TODAY'
          },
          shopVouchers: productData.shopVouchers || [
            { discount: 'Save 10k' }
          ],
          shippingInfo: productData.shippingInfo || 'Delivery in 2-3 days • Free shipping',
          warranty: productData.warranty || 'Free return within 15 days • Warranty included',
          soldCount: productData.soldCount || productData.sold || 0,
          wishlistCount: productData.wishlistCount || productData.favoriteCount || 0,
        };

        setProduct(transformed);
        setSelectedTierIndex(initialSelection);

        // Set initial active model based on initial selection
        if (initialSelection.length > 0) {
          const model = findModel(transformed, initialSelection);
          if (model) setActiveModel(model);
        } else if (productData.models?.length === 1) {
          // Case: No tiers, just one model (simple product)
          setActiveModel(productData.models[0]);
        }

        // Transform related & freq bought ... (Use existing logic or simplify)
        const processRelated = (res) => {
          const list = Array.isArray(res) ? res : res.data || [];
          return list.map((p) => {
            const minModelPrice = p.models?.length > 0
              ? Math.min(...p.models.map(m => m.price))
              : p.originalPrice;
            return {
              ...p,
              id: p._id,
              image:
                p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
              price: minModelPrice ?? p.originalPrice ?? 0,
            };
          });
        };

        setRelatedProducts(processRelated(relatedResponse));
        setFrequentlyBought(processRelated(frequentlyBoughtResponse));
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching product:', err);
          setError(err.response?.data?.message || 'Failed to load product');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Update countdown timer
  useEffect(() => {
    if (!flashSale || !flashSale.endAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(flashSale.endAt);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  // Check if product is in favourites
  useEffect(() => {
    const checkFavouriteStatus = async () => {
      if (user && product?._id) {
        try {
          const response = await favouriteService.checkInFavourites(product._id);
          const isInFav = response.isInFavourites ?? response.data?.isInFavourites ?? false;
          setIsFavourite(isInFav);
        } catch (error) {
          console.error('Error checking favourite status:', error);
        }
      } else {
        setIsFavourite(false);
      }
    };
    checkFavouriteStatus();
  }, [user, product?._id]);

  // Check if an option should be disabled based on *other* current selections
  const isOptionDisabled = (tierLevel, optionIndex) => {
    if (!product || !product.models) return false;

    // Construct target criteria to check availability
    const targetIndices = [...selectedTierIndex];
    targetIndices[tierLevel] = optionIndex;

    const matchingModel = findModel(product, targetIndices);

    // Disable if no matching model or stock is 0
    if (!matchingModel) return true;
    return matchingModel.stock <= 0;
  };

  const handleTierChange = (tierLevel, optionIndex) => {
    if (isOptionDisabled(tierLevel, optionIndex)) return;

    const newIndex = [...selectedTierIndex];
    newIndex[tierLevel] = optionIndex;
    setSelectedTierIndex(newIndex);

    // Update Image if this tier has images (color tier)
    const tier = product.tier_variations?.[tierLevel];
    if (tier?.images && tier.images.length > optionIndex) {
      setSelectedImage(optionIndex);
    }

    // Update Active Model
    const matchingModel = findModel(product, newIndex);
    setActiveModel(matchingModel); // Can be null if combination doesn't exist
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const currentPrice = useMemo(() => {
    if (activeModel) return activeModel.price;
    if (product) {
      const range = getPriceRange(product);
      return range.min; // Show min price by default
    }
    return 0;
  }, [activeModel, product]);

  const currentStock = useMemo(() => {
    if (activeModel) return activeModel.stock;
    return product?.stock || 0;
  }, [activeModel, product]);

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!product) return;

    // Validate Selection
    if (product.tier_variations?.length > 0) {
      if (selectedTierIndex.some((idx) => idx === null || idx === undefined)) {
        toast.error(t('product_details.toast_select_all'));
        return;
      }
      if (!activeModel) {
        toast.error(t('product_details.toast_unavailable'));
        return;
      }
    }

    setAddingToCart(true);
    try {
      // Stock Check
      const stockCheck = activeModel
        ? await productService.checkStockAvailability(product.id, activeModel._id, quantity)
        : { data: { available: true } };

      if (!stockCheck.data?.available) {
        toast.error(
          `${t('product_details.toast_insufficient_stock')}${stockCheck.data?.currentStock || 0}`
        );
        setAddingToCart(false);
        return;
      }

      // Determine Color and Size strings for Cart
      let color = 'Default';
      let size = 'Default';

      if (product.tier_variations?.length > 0) {
        product.tier_variations.forEach((tier, idx) => {
          const selectedOption = tier.options[selectedTierIndex[idx]];
          const tierNameLower = tier.name.toLowerCase();

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
      }

      // Dispatch Add to Cart
      await dispatch(
        addToCart({
          product,
          quantity,
          color,
          size,
        })
      ).unwrap();

      toast.success(t('product_details.toast_add_cart_success'));
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error(typeof err === 'string' ? err : t('product_details.toast_add_cart_failed'));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    handleAddToCart();
    navigate('/cart');
  };

  const formatSavedCount = (count) => {
    if (!count) return 0;
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return count;
  };

  const handleToggleFavourite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      setFavouriteLoading(true);
      if (isFavourite) {
        await favouriteService.removeFromFavourites(product._id);
        setIsFavourite(false);
        setProduct((prev) => ({
          ...prev,
          wishlistCount: Math.max(0, (prev.wishlistCount || 0) - 1),
        }));
        toast.success(t('product_details.toast_wishlist_remove'));
      } else {
        await favouriteService.addToFavourites(product._id);
        setIsFavourite(true);
        setProduct((prev) => ({ ...prev, wishlistCount: (prev.wishlistCount || 0) + 1 }));
        toast.success(t('product_details.toast_wishlist_add'));
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      toast.error(error.response?.data?.message || t('product_details.toast_wishlist_failed'));
    } finally {
      setFavouriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.productDetailsPage}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.notFound}>
        <h2>{error || t('product_details.err_product_not_found')}</h2>
        <button onClick={() => navigate('/products')}>
          {t('product_details.back_to_products')}
        </button>
      </div>
    );
  }

  const productImages = getProductImages(product);

  return (
    <div className={styles.productDetailsPage}>
      <Breadcrumb
        items={[
          { label: t('product_details.breadcrumb_home'), path: '/', icon: 'bi-house' },
          { label: t('product_details.breadcrumb_shop'), path: '/products' },
          {
            label:
              typeof product.category === 'string'
                ? product.category
                : product.category?.name || 'Products',
            path: `/products?category=${product.categoryId || ''}`,
          },
          { label: product.name },
        ].filter((item) => item.label)}
      />

      <div className={styles.productContainer}>
        {/* Images */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage} style={{ position: 'relative' }}>
            <Image.PreviewGroup items={productImages}>
              <Image
                src={productImages[selectedImage]}
                alt={product.name}
                width="100%"
                style={{ objectFit: 'cover', borderRadius: '12px', minHeight: '300px' }}
              />
            </Image.PreviewGroup>
            {product.badge && (
              <span
                className={`${styles.badge} ${styles[product.badgeColor]}`}
                style={{ zIndex: 10, position: 'absolute', top: '15px', left: '15px' }}
              >
                {product.badge}
              </span>
            )}
          </div>
          <div className={styles.thumbnails}>
            {productImages.map((img, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={img} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>

          {/* Share Section */}
          <div className={styles.shareSection}>
            <span className={styles.shareLabel}>Share:</span>
            <div className={styles.shareButtons}>
              <button
                className={`${styles.shareButton} ${styles.facebook}`}
                title="Share on Facebook"
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`;
                  window.open(url, '_blank', 'width=600,height=400');
                }}
              >
                <i className="bi bi-facebook"></i>
              </button>
              <button
                className={`${styles.shareButton} ${styles.messenger}`}
                title="Share via Messenger"
                onClick={() => {
                  const url = `https://www.messenger.com/share?link=${window.location.href}`;
                  window.open(url, '_blank', 'width=600,height=400');
                }}
              >
                <i className="bi bi-chat-dots"></i>
              </button>
              <button
                className={`${styles.shareButton} ${styles.x}`}
                title="Share on X (Twitter)"
                onClick={() => {
                  const url = `https://twitter.com/intent/tweet?url=${window.location.href}&text=${product.name}`;
                  window.open(url, '_blank', 'width=600,height=400');
                }}
              >
                <i className="bi bi-twitter-x"></i>
              </button>
            </div>
            <div className={styles.favouriteSpacer}>
              <button
                className={`${styles.shareButton} ${!isFavourite ? styles.unfavourite : styles.isFavourite}`}
                onClick={handleToggleFavourite}
                disabled={favouriteLoading}
                title={isFavourite ? 'Remove from saved' : 'Save this product'}
              >
                <i className={`bi bi-heart`}></i>
              </button>
              <span className={styles.saveLabel}>
                {isFavourite ? `Saved (${formatSavedCount(product.wishlistCount)})` : `Save (${formatSavedCount(product.wishlistCount)})`}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className={styles.infoSection}>
          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Rating Section */}
          <div className={styles.ratingSection}>
            <div className={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`bi ${i < Math.floor(product.rating || 0) ? 'bi-star-fill' : 'bi-star'}`}
                ></i>
              ))}
            </div>
            <span className={styles.ratingValue}>{product.rating || 0}</span>
            <span className={styles.reviewCount}>
             // ({product.reviewCount || 0} {t('product_details.reviews')})
          //  </span>
          //  <span className={styles.soldCount} style={{ marginLeft: 15, color: '#666' }}>
            //  {t('product_details.stat_sold')} {product.sold || 0}
              {product.reviewCount
                ? product.reviewCount >= 1000
                  ? `${(product.reviewCount / 1000).toFixed(1).replace('.0', '')}k`
                  : product.reviewCount
                : '0'} Rating
            </span>
            <span className={styles.soldCount}>
              {product.sold
                ? product.sold >= 1000
                  ? `${(product.sold / 1000).toFixed(1).replace('.0', '')}k+`
                  : `${product.sold}+`
                : '0+'} Sold
            </span>
          </div>

          {/* Price & Discount Section */}
          <div className={styles.priceSection}>
            {flashSale && (flashSale.status === 'active' || !flashSale.status) && (
              <div className={styles.flashSaleContainer}>
                <div className={styles.flashSaleInfo}>
                  <i className={`bi bi-lightning-fill ${styles.flashSaleIcon}`}></i>
                  <span className={styles.flashSaleLabel}>FLASH SALE</span>
                </div>
                <div className={styles.flashSaleTimer}>
                  {countdown.days}d : {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s
                </div>
              </div>
            )}
            <div className={styles.priceRow}>
              {flashSale && (flashSale.status === 'active' || !flashSale.status) ? (
                <>
                  <span className={`${styles.currentPrice} ${styles.currentPriceFlashSale}`}>
                    {formatCurrency(flashSale.salePrice)}
                  </span>
                  <span className={styles.originalPrice}>
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className={styles.discount}>
                    -{Math.round((1 - flashSale.salePrice / product.originalPrice) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.currentPrice}>{formatCurrency(currentPrice)}</span>
                  {product.originalPrice > currentPrice && (
                    <>
                      <span className={styles.originalPrice}>
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className={styles.discount}>
                        -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Flash Sale Section */}
          {product.isTrending && product.flashSale && (
            <div className={styles.flashSaleSection}>
              <i className="bi bi-lightning-fill"></i>
              <span className={styles.flashSaleLabel}>FLASH SALE</span>
              <span className={styles.flashSaleTime}>{product.flashSale.timeText}</span>
            </div>
          )}

          {/* Voucher Section */}
          {product.shopVouchers && product.shopVouchers.length > 0 && (
            <div className={styles.voucherSection}>
              <div className={styles.voucherLabel}>Shop Vouchers</div>
              <div className={styles.voucherItems}>
                {product.shopVouchers.map((voucher, idx) => (
                  <div key={idx} className={styles.voucherItem}>
                    <span className={styles.voucherDiscount}>{voucher.discount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Info */}
          <div className={styles.shippingInfoSection}>
            <div className={styles.shippingInfoItem}>
              <i className="bi bi-truck"></i>
              <div>
                <div className={styles.shippingTitle}>{t('product_details.tab_shipping')}</div>
                {product.shippingInfo ? (
                  <div className={styles.shippingDetail}>{product.shippingInfo}</div>
                ) : (
                  <div className={styles.shippingDetail}>
                    {t('product_details.default_shipping_detail')}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.shippingInfoItem}>
              <i className="bi bi-shield-check"></i>
              <div>
                <div className={styles.shippingTitle}>{t('product_details.tab_warranty')}</div>
                <div className={styles.shippingDetail}>
                  {product.warranty || t('product_details.default_warranty_detail')}
                </div>
              </div>
            </div>
          </div>

          {/* Tiers / Variants Selection - Compact */}
          {product.tier_variations?.map((tier, tierIdx) => (
            <div key={tierIdx} className={styles.tierSection}>
              <div className={styles.tierHeader}>
                <span className={styles.tierLabel}>{tier.name}:</span>
              </div>
              <div className={styles.tierOptions}>
                {tier.options.map((option, optIdx) => {
                  const isSelected = selectedTierIndex[tierIdx] === optIdx;
                  const isDisabled = isOptionDisabled(tierIdx, optIdx);

                  return (
                    <button
                      key={optIdx}
                      className={`
                        ${styles.tierOption} 
                        ${isSelected ? styles.active : ''}
                        ${isDisabled ? styles.disabled : ''}
                      `}
                      onClick={() => {
                        if (!isDisabled) {
                          handleTierChange(tierIdx, optIdx);
                        }
                      }}
                      disabled={isDisabled}
                      title={isDisabled ? t('product_details.stat_status_inactive') : option}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity & Actions */}
          <div className={styles.actionsSection}>
            <div className={styles.quantitySelector}>
              <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                -
              </button>
              <input type="text" value={quantity} readOnly />
              <button onClick={() => handleQuantityChange(1)} disabled={quantity >= currentStock}>
                +
              </button>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.addBtn}
                onClick={handleAddToCart}
                disabled={addingToCart || currentStock <= 0}
              >
                {addingToCart ? t('product_details.loading') : t('product_details.btn_add_to_cart')}
              </button>
              <button
                className={styles.buyBtn}
                onClick={handleBuyNow}
                disabled={addingToCart || currentStock <= 0}
              >
                {t('product_details.btn_buy_now')}
              </button>
              <button
                className={`${styles.favouriteBtn} ${isFavourite ? styles.isFavourite : ''}`}
                onClick={handleToggleFavourite}
                disabled={favouriteLoading}
                title={
                  isFavourite
                    ? t('product_details.toast_wishlist_remove')
                    : t('product_details.toast_wishlist_add')
                }
              >
                <i className={`bi ${isFavourite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                {favouriteLoading
                  ? t('product_details.loading')
                  : isFavourite
                    ? t('product_details.toast_wishlist_remove')
                    : t('product_details.favorite')}
              </button>
            </div>
            {currentStock <= 0 && (
              <div className="text-danger mt-2">{t('product_details.stat_status_inactive')}</div>
            )}
            {currentStock > 0 && currentStock < 10 && (
              <div className="text-warning mt-2">
                {t('product_details.only_left', { stock: currentStock })}
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <span>{t('product_details.label_stock')}:</span> {currentStock}
            </div>
            <div className={styles.metaItem}>
              <span>{t('product_details.label_sku')}:</span>{' '}
              {activeModel?.sku || product.models?.[0]?.sku || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Info Section - Shopee Style */}
      {(product.sellerId || true) && (
        <div className={styles.shopSection}>
          <ShopInfoCard seller={product.sellerId} showViewShop={true} />
        </div>
      )}

      {/* Product Details Tabs */}
      <div className={styles.detailsSection}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'description' ? styles.active : ''}`}
            onClick={() => setActiveTab('description')}
          >
            {t('product_details.tab_description_upper')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'additional' ? styles.active : ''}`}
            onClick={() => setActiveTab('additional')}
          >
            {t('product_details.tab_additional_upper')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
            onClick={() => setActiveTab('review')}
          >
            {t('product_details.tab_review_upper')}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'description' && (
            <div className={styles.description}>
              <h3>{t('product_details.title_description')}</h3>
              {product.descriptionText?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              )) || <p>{t('product_details.no_description')}</p>}

              <div className={styles.features}>
                <h4>{t('product_details.title_features')}</h4>
                <div className={styles.featureGrid}>
                  {product.features?.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{feature}</span>
                    </div>
                  )) || <p>{t('product_details.no_features')}</p>}
                </div>
              </div>

              <div className={styles.shippingInfo}>
                <h4>{t('product_details.title_shipping_info')}</h4>
                {getShippingMethods(t).map((method, index) => (
                  <div key={index} className={styles.shippingItem}>
                    <i className={`bi ${method.icon}`}></i>
                    <div>
                      <strong>{method.name}:</strong>
                      <p>{method.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'additional' && (
            <div className={styles.additionalInfo}>
              <h3>{t('product_details.title_additional_info')}</h3>
              <table className={styles.infoTable}>
                <tbody>
                  {product.attributes
                    ?.sort((a, b) => a.order - b.order)
                    .map((attr) => (
                      <tr key={attr.key}>
                        <td className={styles.label}>{attr.label}</td>
                        <td className={styles.value}>{attr.value}</td>
                      </tr>
                    ))}
                  {product.tier_variations?.length > 0 && (
                    <tr>
                      <td className={styles.label}>
                        {t('product_details.label_available_variations')}
                      </td>
                      <td className={styles.value}>
                        {product.tier_variations.map((tier, idx) => (
                          <div key={idx}>
                            <strong>{tier.name}:</strong> {tier.options.join(', ')}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                  {product.materialComposition && (
                    <tr>
                      <td className={styles.label}>Material Composition</td>
                      <td className={styles.value}>
                        {Object.entries(product.materialComposition)
                          .map(
                            ([material, percentage]) =>
                              `${material.charAt(0).toUpperCase() + material.slice(1)} ${percentage}%`
                          )
                          .join(', ')}
                      </td>
                    </tr>
                  )}
                  {product.modelInfo && (
                    <tr>
                      <td className={styles.label}>Model Info</td>
                      <td className={styles.value}>
                        Height {product.modelInfo.height}cm, Weight {product.modelInfo.weight}kg,
                        Wearing size {product.modelInfo.wearingSize.toUpperCase()}
                      </td>
                    </tr>
                  )}
                  {product.shipping_info && (
                    <>
                      <tr>
                        <td className={styles.label}>Weight</td>
                        <td className={styles.value}>{product.shipping_info.weight}g</td>
                      </tr>
                      <tr>
                        <td className={styles.label}>Dimensions</td>
                        <td className={styles.value}>
                          {product.shipping_info.dimension.length} x{' '}
                          {product.shipping_info.dimension.width} x{' '}
                          {product.shipping_info.dimension.height} cm
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'review' && (
            <div className={styles.reviews}>
              <h3>{t('product_details.title_customer_reviews')}</h3>
              <div className={styles.reviewSummary}>
                <div className={styles.averageRating}>
                  <div className={styles.ratingNumber}>{product.rating}</div>
                  <div className={styles.stars}>
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </div>
                  <div className={styles.totalReviews}>
                    {product.reviews} {t('product_details.total_reviews')}
                  </div>
                </div>
              </div>
              <div className={styles.reviewList}>
                {product.productReviews?.length > 0 ? (
                  product.productReviews.map((review) => (
                    <div key={review.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <strong>{review.author}</strong>
                        <span className={styles.reviewDate}>{review.date}</span>
                      </div>
                      <div className={styles.reviewRating}>{'★'.repeat(review.rating)}</div>
                      <p>{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p>{t('product_details.no_reviews')}</p>
                )}
              </div>
            </div>
            //<ProductReviewSection product={product} />
          )}
        </div>
      </div>

      {/* Frequently Bought Together */}
      <div className={styles.frequentlyBought}>
        <div className={styles.sectionHeader}>
          <h2>{t('product_details.frequently_bought')}</h2>
          <button className={styles.viewAllBtn}>{t('product_details.view_all')}</button>
        </div>
        <div className={styles.productGrid}>
          {frequentlyBought.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>

      {/* Related Products */}
      <div className={styles.relatedProducts}>
        <div className={styles.sectionHeader}>
          <h2>{t('product_details.related_products')}</h2>
          <button className={styles.viewAllBtn}>{t('product_details.view_all')}</button>
        </div>
        <div className={styles.productGrid}>
          {relatedProducts.slice(0, 4).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>

      {/* Login Required Modal */}
      <RequireLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default ProductDetailsPage;
