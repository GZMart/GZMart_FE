import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
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
} from 'lucide-react';

// Example user (change to null or '' to test the Sign In state)
const userName = 'Suprava Saha';

const Header = () => {
  const [activeCategory, setActiveCategory] = useState('New Arrivals');

  // Categories tailored for a Fashion/Clothing website
  const categories = [
    'New Arrivals',
    "Women's Fashion",
    "Men's Fashion",
    'Dresses & Gowns',
    'Co-ord Sets',
    'Coats & Blazers',
    'Bags & Accessories',
    'Footwear',
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
            <div>Direct Wholesale & Retail Guangzhou Fashion!</div>
            <div className="d-flex align-items-center justify-content-end gap-3">
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <MapPin size={14} /> <span>Deliver to: 423651</span>
              </div>
              <span className="text-secondary">|</span>
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <Truck size={14} /> <span>Track your order</span>
              </div>
              <span className="text-secondary">|</span>
              <div className="d-flex align-items-center gap-1 cursor-pointer">
                <Tag size={14} /> <span>All Offers</span>
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
            <div className="col-12 col-lg-5">
              <div className="d-flex align-items-center gap-3">
                <div className="d-none d-xl-block"></div>
                <div className="input-group flex-grow-1">
                  <span
                    className="input-group-text border-0 pe-0 rounded-start"
                    style={{ backgroundColor: '#F3F4F6' }}
                  >
                    <Search size={20} className="text-secondary" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 ps-3 text-dark py-2"
                    style={{
                      backgroundColor: '#F3F4F6',
                      boxShadow: 'none',
                      outline: 'none',
                    }}
                    placeholder="Search trending styles, dresses, coats..."
                  />
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="col-12 col-lg-4 d-none d-lg-flex justify-content-end align-items-center">
              <Link
                to="#"
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <Heart size={24} /> <span>Wishlist</span>
              </Link>
              <span className="mx-3 text-secondary opacity-25">|</span>

              {/* User Logic */}
              <Link
                to={userName ? '/profile' : BUYER_ROUTES.DASHBOARD}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <User size={24} />
                <span>{userName ? userName : 'Sign In / Sign Up'}</span>
              </Link>

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
                <span>Cart</span>
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
                  <span className="fw-medium">{item}</span>
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
