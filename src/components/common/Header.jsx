import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { selectUser, selectIsAuthenticated, logoutUser } from '@store/slices/authSlice';
import { selectCartTotalItems, fetchCart } from '@store/slices/cartSlice';
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
  ChevronRight,
} from 'lucide-react';

import enFlag from '../../assets/svg/language/en.svg';
import viFlag from '../../assets/svg/language/vi.svg';

// Fake data for Guangzhou fashion categories with subcategories and products
const FAKE_CATEGORIES_DATA = [
  {
    id: 1,
    name: "Women's Fashion",
    subcategories: [
      { id: 101, name: 'Dresses & Gowns' },
      { id: 102, name: 'Tops & Blouses' },
      { id: 103, name: 'Skirts' },
      { id: 104, name: 'Pants & Trousers' },
      { id: 105, name: 'Co-ord Sets' },
      { id: 106, name: 'Outerwear & Coats' },
      { id: 107, name: 'Activewear' },
      { id: 108, name: 'Lingerie & Sleepwear' },
      { id: 109, name: 'Traditional Wear' },
    ],
    featuredProducts: [
      {
        id: 1001,
        name: 'Elegant Floral Summer Dress',
        brand: 'Guangzhou Fashion House',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
        price: 350000,
        originalPrice: 500000,
      },
      {
        id: 1002,
        name: 'Premium Silk Blouse',
        brand: 'GZ Luxury',
        image: 'https://images.unsplash.com/photo-1564257577721-fa5be2c300b9?w=200',
        price: 280000,
        originalPrice: 400000,
      },
      {
        id: 1003,
        name: 'Korean Style Co-ord Set',
        brand: 'Trendy GZ',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200',
        price: 420000,
        originalPrice: 600000,
      },
    ],
    discountProduct: {
      id: 2001,
      name: 'Spring Collection 2026',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      discount: 40,
      price: 299000,
      description: 'Bộ sưu tập mới nhất từ Quảng Châu. Thiết kế trendy, chất liệu cao cấp!',
    },
  },
  {
    id: 2,
    name: "Men's Fashion",
    subcategories: [
      { id: 201, name: 'T-Shirts & Polos' },
      { id: 202, name: 'Shirts & Dress Shirts' },
      { id: 203, name: 'Pants & Jeans' },
      { id: 204, name: 'Shorts' },
      { id: 205, name: 'Suits & Blazers' },
      { id: 206, name: 'Jackets & Coats' },
      { id: 207, name: 'Activewear & Sportswear' },
      { id: 208, name: 'Underwear & Loungewear' },
    ],
    featuredProducts: [
      {
        id: 1004,
        name: 'Premium Cotton Polo Shirt',
        brand: 'GZ Men',
        image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=200',
        price: 180000,
        originalPrice: 280000,
      },
      {
        id: 1005,
        name: 'Slim Fit Business Shirt',
        brand: 'Guangzhou Elite',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200',
        price: 220000,
        originalPrice: 350000,
      },
      {
        id: 1006,
        name: 'Designer Leather Jacket',
        brand: 'GZ Premium',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
        price: 890000,
        originalPrice: 1200000,
      },
    ],
    discountProduct: {
      id: 2002,
      name: 'Summer Essentials',
      image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400',
      discount: 35,
      price: 199000,
      description: 'Thời trang nam cao cấp từ Quảng Châu. Phong cách hiện đại, lịch lãm!',
    },
  },
  {
    id: 3,
    name: 'Bags & Accessories',
    subcategories: [
      { id: 301, name: 'Handbags' },
      { id: 302, name: 'Backpacks' },
      { id: 303, name: 'Crossbody Bags' },
      { id: 304, name: 'Clutches & Evening Bags' },
      { id: 305, name: 'Wallets & Purses' },
      { id: 306, name: 'Belts' },
      { id: 307, name: 'Sunglasses' },
      { id: 308, name: 'Jewelry & Watches' },
    ],
    featuredProducts: [
      {
        id: 1007,
        name: 'Luxury Designer Handbag',
        brand: 'GZ Luxury Bags',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200',
        price: 650000,
        originalPrice: 950000,
      },
      {
        id: 1008,
        name: 'Premium Leather Wallet',
        brand: 'Guangzhou Leather',
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200',
        price: 150000,
        originalPrice: 250000,
      },
      {
        id: 1009,
        name: 'Designer Sunglasses',
        brand: 'GZ Eyewear',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200',
        price: 120000,
        originalPrice: 200000,
      },
    ],
    discountProduct: {
      id: 2003,
      name: 'Accessories Bundle',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
      discount: 45,
      price: 399000,
      description: 'Bộ sưu tập phụ kiện thời trang cao cấp. Hoàn thiện phong cách của bạn!',
    },
  },
  {
    id: 4,
    name: 'Footwear',
    subcategories: [
      { id: 401, name: 'Sneakers' },
      { id: 402, name: 'High Heels' },
      { id: 403, name: 'Flats & Loafers' },
      { id: 404, name: 'Boots & Booties' },
      { id: 405, name: 'Sandals & Slippers' },
      { id: 406, name: 'Sport Shoes' },
      { id: 407, name: 'Formal Shoes' },
    ],
    featuredProducts: [
      {
        id: 1010,
        name: 'Premium Leather Sneakers',
        brand: 'GZ Footwear',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200',
        price: 380000,
        originalPrice: 550000,
      },
      {
        id: 1011,
        name: 'Elegant High Heels',
        brand: 'Guangzhou Heels',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200',
        price: 320000,
        originalPrice: 480000,
      },
      {
        id: 1012,
        name: 'Casual Sport Shoes',
        brand: 'GZ Sport',
        image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200',
        price: 280000,
        originalPrice: 420000,
      },
    ],
    discountProduct: {
      id: 2004,
      name: 'Footwear Collection',
      image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400',
      discount: 30,
      price: 249000,
      description: 'Giày dép thời trang Quảng Châu. Chất lượng cao, giá cực tốt!',
    },
  },
  {
    id: 5,
    name: 'Outerwear & Coats',
    subcategories: [
      { id: 501, name: 'Blazers' },
      { id: 502, name: 'Jackets' },
      { id: 503, name: 'Coats' },
      { id: 504, name: 'Cardigans' },
      { id: 505, name: 'Hoodies & Sweatshirts' },
      { id: 506, name: 'Vests' },
      { id: 507, name: 'Raincoats & Windbreakers' },
    ],
    featuredProducts: [
      {
        id: 1013,
        name: 'Wool Blend Overcoat',
        brand: 'GZ Winter',
        image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=200',
        price: 780000,
        originalPrice: 1100000,
      },
      {
        id: 1014,
        name: 'Designer Blazer',
        brand: 'Guangzhou Elite',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
        price: 580000,
        originalPrice: 850000,
      },
      {
        id: 1015,
        name: 'Trendy Bomber Jacket',
        brand: 'GZ Street',
        image: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=200',
        price: 450000,
        originalPrice: 650000,
      },
    ],
    discountProduct: {
      id: 2005,
      name: 'Winter Collection',
      image: 'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=400',
      discount: 38,
      price: 499000,
      description: 'Áo khoác cao cấp mùa đông. Ấm áp và thời trang từ Quảng Châu!',
    },
  },
];

