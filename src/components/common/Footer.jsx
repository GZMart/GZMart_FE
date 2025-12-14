import React from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { ArrowRight } from 'lucide-react';

const styles = {
  bgDark: { backgroundColor: '#191C1F' },
  bgButton: { backgroundColor: '#303639' },
  textYellow: { color: '#f4db4bff' },
};

const topCategories = [
  { label: 'Computer & Laptop', path: PUBLIC_ROUTES.SHOP },
  { label: 'SmartPhone', path: PUBLIC_ROUTES.SHOP },
  { label: 'Accessories', path: PUBLIC_ROUTES.SHOP },
  { label: 'Headphone', path: PUBLIC_ROUTES.SHOP },
  { label: 'Camera & Photo', path: PUBLIC_ROUTES.SHOP },
  { label: 'TV & Homes', path: PUBLIC_ROUTES.SHOP },
];

const quickLinks = [
  { label: 'Shop Product', path: PUBLIC_ROUTES.SHOP },
  { label: 'Shopping Cart', path: BUYER_ROUTES.CART },
  { label: 'Wishlist', path: PUBLIC_ROUTES.FAQ || '#' },
  { label: 'Refund Policy', path: PUBLIC_ROUTES.FAQ || '#' },
  { label: 'Shipping Policy', path: PUBLIC_ROUTES.FAQ || '#' },
  { label: 'Privacy Policy', path: PUBLIC_ROUTES.FAQ || '#' },
  { label: 'Terms of Service', path: PUBLIC_ROUTES.FAQ || '#' },
];

const popularTags = [
  'Game',
  'iPhone',
  'TV',
  'Asus Laptops',
  'Macbook',
  'SSD',
  'Graphics Card',
  'Power Bank',
  'Smart TV',
  'Speaker',
  'Tablet',
  'Microwave',
  'Samsung',
];

const Footer = () => {
  return (
    <footer style={styles.bgDark} className="text-secondary pt-5 pb-5 mt-auto">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3 col-md-6 col-12">
            <div className="mb-4">
              <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
                <img
                  src="/logo.png"
                  alt="GZMart Logo"
                  style={{ height: '40px', objectFit: 'contain' }}
                />
                <span className="text-white fs-3 fw-bold tracking-tight">GZMart</span>
              </Link>
            </div>
            <div className="d-flex flex-column gap-3">
              <div>
                <p className="mb-1 text-secondary fs-6">Customer Supports:</p>
                <p className="text-white fs-5 fw-bold mb-0">(+84) 905-363636</p>
              </div>
              <div className="text-secondary" style={{ maxWidth: '280px', lineHeight: '1.6' }}>
                Khu đô thị FPT City, P. Hòa Hải,
                <br />
                Q. Ngũ Hành Sơn, TP. Đà Nẵng
              </div>
              <div>
                <a
                  href="mailto:gzmart@gmail.com"
                  className="text-white fw-medium text-decoration-none"
                >
                  gzmart@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3">Top Categories</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              {topCategories.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className="text-decoration-none text-secondary hover-text-white transition-all"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={PUBLIC_ROUTES.SHOP}
                  style={styles.textYellow}
                  className="text-decoration-none d-flex align-items-center gap-1 mt-2"
                >
                  Browse All Product
                  <ArrowRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3">Quick Links</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className="text-decoration-none text-secondary hover-text-white transition-all"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 col-12">
            <h6 className="text-white fw-bold text-uppercase mb-3">Download App</h6>
            <div className="d-flex flex-column gap-3">
              <a
                href="#"
                className="d-flex align-items-center gap-3 px-3 py-2 rounded text-decoration-none text-white transition-all"
                style={styles.bgButton}
              >
                <img
                  src="/googleplay.png"
                  alt="Google Play"
                  style={{ width: '28px', objectFit: 'contain' }}
                />
                <div style={{ lineHeight: '1.2' }}>
                  <small
                    className="text-white-50"
                    style={{ fontSize: '10px', textTransform: 'uppercase' }}
                  >
                    Get it now
                  </small>
                  <div className="fw-bold">Google Play</div>
                </div>
              </a>

              <a
                href="#"
                className="d-flex align-items-center gap-3 px-3 py-2 rounded text-decoration-none text-white transition-all"
                style={styles.bgButton}
              >
                <img
                  src="/appstore.png"
                  alt="App Store"
                  style={{ width: '28px', objectFit: 'contain' }}
                />
                <div style={{ lineHeight: '1.2' }}>
                  <small
                    className="text-white-50"
                    style={{ fontSize: '10px', textTransform: 'uppercase' }}
                  >
                    Get it now
                  </small>
                  <div className="fw-bold">App Store</div>
                </div>
              </a>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-12">
            <h6 className="text-white fw-bold text-uppercase mb-3">Popular Tag</h6>
            <div className="d-flex flex-wrap gap-2">
              {popularTags.map((tag, i) => (
                <span
                  key={i}
                  className="btn btn-outline-secondary btn-sm text-nowrap"
                  style={{ fontSize: '0.75rem' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
