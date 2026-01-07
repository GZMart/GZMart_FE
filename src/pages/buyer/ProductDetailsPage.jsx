import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import ProductCard from '../../components/common/ProductCard';
import {
  products,
  getProductWithDeal,
  generateAllProducts,
  shippingMethods,
  getProductImages,
  findModel,
  getPriceRange,
  isInStock,
} from '../../utils/data/ProductsPage_MockData';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/ProductDetailsPage.module.css';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState([]); // Shopee-style: [colorIndex, sizeIndex]
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Get product details
  const product = useMemo(() => {
    const foundProduct = products.find((p) => p.id === parseInt(id));
    return foundProduct ? getProductWithDeal(foundProduct) : null;
  }, [id]);

  // Generate related products (same category)
  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }
    const allProducts = generateAllProducts();
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 8);
  }, [product]);

  // Generate frequently bought together products
  const frequentlyBought = useMemo(() => {
    const allProducts = generateAllProducts();
    return allProducts.slice(0, 4);
  }, []);

  // Get all images from tier_variations (Shopee-style)
  const productImages = useMemo(() => {
    if (product && product.tier_variations) {
      return getProductImages(product);
    }
    // Fallback for products without tier_variations
    return product?.image ? [product.image] : [];
  }, [product]);

  const breadcrumbItems = useMemo(() => [
    { label: 'Home', path: '/', icon: 'bi-house' },
    { label: 'Shop', path: '/products' },
    { label: product?.category || 'Category', path: `/products?category=${product?.category}` },
    { label: product?.name || '' },
  ], [product]);

  useEffect(() => {
    if (product && product.tier_variations) {
      // Initialize tier_index: [0, 0] for 2 tiers, [0] for 1 tier
      const initialIndex = product.tier_variations.map(() => 0);
      setSelectedTierIndex(initialIndex);
    }
  }, [product]);

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Product Not Found</h2>
        <button onClick={() => navigate('/products')}>Back to Products</button>
      </div>
    );
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleTierChange = (tierLevel, optionIndex) => {
    const newIndex = [...selectedTierIndex];
    newIndex[tierLevel] = optionIndex;
    setSelectedTierIndex(newIndex);

    // Jump to image if changing first tier (usually Color)
    if (tierLevel === 0) {
      setSelectedImage(optionIndex);
    }
  };

  const handleTierHover = (tierLevel, optionIndex) => {
    const newIndex = [...selectedTierIndex];
    newIndex[tierLevel] = optionIndex;
    setHoveredTierIndex(newIndex);

    // Preview image if hovering first tier (usually Color)
    if (tierLevel === 0) {
      setSelectedImage(optionIndex);
    }
  };

  const handleAddToCart = () => {};

  const handleBuyNow = () => {};

  const handleGetDeal = () => {};

  return (
    <div className={styles.productDetailsPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.productContainer}>
        {/* Product Images Section */}
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
                <img src={img} alt={`${product.name} ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className={styles.infoSection}>
          <div className={styles.productHeader}>
            <div className={styles.rating}>
              <div className={styles.stars}>
                {'★'.repeat(Math.floor(product.rating))}
                {'☆'.repeat(5 - Math.floor(product.rating))}
                <span className={styles.ratingNumber}>{product.rating}</span>
              </div>
              <span className={styles.reviews}>({product.reviews} Reviews)</span>
            </div>
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.metaInfo}>
            {product.attributes
              ?.filter((attr) => attr.type === 'fixed')
              .sort((a, b) => a.order - b.order)
              .map((attr) => {
                if (attr.key === 'availability') {
                  return (
                    <div key={attr.key} className={styles.metaItem}>
                      <span className={styles.label}>{attr.label}:</span>
                      <span
                        className={`${styles.stock} ${isInStock(product) ? styles.inStock : styles.outOfStock}`}
                      >
                        <i
                          className={`bi ${isInStock(product) ? 'bi-check-circle' : 'bi-x-circle'}`}
                        ></i>
                        {attr.value}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={attr.key} className={styles.metaItem}>
                    <span className={styles.label}>{attr.label}:</span>
                    <span className={styles.value}>{attr.value}</span>
                  </div>
                );
              })}
          </div>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span className={styles.label}>Price:</span>
              <div className={styles.priceInfo}>
                {(() => {
                  const selectedModel =
                    product.models && selectedTierIndex.length > 0
                      ? findModel(product, selectedTierIndex)
                      : null;
                  const displayPrice = selectedModel ? selectedModel.price : product.price;
                  const priceRange = getPriceRange(product);

                  return (
                    <>
                      <span className={styles.currentPrice}>{formatCurrency(displayPrice)}</span>
                      {priceRange.min !== priceRange.max && (
                        <span className={styles.priceRange}>
                          ({formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)})
                        </span>
                      )}
                      {product.originalPrice && (
                        <>
                          <span className={styles.originalPrice}>
                            {formatCurrency(product.originalPrice)}
                          </span>
                          <span className={styles.discount}>{product.discount}% OFF</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            {product.dealId && product.dealStatus === 'active' && (
              <div className={styles.dealPrice}>
                <span className={styles.label}>Get it for:</span>
                <span className={styles.dealAmount}>
                  {formatCurrency(Math.floor(product.price * 0.9))}
                </span>
              </div>
            )}
          </div>

          {/* Tier Variations - First Tier (Usually Color) */}
          {product.tier_variations && product.tier_variations.length > 0 && (
            <div className={styles.colorSection}>
              <div className={styles.colorHeader}>
                <span className={styles.label}>{product.tier_variations[0].name}:</span>
                <span className={styles.selectedValue}>
                  {selectedTierIndex.length > 0
                    ? product.tier_variations[0].options[selectedTierIndex[0]]
                    : product.tier_variations[0].options[0]}
                </span>
              </div>
              <div className={styles.colorOptions}>
                {product.tier_variations[0].options.map((option, index) => (
                  <div
                    key={index}
                    className={`${styles.colorOption} ${
                      selectedTierIndex[0] === index ? styles.active : ''
                    }`}
                    onClick={() => handleTierChange(0, index)}
                    onMouseEnter={() => handleTierHover(0, index)}
                    onMouseLeave={() => setHoveredTierIndex(null)}
                    title={option}
                  >
                    {product.tier_variations[0].images[index] ? (
                      <img
                        src={product.tier_variations[0].images[index]}
                        alt={option}
                        className={styles.colorImage}
                      />
                    ) : (
                      <div className={styles.colorCircle}>
                        <span className={styles.colorText}>{option}</span>
                      </div>
                    )}
                    {selectedTierIndex[0] === index && <i className="bi bi-check-circle-fill"></i>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier Variations - Second Tier (Usually Size) */}
          {product.tier_variations && product.tier_variations.length > 1 && (
            <div className={styles.sizeSection}>
              <div className={styles.sizeHeader}>
                <span className={styles.label}>{product.tier_variations[1].name}:</span>
                <span className={styles.sizeValue}>
                  {selectedTierIndex.length > 1
                    ? product.tier_variations[1].options[selectedTierIndex[1]]
                    : product.tier_variations[1].options[0]}
                </span>{' '}
                {product.sizeChart && (
                  <button
                    className={styles.sizeChartBtn}
                    onClick={() => setShowSizeChart(!showSizeChart)}
                  >
                    <i className="bi bi-rulers"></i>
                    Size Chart
                  </button>
                )}{' '}
              </div>
              <div className={styles.sizeOptions}>
                {product.tier_variations[1].options.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.sizeButton} ${
                      selectedTierIndex[1] === index ? styles.active : ''
                    }`}
                    onClick={() => handleTierChange(1, index)}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Size Chart - Image or Table */}
              {showSizeChart && product.sizeChart && (
                <div className={styles.sizeChartTable}>
                  {product.sizeChart.type === 'image' && product.sizeChart.imageUrl ? (
                    // Display uploaded size chart image (Shopee style)
                    <div className={styles.sizeChartImage}>
                      <img
                        src={product.sizeChart.imageUrl}
                        alt="Size Chart"
                        className={styles.sizeChartImg}
                      />
                      <p className={styles.sizeChartNote}>
                        <i className="bi bi-info-circle"></i> Size chart provided by the shop
                      </p>
                    </div>
                  ) : (
                    // Display table format if no image or type is 'table'
                    <table>
                      <thead>
                        <tr>
                          <th>Size</th>
                          {product.sizeChart.table?.measurements[0] &&
                            Object.keys(product.sizeChart.table.measurements[0])
                              .filter((key) => key !== 'size')
                              .map((key) => (
                                <th key={key}>
                                  {key.charAt(0).toUpperCase() + key.slice(1)} (
                                  {product.sizeChart.table.unit})
                                </th>
                              ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.table?.measurements.map((measurement, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{measurement.size}</strong>
                            </td>
                            {Object.entries(measurement)
                              .filter(([key]) => key !== 'size')
                              .map(([key, value]) => (
                                <td key={key}>{value}</td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deal Information */}
          {product.dealId && product.dealStatus === 'active' && (
            <div className={styles.dealSection}>
              <div className={styles.dealGrid}>
                {/* Left Side - Deal Stats */}
                <div className={styles.dealLeft}>
                  <div className={styles.dealItem}>
                    <div className={styles.dealItemLabel}>Deal Members Filled</div>
                    <div className={styles.dealItemValue}>
                      {product.dealSoldCount}/{product.dealQuantityLimit}
                    </div>
                  </div>
                  <div className={styles.dealItem}>
                    <div className={styles.dealItemLabel}>Current Deal Price</div>
                    <div className={styles.dealItemValue}>
                      {formatCurrency(Math.floor(product.price * 0.9))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Buyer Count & Indicator */}
                <div className={styles.dealRight}>
                  <div className={styles.dealItem}>
                    <div className={styles.dealItemLabel}>No. Of Buyers In Deal</div>
                    <div className={styles.dealItemValue}>{product.dealSoldCount}</div>
                  </div>
                  <div className={styles.dealItem}>
                    <div className={styles.dealItemLabel}>Deal Trend Indicator</div>
                    <div className={styles.gaugeContainer}>
                      <svg className={styles.gauge} viewBox="0 0 100 50">
                        <path
                          className={styles.gaugeBackground}
                          d="M 10 45 A 40 40 0 0 1 90 45"
                          fill="none"
                          strokeWidth="8"
                        />
                        <path
                          className={styles.gaugeFill}
                          d="M 10 45 A 40 40 0 0 1 90 45"
                          fill="none"
                          strokeWidth="8"
                          strokeDasharray={`${(product.dealSoldCount / product.dealQuantityLimit) * 126} 126`}
                        />
                        <line
                          className={styles.gaugeNeedle}
                          x1="50"
                          y1="45"
                          x2="50"
                          y2="15"
                          strokeWidth="2"
                          transform={`rotate(${-90 + (product.dealSoldCount / product.dealQuantityLimit) * 180} 50 45)`}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom - Deal Timer */}
              <div className={styles.dealTimer}>
                <div className={styles.timerLabel}>{product.badge} !</div>
                <div className={styles.timerBar}>
                  <div
                    className={styles.timerFill}
                    style={{
                      width: `${(product.dealSoldCount / product.dealQuantityLimit) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className={styles.actionsSection}>
            <div className={styles.quantitySelector}>
              <button onClick={() => handleQuantityChange(-1)}>-</button>
              <input type="text" value={quantity} readOnly />
              <button onClick={() => handleQuantityChange(1)}>+</button>
            </div>

            <div className={styles.actionButtons}>
              {product.dealId && product.dealStatus === 'active' && (
                <button className={styles.getDealBtn} onClick={handleGetDeal}>
                  <i className="bi bi-lightning-fill"></i>
                  GET DEALS (100%)
                </button>
              )}
              <button className={styles.addBtn} onClick={handleAddToCart}>
                <i className="bi bi-cart-plus"></i>
                ADD
              </button>
              <button className={styles.buyBtn} onClick={handleBuyNow}>
                <i className="bi bi-bag-check"></i>
                BUY
              </button>
            </div>
          </div>

          {/* Wishlist and Compare */}
          <div className={styles.secondaryActions}>
            <button className={styles.iconBtn}>
              <i className="bi bi-heart"></i>
              Add to Wishlist
            </button>
            <button className={styles.iconBtn}>
              <i className="bi bi-arrow-left-right"></i>
              Add to Compare
            </button>
          </div>

          {/* Share */}
          <div className={styles.shareSection}>
            <span className={styles.shareLabel}>Share product:</span>
            <div className={styles.shareIcons}>
              <button className={styles.shareIcon}>
                <i className="bi bi-link-45deg"></i>
              </button>
              <button className={styles.shareIcon}>
                <i className="bi bi-facebook"></i>
              </button>
              <button className={styles.shareIcon}>
                <i className="bi bi-twitter"></i>
              </button>
              <button className={styles.shareIcon}>
                <i className="bi bi-pinterest"></i>
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentSection}>
            <div className={styles.secureCheckout}>
              <i className="bi bi-shield-check"></i>
              <span>100% Genuine Safe Checkout</span>
            </div>
            <div className={styles.paymentMethods}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                alt="Visa"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                alt="Mastercard"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                alt="PayPal"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
                alt="AmEx"
              />
            </div>
          </div>
        </div>
      </div>

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
                  {/* Render all attributes (fixed + custom) dynamically */}
                  {product.attributes
                    ?.sort((a, b) => a.order - b.order)
                    .map((attr) => (
                      <tr key={attr.key}>
                        <td className={styles.label}>{attr.label}</td>
                        <td className={styles.value}>{attr.value}</td>
                      </tr>
                    ))}
                  {product.tier_variations && product.tier_variations.length > 0 && (
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
                  <p>No reviews yet. Be the first to review this product!</p>
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
    </div>
  );
};

export default ProductDetailsPage;
