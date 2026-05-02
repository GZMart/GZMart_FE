import { Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { PUBLIC_ROUTES, SELLER_ROUTES } from '@constants/routes';
import { logoutUser } from '@store/slices/authSlice';
import styles from '@assets/styles/common/Layouts/ERPLayout.module.css';
import NotificationBell from '@components/common/NotificationBell';
import LoadingSpinner from '@components/common/LoadingSpinner';
import LanguageSwitcher from '@components/common/LanguageSwitcher';

const buildNavGroups = (t) => [
  {
    labelKey: 'erpLayout.groupStore',
    items: [
      { to: SELLER_ROUTES.DASHBOARD, icon: 'bi-speedometer2', labelKey: 'erpLayout.nav.dashboard' },
      { to: SELLER_ROUTES.ORDERS, icon: 'bi-bag-check', labelKey: 'erpLayout.nav.orders' },
      {
        to: SELLER_ROUTES.DISPUTES,
        icon: 'bi-shield-exclamation',
        labelKey: 'erpLayout.nav.disputes',
      },
      { to: '/seller/products', icon: 'bi-grid-3x3-gap-fill', labelKey: 'erpLayout.nav.products' },
      { to: '/seller/inventory', icon: 'bi-boxes', labelKey: 'erpLayout.nav.inventory' },
      { to: '/seller/returns', icon: 'bi-arrow-return-left', labelKey: 'erpLayout.nav.returns' },
      {
        to: SELLER_ROUTES.CAMPAIGNS,
        icon: 'bi-lightning-charge-fill',
        labelKey: 'erpLayout.nav.campaigns',
      },
      { to: SELLER_ROUTES.LIVE, icon: 'bi-broadcast', labelKey: 'erpLayout.nav.live' },
      { to: '/seller/messages', icon: 'bi-chat-dots', labelKey: 'erpLayout.nav.messages' },
    ],
  },
  {
    labelKey: 'erpLayout.groupMarketing',
    items: [
      { to: '/seller/vouchers', icon: 'bi-ticket-perforated', labelKey: 'erpLayout.nav.vouchers' },
      { to: '/seller/promotions', icon: 'bi-megaphone', labelKey: 'erpLayout.nav.promotions' },
      { to: '/seller/notifications', icon: 'bi-bell', labelKey: 'erpLayout.nav.notifications' },
      { to: '/seller/banner-ads', icon: 'bi-layout-wtf', labelKey: 'erpLayout.nav.bannerAds' },
    ],
  },
  {
    labelKey: 'erpLayout.groupErp',
    items: [
      {
        to: '/seller/erp/dashboard',
        icon: 'bi-bar-chart-line',
        labelKey: 'erpLayout.nav.erpDashboard',
      },
      { to: '/seller/erp/suppliers', icon: 'bi-truck', labelKey: 'erpLayout.nav.suppliers' },
      {
        to: '/seller/erp/purchase-orders',
        icon: 'bi-file-earmark-text',
        labelKey: 'erpLayout.nav.purchaseOrders',
      },
    ],
  },
  {
    labelKey: 'erpLayout.groupSettings',
    items: [
      { to: SELLER_ROUTES.PROFILE, icon: 'bi-person', labelKey: 'erpLayout.nav.profile' },
      {
        to: SELLER_ROUTES.SHOP_DECORATION,
        icon: 'bi-palette',
        labelKey: 'erpLayout.nav.shopDecoration',
      },
      { to: SELLER_ROUTES.FINANCE, icon: 'bi-wallet2', labelKey: 'erpLayout.nav.finance' },
    ],
  },
];

const ERPLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth?.user);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  /** Trên mobile luôn hiển thị nhãn đầy đủ trong drawer; desktop giữ collapse */
  const effectiveCollapsed = isMobile ? false : collapsed;
  const NAV_GROUPS = buildNavGroups(t);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileNavOpen]);

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const isActive = (to) => {
    if (to === SELLER_ROUTES.DASHBOARD) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      {isMobile && mobileNavOpen && (
        <button
          type="button"
          className={styles.drawerBackdrop}
          aria-label={t('erpLayout.closeMenu')}
          onClick={closeMobileNav}
        />
      )}

      {/* ─── Sidebar (desktop: sticky | mobile: drawer tràn màn) ─── */}
      <aside
        id="seller-sidebar"
        className={`${styles.sidebar} ${!isMobile && collapsed ? styles.sidebarCollapsed : ''} ${
          isMobile ? styles.sidebarDrawer : ''
        } ${isMobile && mobileNavOpen ? styles.sidebarDrawerOpen : ''}`}
        aria-hidden={isMobile ? !mobileNavOpen : undefined}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img
              src="/logo.png"
              alt="GZMart logo"
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
          </div>
          {!effectiveCollapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>GZMart</span>
              <span className={styles.brandSub}>Seller Portal</span>
            </div>
          )}
          {isMobile && mobileNavOpen && (
            <button
              type="button"
              className={styles.drawerCloseBtn}
              onClick={closeMobileNav}
              title={t('erpLayout.closeMenu')}
              aria-label={t('erpLayout.closeMenu')}
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
          {!isMobile && !collapsed && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed((c) => !c)}
              title={t('erpLayout.collapseSidebar')}
            >
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.labelKey} className={styles.navGroup}>
              {!effectiveCollapsed && (
                <span className={styles.navGroupLabel}>{t(group.labelKey)}</span>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${styles.navItem} ${isActive(item.to) ? styles.navItemActive : ''}`}
                  title={!effectiveCollapsed ? undefined : t(item.labelKey)}
                  onClick={() => {
                    if (isMobile) {
                      closeMobileNav();
                    }
                  }}
                >
                  <i className={`bi ${item.icon} ${styles.navIcon}`} />
                  {!effectiveCollapsed && (
                    <span className={styles.navLabel}>{t(item.labelKey)}</span>
                  )}
                  {isActive(item.to) && !effectiveCollapsed && (
                    <span className={styles.navActiveDot} />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile pill at bottom */}
        {!effectiveCollapsed && (
          <div className={styles.sidebarFooter}>
            <div className={styles.userPill}>
              <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() || 'S'}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name || 'Seller'}</span>
                <span className={styles.userEmail}>{user?.email || ''}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ─── Main panel ───────────────────────────────────────────── */}
      <div className={styles.panel}>
        {/* Top bar */}
        <header className={`${styles.topbar} ${isMobile ? styles.topbarMobile : ''}`}>
          {/* Page context breadcrumb */}
          <div className={styles.topbarLeft}>
            {isMobile && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setMobileNavOpen((o) => !o)}
                title={mobileNavOpen ? t('erpLayout.closeMenu') : t('erpLayout.openMenu')}
                aria-label={mobileNavOpen ? t('erpLayout.closeMenu') : t('erpLayout.openMenu')}
                aria-expanded={mobileNavOpen}
                aria-controls="seller-sidebar"
              >
                <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
              </button>
            )}
            {!isMobile && collapsed && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setCollapsed(false)}
                title={t('erpLayout.expandSidebar')}
                style={{ marginRight: 8 }}
              >
                <i className="bi bi-layout-sidebar" />
              </button>
            )}
            <span className={styles.topbarRoute}>
              {location.pathname.split('/').filter(Boolean).join(' / ')}
            </span>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.topbarAction}>
              <LanguageSwitcher />
            </div>
            {/* Notification bell */}
            <div className={styles.topbarAction}>
              <NotificationBell
                triggerClassName="text-dark text-decoration-none"
                dropdownWidth="380px"
              />
            </div>

            {/* Profile dropdown */}
            <div className={styles.topbarAction}>
              <button className={styles.avatarBtn} onClick={() => setProfileOpen((o) => !o)}>
                <div className={styles.topAvatar}>{user?.name?.[0]?.toUpperCase() || 'S'}</div>
                <i className="bi bi-chevron-down" style={{ fontSize: '11px', marginLeft: '4px' }} />
              </button>
              {profileOpen && (
                <div className={`${styles.dropdown} ${styles.dropdownRight}`}>
                  <Link
                    to={PUBLIC_ROUTES.HOME}
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-house-door me-2" /> {t('erpLayout.nav.home')}
                  </Link>
                  <Link
                    to={SELLER_ROUTES.PROFILE}
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-person me-2" /> {t('erpLayout.nav.profile')}
                  </Link>
                  <Link
                    to={SELLER_ROUTES.FINANCE}
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-wallet2 me-2" /> {t('erpLayout.nav.finance')}
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2" /> {t('erpLayout.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content — Suspense ở đây thay vì ở App: lazy route chỉ thay nội dung, không mất shell */}
        <main className={styles.content}>
          <Suspense fallback={<LoadingSpinner variant="content" />}>
            {children || <Outlet />}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

ERPLayout.propTypes = {
  children: PropTypes.node,
};

export default ERPLayout;
