import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import LoadingSpinner from '@components/common/LoadingSpinner';
import Pagination from '@components/common/Pagination';
import styles from '@assets/styles/buyer/Product/ProductsPage.module.css';
import { dealService, campaignService } from '../../services/api';

const dealTypes = [
  { id: 'flash_sale', name: 'Flash Sale', icon: 'lightning-fill' },
  { id: 'daily_deal', name: 'Daily Deal', icon: 'calendar-day' },
  { id: 'limited_time', name: 'Limited Time', icon: 'clock' },
  { id: 'clearance', name: 'Clearance', icon: 'tag' },
];

const discountOptions = [
  { id: '50', name: '50% trở lên' },
  { id: '40', name: '40% trở lên' },
  { id: '30', name: '30% trở lên' },
  { id: '20', name: '20% trở lên' },
  { id: '10', name: '10% trở lên' },
];

/**
 * Same rule as ProductCard discount badge: round((original - price) / original * 100).
 * Sorting must use this so "Giảm nhiều" order matches the % shown on each card.
 */
function getEffectiveDiscountPercent(product) {
  const orig = Number(product?.originalPrice) || 0;
  const price = Number(product?.price) || 0;
  if (orig > 0 && price >= 0 && orig > price) {
    return Math.round(((orig - price) / orig) * 100);
  }
  return Number(product?.discount) || 0;
}

// Tạo key duy nhất cho deal bằng cách kết hợp id, dealId, dealType và endDate
// dealType giúp phân biệt các deal types khác nhau cho cùng 1 product
function getDealSortKey(product) {
  const dealId = product.flashSaleId || product.dealId || '';
  const dealType = product.dealType || '';
  const end = product.dealEndDate || '';
  return `${product.id}_${dealId}_${dealType}_${end}`;
}