const Header = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartTotalItems = useSelector(selectCartTotalItems);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(null);
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
  const megaMenuRef = useRef(null);

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
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setHoveredCategory(null);
        setActiveSubcategory(null);
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

  // Fetch cart data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

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
        console.log('🔍 Autocomplete API Response:', response);
        console.log('🔍 Response.data:', response.data);
        console.log('🔍 Response.data.data:', response.data?.data);

        // Handle response - backend returns data directly or nested
        const suggestions = response.data?.data || response.data || {};
        console.log('🔍 Parsed suggestions:', suggestions);

        setSearchSuggestions(suggestions);

        // Show dropdown if we have any suggestions
        const hasResults =
          (suggestions.products && suggestions.products.length > 0) ||
          (suggestions.categories && suggestions.categories.length > 0) ||
          (suggestions.brands && suggestions.brands.length > 0);

        console.log('🔍 Has results:', hasResults);
        setShowSearchDropdown(hasResults);
      } catch (error) {
        console.error('❌ Error fetching search suggestions:', error);
        setSearchSuggestions({});
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

  // Handle category hover
  const handleCategoryHover = (category) => {
    setHoveredCategory(category);
    setActiveSubcategory(null);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (activeCategory?.id === category.id) {
      setActiveCategory(null);
      setHoveredCategory(null);
    } else {
      setActiveCategory(category);
      setHoveredCategory(category);
    }
    setActiveSubcategory(null);
  };

  // Get user display name and avatar
  const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const userAvatar =
    user?.avatar ||
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;

  // Get current category data
  const currentCategoryData = hoveredCategory || activeCategory;
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
                {cartTotalItems > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {cartTotalItems}
                  </span>
                )}
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
                  {showSearchDropdown && (
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
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.products')}
                          </div>
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
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.categories')}
                          </div>
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
                          <div className="px-3 py-1 text-muted small fw-bold">
                            {t('header.search_results.brands')}
                          </div>
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
                    style={{
                      width: '24px',
                      height: '16px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                    }}
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
                    <div className="px-3 py-2 text-muted small fw-bold border-bottom mb-1">
                      {t('header.language')}
                    </div>
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
                      <img
                        src={viFlag}
                        alt="Tiếng Việt"
                        style={{ width: '20px', height: '14px' }}
                      />
                      <span>Tiếng Việt</span>
                      {i18n.language === 'vi' && <span className="ms-auto text-success">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              <span className="mx-3 text-secondary opacity-25">|</span>

              <Link
                to={BUYER_ROUTES.FAVOURITES}
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
                  {cartTotalItems > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                      style={{ fontSize: '0.6rem' }}
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
            className="d-flex justify-content-start justify-content-lg-center overflow-auto py-2 gap-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FAKE_CATEGORIES_DATA.map((category) => {
              const isActive =
                activeCategory?.id === category.id || hoveredCategory?.id === category.id;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill cursor-pointer border flex-shrink-0 ${
                    isActive ? 'bg-dark text-white border-dark' : 'text-dark border-0'
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
        {currentCategoryData && (
          <div
            className="position-absolute bg-white w-100 shadow-lg border-top"
            style={{
              top: '100%',
              left: 0,
              zIndex: 1000,
            }}
          >
            <div className="container py-4">
              <div className="row">
                {/* Subcategories - Left Column */}
                <div className="col-md-3">
                  <div className="d-flex flex-column">
                    <h6 className="fw-bold mb-3 text-uppercase small text-muted">
                      Browse By Category
                    </h6>
                    {currentCategoryData.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        onClick={() => setActiveSubcategory(subcategory)}
                        className={`d-flex align-items-center justify-content-between px-3 py-2 rounded mb-1 ${
                          activeSubcategory?.id === subcategory.id
                            ? 'bg-dark text-white'
                            : 'text-dark'
                        }`}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor:
                            activeSubcategory?.id === subcategory.id ? '#212529' : 'transparent',
                        }}
                      >
                        <span>{subcategory.name}</span>
                        <ChevronRight size={16} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Products - Middle Column */}
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3 text-uppercase small text-muted">
                    Featured Products
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {currentCategoryData.featuredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="d-flex align-items-center gap-3 p-2 rounded"
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                        onClick={() => {
                          setHoveredCategory(null);
                          setActiveSubcategory(null);
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{product.brand}</div>
                          <div className="fw-medium text-dark mb-1">{product.name}</div>
                          <div className="d-flex align-items-center gap-2">
                            {product.originalPrice && (
                              <span
                                className="text-muted small text-decoration-line-through"
                                style={{ fontSize: '0.85rem' }}
                              >
                                Rs {product.originalPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-primary fw-bold">
                              Rs {product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount Product - Right Column */}
                <div className="col-md-3">
                  <div
                    className="rounded p-4 h-100 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: '#FFF4E6',
                      minHeight: '300px',
                    }}
                  >
                    <div>
                      <h3 className="fw-bold mb-3" style={{ fontSize: '2rem' }}>
                        {currentCategoryData.discountProduct.discount}% Discount
                      </h3>
                      <p className="text-dark mb-3" style={{ fontSize: '0.9rem' }}>
                        {currentCategoryData.discountProduct.description}
                      </p>
                      <div className="mb-3">
                        <span className="text-muted small">Starting price: </span>
                        <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                          ${currentCategoryData.discountProduct.price} USD
                        </span>
                      </div>
                    </div>
                    <div>
                      <img
                        src={currentCategoryData.discountProduct.image}
                        alt={currentCategoryData.discountProduct.name}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                        className="mb-3"
                      />
                      <button
                        className="btn btn-warning w-100 fw-bold text-white"
                        style={{
                          backgroundColor: '#FF8A00',
                          border: 'none',
                        }}
                        onClick={() => {
                          setHoveredCategory(null);
                          setActiveSubcategory(null);
                        }}
                      >
                        SHOP NOW →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;