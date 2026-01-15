import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import styles from '@assets/styles/ProductsPage.module.css';
import { dealService } from '../../services/api';

const FlashDealsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [itemsToShow, setItemsToShow] = useState(12);
  const [sortBy, setSortBy] = useState('discount');
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [selectedDealTypes, setSelectedDealTypes] = useState([]);
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  // Fetch deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await dealService.getAllDeals();
        console.log('📦 Deals API Response:', response);

        const dealsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        console.log('✅ Deals Data:', dealsData);

        // Transform deals data to products format
        const productsFromDeals = dealsData.map((deal) => {
          const product = deal.productId || {};
          const activeModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};

          return {
            id: product._id,
            name: product.name,
            description: product.description,
            image:
              product.images?.[0] ||
              activeModel.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
            images: product.images || [],
            price: deal.dealPrice || activeModel.price || 0,
            originalPrice: product.originalPrice || activeModel.originalPrice || 0,
            discount: deal.discountPercent || product.discount || 0,
            rating: product.rating || 5,
            reviews: product.reviewCount || product.sold || 0,
            sold: product.sold || 0,
            stock: activeModel.stock || 0,
            brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
            category:
              typeof product.category === 'object' ? product.category?.name : product.category,
            categoryId:
              typeof product.category === 'object' ? product.category?._id : product.categoryId,
            tier_variations: product.tier_variations,
            // Deal specific fields
            dealId: deal._id,
            dealType: deal.type || 'flash',
            dealStatus: deal.status,
            dealStartDate: deal.startDate,
            dealEndDate: deal.endDate,
            dealSoldCount: deal.soldCount || 0,
            dealQuantityLimit: deal.quantityLimit,
          };
        });

        setDeals(dealsData);
        setProducts(productsFromDeals);
        console.log('📊 Transformed Products:', productsFromDeals.length);
      } catch (error) {
        console.error('❌ Error fetching deals:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Breadcrumb for All Deals
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

      // Only show active deals
      if (product.dealStatus !== 'active') {
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
      case 'priority':
        return sorted.sort((a, b) => (b.dealPriority || 0) - (a.dealPriority || 0));
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

            {/* Deal Duration Filter */}
            <div className={styles.filterSection}>
              <button
                className={styles.filterHeaderBtn}
                onClick={() => toggleSection('dealDuration')}
              >
                <span className={styles.filterTitle}>Time Remaining</span>
                <i className={`bi bi-chevron-${openSections.dealDuration ? 'up' : 'down'}`}></i>
              </button>
              {openSections.dealDuration && (
                <div className={styles.filterContent}>
                  {dealDurations.map((duration) => (
                    <label key={duration.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedDealDurations.includes(duration.id)}
                        onChange={() => toggleFilter('dealDuration', duration.id)}
                        className={styles.checkbox}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="bi bi-clock" style={{ color: '#ef4444' }}></i>
                        <span className={styles.brandName}>{duration.name}</span>
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

            {/* Location Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('location')}>
                <span className={styles.filterTitle}>Seller Location</span>
                <i className={`bi bi-chevron-${openSections.location ? 'up' : 'down'}`}></i>
              </button>
              {openSections.location && (
                <div className={styles.filterContent}>
                  {locations.slice(0, 5).map((location) => (
                    <label key={location.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location.id)}
                        onChange={() => toggleFilter('location', location.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{location.name}</span>
                    </label>
                  ))}
                  {locations.length > 5 && <button className={styles.showMoreBtn}>More</button>}
                </div>
              )}
            </div>

            {/* Shipping Unit Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('shipping')}>
                <span className={styles.filterTitle}>Shipping Unit</span>
                <i className={`bi bi-chevron-${openSections.shipping ? 'up' : 'down'}`}></i>
              </button>
              {openSections.shipping && (
                <div className={styles.filterContent}>
                  {shippingUnits.map((unit) => (
                    <label key={unit.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedShippingUnits.includes(unit.id)}
                        onChange={() => toggleFilter('shippingUnit', unit.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{unit.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('brand')}>
                <span className={styles.filterTitle}>Brand</span>
                <i className={`bi bi-chevron-${openSections.brand ? 'up' : 'down'}`}></i>
              </button>
              {openSections.brand && (
                <div className={styles.filterContent}>
                  {brands.map((brand) => (
                    <label key={brand.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => toggleFilter('brand', brand.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{brand.name}</span>
                    </label>
                  ))}
                  <button className={styles.showMoreBtn}>More</button>
                </div>
              )}
            </div>

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
                          min="0"
                          max={tempPriceRange.max}
                        />
                      </div>
                      <span className={styles.priceSeparator}>-</span>
                      <div className={styles.priceInputGroup}>
                        <input
                          type="number"
                          placeholder="₫ TO"
                          value={tempPriceRange.max}
                          onChange={(e) =>
                            setTempPriceRange({ ...tempPriceRange, max: Number(e.target.value) })
                          }
                          className={styles.priceInput}
                          min={tempPriceRange.min}
                          max="100000000"
                        />
                      </div>
                    </div>
                    <div className={styles.priceActions}>
                      <button className={styles.resetBtn} onClick={handleResetPriceFilter}>
                        Reset
                      </button>
                      <button className={styles.applyBtn} onClick={handleApplyPriceFilter}>
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shop Type Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('shopType')}>
                <span className={styles.filterTitle}>Shop Type</span>
                <i className={`bi bi-chevron-${openSections.shopType ? 'up' : 'down'}`}></i>
              </button>
              {openSections.shopType && (
                <div className={styles.filterContent}>
                  {shopTypes.map((type) => (
                    <label key={type.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedShopTypes.includes(type.id)}
                        onChange={() => toggleFilter('shopType', type.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{type.name}</span>
                    </label>
                  ))}
                  <button className={styles.showMoreBtn}>More</button>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('rating')}>
                <span className={styles.filterTitle}>Rating</span>
                <i className={`bi bi-chevron-${openSections.rating ? 'up' : 'down'}`}></i>
              </button>
              {openSections.rating && (
                <div className={styles.filterContent}>
                  {ratings.map((rating) => (
                    <label key={rating.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(rating.id)}
                        onChange={() => toggleFilter('rating', rating.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.ratingRow}>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star-fill ${i < rating.value ? styles.starActive : styles.starInactive}`}
                          ></i>
                        ))}
                        <span className={styles.brandName}>and up</span>
                      </div>
                    </label>
                  ))}
                  <button className={styles.showMoreBtn}>More</button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Header Controls */}
            <div className={styles.productsHeader}>
              <button className={styles.backButton} onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left"></i>
              </button>

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
                  <label className={styles.filterLabel}>To Show:</label>
                  <select
                    className={styles.filterSelect}
                    value={itemsToShow}
                    onChange={(e) => setItemsToShow(Number(e.target.value))}
                  >
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <select
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="priority">Priority</option>
                    <option value="ending-soon">Ending Soon</option>
                    <option value="discount">Discount: High to Low</option>
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
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.productList}>
                {displayedProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {displayedProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <i className="bi bi-inbox" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                <p>No deals available at the moment</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FlashDealsPage;
