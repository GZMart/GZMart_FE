import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import styles from '@assets/styles/ProductsPage.module.css';
import {
  breadcrumbItems,
  generateAllProducts,
  sizes,
  locations,
  shippingUnits,
  brands,
  shopTypes,
  conditions,
  paymentOptions,
  ratings,
  services,
  priceRanges,
  discounts,
  availabilityOptions,
  isInStock,
  getPriceRange,
} from '@utils/data/ProductsPage_MockData';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [itemsToShow, setItemsToShow] = useState(9);
  const [sortBy, setSortBy] = useState('position');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedShippingUnits, setSelectedShippingUnits] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [openSections, setOpenSections] = useState({});

  // Temporary filter states (before Apply)
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  const allProducts = generateAllProducts();

  // Filter products based on selections
  const filteredProducts = useMemo(() => allProducts.filter((product) => {
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // Size filter (check in tier_variations)
      if (selectedSizes.length > 0) {
        if (product.tier_variations && product.tier_variations.length > 1) {
          // Check if second tier (usually Size) has any matching option
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
        } else if (product.size) {
          // Fallback for old schema
          const hasMatchingSize = selectedSizes.some((size) => product.size.includes(size));
          if (!hasMatchingSize) {
return false;
}
        }
      }

      // Price range filter (checkbox or slider)
      if (selectedPriceRanges.length > 0) {
        const inPriceRange = selectedPriceRanges.some((rangeId) => {
          const range = priceRanges.find((r) => r.id === rangeId);
          return product.price >= range.min && product.price <= range.max;
        });
        if (!inPriceRange) {
return false;
}
      } else if (priceRange.min > 0 || priceRange.max < 10000000) {
        // Use slider values if no checkbox selected
        if (product.price < priceRange.min || product.price > priceRange.max) {
return false;
}
      }

      // Discount filter
      if (selectedDiscounts.length > 0) {
        const maxDiscount = Math.max(...selectedDiscounts.map((d) => parseInt(d)));
        if (product.discount < maxDiscount) {
return false;
}
      }

      // Availability filter (use helper function)
      if (selectedAvailability.length > 0) {
        const productInStock = isInStock(product);
        if (selectedAvailability.includes('inStock') && !productInStock) {
return false;
}
        if (selectedAvailability.includes('outOfStock') && productInStock) {
return false;
}
      }

      return true;
    }), [
    allProducts,
    selectedBrands,
    selectedSizes,
    selectedPriceRanges,
    selectedDiscounts,
    selectedAvailability,
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
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const totalProducts = filteredProducts.length;
  const displayedProducts = sortedProducts.slice(0, itemsToShow);

  const toggleFilter = (filterType, value) => {
    const setters = {
      location: setSelectedLocations,
      shippingUnit: setSelectedShippingUnits,
      brand: setSelectedBrands,
      size: setSelectedSizes,
      priceRange: setSelectedPriceRanges,
      shopType: setSelectedShopTypes,
      condition: setSelectedConditions,
      payment: setSelectedPaymentOptions,
      rating: setSelectedRatings,
      service: setSelectedServices,
      discount: setSelectedDiscounts,
      availability: setSelectedAvailability,
    };

    const setter = setters[filterType];
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
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

            {/* Condition Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('condition')}>
                <span className={styles.filterTitle}>Condition</span>
                <i className={`bi bi-chevron-${openSections.condition ? 'up' : 'down'}`}></i>
              </button>
              {openSections.condition && (
                <div className={styles.filterContent}>
                  {conditions.map((condition) => (
                    <label key={condition.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(condition.id)}
                        onChange={() => toggleFilter('condition', condition.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{condition.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Options Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('payment')}>
                <span className={styles.filterTitle}>Payment Options</span>
                <i className={`bi bi-chevron-${openSections.payment ? 'up' : 'down'}`}></i>
              </button>
              {openSections.payment && (
                <div className={styles.filterContent}>
                  {paymentOptions.map((option) => (
                    <label key={option.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedPaymentOptions.includes(option.id)}
                        onChange={() => toggleFilter('payment', option.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{option.name}</span>
                    </label>
                  ))}
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

            {/* Services Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('services')}>
                <span className={styles.filterTitle}>Services & Promotions</span>
                <i className={`bi bi-chevron-${openSections.services ? 'up' : 'down'}`}></i>
              </button>
              {openSections.services && (
                <div className={styles.filterContent}>
                  {services.map((service) => (
                    <label key={service.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleFilter('service', service.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.brandName}>{service.name}</span>
                    </label>
                  ))}
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

              <h1 className={styles.pageTitle}>All Products</h1>

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
                  Showing 1 - {displayedProducts.length} of {totalProducts} items
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
