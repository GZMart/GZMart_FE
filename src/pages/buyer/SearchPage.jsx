import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import ProductCard from '@components/common/ProductCard';
import ProductListItem from '@components/common/ProductListItem';
import styles from '@assets/styles/buyer/Product/ProductsPage.module.css';
import { searchService } from '../../services/api';

const breadcrumbItems = [
  { label: 'Home', path: '/' },
  { label: 'Search', path: '/search', isActive: true },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [itemsToShow, setItemsToShow] = useState(12);
  const [sortBy, setSortBy] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000000 },
    minRating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [openSections, setOpenSections] = useState({});
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });

  // Get search query from URL
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    if (query) {
      performSearch(query);
      fetchFilters();
    }
  }, [searchParams]);

  // Fetch search filters
  const fetchFilters = async () => {
    try {
      const response = await searchService.getFilters();
      setFilters(response.data?.data || {});
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  // Perform search
  const performSearch = async (query, additionalFilters = {}) => {
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);
      const searchParams = {
        query,
        categories: selectedFilters.categories.length > 0 ? selectedFilters.categories : undefined,
        brands: selectedFilters.brands.length > 0 ? selectedFilters.brands : undefined,
        minPrice: selectedFilters.priceRange.min > 0 ? selectedFilters.priceRange.min : undefined,
        maxPrice:
          selectedFilters.priceRange.max < 10000000 ? selectedFilters.priceRange.max : undefined,
        minRating: selectedFilters.minRating > 0 ? selectedFilters.minRating : undefined,
        sort: sortBy === 'price-asc' ? 'price' : sortBy === 'price-desc' ? '-price' : 'relevance',
        limit: 100,
        ...additionalFilters,
      };

      const response = await searchService.searchProducts(searchParams);
      const productsData = response.data?.data || [];

      // Transform backend data to component format
      const transformed = productsData.map((product) => ({
        id: product._id,
        name: product.name,
        image:
          (product.models?.find(m => m.isActive) || product.models?.[0])?.image ||
          product.images?.[0] ||
          product.image ||
          'https://via.placeholder.com/300',
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        rating: product.rating || 5,
        sold: product.sold || 0,
        stock: product.stock,
        brand: product.brand,
        category: product.category,
        preOrderDays: product.preOrderDays ?? 0,
      }));

      setProducts(transformed);
      setTotalCount(response.data?.pagination?.total || transformed.length);
    } catch (err) {
      console.error('Error searching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get autocomplete suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await searchService.getAutocomplete({ query, limit: 10 });
      setSuggestions(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  // Toggle filter section
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle filter selection
  const toggleFilter = (filterType, value) => {
    setSelectedFilters((prev) => {
      const current = prev[filterType] || [];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      const updated = { ...prev, [filterType]: newValue };

      // Re-search with new filters
      performSearch(searchQuery, updated);

      return updated;
    });
  };

  // Apply price filter
  const handleApplyPriceFilter = () => {
    setSelectedFilters((prev) => {
      const updated = { ...prev, priceRange: tempPriceRange };
      performSearch(searchQuery, updated);
      return updated;
    });
  };

  // Reset price filter
  const handleResetPriceFilter = () => {
    const defaultRange = { min: 0, max: 10000000 };
    setTempPriceRange(defaultRange);
    setSelectedFilters((prev) => {
      const updated = { ...prev, priceRange: defaultRange };
      performSearch(searchQuery, updated);
      return updated;
    });
  };

  // Re-search when sort changes
  useEffect(() => {
    if (searchQuery && products.length > 0) {
      performSearch(searchQuery);
    }
  }, [sortBy]);

  const displayedProducts = products.slice(0, itemsToShow);

  return (
    <div className={styles.productsPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        {/* Search Bar */}
        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="position-relative">
            <div className="input-group input-group-lg">
              <input
                type="text"
                className="form-control"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-search"></i> Search
              </button>
            </div>
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 border-bottom cursor-pointer hover-bg-light"
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
                  >
                    <i className="bi bi-search me-2"></i>
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className={styles.pageLayout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <i className="bi bi-funnel"></i>
              <span className={styles.filterMainTitle}>Search Filters</span>
            </div>

            {/* Categories Filter */}
            {filters.categories && filters.categories.length > 0 && (
              <div className={styles.filterSection}>
                <button
                  className={styles.filterHeaderBtn}
                  onClick={() => toggleSection('categories')}
                >
                  <span className={styles.filterTitle}>Categories</span>
                  <i className={`bi bi-chevron-${openSections.categories ? 'up' : 'down'}`}></i>
                </button>
                {openSections.categories && (
                  <div className={styles.filterContent}>
                    {filters.categories.map((category) => (
                      <label key={category._id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedFilters.categories.includes(category._id)}
                          onChange={() => toggleFilter('categories', category._id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.brandName}>{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brands Filter */}
            {filters.brands && filters.brands.length > 0 && (
              <div className={styles.filterSection}>
                <button className={styles.filterHeaderBtn} onClick={() => toggleSection('brands')}>
                  <span className={styles.filterTitle}>Brands</span>
                  <i className={`bi bi-chevron-${openSections.brands ? 'up' : 'down'}`}></i>
                </button>
                {openSections.brands && (
                  <div className={styles.filterContent}>
                    {filters.brands.map((brand) => (
                      <label key={brand._id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedFilters.brands.includes(brand._id)}
                          onChange={() => toggleFilter('brands', brand._id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.brandName}>{brand.name}</span>
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

            {/* Rating Filter */}
            <div className={styles.filterSection}>
              <button className={styles.filterHeaderBtn} onClick={() => toggleSection('rating')}>
                <span className={styles.filterTitle}>Rating</span>
                <i className={`bi bi-chevron-${openSections.rating ? 'up' : 'down'}`}></i>
              </button>
              {openSections.rating && (
                <div className={styles.filterContent}>
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className={styles.checkboxLabel}>
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedFilters.minRating === rating}
                        onChange={() => {
                          setSelectedFilters((prev) => {
                            const updated = { ...prev, minRating: rating };
                            performSearch(searchQuery, updated);
                            return updated;
                          });
                        }}
                        className={styles.checkbox}
                      />
                      <div className={styles.ratingRow}>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star-fill ${i < rating ? styles.starActive : styles.starInactive}`}
                          ></i>
                        ))}
                        <span className={styles.brandName}>and up</span>
                      </div>
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

              <h1 className={styles.pageTitle}>
                Search Results {searchQuery && `for "${searchQuery}"`}
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
                  Showing 1 - {displayedProducts.length} of {totalCount} items
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>To Show:</label>
                  <select
                    className={styles.filterSelect}
                    value={itemsToShow}
                    onChange={(e) => setItemsToShow(Number(e.target.value))}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={products.length}>All</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <select
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name">Name</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* No Results */}
                {products.length === 0 && searchQuery && (
                  <div className="text-center py-5">
                    <i className="bi bi-search" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                    <h3 className="mt-3">No results found for "{searchQuery}"</h3>
                    <p className="text-muted">Try different keywords or check your spelling</p>
                  </div>
                )}

                {/* Product Grid/List */}
                {products.length > 0 && (
                  <>
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
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
