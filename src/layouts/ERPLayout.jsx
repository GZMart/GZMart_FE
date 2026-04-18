import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { SELLER_ROUTES } from '@constants/routes';
import { logoutUser } from '@store/slices/authSlice';
import styles from '@assets/styles/common/Layouts/ERPLayout.module.css';
import NotificationBell from '@components/common/NotificationBell';
import LanguageSwitcher from '@components/common/LanguageSwitcher';

const NAV_GROUPS = [
  {
    label: 'STORE',
    items: [
      { to: SELLER_ROUTES.DASHBOARD, icon: 'bi-speedometer2', label: 'Dashboard' },
      { to: SELLER_ROUTES.ORDERS, icon: 'bi-bag-check', label: 'Orders' },
      { to: SELLER_ROUTES.DISPUTES, icon: 'bi-shield-exclamation', label: 'Disputes' },
      { to: '/seller/products', icon: 'bi-grid-3x3-gap-fill', label: 'Products' },
      { to: '/seller/inventory', icon: 'bi-boxes', label: 'Inventory' },
      { to: '/seller/returns', icon: 'bi-arrow-return-left', label: 'Returns' },
      { to: SELLER_ROUTES.CAMPAIGNS, icon: 'bi-lightning-charge-fill', label: 'Campaigns' },
      { to: SELLER_ROUTES.LIVE, icon: 'bi-broadcast', label: 'Live' },
      { to: '/seller/messages', icon: 'bi-chat-dots', label: 'Messages' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { to: '/seller/vouchers', icon: 'bi-ticket-perforated', label: 'Vouchers' },
      { to: '/seller/promotions', icon: 'bi-megaphone', label: 'Promotions' },
      { to: '/seller/notifications', icon: 'bi-bell', label: 'Notifications' },
      { to: '/seller/banner-ads', icon: 'bi-layout-wtf', label: 'Banner Ads' },
    ],
  },
  {
    label: 'ERP',
    items: [
      { to: '/seller/erp/dashboard', icon: 'bi-bar-chart-line', label: 'ERP Dashboard' },
      { to: '/seller/erp/suppliers', icon: 'bi-truck', label: 'Suppliers' },
      { to: '/seller/erp/purchase-orders', icon: 'bi-file-earmark-text', label: 'Purchase Orders' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { to: SELLER_ROUTES.PROFILE, icon: 'bi-person', label: 'Profile' },
      { to: SELLER_ROUTES.SHOP_DECORATION, icon: 'bi-palette', label: 'Shop Decoration' },
      { to: SELLER_ROUTES.FINANCE, icon: 'bi-wallet2', label: 'Finance & Topup' },
    ],
  },
];

const ERPLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  /** Trên mobile luôn hiển thị nhãn đầy đủ trong drawer; desktop giữ collapse */
  const effectiveCollapsed = isMobile ? false : collapsed;

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
          aria-label="Đóng menu"
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
              title="Đóng menu"
              aria-label="Đóng menu"
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
          {!isMobile && !collapsed && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed((c) => !c)}
              title="Collapse sidebar"
            >
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              {!effectiveCollapsed && <span className={styles.navGroupLabel}>{group.label}</span>}
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${styles.navItem} ${isActive(item.to) ? styles.navItemActive : ''}`}
                  title={!effectiveCollapsed ? undefined : item.label}
                  onClick={() => {
                    if (isMobile) {
                      closeMobileNav();
                    }
                  }}
                >
                  <i className={`bi ${item.icon} ${styles.navIcon}`} />
                  {!effectiveCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {isActive(item.to) && !effectiveCollapsed && <span className={styles.navActiveDot} />}
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
                title={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
                aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
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
                title="Expand sidebar"
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
                    to={SELLER_ROUTES.PROFILE}
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-person me-2" /> Profile
                  </Link>
                  <Link
                    to={SELLER_ROUTES.FINANCE}
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-wallet2 me-2" /> Finance & Topup
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>{children || <Outlet />}</main>
      </div>
    </div>
  );
};

ERPLayout.propTypes = {
  children: PropTypes.node,
};

export default ERPLayout;
