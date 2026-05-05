import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PUBLIC_ROUTES, BUYER_ROUTES, SELLER_ROUTES, ADMIN_ROUTES } from '@constants/routes';
import { USER_ROLES } from '@constants';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { selectCartTotalItems, fetchCart } from '@store/slices/cartSlice';
import { searchService } from '@services/api';
import {
  Tag,
  Search,
  User,
  ShoppingCart,
  ChevronDown,
  Globe,
  Heart,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Loader2,
  ChevronRight,
  Camera,
  Crown,
} from 'lucide-react';

import NotificationBell from './NotificationBell';
import ImageSearchModal from './ImageSearchModal';

// Import categoryService
import { categoryService } from '@services/api';

const Header = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartTotalItems = useSelector(selectCartTotalItems);
  // ---------------------------------------------

  const [categoriesData, setCategoriesData] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);

  useEffect(() => {
    const fetchMegaMenu = async () => {
      try {
        const response = await categoryService.getMegaMenu();
        if (response.success) {
          setCategoriesData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch mega menu data:", error);
      }
    };
    fetchMegaMenu();
  }, []);

  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState({
    products: [],
    categories: [],
    brands: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState(''); // 'wishlist' or 'cart'

  // --- REFS ---
  const dropdownRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const megaMenuRef = useRef(null);
  const navContainerRef = useRef(null);

  // Thêm trạng thái cho scroll navigation
  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [navStartX, setNavStartX] = useState(0);
  const [navScrollLeft, setNavScrollLeft] = useState(0);

  const handleNavMouseDown = (e) => {
    setIsDraggingNav(true);
    setNavStartX(e.pageX - navContainerRef.current.offsetLeft);
    setNavScrollLeft(navContainerRef.current.scrollLeft);
  };
  const handleNavMouseLeave = () => {
    setIsDraggingNav(false);
  };
  const handleNavMouseUp = () => {
    setIsDraggingNav(false);
  };
  const handleNavMouseMove = (e) => {
    if (!isDraggingNav) {
return;
}
    e.preventDefault();
    const x = e.pageX - navContainerRef.current.offsetLeft;
    const walk = (x - navStartX) * 2;
    navContainerRef.current.scrollLeft = navScrollLeft - walk;
  };

  // Thêm Refs cho phiên bản Sticky Header
  const stickyDropdownRef = useRef(null);
  const stickySearchDropdownRef = useRef(null);

  // --- STATE CUỘN TRANG ---
  const [isScrolled, setIsScrolled] = useState(false);

  const hasAutocompleteResults =
    (searchSuggestions.products && searchSuggestions.products.length > 0) ||
    (searchSuggestions.categories && searchSuggestions.categories.length > 0) ||
    (searchSuggestions.brands && searchSuggestions.brands.length > 0);

  // Lắng nghe sự kiện Scroll
  useEffect(() => {
    const handleScroll = () => {
      // Hiện sticky header khi cuộn qua 150px
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveRecentSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.toLowerCase();
    const next = [
      trimmed,
      ...recentSearches.filter((item) => item.toLowerCase() !== normalized),
    ].slice(0, 6);
    setRecentSearches(next);
    localStorage.setItem('gzm_recent_searches', JSON.stringify(next));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('gzm_recent_searches');
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(query)}`);
    setShowSearchDropdown(false);
  };

  // Close dropdowns when clicking outside (Đã cập nhật để hỗ trợ cả 2 Header)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        stickyDropdownRef.current &&
        !stickyDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        stickySearchDropdownRef.current &&
        !stickySearchDropdownRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setHoveredCategory(null);
        setActiveSubcategory(null);
        setActiveBrand(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const raw = localStorage.getItem('gzm_recent_searches');
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((q) => typeof q === 'string' && q.trim().length > 0));
      }
    } catch (error) {
      localStorage.removeItem('gzm_recent_searches');
    }
  }, []);

  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) {
      dispatch(fetchCart());
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate(PUBLIC_ROUTES.HOME);
      setShowProfileDropdown(false);
    } catch (error) { }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchSuggestions({ products: [], categories: [], brands: [] });
      setSearchLoading(false);
      setShowSearchDropdown(recentSearches.length > 0 && value.trim().length === 0);
      return;
    }

    setSearchLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchService.getAutocomplete(value.trim());
        const suggestions = response.data?.data || response.data || {};
        const normalizedSuggestions = {
          products: Array.isArray(suggestions.products) ? suggestions.products : [],
          categories: Array.isArray(suggestions.categories) ? suggestions.categories : [],
          brands: Array.isArray(suggestions.brands) ? suggestions.brands : [],
        };

        setSearchSuggestions(normalizedSuggestions);

        const hasResults =
          normalizedSuggestions.products.length > 0 ||
          normalizedSuggestions.categories.length > 0 ||
          normalizedSuggestions.brands.length > 0;

        setShowSearchDropdown(hasResults);
      } catch (error) {
        setSearchSuggestions({ products: [], categories: [], brands: [] });
        setShowSearchDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      saveRecentSearch(trimmedQuery);
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      navigate(PUBLIC_ROUTES.PRODUCTS);
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', suggestion._id)}`);
    } else if (suggestion.type === 'category' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.CATEGORY_PRODUCTS.replace(':categoryId', suggestion._id)}`);
    } else if (suggestion.name) {
      setSearchQuery(suggestion.name);
      saveRecentSearch(suggestion.name);
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(suggestion.name)}`);
    }
    setShowSearchDropdown(false);
  };

  const handleSearchIconClick = () => handleSearchSubmit();

  const handleCategoryClick = (category) => {
    if (activeCategory?.id === category.id) {
      setActiveCategory(null);
      setHoveredCategory(null);
    } else {
      setActiveCategory(category);
      setHoveredCategory(category);
    }
    setActiveSubcategory(null);
    setActiveBrand(null);
  };

  const handleWishlistClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalType('wishlist');
      setShowLoginModal(true);
    }
  };

  const handleCartClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalType('cart');
      setShowLoginModal(true);
    }
  };

  const handleLoginModalConfirm = () => {
    setShowLoginModal(false);
    navigate(PUBLIC_ROUTES.LOGIN);
  };

  const handleLoginModalCancel = () => {
    setShowLoginModal(false);
    setLoginModalType('');
  };

  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  const currentCategoryData = hoveredCategory || activeCategory;

  // Render dùng chung cho Dropdown Kết quả tìm kiếm
  const renderSearchDropdown = () => (
    <div
      className="position-absolute bg-white border rounded shadow-lg w-100"
      style={{
        top: '100%',
        left: 0,
        marginTop: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      {/* Recent Searches */}
      {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
        <div className="py-2">
          <div className="px-3 py-1 d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-bold">Recent searches</span>
            <button
              type="button"
              className="btn btn-link p-0 small text-decoration-none"
              onClick={clearRecentSearches}
              style={{ color: '#B13C36' }}
            >
              Clear
            </button>
          </div>
          {recentSearches.map((recentQuery) => (
            <div
              key={recentQuery}
              className="px-3 py-2 d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handleRecentSearchClick(recentQuery)}
            >
              <Search size={14} className="text-secondary" />
              <span className="text-dark small">{recentQuery}</span>
            </div>
          ))}
        </div>
      )}

      {/* Products Section */}
      {searchSuggestions.products && searchSuggestions.products.length > 0 && (
        <div className="py-2">
          <div className="px-3 py-1 text-muted small fw-bold">
            {t('header.search_results.products')}
          </div>
          {searchSuggestions.products.slice(0, 5).map((product) => (
            <div
              key={product._id}
              className="px-3 py-2 d-flex align-items-center gap-3"
              style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handleSuggestionClick({ ...product, type: 'product' })}
            >
              {product.images && product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}
              <div className="flex-grow-1">
                <div className="text-dark small">{product.name}</div>
                {product.price && (
                  <div className="text-primary small fw-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      product.price
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Section */}
      {searchSuggestions.categories && searchSuggestions.categories.length > 0 && (
        <div className="py-2 border-top">
          <div className="px-3 py-1 text-muted small fw-bold">
            {t('header.search_results.categories')}
          </div>
          {searchSuggestions.categories.slice(0, 3).map((category) => (
            <div
              key={category._id}
              className="px-3 py-2 d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handleSuggestionClick({ ...category, type: 'category' })}
            >
              <Tag size={16} className="text-secondary" />
              <span className="text-dark small">{category.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Brands Section */}
      {searchSuggestions.brands && searchSuggestions.brands.length > 0 && (
        <div className="py-2 border-top">
          <div className="px-3 py-1 text-muted small fw-bold">
            {t('header.search_results.brands')}
          </div>
          {searchSuggestions.brands.slice(0, 3).map((brand) => (
            <div
              key={brand._id}
              className="px-3 py-2 d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handleSuggestionClick({ ...brand, type: 'brand' })}
            >
              {brand.logo && (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                />
              )}
              <span className="text-dark small">{brand.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render dùng chung cho Profile Dropdown
  const renderProfileDropdown = (closeDropdownFn) => (
    <div
      className="position-absolute bg-white border rounded shadow-lg"
      style={{
        top: '100%',
        right: 0,
        marginTop: '8px',
        minWidth: '200px',
        zIndex: 1000,
        padding: '8px 0',
      }}
    >
      {user?.role !== USER_ROLES.BUYER && (
        <>
          <Link
            to={user?.role === USER_ROLES.ADMIN ? ADMIN_ROUTES.DASHBOARD : SELLER_ROUTES.DASHBOARD}
            className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
            style={{ transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            onClick={() => closeDropdownFn(false)}
          >
            <LayoutDashboard size={18} />
            <span>{t('header.dashboard')}</span>
          </Link>
          <div className="border-top my-1"></div>
        </>
      )}

      <Link
        to={
          user?.role === USER_ROLES.ADMIN
            ? ADMIN_ROUTES.PROFILE
            : user?.role === USER_ROLES.SELLER
              ? SELLER_ROUTES.PROFILE
              : BUYER_ROUTES.PROFILE
        }
        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
        style={{ transition: 'background-color 0.2s' }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        onClick={() => closeDropdownFn(false)}
      >
        <UserCircle size={18} />
        <span>{t('header.profile')}</span>
      </Link>

      {user?.role === USER_ROLES.BUYER && (
        <Link
          to={BUYER_ROUTES.VIP_SUBSCRIPTION}
          className="d-flex align-items-center gap-2 text-decoration-none px-3 py-2"
          style={{ transition: 'background-color 0.2s', color: '#b45309' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fffbeb')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => closeDropdownFn(false)}
        >
          <Crown size={18} />
          <span className="fw-semibold">VIP Membership</span>
        </Link>
      )}

      <div className="border-top my-1"></div>

      <Link
        to="/change-password"
        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
        style={{ transition: 'background-color 0.2s' }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        onClick={() => closeDropdownFn(false)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>{t('header.change_password')}</span>
      </Link>

      <div className="border-top my-1"></div>

      <button
        onClick={handleLogout}
        className="d-flex align-items-center gap-2 text-decoration-none text-dark border-0 bg-transparent w-100 px-3 py-2"
        style={{ transition: 'background-color 0.2s', textAlign: 'left', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
      >
        <LogOut size={18} />
        <span>{t('header.logout')}</span>
      </button>
    </div>
  );

  return (
    <header>
      {/* =========================================
          VERSION 1: STICKY HEADER (Khi Scroll xuống)
          ========================================= */}
      <div
        className="bg-white shadow-sm border-bottom position-fixed w-100 d-none d-lg-block"
        style={{
          top: 0,
          left: 0,
          zIndex: 1040,
          transform: isScrolled ? 'translateY(0)' : 'translateY(-100%)',

          // --- BẢO VỆ 2 LỚP: Ẩn tàng hình và Khóa click khi chưa scroll ---
          opacity: isScrolled ? 1 : 0,
          pointerEvents: isScrolled ? 'auto' : 'none',

          transition: 'all 0.3s ease-in-out', // Sửa lại thành all cho mượt
          height: '70px',
        }}
      >
        <div className="container h-100 d-flex align-items-center justify-content-between gap-4">
          {/* Trái: Logo + Search Bar */}
          <div className="d-flex align-items-center gap-4 flex-grow-1" style={{ maxWidth: '60%' }}>
            <Link
              to={PUBLIC_ROUTES.HOME}
              className="text-decoration-none text-dark d-flex align-items-center gap-2"
            >
              <img src="/logo.png" alt="GZMart" style={{ height: '40px', objectFit: 'contain' }} />
              <h2 className="h4 fw-bolder mb-0 tracking-tight d-none d-xl-block">GZMart</h2>
            </Link>

            <div className="position-relative flex-grow-1" ref={stickySearchDropdownRef}>
              <form onSubmit={handleSearchSubmit} className="input-group">
                <span
                  className="input-group-text border-0 pe-0 rounded-start"
                  style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }}
                  onClick={handleSearchIconClick}
                >
                  {searchLoading ? (
                    <Loader2
                      size={18}
                      className="text-secondary"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  ) : (
                    <Search size={18} className="text-secondary" />
                  )}
                </span>
                <input
                  type="text"
                  className="form-control border-0 ps-3 text-dark py-2"
                  style={{
                    backgroundColor: '#F3F4F6',
                    boxShadow: 'none',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                  placeholder={t('header.search_placeholder')}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) {
                      setShowSearchDropdown(hasAutocompleteResults);
                    } else if (recentSearches.length > 0) {
                      setShowSearchDropdown(true);
                    }
                  }}
                />
              </form>
              {showSearchDropdown && renderSearchDropdown()}
            </div>
          </div>

          {/* Phải: Actions */}
          <div className="d-flex align-items-center gap-4">
            <div style={{ cursor: 'pointer' }}>
              <NotificationBell />
            </div>

            <Link to={BUYER_ROUTES.WISHLIST} onClick={handleWishlistClick} className="text-dark">
              <Heart size={22} />
            </Link>

            <Link
              to={BUYER_ROUTES.CART}
              onClick={handleCartClick}
              className="text-dark position-relative"
            >
              <ShoppingCart size={22} />
              {cartTotalItems > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ fontSize: '0.55rem', backgroundColor: '#b13c36', color: '#fff' }}
                >
                  {cartTotalItems}
                </span>
              )}
            </Link>

            <span className="text-secondary opacity-25">|</span>

            {isAuthenticated && user ? (
              <div className="position-relative" ref={stickyDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="d-flex align-items-center gap-2 text-dark border-0 bg-transparent p-0"
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  <span className="fw-medium small">{userDisplayName}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                {showProfileDropdown && renderProfileDropdown(setShowProfileDropdown)}
              </div>
            ) : (
              <Link
                to={PUBLIC_ROUTES.LOGIN}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <User size={18} />
                <span className="fw-medium small">{t('header.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          VERSION 2: NORMAL HEADER (UI Cũ)
          ========================================= */}
      {/* Top Bar */}
      <div
        style={{ backgroundColor: '#191C1F' }}
        className="text-light py-2 small d-none d-md-block"
      >
        <div className="container">
          <div className="d-flex justify-content-between align-items-center text-nowrap">
            <div>
              {(!isAuthenticated || user?.role === USER_ROLES.BUYER) && (
                <>
                  Wanna become a seller?
                  <Link
                    to={BUYER_ROUTES.SELLER_APPLICATION}
                    className="text-danger text-decoration-none fw-bold ms-1"
                    style={{ transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = 'var(--color-danger)')}
                    onMouseLeave={(e) => (e.target.style.color = '')}
                  >
                    Sent application here
                  </Link>
                </>
              )}
            </div>
            <div className="d-flex align-items-center justify-content-end gap-3">
              <NotificationBell />
              <span className="text-secondary">|</span>
              <div className="position-relative" ref={languageDropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="d-flex align-items-center gap-1 border-0 bg-transparent p-0 text-light"
                  style={{ cursor: 'pointer' }}
                >
                  <Globe size={14} />
                  <span>{i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: showLanguageDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {showLanguageDropdown && (
                  <div
                    className="position-absolute bg-white border rounded shadow-lg"
                    style={{
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      minWidth: '180px',
                      zIndex: 1000,
                      padding: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <button
                      className="border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{
                        display: 'block',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        color: i18n.language === 'vi' ? '#EE4D2D' : '#212529',
                        fontWeight: i18n.language === 'vi' ? '600' : '400',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('vi');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      className="border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{
                        display: 'block',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        color: i18n.language === 'en' ? '#EE4D2D' : '#212529',
                        fontWeight: i18n.language === 'en' ? '600' : '400',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('en');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              <span className="text-secondary">|</span>

              {isAuthenticated && user ? (
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="d-flex align-items-center gap-2 text-light border-0 bg-transparent p-0"
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    />
                    <span>{userDisplayName}</span>
                    <ChevronDown
                      size={13}
                      style={{
                        transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {showProfileDropdown && renderProfileDropdown(setShowProfileDropdown)}
                </div>
              ) : (
                <Link
                  to={PUBLIC_ROUTES.LOGIN}
                  className="d-flex align-items-center gap-2 text-decoration-none text-light"
                >
                  <User size={16} />
                  <span>{t('header.login')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-3 py-lg-4 shadow-sm border-bottom">
        <div className="container">
          <div className="row align-items-center gy-3">
            {/* Logo & Menu */}
            <div className="col-6 col-lg-3 d-flex align-items-center gap-3">
              <Link
                to={PUBLIC_ROUTES.HOME}
                className="text-decoration-none text-dark d-flex align-items-center gap-2"
              >
                <img
                  src="/logo.png"
                  alt="GZMart"
                  style={{ height: '90px', objectFit: 'contain' }}
                />
                <span className="text-secondary mx-1">|</span>
                <h2 className="h3 fw-bolder mb-0 tracking-tight">GZMart</h2>
              </Link>
              <div className="d-none d-xl-block">
                <Link to={PUBLIC_ROUTES.DEALS}>
                  <img
                    src="/flashsale.png"
                    alt="Flash Sale"
                    style={{ height: '45px', objectFit: 'contain', cursor: 'pointer' }}
                  />
                </Link>
              </div>
            </div>

            {/* Actions (Mobile) */}
            <div className="col-6 d-lg-none d-flex justify-content-end align-items-center gap-3">
              <Link
                to={BUYER_ROUTES.CART}
                className="text-dark position-relative"
                onClick={handleCartClick}
              >
                <ShoppingCart size={24} />
                {cartTotalItems > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{ fontSize: '0.6rem', backgroundColor: '#b13c36', color: '#fff' }}
                  >
                    {cartTotalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Search Bar */}
            <div className="col-12 col-lg-5">
              <div className="d-flex align-items-center w-100">
                <div className="position-relative flex-grow-1 w-100" ref={searchDropdownRef}>
                  <form onSubmit={handleSearchSubmit} className="input-group">
                    <span
                      className="input-group-text border-0 pe-2 rounded-start"
                      style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }}
                      title={t('header.search_by_image') || 'Search by image'}
                      onClick={() => setShowImageSearchModal(true)}
                    >
                      <Camera size={20} className="text-secondary" />
                    </span>
                    <span
                      className="input-group-text border-0 pe-0 rounded-0"
                      style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }}
                      onClick={handleSearchIconClick}
                    >
                      {searchLoading ? (
                        <Loader2
                          size={20}
                          className="text-secondary"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                      ) : (
                        <Search size={20} className="text-secondary" />
                      )}
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 ps-3 text-dark py-2"
                      style={{
                        backgroundColor: '#F3F4F6',
                        boxShadow: 'none',
                        outline: 'none',
                      }}
                      placeholder={t('header.search_placeholder')}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (searchQuery.trim().length >= 2) {
                          setShowSearchDropdown(hasAutocompleteResults);
                        } else if (recentSearches.length > 0) {
                          setShowSearchDropdown(true);
                        }
                      }}
                    />
                  </form>

                  {/* Search Suggestions Dropdown */}
                  {showSearchDropdown && renderSearchDropdown()}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="col-12 col-lg-4 d-none d-lg-flex justify-content-end align-items-center">
              <Link
                to={BUYER_ROUTES.WISHLIST}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
                onClick={handleWishlistClick}
              >
                <Heart size={24} /> <span>{t('header.wishlist')}</span>
              </Link>
              <span className="mx-3 text-secondary opacity-25">|</span>
              <Link
                to={BUYER_ROUTES.CART}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark position-relative"
                onClick={handleCartClick}
              >
                <div id="header-cart-icon" className="position-relative">
                  <ShoppingCart size={24} />
                  {cartTotalItems > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                      style={{ fontSize: '0.6rem', backgroundColor: '#b13c36', color: '#fff' }}
                    >
                      {cartTotalItems}
                    </span>
                  )}
                </div>
                <span>{t('header.cart')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar with Mega Menu */}
      <div className="bg-white border-bottom shadow-sm position-relative" ref={megaMenuRef}>
        <div className="container">
          <div
            ref={navContainerRef}
            className="d-flex justify-content-start justify-content-lg-center py-2 gap-2 flex-nowrap"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none', 
              overflowX: 'auto',
              cursor: isDraggingNav ? 'grabbing' : 'grab' 
            }}
            onMouseDown={handleNavMouseDown}
            onMouseLeave={handleNavMouseLeave}
            onMouseUp={handleNavMouseUp}
            onMouseMove={handleNavMouseMove}
          >
            {categoriesData.slice(0, 6).map((category) => {
              const isActive =
                activeCategory?.id === category.id || hoveredCategory?.id === category.id;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill cursor-pointer border flex-shrink-0 ${isActive ? 'bg-dark text-white border-dark' : 'text-dark border-0'
                    }`}
                  style={{
                    fontSize: '14px',
                    backgroundColor: isActive ? '#212529' : '#F3F9FB',
                    userSelect: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span className="fw-medium">{category.name}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        {currentCategoryData &&
          (() => {
            const uniqueBrands = activeSubcategory?.products
              ? [...new Set(activeSubcategory.products.map((p) => p.brand).filter(Boolean))]
              : [];

            const displayProducts = activeSubcategory?.products
              ? activeBrand
                ? activeSubcategory.products.filter((p) => p.brand === activeBrand)
                : activeSubcategory.products
              : currentCategoryData.featuredProducts;
            const firstFeatured = currentCategoryData.featuredProducts?.[0];
            const discountData = currentCategoryData.discountProduct || (firstFeatured ? {
              discount: firstFeatured.originalPrice ? Math.round(((firstFeatured.originalPrice - firstFeatured.price) / firstFeatured.originalPrice) * 100) : 15,
              description: firstFeatured.name,
              price: firstFeatured.price || 0,
              image: firstFeatured.image,
              name: firstFeatured.name
            } : null);

            return (
              <div
                className="position-absolute bg-white shadow-lg border-top mega-menu-scroll"
                style={{
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  maxWidth: '1200px',
                  width: '95%',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  borderRadius: '0 0 12px 12px',
                  animation: 'slideDown 0.3s ease-out',
                }}
              >
                <div
                  className="d-flex gap-3 py-3 px-3"
                  style={{
                    minHeight: '400px',
                  }}
                >
                  {/* Column 1 - Subcategories */}
                  <div
                    style={{
                      width: '200px',
                      flexShrink: 0,
                      borderRight: '1px solid #e9ecef',
                      paddingRight: '12px',
                    }}
                  >
                    <h6
                      className="fw-bold mb-2 text-uppercase"
                      style={{ fontSize: '0.75rem', color: '#6c757d' }}
                    >
                      Categories
                    </h6>
                    <div className="d-flex flex-column gap-1">
                      {currentCategoryData.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          onClick={() => {
                            setActiveSubcategory(subcategory);
                            setActiveBrand(null);
                          }}
                          className={`d-flex align-items-center justify-content-between px-2 py-2 rounded ${activeSubcategory?.id === subcategory.id
                              ? 'bg-dark text-white'
                              : 'text-dark'
                            }`}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.85rem',
                            backgroundColor:
                              activeSubcategory?.id === subcategory.id ? '#212529' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (activeSubcategory?.id !== subcategory.id) {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeSubcategory?.id !== subcategory.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <span className="text-truncate">{subcategory.name}</span>
                          <ChevronRight size={14} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2 - Brands */}
                  {activeSubcategory && uniqueBrands.length > 0 && (
                    <div
                      style={{
                        width: '180px',
                        flexShrink: 0,
                        borderRight: '1px solid #e9ecef',
                        paddingRight: '12px',
                      }}
                    >
                      <h6
                        className="fw-bold mb-2 text-uppercase"
                        style={{ fontSize: '0.75rem', color: '#6c757d' }}
                      >
                        Brands
                      </h6>
                      <div className="d-flex flex-column gap-1">
                        {uniqueBrands.map((brand, index) => (
                          <div
                            key={index}
                            onClick={() => setActiveBrand(brand)}
                            className={`px-2 py-2 rounded ${activeBrand === brand ? 'bg-primary text-white' : 'text-dark'
                              }`}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '0.85rem',
                              backgroundColor: activeBrand === brand ? '#0d6efd' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (activeBrand !== brand) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeBrand !== brand) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <span className="text-truncate d-block">{brand}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Column 3 - Products */}
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <h6
                      className="fw-bold mb-2 text-uppercase"
                      style={{ fontSize: '0.75rem', color: '#6c757d' }}
                    >
                      {activeBrand
                        ? `${activeBrand} Products`
                        : activeSubcategory
                          ? activeSubcategory.name
                          : 'Featured Products'}
                    </h6>
                    <div
                      className="d-flex flex-column gap-2 mega-menu-scroll"
                      style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}
                    >
                      {displayProducts.slice(0, 4).map((product) => (
                        <div
                          key={product.id}
                          className="d-flex align-items-center gap-2 p-2 rounded"
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid transparent',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                          onClick={() => {
                            setHoveredCategory(null);
                            setActiveSubcategory(null);
                            setActiveBrand(null);
                          }}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: '65px',
                              height: '65px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              flexShrink: 0,
                              backgroundColor: '#f8f9fa',
                            }}
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/65x65/f8f9fa/6c757d?text=No+Image';
                            }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                              {product.brand}
                            </div>
                            <div
                              className="fw-medium text-dark mb-1 text-truncate"
                              style={{ fontSize: '0.9rem' }}
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {product.originalPrice != null && (
                                <span
                                  className="text-muted text-decoration-line-through"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {product.originalPrice?.toLocaleString('vi-VN')}₫
                                </span>
                              )}
                              <span
                                className="text-primary fw-bold"
                                style={{ fontSize: '0.95rem' }}
                              >
                                {product.price?.toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4 - Discount Product */}
                  {discountData && (
                    <div
                      style={{
                        width: '280px',
                        flexShrink: 0,
                        marginLeft: 'auto',
                      }}
                    >
                      <div
                        className="rounded p-3 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)',
                        minHeight: '380px',
                        maxHeight: '420px',
                      }}
                    >
                      {/* Decorative circle */}
                      <div
                        className="position-absolute rounded-circle"
                        style={{
                          width: '180px',
                          height: '180px',
                          background: 'rgba(255, 138, 0, 0.1)',
                          top: '-60px',
                          right: '-60px',
                          zIndex: 0,
                        }}
                      />

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                          className="badge bg-danger text-white px-2 py-1 mb-2"
                          style={{
                            fontSize: '0.7rem',
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        >
                          HOT DEAL
                        </div>
                        <h3
                          className="fw-bold mb-2"
                          style={{
                            fontSize: '2.5rem',
                            color: '#FF8A00',
                            lineHeight: '1',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {discountData.discount}% OFF
                        </h3>
                        <p
                          className="text-dark mb-2"
                          style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
                        >
                          {discountData.description}
                        </p>
                        <div className="mb-3">
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            Starting from
                          </span>
                          <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>
                            {discountData.price?.toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                      </div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <img
                          src={discountData.image}
                          alt={discountData.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                          className="mb-2"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/280x150/FFF4E6/FF8A00?text=Special+Offer';
                          }}
                        />
                        <button
                          className="btn btn-warning w-100 fw-bold text-white py-2 discount-btn-hover"
                          style={{
                            backgroundColor: '#FF8A00',
                            border: 'none',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(255, 138, 0, 0.3)',
                            transition: 'all 0.3s ease',
                          }}
                          onClick={() => {
                            setHoveredCategory(null);
                            setActiveSubcategory(null);
                            setActiveBrand(null);
                          }}
                        >
                          SHOP NOW →
                        </button>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 9998 }}
            onClick={handleLoginModalCancel}
          />
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow-lg"
            style={{
              zIndex: 9999,
              maxWidth: '450px',
              width: '90%',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <div className="p-4">
              <div className="text-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#FFF4E6',
                  }}
                >
                  {loginModalType === 'wishlist' ? (
                    <Heart size={30} className="text-warning" />
                  ) : (
                    <ShoppingCart size={30} className="text-warning" />
                  )}
                </div>
              </div>
              <h5 className="text-center fw-bold mb-2">
                {t('header.login_required_title') || 'Login Required'}
              </h5>
              <p className="text-center text-muted mb-4">
                {loginModalType === 'wishlist'
                  ? t('header.login_required_wishlist_msg') ||
                  'Please login to access your wishlist and save your favorite items.'
                  : t('header.login_required_cart_msg') ||
                  'Please login to access your cart and continue shopping.'}
              </p>
              <div className="d-flex gap-3">
                <button
                  onClick={handleLoginModalCancel}
                  className="btn btn-outline-secondary flex-grow-1 py-2"
                  style={{ borderRadius: '8px', fontWeight: '500' }}
                >
                  {t('header.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleLoginModalConfirm}
                  className="btn btn-warning flex-grow-1 py-2 text-white"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                    backgroundColor: '#FF8A00',
                    border: 'none',
                  }}
                >
                  {t('header.go_to_login') || 'Go to Login'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
      />
    </header>
  );
};

export default Header;
