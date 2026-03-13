import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import LoadingSpinner from '@components/common/LoadingSpinner';
import styles from '@assets/styles/ProductsPage.module.css';
import { dealService, flashsaleService } from '../../services/api';

const FlashDealsPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const itemsPerPage = 12;
  const [page, setPage] = useState(1);
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

        // Fetch both flash sales and active deals in parallel
        const [flashSaleRes, dealsRes] = await Promise.allSettled([
          flashsaleService.getActive(),
          dealService.getActiveDeals({ limit: 100 }),
        ]);

        // ── Parse flash sales ────────────────────────────────────────────────
        let flashSalesData = [];
        if (flashSaleRes.status === 'fulfilled') {
          const response = flashSaleRes.value;
          if (Array.isArray(response)) {
            flashSalesData = response;
          } else if (response?.data) {
            flashSalesData = Array.isArray(response.data)
              ? response.data
              : response.data?.data || [];
          }
        }

        // Group flash sales by product + campaign so each product appears once
        const grouped = {};
        flashSalesData
          .filter((fs) => fs && fs.productId)
          .forEach((flashSale) => {
            const pid =
              typeof flashSale.productId === 'object'
                ? flashSale.productId._id
                : flashSale.productId;
            const groupKey = `${pid}_${flashSale.campaignTitle || ''}_${flashSale.startAt}`;
            if (!grouped[groupKey]) {
              grouped[groupKey] = { product: flashSale.productId, deals: [] };
            }
            grouped[groupKey].deals.push(flashSale);
          });

        const productsFromFlashSales = Object.values(grouped).map(({ product, deals }) => {
          const rep = deals.reduce((best, d) =>
            (d.salePrice || Infinity) < (best.salePrice || Infinity) ? d : best
          );
          let variantModel = null;
          if (rep.variantSku && product.models) {
            variantModel = product.models.find((m) => m.sku === rep.variantSku);
          }
          if (!variantModel) {
            variantModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};
          }
          const totalSold = deals.reduce((s, d) => s + (d.soldQuantity || 0), 0);
          const totalQty = deals.reduce((s, d) => s + (d.totalQuantity || 0), 0);
          const priceMin = Math.min(...deals.map((d) => d.salePrice || 0));
          const priceMax = Math.max(...deals.map((d) => d.salePrice || 0));
          return {
            id: product._id,
            name: product.name,
            description: product.description,
            image:
              product.images?.[0] ||
              variantModel.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
            images: product.images || [],
            price: priceMin,
            originalPrice: variantModel.price || priceMin || 0,
            discount:
              rep.discountPercent ||
              Math.round(((variantModel.price - priceMin) / variantModel.price) * 100) ||
              0,
            rating: product.rating || 5,
            reviews: product.reviewCount || product.sold || 0,
            sold: totalSold,
            stock: deals.reduce(
              (s, d) => s + (d.remainingQuantity ?? d.totalQuantity - d.soldQuantity ?? 0),
              0
            ),
            brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
            category:
              typeof product.category === 'object' ? product.category?.name : product.category,
            categoryId:
              typeof product.category === 'object' ? product.category?._id : product.categoryId,
            tier_variations: product.tier_variations,
            flashSaleId: rep._id,
            dealId: rep._id,
            dealType: 'flash_sale',
            dealStatus: rep.status,
            dealStartDate: rep.startAt,
            dealEndDate: rep.endAt,
            dealSoldCount: totalSold,
            dealQuantityLimit: totalQty,
            dealPriceMin: priceMin,
            dealPriceMax: priceMax,
            skuCount: deals.length,
            variantSku: rep.variantSku,
            purchaseLimit: rep.purchaseLimit,
            campaignTitle: rep.campaignTitle,
          };
        });

        // ── Parse active deals (special, limited_time, clearance, etc.) ─────
        let dealsData = [];
        if (dealsRes.status === 'fulfilled') {
          const response = dealsRes.value;
          if (Array.isArray(response)) {
            dealsData = response;
          } else if (response?.data) {
            dealsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
          }
        }

        // Filter out flash_sale types (already shown above) and deals without product
        const flashSaleProductIds = new Set(productsFromFlashSales.map((p) => p.id));
        const productsFromDeals = dealsData
          .filter((deal) => deal && deal.productId && deal.type !== 'flash_sale')
          .filter((deal) => {
            const pid = typeof deal.productId === 'object' ? deal.productId._id : deal.productId;
            return !flashSaleProductIds.has(pid);
          })
          .map((deal) => {
            const product = deal.productId;
            const pid = typeof product === 'object' ? product._id : product;
            return {
              id: pid,
              name: product.name,
              description: product.description,
              image:
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
              images: product.images || [],
              price: deal.dealPrice || deal.discountedPrice || product.price || 0,
              originalPrice: product.originalPrice || product.price || 0,
              discount: deal.discountPercent || 0,
              rating: product.rating || 5,
              reviews: product.reviewCount || product.sold || 0,
              sold: deal.soldCount || 0,
              stock: deal.quantityLimit != null ? deal.quantityLimit - (deal.soldCount || 0) : null,
              brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
              category:
                typeof product.category === 'object' ? product.category?.name : product.category,
              categoryId:
                typeof product.category === 'object' ? product.category?._id : product.categoryId,
              tier_variations: product.tier_variations || [],
              dealId: deal._id,
              dealType: deal.type,
              dealStatus: deal.status,
              dealStartDate: deal.startDate,
              dealEndDate: deal.endDate,
              dealSoldCount: deal.soldCount || 0,
              dealQuantityLimit: deal.quantityLimit,
              dealPriceMin: deal.discountedMinPrice || deal.dealPrice || 0,
              dealPriceMax: deal.discountedMaxPrice || deal.dealPrice || 0,
              purchaseLimit: deal.purchaseLimitPerUser,
              campaignTitle: deal.title,
            };
          });

        const allProducts = [...productsFromFlashSales, ...productsFromDeals];

        if (import.meta.env.DEV) {
          console.log('📊 Flash Sale products:', productsFromFlashSales.length);
          console.log('📊 Deal products:', productsFromDeals.length);
          console.log('📊 Total products:', allProducts.length);
        }

        setProducts(allProducts);
      } catch (error) {
        console.error('❌ Error fetching deals:', error);
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
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
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
      }),
    [products, selectedDealTypes, selectedBrands, selectedCategories, priceRange, selectedDiscounts]
  );

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
  const displayedProducts = sortedProducts.slice(0, page * itemsPerPage);

  // Infinite Scroll Observer
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (loading) {
        return;
      }
      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayedProducts.length < totalProducts) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, displayedProducts.length, totalProducts]
  );

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
    setPage(1);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyPriceFilter = () => {
    setPriceRange(tempPriceRange);
    setPage(1);
  };

  const handleResetPriceFilter = () => {
    const defaultRange = { min: 0, max: 10000000 };
    setTempPriceRange(defaultRange);
    setPriceRange(defaultRange);
    setPage(1);
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
                  Showing {displayedProducts.length} of {totalProducts} deals
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Sort by:</label>
                  <select
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
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
                {displayedProducts.map((product, index) => {
                  const isLast = index === displayedProducts.length - 1;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      style={{ textDecoration: 'none' }}
                      ref={isLast ? lastElementRef : null}
                    >
                      <ProductCard product={product} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.productList}>
                {displayedProducts.map((product, index) => {
                  const isLast = index === displayedProducts.length - 1;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      style={{ textDecoration: 'none' }}
                      ref={isLast ? lastElementRef : null}
                    >
                      <ProductListItem product={product} />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Loading More Indicator */}
            {displayedProducts.length < totalProducts && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
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
