import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import LoadingSpinner from '@components/common/LoadingSpinner';
import styles from '@assets/styles/ProductsPage.module.css';
import { dealService, flashsaleService } from '../../services/api';

const FlashDealsPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [itemsToShow, setItemsToShow] = useState(12);
  const [sortBy, setSortBy] = useState('discount');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedDealTypes, setSelectedDealTypes] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  // Fetch deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);

        // Use flashsaleService.getActive() to get active flash sales
        const response = await flashsaleService.getActive();

        if (import.meta.env.DEV) {
          console.log('📦 Flash Sales API Response:', response);
          console.log('📦 Response type:', typeof response);
          console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
        }

        // Handles multiple response structures:
        // Case 1: { success: true, data: [...] }
        // Case 2: { data: [...] }
        // Case 3: [...] (direct array)
        let flashSalesData = [];

        if (Array.isArray(response)) {
          // Direct array response
          flashSalesData = response;
        } else if (response?.data) {
          // Has data property
          if (Array.isArray(response.data)) {
            flashSalesData = response.data;
          } else if (Array.isArray(response.data?.data)) {
            flashSalesData = response.data.data;
          }
        }

        if (import.meta.env.DEV) {
          console.log('✅ Flash Sales Data (count):', flashSalesData.length);
          console.log('✅ First flash sale sample:', flashSalesData[0]);
        }

        if (flashSalesData.length === 0) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Backend returned empty data array - no flash sales available');
          }
          setProducts([]);
          setLoading(false);
          return;
        }

        // Transform flash sales data to products format
        const productsFromFlashSales = flashSalesData
          .filter((flashSale) => {
            const hasProduct = flashSale && flashSale.productId;
            if (!hasProduct) {
              console.warn('⚠️ Flash sale missing productId:', flashSale);
            }
            return hasProduct;
          })
          .map((flashSale) => {
            const product = flashSale.productId;

            // Find the variant model by SKU or tier_index
            let variantModel = null;
            if (flashSale.variantSku && product.models) {
              variantModel = product.models.find((m) => m.sku === flashSale.variantSku);
            }

            // Fallback to first active model or first model
            if (!variantModel) {
              variantModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};
            }

            return {
              id: product._id,
              name: product.name,
              description: product.description,
              image:
                product.images?.[0] ||
                variantModel.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
              images: product.images || [],
              price: flashSale.salePrice || variantModel.price || 0,
              originalPrice: variantModel.price || flashSale.salePrice || 0,
              discount:
                flashSale.discountPercent ||
                Math.round(
                  ((variantModel.price - flashSale.salePrice) / variantModel.price) * 100
                ) ||
                0,
              rating: product.rating || 5,
              reviews: product.reviewCount || product.sold || 0,
              sold: flashSale.soldQuantity || product.sold || 0,
              stock: flashSale.remainingQuantity || variantModel.stock || 0,
              brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
              category:
                typeof product.category === 'object' ? product.category?.name : product.category,
              categoryId:
                typeof product.category === 'object' ? product.category?._id : product.categoryId,
              tier_variations: product.tier_variations,
              // Flash Sale specific fields
              flashSaleId: flashSale._id,
              dealId: flashSale._id, // Alias for compatibility
              dealType: 'flash_sale',
              dealStatus: flashSale.status,
              dealStartDate: flashSale.startAt,
              dealEndDate: flashSale.endAt,
              dealSoldCount: flashSale.soldQuantity || 0,
              dealQuantityLimit: flashSale.totalQuantity,
              variantSku: flashSale.variantSku,
              purchaseLimit: flashSale.purchaseLimit,
              campaignTitle: flashSale.campaignTitle,
            };
          });

        setProducts(productsFromFlashSales);

        if (import.meta.env.DEV) {
          console.log('📊 Transformed Products from Flash Sales:', productsFromFlashSales.length);
        }
      } catch (error) {
        console.error('❌ Error fetching flash sales:', error);

        if (import.meta.env.DEV) {
          console.error('❌ Error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'All Deals', path: '/deals' },
  ];

  // Deal type options
  const dealTypes = [
    { id: 'flash_sale', name: 'Flash Sale', icon: 'lightning-fill' },
    { id: 'daily_deal', name: 'Daily Deal', icon: 'calendar-day' },
    { id: 'limited_time', name: 'Limited Time', icon: 'clock' },
    { id: 'clearance', name: 'Clearance', icon: 'tag' },
  ];

  // Discount options
  const discounts = [
    { id: '50', name: '50% or more' },
    { id: '40', name: '40% or more' },
    { id: '30', name: '30% or more' },
    { id: '20', name: '20% or more' },
    { id: '10', name: '10% or more' },
  ];

  // Get unique brands and categories from products
  const availableBrands = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
    return brands.sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return categories.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Deal Type filter
      if (selectedDealTypes.length > 0 && !selectedDealTypes.includes(product.dealType)) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
        return false;
      }

      // Price range filter
      if (priceRange.min > 0 || priceRange.max < 10000000) {
        if (product.price < priceRange.min || product.price > priceRange.max) {
          return false;
        }
      }

      // Discount filter
      if (selectedDiscounts.length > 0) {
        const minDiscount = Math.min(...selectedDiscounts.map((d) => parseInt(d)));
        if (product.discount < minDiscount) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    selectedDealTypes,
    selectedBrands,
    selectedCategories,
    priceRange,
    selectedDiscounts,
  ]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'discount':
        return sorted.sort((a, b) => b.discount - a.discount);
      case 'ending-soon':
        return sorted.sort((a, b) => {
          const aEnd = new Date(a.dealEndDate).getTime();
          const bEnd = new Date(b.dealEndDate).getTime();
          return aEnd - bEnd;
        });
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const totalProducts = filteredProducts.length;
  const displayedProducts = sortedProducts.slice(0, itemsToShow);

  // Toggle filter
  const toggleFilter = (filterType, value) => {
    const setters = {
      brand: setSelectedBrands,
      category: setSelectedCategories,
      discount: setSelectedDiscounts,
      dealType: setSelectedDealTypes,
    };

    const setter = setters[filterType];
    if (setter) {
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyPriceFilter = () => {
    setPriceRange(tempPriceRange);
  };

  const handleResetPriceFilter = () => {
    const defaultRange = { min: 0, max: 10000000 };
    setTempPriceRange(defaultRange);
    setPriceRange(defaultRange);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.productsPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        <div className={styles.pageLayout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <i className="bi bi-lightning-fill" style={{ color: '#f59e0b' }}></i>
              <span className={styles.filterMainTitle}>Deal Filters</span>
            </div>

            {/* Deal Type Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('dealType')}>
                <span className={styles.filterTitle}>Deal Type</span>
                <i className={`bi bi-chevron-${openSections.dealType ? 'up' : 'down'}`}></i>
              </button>
              {openSections.dealType && (
                <div className={styles.filterContent}>
                  {dealTypes.map((type) => (
                    <label key={type.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedDealTypes.includes(type.id)}
                        onChange={() => toggleFilter('dealType', type.id)}
                        className={styles.checkbox}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`bi bi-${type.icon}`} style={{ color: '#f59e0b' }}></i>
                        <span className={styles.brandName}>{type.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Discount Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('discount')}>
                <span className={styles.filterTitle}>Discount Amount</span>
                <i className={`bi bi-chevron-${openSections.discount ? 'up' : 'down'}`}></i>
              </button>
              {openSections.discount && (
                <div className={styles.filterContent}>
                  {discounts.map((discount) => (
                    <label key={discount.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(discount.id)}
                        onChange={() => toggleFilter('discount', discount.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{discount.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className={styles.filterSection}>
                <button className={styles.filterHeaderBtn} onClick={() => toggleSection('brand')}>
                  <span className={styles.filterTitle}>Brand</span>
                  <i className={`bi bi-chevron-${openSections.brand ? 'up' : 'down'}`}></i>
                </button>
                {openSections.brand && (
                  <div className={styles.filterContent}>
                    {availableBrands.map((brand) => (
                      <label key={brand} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleFilter('brand', brand)}
                          className={styles.checkbox}
                        />
                        <span className={styles.brandName}>{brand}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className={styles.filterSection}>
                <button
                  className={styles.filterHeaderBtn}
                  onClick={() => toggleSection('category')}
                >
                  <span className={styles.filterTitle}>Category</span>
                  <i className={`bi bi-chevron-${openSections.category ? 'up' : 'down'}`}></i>
                </button>
                {openSections.category && (
                  <div className={styles.filterContent}>
                    {availableCategories.map((category) => (
                      <label key={category} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleFilter('category', category)}
                          className={styles.checkbox}
                        />
                        <span className={styles.brandName}>{category}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price Range Filter */}
            <div className={styles.filterSection}>
              <button
                className={styles.filterHeaderBtn}
                onClick={() => toggleSection('priceRange')}
              >
                <span className={styles.filterTitle}>Price Range</span>
                <i className={`bi bi-chevron-${openSections.priceRange ? 'up' : 'down'}`}></i>
              </button>
              {openSections.priceRange && (
                <div className={styles.filterContent}>
                  <div className={styles.priceSlider}>
                    <div className={styles.priceInputs}>
                      <div className={styles.priceInputGroup}>
                        <input
                          type="number"
                          placeholder="₫ FROM"
                          value={tempPriceRange.min}
                          onChange={(e) =>
                            setTempPriceRange({ ...tempPriceRange, min: Number(e.target.value) })
                          }
                          className={styles.priceInput}
                        />
                      </div>
                      <div className={styles.priceSeparator}>-</div>
                      <div className={styles.priceInputGroup}>
                        <input
                          type="number"
                          placeholder="₫ TO"
                          value={tempPriceRange.max}
                          onChange={(e) =>
                            setTempPriceRange({ ...tempPriceRange, max: Number(e.target.value) })
                          }
                          className={styles.priceInput}
                        />
                      </div>
                    </div>
                    <div className={styles.priceActions}>
                      <button onClick={handleApplyPriceFilter} className={styles.applyBtn}>
                        Apply
                      </button>
                      <button onClick={handleResetPriceFilter} className={styles.resetBtn}>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            <div className={styles.productsHeader}>
              <h1 className={styles.pageTitle}>
                <i
                  className="bi bi-lightning-fill"
                  style={{ color: '#f59e0b', marginRight: '8px' }}
                ></i>
                All Deals
              </h1>

              <div className={styles.productsControls}>
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <i className="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button
                    className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <i className="bi bi-list-ul"></i>
                  </button>
                </div>

                <div className={styles.infoText}>
                  Showing 1 - {displayedProducts.length} of {totalProducts} deals
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Show:</label>
                  <select
                    className={styles.filterSelect}
                    value={itemsToShow}
                    onChange={(e) => setItemsToShow(Number(e.target.value))}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={96}>96</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Sort by:</label>
                  <select
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="discount">Discount: High to Low</option>
                    <option value="ending-soon">Ending Soon</option>
                    <option value="name">Name</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid/List */}
            {viewMode === 'grid' ? (
              <div className={styles.productGrid}>
                {displayedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <ProductCard product={product} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.productList}>
                {displayedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <ProductListItem product={product} />
                  </Link>
                ))}
              </div>
            )}

            {displayedProducts.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}
                ></i>
                <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
                  {products.length === 0
                    ? '🛒 No Flash Sales Available'
                    : 'No Matching Flash Sales'}
                </p>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                  {products.length === 0
                    ? 'Backend has no active flash sales at the moment. Check back later or sellers can create flash sales.'
                    : 'Try adjusting your filters to see more flash sales'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FlashDealsPage;