const FlashDealsPage = () => {
  const viewMode = 'grid';
  const itemsPerPage = 24;
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('discount');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedDealTypes, setSelectedDealTypes] = useState([]);
  const [openSections, setOpenSections] = useState({
    dealType: true,
    discount: true,
    brand: true,
    category: true,
    priceRange: true,
  });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);

        const [flashSaleRes, dealsRes] = await Promise.allSettled([
          campaignService.getActive(),
          dealService.getActiveDeals({ limit: 100 }),
        ]);

        let flashSalesData = [];
        if (flashSaleRes.status === 'fulfilled') {
          const response = flashSaleRes.value;
          if (Array.isArray(response)) {
            flashSalesData = response;
          } else if (response?.data) {
            // API /api/campaigns/active trả về { data: [...] }
            flashSalesData = Array.isArray(response.data) ? response.data : [];
          }
        }

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
              variantModel.image ||
              product.images?.[0] ||
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
            preOrderDays: product.preOrderDays ?? 0,
          };
        });

        let dealsData = [];
        if (dealsRes.status === 'fulfilled') {
          const response = dealsRes.value;
          if (Array.isArray(response)) {
            dealsData = response;
          } else if (response?.data) {
            // API /api/deals trả về { data: [...] } → lấy response.data trực tiếp
            dealsData = Array.isArray(response.data) ? response.data : [];
          }
        }

        // Lấy deals từ deal service (type != flash_sale)
        // Không deduplicate theo productId vì cùng 1 product có thể có nhiều deal types
        const productsFromDeals = dealsData
          .filter((deal) => deal && deal.productId && deal.type !== 'flash_sale')
          .map((deal) => {
            const product = deal.productId;
            const pid = typeof product === 'object' ? product._id : product;
            return {
              id: pid,
              name: product.name,
              description: product.description,
              image:
                (product.models?.find((m) => m.isActive) || product.models?.[0])?.image ||
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
              preOrderDays: product.preOrderDays ?? 0,
            };
          });

        // Merge tất cả deals từ cả 2 services
        setProducts([...productsFromFlashSales, ...productsFromDeals]);
      } catch (error) {
        console.error('Error fetching deals:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'All Deals', path: '/deals' },
  ];

  const availableBrands = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
    return brands.sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return categories.sort();
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (selectedDealTypes.length > 0 && !selectedDealTypes.includes(product.dealType)) {
          return false;
        }
        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
          return false;
        }
        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
          return false;
        }
        if (priceRange.min > 0 || priceRange.max < 10000000) {
          if (product.price < priceRange.min || product.price > priceRange.max) {
            return false;
          }
        }
        if (selectedDiscounts.length > 0) {
          const minDiscount = Math.min(...selectedDiscounts.map((d) => parseInt(d, 10)));
          if (getEffectiveDiscountPercent(product) < minDiscount) {
            return false;
          }
        }
        return true;
      }),
    [products, selectedDealTypes, selectedBrands, selectedCategories, priceRange, selectedDiscounts]
  );

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    const tieBreak = (a, b, primary) => {
      if (primary !== 0) {
        return primary;
      }
      return getDealSortKey(a).localeCompare(getDealSortKey(b));
    };
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => tieBreak(a, b, a.name.localeCompare(b.name)));
      case 'price-asc':
        return sorted.sort((a, b) => tieBreak(a, b, a.price - b.price));
      case 'price-desc':
        return sorted.sort((a, b) => tieBreak(a, b, b.price - a.price));
      case 'discount':
        return sorted.sort((a, b) =>
          tieBreak(a, b, getEffectiveDiscountPercent(b) - getEffectiveDiscountPercent(a))
        );
      case 'ending-soon':
        return sorted.sort((a, b) => {
          const aEnd = a.dealEndDate ? new Date(a.dealEndDate).getTime() : Number.POSITIVE_INFINITY;
          const bEnd = b.dealEndDate ? new Date(b.dealEndDate).getTime() : Number.POSITIVE_INFINITY;
          return tieBreak(a, b, aEnd - bEnd);
        });
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const displayedProducts = sortedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

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
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const hasActiveFilters =
    selectedDealTypes.length > 0 ||
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    selectedDiscounts.length > 0 ||
    priceRange.min > 0 ||
    priceRange.max < 10000000;

  const clearAllFilters = () => {
    setSelectedDealTypes([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedDiscounts([]);
    handleResetPriceFilter();
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
              <i className="bi bi-lightning-fill"></i>
              <span className={styles.filterMainTitle}>Bộ Lọc Ưu Đãi</span>
            </div>

            {/* Deal Type */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('dealType')}>
                <span className={styles.filterTitle}>
                  <i className="bi bi-bookmark-star"></i> Loại Ưu Đãi
                </span>
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
                      <span className={styles.filterItemName}>
                        <i className={`bi bi-${type.icon}`} style={{ marginRight: 4 }}></i>
                        {type.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('discount')}>
                <span className={styles.filterTitle}>
                  <i className="bi bi-percent"></i> Mức Giảm Giá
                </span>
                <i className={`bi bi-chevron-${openSections.discount ? 'up' : 'down'}`}></i>
              </button>
              {openSections.discount && (
                <div className={styles.filterContent}>
                  {discountOptions.map((discount) => (
                    <label key={discount.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(discount.id)}
                        onChange={() => toggleFilter('discount', discount.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.filterItemName}>{discount.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Brand */}
            {availableBrands.length > 0 && (
              <div className={styles.filterSection}>
                <button className={styles.filterHeaderBtn} onClick={() => toggleSection('brand')}>
                  <span className={styles.filterTitle}>
                    <i className="bi bi-tag"></i> Thương Hiệu
                  </span>
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
                        <span className={styles.filterItemName}>{brand}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category */}
            {availableCategories.length > 0 && (
              <div className={styles.filterSection}>
                <button
                  className={styles.filterHeaderBtn}
                  onClick={() => toggleSection('category')}
                >
                  <span className={styles.filterTitle}>
                    <i className="bi bi-grid"></i> Danh Mục
                  </span>
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
                        <span className={styles.filterItemName}>{category}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price Range */}
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

            {/* Clear All */}
            {hasActiveFilters && (
              <div className={styles.clearAllSection}>
                <button className={styles.clearAllBtn} onClick={clearAllFilters}>
                  <i className="bi bi-x-circle"></i> Xóa Tất Cả
                </button>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Result Info */}
            <div className={styles.resultInfo}>
              <span className={styles.resultCount}>
                <i className="bi bi-lightning-fill"></i> {totalProducts} ưu đãi
              </span>
              {hasActiveFilters && (
                <div className={styles.activeFilters}>
                  {selectedDealTypes.map((dtId) => {
                    const dt = dealTypes.find((d) => d.id === dtId);
                    return dt ? (
                      <span key={dtId} className={styles.filterTag}>
                        {dt.name}
                        <i className="bi bi-x" onClick={() => toggleFilter('dealType', dtId)}></i>
                      </span>
                    ) : null;
                  })}
                  {selectedDiscounts.map((discId) => (
                    <span key={discId} className={styles.filterTag}>
                      ≥{discId}%
                      <i className="bi bi-x" onClick={() => toggleFilter('discount', discId)}></i>
                    </span>
                  ))}
                  {selectedBrands.map((brand) => (
                    <span key={brand} className={styles.filterTag}>
                      {brand}
                      <i className="bi bi-x" onClick={() => toggleFilter('brand', brand)}></i>
                    </span>
                  ))}
                  {selectedCategories.map((cat) => (
                    <span key={cat} className={styles.filterTag}>
                      {cat}
                      <i className="bi bi-x" onClick={() => toggleFilter('category', cat)}></i>
                    </span>
                  ))}
                  {(priceRange.min > 0 || priceRange.max < 10000000) && (
                    <span className={styles.filterTag}>
                      {priceRange.min > 0 ? `₫${priceRange.min.toLocaleString()}` : '₫0'} —{' '}
                      {priceRange.max < 10000000 ? `₫${priceRange.max.toLocaleString()}` : '∞'}
                      <i className="bi bi-x" onClick={handleResetPriceFilter}></i>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sort Bar */}
            <div className={styles.sortBar}>
              <div className={styles.sortBarLeft}>
                <span className={styles.sortLabel}>Sắp xếp theo</span>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'discount' ? styles.sortBtnActive : ''}`}
                  onClick={() => {
                    setSortBy('discount');
                    setPage(1);
                  }}
                >
                  Giảm Nhiều
                </button>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'ending-soon' ? styles.sortBtnActive : ''}`}
                  onClick={() => {
                    setSortBy('ending-soon');
                    setPage(1);
                  }}
                >
                  Sắp Kết Thúc
                </button>
                <select
                  className={`${styles.sortPriceSelect} ${sortBy === 'price-asc' || sortBy === 'price-desc' ? styles.sortPriceActive : ''}`}
                  value={sortBy === 'price-asc' || sortBy === 'price-desc' ? sortBy : ''}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="" disabled>
                    Giá
                  </option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
              <div className={styles.sortBarRight}>
                <span className={styles.pageInfo}>
                  <span className={styles.pageInfoCurrent}>{page}</span>/{totalPages || 1}
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
            {displayedProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-lightning"></i>
                </div>
                <h3>
                  {products.length === 0 ? 'Chưa có ưu đãi nào' : 'Không tìm thấy ưu đãi phù hợp'}
                </h3>
                <p>
                  {products.length === 0
                    ? 'Hiện tại chưa có chương trình ưu đãi nào. Hãy quay lại sau!'
                    : 'Thử điều chỉnh bộ lọc để xem thêm ưu đãi'}
                </p>
                {hasActiveFilters && (
                  <button className={styles.emptyResetBtn} onClick={clearAllFilters}>
                    <i className="bi bi-arrow-counterclockwise"></i> Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className={styles.productGrid}>
                {displayedProducts.map((product) => (
                  <Link
                    key={getDealSortKey(product)}
                    to={`/product/${product.id}`}
                    className={styles.productGridCardLink}
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

export default FlashDealsPage;
