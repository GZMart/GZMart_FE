import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import styles from '@assets/styles/ProductsPage.module.css';
import Pagination from '@components/common/Pagination';
import { productService } from '../../services/api';
import promotionBuyerService from '../../services/api/promotionBuyerService';


const locations = [
  { id: 'hanoi', name: 'Hà Nội' },
  { id: 'hcm', name: 'Hồ Chí Minh' },
  { id: 'danang', name: 'Đà Nẵng' },
  { id: 'cantho', name: 'Cần Thơ' },
  { id: 'haiphong', name: 'Hải Phòng' },
];



const ratings = [
  { id: '5star', value: 5 },
  { id: '4star', value: 4 },
  { id: '3star', value: 3 },
];

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  // ... breadcrumb logic (omitted for brevity in replacement if possible, but replace tool needs context)
  // Re-inserting logic requires matching context. 
  // Easier to just insert key blocks separately or careful replacement.

  // Let's target the top of the file for ratings constant first
  // And then the state variables.


  // Dynamic breadcrumb based on search query
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Home', path: '/' }];

    if (searchQuery) {
      items.push(
        { label: 'Products', path: '/products' },
        { label: `Search: "${searchQuery}"`, path: `/products?q=${searchQuery}`, isActive: true }
      );
    } else {
      items.push({ label: 'Products', path: '/products', isActive: true });
    }

    return items;
  }, [searchQuery]);

  const [viewMode, setViewMode] = useState('grid');
  const [itemsToShow, setItemsToShow] = useState(12);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('position');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [openSections, setOpenSections] = useState({
    location: true,
    brand: true,
    priceRange: true,
    rating: true,
  });
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Temporary filter states (before Apply)
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  // Infinite scroll
  const loaderRef = useRef(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Memoize filters to prevent unnecessary API calls
  const apiFilters = useMemo(() => {
    const searchQuery = searchParams.get('q');
    const filters = {
      page,
      limit: itemsToShow,
      search: searchQuery || undefined,
      brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
      minPrice: priceRange.min > 0 ? priceRange.min : undefined,
      maxPrice: priceRange.max < 10000000 ? priceRange.max : undefined,
      minDiscount:
        selectedDiscounts.length > 0
          ? Math.max(...selectedDiscounts.map((d) => parseInt(d)))
          : undefined,
      minRating:
        selectedRatings.length > 0 ? Math.max(...selectedRatings.map((r) => r.value)) : undefined,
      inStock: selectedAvailability.includes('inStock') ? 'true' : undefined,
      location: selectedLocations.length > 0 ? selectedLocations.join(',') : undefined,
      sortBy:
        sortBy === 'price-asc' || sortBy === 'price-desc'
          ? 'originalPrice' // Fixed: Map to backend field
          : sortBy === 'name'
            ? 'name'
            : sortBy === 'position'
              ? 'createdAt' // Map Position to Newest
              : 'isFeatured',
      sortOrder: sortBy === 'price-desc' || sortBy === 'position' ? 'desc' : 'asc',
    };
    // Remove undefined values
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);
    return filters;
  }, [
    searchParams,
    selectedBrands,
    priceRange.min,
    priceRange.max,
    selectedDiscounts,
    selectedRatings,
    selectedAvailability,
    selectedLocations,
    sortBy,
    page,
    itemsToShow,
  ]);


  // Fetch products with filters
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setIsFetchingMore(true);
        }
        const response = await productService.getProductsAdvanced(apiFilters);

        if (!isMounted) return;

        // Backend returns data directly, not nested in data.data
        const productsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        // Transform backend data to component format
        const transformed = productsData.map((product) => {
          // Get price from models array (first active model)
          const activeModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};

          return {
            id: product._id,
            name: product.name,
            image:
              product.images?.[0] ||
              activeModel.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
            price: activeModel.price || product.price || 0,
            originalPrice: activeModel.originalPrice || product.originalPrice || 0,
            discount: product.discount || 0,
            rating: product.rating || 5,
            sold: product.sold || 0,
            reviews: product.sold || 0,
            stock: activeModel.stock || product.stock || 0,
            brand: product.brand?._id || product.brandId,
            tier_variations: product.tier_variations,
            isFeatured: product.isFeatured,
            isHot: product.isHot,
          };
        });

        if (page === 1) {
          setProducts(transformed);
        } else {
          setProducts((prev) => {
            const currentIds = new Set(prev.map(p => p.id));
            const newProducts = transformed.filter(p => !currentIds.has(p.id));
            return [...prev, ...newProducts];
          });
        }
        
        setTotalCount(response.count || response.pagination?.total || 0);
        setTotalPages(response.pagination?.pages || Math.ceil((response.count || 0) / itemsToShow));
        setLoading(false);
        setIsFetchingMore(false);

        // Fetch promotions for all visible products
        const productIds = transformed.map((p) => p.id).filter(Boolean);
        if (productIds.length > 0) {
          try {
            const promoResponse = await promotionBuyerService.getProductPromotionsBatch(productIds);
            const promoMap = promoResponse?.data || promoResponse;
            if (promoMap && typeof promoMap === 'object') {
              setProducts((prev) =>
                prev.map((p) => {
                  const promo = promoMap[p.id];
                  if (!promo) return p;

                  const updated = { ...p };

                  // Shop program price override
                  if (promo.shopProgram && promo.shopProgram.salePrice < promo.shopProgram.originalPrice) {
                    updated.price = promo.shopProgram.salePrice;
                    updated.originalPrice = promo.shopProgram.originalPrice;
                    updated.promotionType = 'shopProgram';
                  }

                  // Combo promotion info
                  if (promo.comboPromotions && promo.comboPromotions.length > 0) {
                    const combo = promo.comboPromotions[0];
                    const bestTier = combo.tiers?.reduce((best, t) =>
                      (t.value > (best?.value || 0)) ? t : best, null
                    );
                    updated.comboPromotion = {
                      name: combo.name,
                      comboType: combo.comboType,
                      bestDiscount: bestTier?.value || 0,
                    };
                  }

                  return updated;
                })
              );
            }
          } catch (promoErr) {
            console.error('Error fetching batch promotions:', promoErr);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ Error fetching products:', err);
          console.error('Error details:', err.response?.data || err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsFetchingMore(false);
        }
      }
    };
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [apiFilters, searchParams, selectedBrands, itemsToShow, page]);

  // Fetch available brands for filter
  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      try {
        const response = await productService.getAvailableFilters();

        if (!isMounted) return;

        const brandsData = response.data?.data?.brands || [];
        setBrands(brandsData.map((b) => ({ id: b._id, name: b.name })));
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching brands:', err);
        }
      }
    };
    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  // Only apply client-side filters that are NOT handled by API
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    return products.filter((product) => {
      // Size filter (not in API, needs client-side filtering)
      if (selectedSizes.length > 0) {
        if (product.tier_variations && product.tier_variations.length > 1) {
          const sizeTier = product.tier_variations[1];
          const hasMatchingSize = selectedSizes.some((size) =>
            sizeTier.options.some(
              (opt) =>
                opt.toLowerCase().includes(size.toLowerCase()) ||
                size.toLowerCase().includes(opt.toLowerCase())
            )
          );
          if (!hasMatchingSize) return false;
        } else {
          // No tier variations, skip this product
          return false;
        }
      }

      return true;
    });
  }, [products, selectedSizes]);

  // Only re-sort if needed (API already sorts, but we may need to sort filtered results)
  const sortedProducts = useMemo(() => {
    if (!filteredProducts.length) return [];

    // If no client-side filters applied, return as-is (API already sorted)
    if (selectedSizes.length === 0) {
      return filteredProducts;
    }

    // If client-side filtered, need to re-sort
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy, selectedSizes]);

  const totalProducts = totalCount || filteredProducts.length;
  const displayedProducts = sortedProducts; // Already paginated from API

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage}></div>
      <div className={styles.skeletonInfo}>
        <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '40%' }}></div>
      </div>
    </div>
  );

  const toggleFilter = (filterType, value) => {
    const setters = {
      location: setSelectedLocations,
      brand: setSelectedBrands,
      size: setSelectedSizes,
      // priceRange handled separately via min/max state
      rating: setSelectedRatings,
      discount: setSelectedDiscounts,
      availability: setSelectedAvailability,
    };

    const setter = setters[filterType];
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    setPage(1); // Reset page when filter changes
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

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Infinite Scroll Observer
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      // Don't trigger if currently loading new page or first load
      if (loading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, isFetchingMore, page, totalPages]
  );

  return (
    <div className={styles.productsPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        <div className={styles.pageLayout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <i className="bi bi-funnel"></i>
              <span className={styles.filterMainTitle}>Search Filters</span>
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

            {/* Shipping Unit Filter - Hidden (Unsupported) */}
            {/*
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('shipping')}>
                <span className={styles.filterTitle}>Shipping Unit</span>
                <i className={`bi bi-chevron-${openSections.shipping ? 'up' : 'down'}`}></i>
              </button>
              {openSections.shipping && (
                <div className={styles.filterContent}>
                  {['Fast Delivery', 'Standard'].map((opt) => (
                    <label key={opt} className={styles.checkboxLabel}>
                      <input type="checkbox" className={styles.checkbox} />
                      <span className={styles.brandName}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            */}

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

            {/* Shop Type Filter - Hidden (Unsupported) */}
            {/*
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('shopType')}>
                <span className={styles.filterTitle}>Shop Type</span>
                <i className={`bi bi-chevron-${openSections.shopType ? 'up' : 'down'}`}></i>
              </button>
              {openSections.shopType && (
                <div className={styles.filterContent}>
                  {['Official Mall', 'Preferred', 'Local'].map((opt) => (
                    <label key={opt} className={styles.checkboxLabel}>
                      <input type="checkbox" className={styles.checkbox} />
                      <span className={styles.brandName}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            */}

            {/* Condition Filter - Hidden (Unsupported) */}
            {/*
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('condition')}>
                <span className={styles.filterTitle}>Condition</span>
                <i className={`bi bi-chevron-${openSections.condition ? 'up' : 'down'}`}></i>
              </button>
              {openSections.condition && (
                <div className={styles.filterContent}>
                   {['New', 'Used'].map((opt) => (
                    <label key={opt} className={styles.checkboxLabel}>
                      <input type="checkbox" className={styles.checkbox} />
                      <span className={styles.brandName}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            */}

            {/* Payment Options Filter - Hidden (Unsupported) */}
            {/*
             <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('payment')}>
                <span className={styles.filterTitle}>Payment Options</span>
                <i className={`bi bi-chevron-${openSections.payment ? 'up' : 'down'}`}></i>
              </button>
              {openSections.payment && (
                <div className={styles.filterContent}>
                   {['COD', 'Credit Card'].map((opt) => (
                    <label key={opt} className={styles.checkboxLabel}>
                      <input type="checkbox" className={styles.checkbox} />
                      <span className={styles.brandName}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            */}

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
                {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
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
                  Showing {displayedProducts.length} of {totalProducts} items
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
                    <option value="position">Position</option>
                    <option value="name">Name</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid/List */}
            {loading && page === 1 ? (
              <div className={styles.productGrid}>
                {[...Array(itemsToShow)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="bi bi-search" style={{ fontSize: '48px', color: '#d1d5db' }}></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search query</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={styles.productGrid}>
                {displayedProducts.map((product, index) => {
                  if (index === displayedProducts.length - 1) {
                    return <ProductCard ref={lastElementRef} key={`${product.id}-${index}`} product={product} />;
                  }
                  return <ProductCard key={`${product.id}-${index}`} product={product} />;
                })}
              </div>
            ) : (
              <div className={styles.productList}>
                {displayedProducts.map((product, index) => {
                  if (index === displayedProducts.length - 1) {
                    return <ProductListItem ref={lastElementRef} key={`${product.id}-${index}`} product={product} />;
                  }
                  return <ProductListItem key={`${product.id}-${index}`} product={product} />;
                })}
              </div>
            )}

            {/* Loading More Indicator */}
            {isFetchingMore && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
