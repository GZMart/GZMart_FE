import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCart } from '../../store/slices/cartSlice';
import Breadcrumb from '../../components/common/Breadcrumb';
import ProductCard from '../../components/common/ProductCard';
import RequireLoginModal from '../../components/common/RequireLoginModal';
import { productService } from '../../services/api';
import * as favouriteService from '../../services/api/favouriteService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/ProductDetailsPage.module.css';

const shippingMethods = [
  {
    name: 'Free Shipping',
    description: 'Delivery 5-7 business days',
    icon: 'bi-truck',
  },
  {
    name: 'Express Shipping',
    description: 'Delivery 2-3 business days',
    icon: 'bi-lightning',
  },
  {
    name: 'Store Pickup',
    description: 'Available at select locations',
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

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState([]); // [tier0_index, tier1_index]
  const [hoveredTierIndex, setHoveredTierIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [showSizeChart, setShowSizeChart] = useState(false);

  const [product, setProduct] = useState(null);
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

        const [productResponse, relatedResponse, frequentlyBoughtResponse] = await Promise.all([
          productService.getById(id),
          productService.getRelatedProducts(id, 8).catch(() => ({ data: [] })),
          productService.getFeaturedProducts(4).catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const productData = productResponse.data?.data || productResponse.data || productResponse;

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
          tier_variations: tiers, // Key fix: Map 'tiers' to 'tier_variations'
          // Ensure other fields are preserved
          models: productData.models || [],
          price: productData.originalPrice || 0, // Base price
          // Add mock data for missing optional fields
          flashSale: productData.flashSale || {
            timeText: 'FLASH SALE STARTS IN 21:00, TODAY'
          },
          shopVouchers: productData.shopVouchers || [
            { discount: 'Save 10k' }
          ],
          shippingInfo: productData.shippingInfo || 'Delivery in 2-3 days • Free shipping',
          warranty: productData.warranty || 'Free return within 15 days • Warranty included'
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
          return list.map((p) => ({
            ...p,
            id: p._id,
            image:
              p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
          }));
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

  // Check if product is in favourites
  useEffect(() => {
    const checkFavouriteStatus = async () => {
      if (user && product?._id) {
        try {
          const response = await favouriteService.checkInFavourites(product._id);
          console.log('Check favourite response:', response);

          // Backend: { success: true, data: { isInFavourites: true/false } }
          // axiosClient unwraps to: { success: true, data: { isInFavourites: true/false } }
          // But based on the screenshot, response is already the data object: { isInFavourites: true }
          const isInFav = response.isInFavourites ?? response.data?.isInFavourites ?? false;
          console.log('Setting isFavourite to:', isInFav);
          setIsFavourite(isInFav);
        } catch (error) {
          console.error('Error checking favourite status:', error);
        }
      } else {
        console.log('Skipping favourite check:', { user: !!user, productId: product?._id });
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
        toast.error('Please select all options');
        return;
      }
      if (!activeModel) {
        toast.error('Selected variation is unavailable');
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
        toast.error(`Insufficient stock! Available: ${stockCheck.data?.currentStock || 0}`);
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

      toast.success('Added to cart successfully!');
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error(typeof err === 'string' ? err : 'Failed to add to cart');
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

  const handleToggleFavourite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      setFavouriteLoading(true);
      if (isFavourite) {
        const response = await favouriteService.removeFromFavourites(product._id);
        console.log('Remove response:', response);
        setIsFavourite(false);
        toast.success('Removed from favourites');
      } else {
        const response = await favouriteService.addToFavourites(product._id);
        console.log('Add response:', response);
        setIsFavourite(true);
        toast.success('Added to favourites');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      toast.error(error.response?.data?.message || 'Failed to update favourites');
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
        <h2>{error || 'Product Not Found'}</h2>
        <button onClick={() => navigate('/products')}>Back to Products</button>
      </div>
    );
  }

  const productImages = getProductImages(product);

  return (
    <div className={styles.productDetailsPage}>
      <Breadcrumb
        items={[
          { label: 'Home', path: '/', icon: 'bi-house' },
          { label: 'Shop', path: '/products' },
          {
            label: typeof product.category === 'string' ? product.category : product.category?.name,
            path: `/products?category=${product.categoryId}`,
          },
          { label: product.name },
        ]}
      />

      <div className={styles.productContainer}>
        {/* Images */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img src={productImages[selectedImage]} alt={product.name} />
            {product.badge && (
              <span className={`${styles.badge} ${styles[product.badgeColor]}`}>
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
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className={styles.infoSection}>
          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Rating Section */}
          <div className={styles.ratingSection}>
            <div className={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`bi ${i < Math.floor(product.rating || 0) ? 'bi-star-fill' : 'bi-star'}`}></i>
              ))}
            </div>
            <span className={styles.ratingValue}>{product.rating || 0}</span>
            <span className={styles.reviewCount}>({product.reviewCount || 0} Reviews)</span>
          </div>

          {/* Price & Discount Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
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
            </div>
          </div>

          {/* Flash Sale Section */}
          {product.flashSale && (
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
                <div className={styles.shippingTitle}>Shipping</div>
                {product.shippingInfo ? (
                  <div className={styles.shippingDetail}>{product.shippingInfo}</div>
                ) : (
                  <div className={styles.shippingDetail}>Delivery in 2-3 days • Free shipping</div>
                )}
              </div>
            </div>
            <div className={styles.shippingInfoItem}>
              <i className="bi bi-shield-check"></i>
              <div>
                <div className={styles.shippingTitle}>Warranty</div>
                <div className={styles.shippingDetail}>{product.warranty || 'Free return within 15 days'}</div>
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
                      title={isDisabled ? 'Out of Stock' : option}
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
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                className={styles.buyBtn}
                onClick={handleBuyNow}
                disabled={addingToCart || currentStock <= 0}
              >
                Buy Now
              </button>
              <button
                className={`${styles.favouriteBtn} ${isFavourite ? styles.isFavourite : ''}`}
                onClick={handleToggleFavourite}
                disabled={favouriteLoading}
                title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <i className={`bi ${isFavourite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                {favouriteLoading ? 'Loading...' : isFavourite ? 'Saved' : 'Save'}
              </button>
            </div>
            {currentStock <= 0 && <div className="text-danger mt-2">Out of Stock</div>}
            {currentStock > 0 && currentStock < 10 && (
              <div className="text-warning mt-2">Only {currentStock} left!</div>
            )}
          </div>

          {/* Meta Info */}
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <span>Stock:</span> {currentStock}
            </div>
            <div className={styles.metaItem}>
              <span>SKU:</span> {activeModel?.sku || product.models?.[0]?.sku || 'N/A'}
            </div>
          </div>


        </div>
      </div>

      {/* Shop Info Section - Shopee Style */}
      {(product.sellerId || true) && (
        <div className={styles.shopSection}>
          <div className={styles.shopInfoCard}>
            
            {/* Left Side: Avatar, Name, Buttons */}
            <div className={styles.shopProfileLeft}>
              <div className={styles.shopAvatarContainer}>
                <img
                  src={(typeof product.sellerId === 'object' && product.sellerId?.avatar) ? product.sellerId.avatar : 'https://ui-avatars.com/api/?name=Tong+Kho+Si+Minh+Khoi&background=random'}
                  alt={(typeof product.sellerId === 'object' && product.sellerId?.fullName) ? product.sellerId.fullName : 'Tổng Kho Sỉ Minh Khôi'}
                  className={styles.shopAvatarImg}
                />
                <div className={styles.shopFavBadge}>Yêu thích</div>
              </div>
              <div className={styles.shopProfileInfo}>
                <div className={styles.shopName}>{(typeof product.sellerId === 'object' && product.sellerId?.fullName) ? product.sellerId.fullName : 'Tổng Kho Sỉ Minh Khôi'}</div>
                <div className={styles.shopOnlineStatus}>Online 1 Giờ Trước</div>
                <div className={styles.shopActions}>
                  <button className={styles.btnChat}>
                    <i className="bi bi-chat-dots-fill"></i> Chat Ngay
                  </button>
                  <button
                    className={styles.btnViewShop}
                    onClick={() => navigate(`/shop/${typeof product.sellerId === 'object' ? product.sellerId._id : product.sellerId}`)}
                  >
                    <i className="bi bi-shop"></i> Xem Shop
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.shopDivider}></div>

            {/* Right Side: Stats */}
            <div className={styles.shopStatsRight}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Đánh Giá</span>
                <span className={styles.statValue}>155,6k</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Tỉ Lệ Phản Hồi</span>
                <span className={styles.statValue}>80%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Tham Gia</span>
                <span className={styles.statValue}>
                  {(typeof product.sellerId === 'object' && product.sellerId?.createdAt) 
                    ? (() => {
                        const years = new Date().getFullYear() - new Date(product.sellerId.createdAt).getFullYear();
                        return years > 0 ? `${years} năm trước` : 'Gần đây';
                      })()
                    : '7 năm trước'}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Sản Phẩm</span>
                <span className={styles.statValue}>1,5k</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Thời Gian Phản Hồi</span>
                <span className={styles.statValue}>trong vài giờ</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Người Theo Dõi</span>
                <span className={styles.statValue}>60,7k</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Tabs */}
      <div className={styles.detailsSection}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'description' ? styles.active : ''}`}
            onClick={() => setActiveTab('description')}
          >
            DESCRIPTION
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'additional' ? styles.active : ''}`}
            onClick={() => setActiveTab('additional')}
          >
            ADDITIONAL INFORMATION
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
            onClick={() => setActiveTab('review')}
          >
            REVIEW
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'description' && (
            <div className={styles.description}>
              <h3>Description</h3>
              {product.descriptionText?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              )) || <p>No description available.</p>}

              <div className={styles.features}>
                <h4>Feature</h4>
                <div className={styles.featureGrid}>
                  {product.features?.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{feature}</span>
                    </div>
                  )) || <p>No features available.</p>}
                </div>
              </div>

              <div className={styles.shippingInfo}>
                <h4>Shipping Information</h4>
                {shippingMethods.map((method, index) => (
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
              <h3>Additional Information</h3>
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
                      <td className={styles.label}>Available Variations</td>
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
              <h3>Customer Reviews</h3>
              <div className={styles.reviewSummary}>
                <div className={styles.averageRating}>
                  <div className={styles.ratingNumber}>{product.rating}</div>
                  <div className={styles.stars}>
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </div>
                  <div className={styles.totalReviews}>{product.reviews} Reviews</div>
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
                  <p>No reviews yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together */}
      <div className={styles.frequentlyBought}>
        <div className={styles.sectionHeader}>
          <h2>FREQUENTLY BOUGHT TOGETHER</h2>
          <button className={styles.viewAllBtn}>VIEW ALL</button>
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
          <h2>RELATED PRODUCTS</h2>
          <button className={styles.viewAllBtn}>VIEW ALL</button>
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
