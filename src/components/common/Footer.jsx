import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';
import { ArrowRight } from 'lucide-react';

const styles = {
  bgDark: { backgroundColor: '#191C1F' },
  bgButton: { backgroundColor: '#303639' },
  textYellow: { color: '#f4db4bff' },
};

const getTopCategories = (t) => [
  { label: t('footer.computer_laptop'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.smartphone'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.accessories'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.headphone'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.camera_photo'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.tv_homes'), path: PUBLIC_ROUTES.SHOP },
];

const getQuickLinks = (t) => [
  { label: t('footer.shop_product'), path: PUBLIC_ROUTES.SHOP },
  { label: t('footer.shopping_cart'), path: BUYER_ROUTES.CART },
  { label: t('footer.wishlist'), path: BUYER_ROUTES.WISHLIST },
  { label: t('footer.refund_policy'), path: PUBLIC_ROUTES.REFUND_POLICY },
  { label: t('footer.shipping_policy'), path: PUBLIC_ROUTES.SHIPPING_POLICY },
  { label: t('footer.privacy_policy'), path: PUBLIC_ROUTES.PRIVACY_POLICY },
  { label: t('footer.terms_of_service'), path: PUBLIC_ROUTES.TERMS_OF_SERVICE },
  { label: t('footer.faq'), path: PUBLIC_ROUTES.FAQ },
  { label: t('footer.how_we_can_help'), path: PUBLIC_ROUTES.HOW_WE_CAN_HELP },
];

const getPopularTags = (t) => [
  t('footer.tags.game'),
  t('footer.tags.iphone'),
  t('footer.tags.tv'),
  t('footer.tags.asus_laptops'),
  t('footer.tags.macbook'),
  t('footer.tags.ssd'),
  t('footer.tags.graphics_card'),
  t('footer.tags.power_bank'),
  t('footer.tags.smart_tv'),
  t('footer.tags.speaker'),
  t('footer.tags.tablet'),
  t('footer.tags.microwave'),
  t('footer.tags.samsung'),
];

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const topCategories = getTopCategories(t);
  const quickLinks = getQuickLinks(t);
  const popularTags = getPopularTags(t);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

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
                <p className="mb-1 text-secondary fs-6">{t('footer.customer_supports')}</p>
                <p className="text-white fs-5 fw-bold mb-0">{t('footer.phone')}</p>
              </div>
              <div className="text-secondary" style={{ maxWidth: '280px', lineHeight: '1.6' }}>
                {t('footer.address')}
              </div>
              <div>
                <a
                  href={`mailto:${t('footer.email')}`}
                  className="text-white fw-medium text-decoration-none"
                >
                  {t('footer.email')}
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3">{t('footer.top_categories')}</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              {topCategories.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={scrollToTop}
                    className="text-decoration-none transition-all"
                    style={{
                      color: isActivePath(item.path) ? '#ffffff' : '#6c757d',
                      fontWeight: isActivePath(item.path) ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={PUBLIC_ROUTES.PRODUCTS}
                  onClick={scrollToTop}
                  style={styles.textYellow}
                  className="text-decoration-none d-flex align-items-center gap-1 mt-2"
                >
                  {t('footer.browse_all_product')}
                  <ArrowRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3">{t('footer.quick_links')}</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={scrollToTop}
                    className="text-decoration-none transition-all"
                    style={{
                      color: isActivePath(item.path) ? '#ffffff' : '#6c757d',
                      fontWeight: isActivePath(item.path) ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 col-12">
            <h6 className="text-white fw-bold text-uppercase mb-3">{t('footer.download_app')}</h6>
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
                    {t('footer.get_it_now')}
                  </small>
                  <div className="fw-bold">{t('footer.google_play')}</div>
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
                    {t('footer.get_it_now')}
                  </small>
                  <div className="fw-bold">{t('footer.app_store')}</div>
                </div>
              </a>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-12">
            <h6 className="text-white fw-bold text-uppercase mb-3">{t('footer.popular_tag')}</h6>
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
