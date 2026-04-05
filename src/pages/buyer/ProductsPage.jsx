import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import styles from '@assets/styles/buyer/Product/ProductsPage.module.css';
import Pagination from '@components/common/Pagination';
import { productService, categoryService } from '../../services/api';
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
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const categoryParam = searchParams.get('category');

  // Category name state for display
  const [categoryName, setCategoryName] = useState('');

  // Dynamic breadcrumb based on search/category context
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Home', path: '/' }];

    if (searchQuery) {
      items.push(
        { label: 'Products', path: '/products' },
        { label: `Search: "${searchQuery}"`, path: `/products?q=${searchQuery}`, isActive: true }
      );
    } else if (categoryParam) {
      items.push(
        { label: 'Products', path: '/products' },
        {
          label: categoryName || categoryParam,
          path: `/products?category=${categoryParam}`,
          isActive: true,
        }
      );
    } else {
      items.push({ label: 'Products', path: '/products', isActive: true });
    }

    return items;
  }, [searchQuery, categoryParam, categoryName]);

  const [viewMode] = useState('grid');
  const [itemsToShow] = useState(24);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('popular');
  const [priceOrder, setPriceOrder] = useState('asc');
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
  // Memoize filters to prevent unnecessary API calls
  const apiFilters = useMemo(() => {
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
      category: categoryParam || undefined,
      sortBy:
        sortBy === 'price'
          ? 'originalPrice'
          : sortBy === 'newest'
            ? 'createdAt'
            : sortBy === 'best-selling'
              ? 'sold'
              : 'sold',
      sortOrder: sortBy === 'price' ? priceOrder : 'desc',
    };
    // Remove undefined values
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);
    return filters;
  }, [
    searchQuery,
    categoryParam,
    selectedBrands,
    priceRange.min,
    priceRange.max,
    selectedDiscounts,
    selectedRatings,
    selectedAvailability,
    selectedLocations,
    sortBy,
    priceOrder,
    page,
    itemsToShow,
  ]);

  // Fetch products with filters
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProductsAdvanced(apiFilters);

        if (!isMounted) {
          return;
        }

        const productsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        const transformed = productsData.map((product) => {
          const activeModel = product.models?.find((m) => m.isActive) || product.models?.[0] || {};

          return {
            id: product._id,
            name: product.name,
            image:
              activeModel.image ||
              product.images?.[0] ||
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

        setProducts(transformed);
        setTotalCount(response.count || response.pagination?.total || 0);
        setTotalPages(
          response.pagination?.pages || Math.ceil((response.count || 0) / apiFilters.limit)
        );
        setLoading(false);

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
                  if (!promo) {
                    return p;
                  }

                  const updated = { ...p };

                  // Shop program price override
                  if (
                    promo.shopProgram &&
                    promo.shopProgram.salePrice < promo.shopProgram.originalPrice
                  ) {
                    updated.price = promo.shopProgram.salePrice;
                    updated.originalPrice = promo.shopProgram.originalPrice;
                    updated.promotionType = 'shopProgram';
                  }

                  // Combo promotion info
                  if (promo.comboPromotions && promo.comboPromotions.length > 0) {
                    const combo = promo.comboPromotions[0];
                    const bestTier = combo.tiers?.reduce(
                      (best, t) => (t.value > (best?.value || 0) ? t : best),
                      null
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
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [apiFilters]);

  // Fetch available brands for filter
  useEffect(() => {
    let isMounted = true;
    const fetchBrands = async () => {
      try {
        const response = await productService.getAvailableFilters();
        if (!isMounted) {
          return;
        }
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

  // Fetch category name
  useEffect(() => {
    if (!categoryParam) {
      setCategoryName('');
      return;
    }
    const fetchCategoryName = async () => {
      try {
        const response = await categoryService.getAll();
        const allCats = Array.isArray(response) ? response : response.data || [];
        const match = allCats.find((c) => c.slug === categoryParam);
        if (match) {
          setCategoryName(match.name);
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchCategoryName();
  }, [categoryParam]);

  // Client-side filtering (Sizes)
  const filteredProducts = useMemo(() => {
    if (!products.length) {
      return [];
    }
    return products.filter((product) => {
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
          if (!hasMatchingSize) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedSizes]);

  // Client-side sorting (if needed after client filter)
  const sortedProducts = useMemo(() => {
    if (!filteredProducts.length) {
      return [];
    }
    if (selectedSizes.length === 0) {
      return filteredProducts;
    }

    const sorted = [...filteredProducts];
    if (sortBy === 'price') {
      return priceOrder === 'desc'
        ? sorted.sort((a, b) => b.price - a.price)
        : sorted.sort((a, b) => a.price - b.price);
    }
    return sorted;
  }, [filteredProducts, sortBy, priceOrder, selectedSizes]);

  const totalProducts = totalCount || filteredProducts.length;
  const displayedProducts = sortedProducts;

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
      rating: setSelectedRatings,
      discount: setSelectedDiscounts,
      availability: setSelectedAvailability,
    };
    const setter = setters[filterType];
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
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

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryParam]);

  return (
    <div className={styles.productsPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        <div className={styles.pageLayout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <i className="bi bi-funnel-fill"></i>
              <span className={styles.filterMainTitle}>Bộ Lọc Tìm Kiếm</span>
            </div>

            {/* Location Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('location')}>
                <span className={styles.filterTitle}>
                  <i className="bi bi-geo-alt"></i> Nơi Bán
                </span>
                <i className={`bi bi-chevron-${openSections.location ? 'up' : 'down'}`}></i>
              </button>
              {openSections.location && (
                <div className={styles.filterContent}>
                  {locations.map((location) => (
                    <label key={location.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location.id)}
                        onChange={() => toggleFilter('location', location.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.filterItemName}>{location.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('brand')}>
                <span className={styles.filterTitle}>
                  <i className="bi bi-tag"></i> Thương Hiệu
                </span>
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
                      <span className={styles.filterItemName}>{brand.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range Filter */}
            <div className={styles.filterSection}>
              <button
                className={styles.filterHeaderBtn}
                onClick={() => toggleSection('priceRange')}
              >
                <span className={styles.filterTitle}>
                  <i className="bi bi-cash-stack"></i> Khoảng Giá
                </span>
                <i className={`bi bi-chevron-${openSections.priceRange ? 'up' : 'down'}`}></i>
              </button>
              {openSections.priceRange && (
                <div className={styles.filterContent}>
                  <div className={styles.rangeSliderContainer}>
                    <div className={styles.sliderTrack}>
                      <div
                        className={styles.sliderRange}
                        style={{
                          left: `${(tempPriceRange.min / 10000000) * 100}%`,
                          right: `${100 - (tempPriceRange.max / 10000000) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="100000"
                      value={tempPriceRange.min}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), tempPriceRange.max - 100000);
                        setTempPriceRange({ ...tempPriceRange, min: val });
                      }}
                      className={styles.rangeInput}
                    />
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="100000"
                      value={tempPriceRange.max}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), tempPriceRange.min + 100000);
                        setTempPriceRange({ ...tempPriceRange, max: val });
                      }}
                      className={styles.rangeInput}
                    />
                  </div>
                  <div className={styles.rangePriceLabels}>
                    <span>₫{tempPriceRange.min.toLocaleString()}</span>
                    <span>₫{tempPriceRange.max.toLocaleString()}</span>
                  </div>
                  <button className={styles.applyBtn} onClick={handleApplyPriceFilter}>
                    ÁP DỤNG
                  </button>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('rating')}>
                <span className={styles.filterTitle}>
                  <i className="bi bi-star"></i> Đánh Giá
                </span>
                <i className={`bi bi-chevron-${openSections.rating ? 'up' : 'down'}`}></i>
              </button>
              {openSections.rating && (
                <div className={styles.filterContent}>
                  {ratings.map((rating) => (
                    <button
                      key={rating.id}
                      className={`${styles.ratingBtn} ${selectedRatings.includes(rating.id) ? styles.ratingBtnActive : ''}`}
                      onClick={() => toggleFilter('rating', rating.id)}
                    >
                      <div className={styles.ratingRow}>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star-fill ${i < rating.value ? styles.starActive : styles.starInactive}`}
                          ></i>
                        ))}
                        <span className={styles.ratingText}>trở lên</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear All Button */}
            {(selectedLocations.length > 0 ||
              selectedBrands.length > 0 ||
              selectedRatings.length > 0 ||
              priceRange.min > 0 ||
              priceRange.max < 10000000) && (
              <div className={styles.clearAllSection}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setSelectedLocations([]);
                    setSelectedBrands([]);
                    setSelectedRatings([]);
                    handleResetPriceFilter();
                  }}
                >
                  <i className="bi bi-x-circle"></i> Xóa Tất Cả
                </button>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Result Info */}
            {!loading && (
              <div className={styles.resultInfo}>
                <span className={styles.resultCount}>
                  {searchQuery && (
                    <>
                      <i className="bi bi-search"></i> Kết quả cho{' '}
                      <strong>&ldquo;{searchQuery}&rdquo;</strong> &middot;{' '}
                    </>
                  )}
                  {totalProducts} sản phẩm
                </span>
                {(selectedLocations.length > 0 ||
                  selectedBrands.length > 0 ||
                  selectedRatings.length > 0 ||
                  priceRange.min > 0 ||
                  priceRange.max < 10000000) && (
                  <div className={styles.activeFilters}>
                    {selectedLocations.map((locId) => {
                      const loc = locations.find((l) => l.id === locId);
                      return loc ? (
                        <span key={locId} className={styles.filterTag}>
                          {loc.name}
                          <i
                            className="bi bi-x"
                            onClick={() => toggleFilter('location', locId)}
                          ></i>
                        </span>
                      ) : null;
                    })}
                    {selectedBrands.map((brandId) => {
                      const brand = brands.find((b) => b.id === brandId);
                      return brand ? (
                        <span key={brandId} className={styles.filterTag}>
                          {brand.name}
                          <i className="bi bi-x" onClick={() => toggleFilter('brand', brandId)}></i>
                        </span>
                      ) : null;
                    })}
                    {(priceRange.min > 0 || priceRange.max < 10000000) && (
                      <span className={styles.filterTag}>
                        {priceRange.min > 0 ? `₫${priceRange.min.toLocaleString()}` : '₫0'} —{' '}
                        {priceRange.max < 10000000 ? `₫${priceRange.max.toLocaleString()}` : '∞'}
                        <i className="bi bi-x" onClick={handleResetPriceFilter}></i>
                      </span>
                    )}
                    {selectedRatings.map((ratingId) => {
                      const r = ratings.find((rt) => rt.id === ratingId);
                      return r ? (
                        <span key={ratingId} className={styles.filterTag}>
                          {r.value}★ trở lên
                          <i
                            className="bi bi-x"
                            onClick={() => toggleFilter('rating', ratingId)}
                          ></i>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sort Bar */}
            <div className={styles.sortBar}>
              <div className={styles.sortBarLeft}>
                <span className={styles.sortLabel}>Sắp xếp theo</span>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'popular' ? styles.sortBtnActive : ''}`}
                  onClick={() => {
                    setSortBy('popular');
                    setPage(1);
                  }}
                >
                  Phổ Biến
                </button>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'newest' ? styles.sortBtnActive : ''}`}
                  onClick={() => {
                    setSortBy('newest');
                    setPage(1);
                  }}
                >
                  Mới Nhất
                </button>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'best-selling' ? styles.sortBtnActive : ''}`}
                  onClick={() => {
                    setSortBy('best-selling');
                    setPage(1);
                  }}
                >
                  Bán Chạy
                </button>
                <select
                  className={`${styles.sortPriceSelect} ${sortBy === 'price' ? styles.sortPriceActive : ''}`}
                  value={sortBy === 'price' ? priceOrder : ''}
                  onChange={(e) => {
                    setSortBy('price');
                    setPriceOrder(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="" disabled>
                    Giá
                  </option>
                  <option value="asc">Giá: Thấp đến Cao</option>
                  <option value="desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
              <div className={styles.sortBarRight}>
                <span className={styles.pageInfo}>
                  <span className={styles.pageInfoCurrent}>{page}</span>/{totalPages}
                </span>
                <button
                  className={styles.pageNavBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className={styles.pageNavBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
            {/* Product Grid/List */}
            {loading ? (
              <div className={styles.productGrid}>
                {[...Array(itemsToShow > 20 ? 20 : itemsToShow)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-box-seam"></i>
                </div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                {(selectedLocations.length > 0 ||
                  selectedBrands.length > 0 ||
                  selectedRatings.length > 0 ||
                  priceRange.min > 0 ||
                  priceRange.max < 10000000) && (
                  <button
                    className={styles.emptyResetBtn}
                    onClick={() => {
                      setSelectedLocations([]);
                      setSelectedBrands([]);
                      setSelectedRatings([]);
                      handleResetPriceFilter();
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i> Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className={styles.productGrid}>
                {displayedProducts.map((product, index) => (
                  <ProductCard key={`${product.id}-${index}`} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.productList}>
                {displayedProducts.map((product, index) => (
                  <ProductListItem key={`${product.id}-${index}`} product={product} />
                ))}
              </div>
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
