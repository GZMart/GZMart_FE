import { useState, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { ADMIN_ROUTES } from '@constants/routes';
import { logoutUser } from '@store/slices/authSlice';
import styles from '@assets/styles/admin/AdminLayout.module.css';
import NotificationBell from '@components/common/NotificationBell';

/** Only list routes declared in routeConfig (avoid 404 links). */
const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [{ to: ADMIN_ROUTES.DASHBOARD, icon: 'bi bi-speedometer2', label: 'Dashboard' }],
  },
  {
    section: 'Users & marketplace',
    items: [
      { to: ADMIN_ROUTES.USERS, icon: 'bi bi-people', label: 'Users' },
      { to: ADMIN_ROUTES.SELLER_APPLICATIONS, icon: 'bi bi-shop', label: 'Seller Applications' },
      { to: ADMIN_ROUTES.DISPUTES, icon: 'bi bi-shield-exclamation', label: 'Disputes' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: ADMIN_ROUTES.PLATFORM_ORDERS, icon: 'bi bi-receipt', label: 'Platform orders' },
      {
        to: ADMIN_ROUTES.REWARD_WITHDRAWALS,
        icon: 'bi bi-cash-coin',
        label: 'Reward withdrawals',
      },
      { to: ADMIN_ROUTES.RMA_QUEUE, icon: 'bi bi-arrow-return-left', label: 'RMA / Returns' },
      { to: ADMIN_ROUTES.COIN_TOOLS, icon: 'bi bi-coin', label: 'GZCoin (admin)' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { to: ADMIN_ROUTES.CATEGORIES, icon: 'bi bi-folder', label: 'Categories' },
      { to: ADMIN_ROUTES.ATTRIBUTES, icon: 'bi bi-tags', label: 'Attributes' },
    ],
  },
  {
    section: 'Marketing & ads',
    items: [
      {
        to: ADMIN_ROUTES.SYSTEM_VOUCHERS,
        icon: 'bi bi-gift',
        label: 'System Vouchers',
        matchPrefix: true,
      },
      {
        to: ADMIN_ROUTES.FLASH_CAMPAIGNS,
        icon: 'bi bi-lightning-charge',
        label: 'Flash sale (platform-wide)',
        matchPrefix: true,
      },
      {
        to: ADMIN_ROUTES.VOUCHER_CAMPAIGNS,
        icon: 'bi bi-calendar-heart',
        label: 'Voucher Campaigns',
        matchPrefix: true,
      },
      {
        to: ADMIN_ROUTES.BANNER_ADS,
        icon: 'bi bi-layout-wtf',
        label: 'Banner Ads',
        matchPrefix: true,
      },
    ],
  },
  {
    section: 'System',
    items: [{ to: ADMIN_ROUTES.SYSTEM_CONFIG, icon: 'bi bi-gear', label: 'Configuration' }],
  },
];

const PAGE_TITLES = {
  [ADMIN_ROUTES.DASHBOARD]: 'Dashboard',
  [ADMIN_ROUTES.USERS]: 'User Management',
  [ADMIN_ROUTES.SELLER_APPLICATIONS]: 'Seller Applications',
  [ADMIN_ROUTES.CATEGORIES]: 'Categories',
  [ADMIN_ROUTES.ATTRIBUTES]: 'Attributes',
  [ADMIN_ROUTES.SYSTEM_VOUCHERS]: 'System Vouchers',
  [ADMIN_ROUTES.FLASH_CAMPAIGNS]: 'Flash sale — Admin',
  [ADMIN_ROUTES.VOUCHER_CAMPAIGNS]: 'Voucher Campaigns',
  [ADMIN_ROUTES.SYSTEM_CONFIG]: 'Configuration',
  [ADMIN_ROUTES.BANNER_ADS]: 'Banner Ads Management',
  [ADMIN_ROUTES.DISPUTES]: 'Disputes',
  [ADMIN_ROUTES.PLATFORM_ORDERS]: 'Platform orders',
  [ADMIN_ROUTES.REWARD_WITHDRAWALS]: 'Reward withdrawals',
  [ADMIN_ROUTES.RMA_QUEUE]: 'RMA / Returns',
  [ADMIN_ROUTES.COIN_TOOLS]: 'GZCoin (admin)',
};

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = useCallback(
    (item) => {
      if (item.matchPath) {
        return location.pathname.includes(item.matchPath);
      }
      if (item.matchPrefix) {
        return location.pathname.startsWith(item.to);
      }
      return location.pathname === item.to;
    },
    [location.pathname]
  );

  const pageTitle =
    Object.entries(PAGE_TITLES).find(
      ([route]) => location.pathname === route || location.pathname.startsWith(`${route}/`)
    )?.[1] ?? 'Admin';

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const sidebarClass = `${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`;
  const mainClass = `${styles.main} ${collapsed ? styles.mainCollapsed : ''}`;
  const topbarClass = `${styles.topbar} ${collapsed ? styles.topbarCollapsed : ''}`;

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={sidebarClass}>
        {/* Brand */}
        <Link className={styles.brand} to={ADMIN_ROUTES.DASHBOARD} title="GZMart Admin">
          <span className={styles.brandIcon}>
            <i className="bi bi-shield-lock" />
          </span>
          <span className={styles.brandText}>
            <div className={styles.brandName}>GZMart</div>
            <div className={styles.brandSub}>Admin Portal</div>
          </span>
        </Link>

        {/* Nav */}
        <nav className={styles.navArea}>
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <div className={styles.sectionLabel}>{group.section}</div>
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>
                      <i className={item.icon} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — user card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard} title={collapsed ? 'Administrator' : undefined}>
            <div className={styles.userAvatar}>A</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Administrator</div>
              <div className={styles.userRole}>Super Admin</div>
            </div>
            <button className={styles.logoutBtn} title="Logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header className={topbarClass}>
        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-reverse'}`} />
        </button>

        <span className={styles.topbarTitle}>{pageTitle}</span>

        <div className={styles.topbarRight}>
          {/* Notifications */}
          <div
            title="Notifications"
            style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}
          >
            <NotificationBell triggerClassName="text-dark text-decoration-none" />
          </div>

          <div className={styles.topbarDivider} />

          {/* User menu */}
          <button className={styles.topbarUserBtn}>
            <div className={styles.topbarAvatar}>A</div>
            <span className={styles.topbarUserName}>Admin</span>
            <i className={`bi bi-chevron-down ${styles.topbarChevron}`} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={mainClass}>{children || <Outlet />}</main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
