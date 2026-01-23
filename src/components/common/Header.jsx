import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { searchService } from '@services/api';
import {
  MapPin,
  Truck,
  Tag,
  Search,
  User,
  ShoppingCart,
  ChevronDown,
  Heart,
  AlignLeft,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Loader2,
  Globe,
} from 'lucide-react';

import enFlag from '../../assets/svg/language/en.svg';
import viFlag from '../../assets/svg/language/vi.svg';


const Header = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('new_arrivals');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate(PUBLIC_ROUTES.HOME);
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't fetch suggestions for empty or very short queries
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    // Set loading state
    setSearchLoading(true);

    // Debounce API call (wait 300ms after user stops typing)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchService.getAutocomplete(value.trim());
        if (response.data?.data) {
          setSearchSuggestions(response.data.data);
          setShowSearchDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSearchSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Handle search submit (Enter key or Search button click)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    const trimmedQuery = searchQuery.trim();
    // Navigate to products page (with or without search query)
    if (trimmedQuery) {
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      // No query - show all products
      navigate(PUBLIC_ROUTES.PRODUCTS);
    }
    setShowSearchDropdown(false);
    setSearchQuery(''); // Clear search input after submit
    setSearchLoading(false); // Reset loading state
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.PRODUCT_DETAILS.replace(':id', suggestion._id)}`);
    } else if (suggestion.type === 'category' && suggestion._id) {
      navigate(`${PUBLIC_ROUTES.CATEGORY_PRODUCTS.replace(':categoryId', suggestion._id)}`);
    } else if (suggestion.name) {
      setSearchQuery(suggestion.name);
      navigate(`${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(suggestion.name)}`);
    }
    setShowSearchDropdown(false);
  };

  // Handle search icon click
  const handleSearchIconClick = () => {
    handleSearchSubmit();
  };

  // Get user display name and avatar
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  // Categories tailored for a Fashion/Clothing website
  const categories = [
    'new_arrivals',
    'womens_fashion',
    'mens_fashion',
    'dresses_gowns',
    'coord_sets',
    'coats_blazers',
    'bags_accessories',
    'footwear',
  ];

  return (
    <header>
      {/* Top Bar */}
      <div
        style={{ backgroundColor: '#191C1F' }}
        className="text-light py-2 small d-none d-md-block"
      >
        <div className="container">
          <div className="d-flex justify-content-between align-items-center text-nowrap">
            {/* Theme specific welcome message */}
            <div>{t('header.welcome_msg')}</div>
            <div className="d-flex align-items-center justify-content-end gap-3">
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <MapPin size={14} /> <span>{t('header.deliver_to')}: 423651</span>
              </div>
              <span className="text-secondary">|</span>
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <Truck size={14} /> <span>{t('header.track_order')}</span>
              </div>
              <span className="text-secondary">|</span>
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <Tag size={14} /> <span>{t('header.all_offers')}</span>
              </div>
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
              <button className="btn btn-light bg-light rounded px-3 py-2 d-flex align-items-center justify-content-center">
                <AlignLeft size={24} className="text-dark" />
              </button>
              <Link to={PUBLIC_ROUTES.HOME} className="text-decoration-none text-dark">
                <h2 className="h3 fw-bolder mb-0 tracking-tight">GZMart</h2>
              </Link>
              <div className="d-none d-xl-block">
                <img
                  src="/flashsale.png"
                  alt="Flash Sale"
                  style={{ height: '45px', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Actions (Mobile) */}
            <div className="col-6 d-lg-none d-flex justify-content-end align-items-center gap-3">
              <Link to={BUYER_ROUTES.CART} className="text-dark position-relative">
                <ShoppingCart size={24} />
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                  style={{ fontSize: '0.6rem' }}
                >
                  2
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="col-12 col-lg-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-none d-xl-block"></div>
                <div className="position-relative flex-grow-1" ref={searchDropdownRef}>
                  <form onSubmit={handleSearchSubmit} className="input-group">
                    <span
                      className="input-group-text border-0 pe-0 rounded-start"
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
                      onFocus={() =>
                        searchQuery.trim().length >= 2 &&
                        searchSuggestions.length > 0 &&
                        setShowSearchDropdown(true)
                      }
                    />
                  </form>

                  {/* Search Suggestions Dropdown */}
                  {showSearchDropdown && searchSuggestions.length > 0 && (
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
                      {/* Products Section */}
                      {searchSuggestions.products && searchSuggestions.products.length > 0 && (
                        <div className="py-2">
                          <div className="px-3 py-1 text-muted small fw-bold">{t('header.search_results.products')}</div>
                          {searchSuggestions.products.slice(0, 5).map((product) => (
                            <div
                              key={product._id}
                              className="px-3 py-2 d-flex align-items-center gap-3"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() => handleSuggestionClick({ ...product, type: 'product' })}
                            >
                              {product.images && product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                  }}
                                />
                              )}
                              <div className="flex-grow-1">
                                <div className="text-dark small">{product.name}</div>
                                {product.price && (
                                  <div className="text-primary small fw-bold">
                                    {new Intl.NumberFormat('vi-VN', {
                                      style: 'currency',
                                      currency: 'VND',
                                    }).format(product.price)}
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
                          <div className="px-3 py-1 text-muted small fw-bold">{t('header.search_results.categories')}</div>
                          {searchSuggestions.categories.slice(0, 3).map((category) => (
                            <div
                              key={category._id}
                              className="px-3 py-2 d-flex align-items-center gap-2"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() =>
                                handleSuggestionClick({ ...category, type: 'category' })
                              }
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
                          <div className="px-3 py-1 text-muted small fw-bold">{t('header.search_results.brands')}</div>
                          {searchSuggestions.brands.slice(0, 3).map((brand) => (
                            <div
                              key={brand._id}
                              className="px-3 py-2 d-flex align-items-center gap-2"
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f8f9fa')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                              onClick={() => handleSuggestionClick({ ...brand, type: 'brand' })}
                            >
                              {brand.logo && (
                                <img
                                  src={brand.logo}
                                  alt={brand.name}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    objectFit: 'contain',
                                  }}
                                />
                              )}
                              <span className="text-dark small">{brand.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="col-12 col-lg-5 d-none d-lg-flex justify-content-end align-items-center">
              {/* Language Switcher */}
              <div className="position-relative" ref={languageDropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="d-flex align-items-center gap-2 border-0 bg-transparent p-0 text-dark"
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={i18n.language === 'vi' ? viFlag : enFlag}
                    alt={i18n.language}
                    style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px' }}
                  />
                  <ChevronDown
                    size={14}
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
                      marginTop: '12px',
                      minWidth: '160px',
                      zIndex: 1000,
                      padding: '8px 0',
                    }}
                  >
                     <div className="px-3 py-2 text-muted small fw-bold border-bottom mb-1">{t('header.language')}</div>
                    <button
                      className="d-flex align-items-center gap-2 border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{ transition: 'background-color 0.2s', textAlign: 'left' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('en');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      <img src={enFlag} alt="English" style={{ width: '20px', height: '14px' }} />
                      <span>English</span>
                      {i18n.language === 'en' && <span className="ms-auto text-success">✓</span>}
                    </button>
                    <button
                      className="d-flex align-items-center gap-2 border-0 bg-transparent w-100 px-3 py-2 text-dark"
                      style={{ transition: 'background-color 0.2s', textAlign: 'left' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        i18n.changeLanguage('vi');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      <img src={viFlag} alt="Tiếng Việt" style={{ width: '20px', height: '14px' }} />
                      <span>Tiếng Việt</span>
                      {i18n.language === 'vi' && <span className="ms-auto text-success">✓</span>}
                    </button>
                  </div>
                )}
              </div>
              
              <span className="mx-3 text-secondary opacity-25">|</span>

              <Link
                to="#"
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <Heart size={24} /> <span>{t('header.wishlist')}</span>
              </Link>
              <span className="mx-3 text-secondary opacity-25">|</span>

              {/* User Logic */}
              {isAuthenticated && user ? (
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="d-flex align-items-center gap-2 text-decoration-none text-dark border-0 bg-transparent p-0"
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e0e0e0',
                      }}
                    />
                    <span>{userDisplayName}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
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
                      <Link
                        to={BUYER_ROUTES.DASHBOARD}
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <LayoutDashboard size={18} />
                        <span>{t('header.dashboard')}</span>
                      </Link>
                      <div className="border-top my-1"></div>
                      <Link
                        to={BUYER_ROUTES.PROFILE}
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <UserCircle size={18} />
                        <span>{t('header.profile')}</span>
                      </Link>
                      <div className="border-top my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="d-flex align-items-center gap-2 text-decoration-none text-dark border-0 bg-transparent w-100 px-3 py-2"
                        style={{
                          transition: 'background-color 0.2s',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                      >
                        <LogOut size={18} />
                        <span>{t('header.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={PUBLIC_ROUTES.LOGIN}
                  className="d-flex align-items-center gap-2 text-decoration-none text-dark"
                >
                  <User size={24} />
                  <span>{t('header.login')}</span>
                </Link>
              )}

              <span className="mx-3 text-secondary opacity-25">|</span>
              <Link
                to={BUYER_ROUTES.CART}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark position-relative"
              >
                <div className="position-relative">
                  <ShoppingCart size={24} />
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                    style={{ fontSize: '0.6rem' }}
                  >
                    2
                  </span>
                </div>
                <span>{t('header.cart')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-bottom shadow-sm">
        <div className="container">
          <div
            className="d-flex justify-content-start justify-content-lg-center overflow-auto py-2 gap-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((item, idx) => {
              const isActive = activeCategory === item;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveCategory(item)}
                  className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill cursor-pointer border flex-shrink-0 ${
                    isActive ? 'bg-dark text-white border-dark' : 'text-dark border-0'
                  }`}
                  style={{
                    fontSize: '14px',
                    backgroundColor: isActive ? '#212529' : '#F3F9FB',
                    userSelect: 'none',
                  }}
                >
                  <span className="fw-medium">{t(`categories.${item}`)}</span>
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
      </div>
    </header>
  );
};

export default Header;
