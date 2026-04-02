import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { SELLER_ROUTES } from '@constants/routes';
import { logoutUser } from '@store/slices/authSlice';
import styles from '@assets/styles/common/Layouts/ERPLayout.module.css';
import NotificationBell from '@components/common/NotificationBell';

const NAV_GROUPS = [
  {
    label: 'STORE',
    items: [
      { to: SELLER_ROUTES.DASHBOARD, icon: 'bi-speedometer2', label: 'Dashboard' },
      { to: SELLER_ROUTES.ORDERS, icon: 'bi-bag-check', label: 'Orders' },
      { to: '/seller/products', icon: 'bi-grid-3x3-gap-fill', label: 'Products' },
      { to: '/seller/inventory', icon: 'bi-boxes', label: 'Inventory' },
      { to: '/seller/returns', icon: 'bi-arrow-return-left', label: 'Returns' },
      { to: '/seller/flash-sales', icon: 'bi-lightning-charge-fill', label: 'Flash Sales' },
      { to: SELLER_ROUTES.LIVE_STREAM, icon: 'bi-broadcast', label: 'Live Stream' },
      { to: '/seller/messages', icon: 'bi-chat-dots', label: 'Messages' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { to: '/seller/vouchers', icon: 'bi-ticket-perforated', label: 'Vouchers' },
      { to: '/seller/promotions', icon: 'bi-megaphone', label: 'Promotions' },
      { to: '/seller/notifications', icon: 'bi-bell', label: 'Notifications' },
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
      { to: '/seller/billing', icon: 'bi-credit-card', label: 'Billing' },
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
      {/* ─── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img
              src="/logo.png"
              alt="GZMart logo"
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>GZMart</span>
              <span className={styles.brandSub}>Seller Portal</span>
            </div>
          )}
          {!collapsed && (
            <button
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
              {!collapsed && <span className={styles.navGroupLabel}>{group.label}</span>}
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${styles.navItem} ${isActive(item.to) ? styles.navItemActive : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <i className={`bi ${item.icon} ${styles.navIcon}`} />
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {isActive(item.to) && !collapsed && <span className={styles.navActiveDot} />}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile pill at bottom */}
        {!collapsed && (
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
        <header className={styles.topbar}>
          {/* Page context breadcrumb */}
          <div className={styles.topbarLeft}>
            {collapsed && (
              <button
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
                    to="/seller/billing"
                    className={styles.dropdownItem}
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-credit-card me-2" /> Billing
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
