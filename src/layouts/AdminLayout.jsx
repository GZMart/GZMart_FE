import { useState, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ADMIN_ROUTES } from '@constants/routes';
import styles from '@assets/styles/admin/AdminLayout.module.css';

const NAV_ITEMS = [
  {
    section: 'OVERVIEW',
    items: [
      { to: ADMIN_ROUTES.DASHBOARD, icon: 'bi bi-speedometer2', label: 'Dashboard' },
    ],
  },
  {
    section: 'USER MANAGEMENT',
    items: [
      { to: ADMIN_ROUTES.USERS, icon: 'bi bi-people', label: 'Users' },
    ],
  },
  {
    section: 'CATALOG',
    items: [
      { to: ADMIN_ROUTES.CATEGORIES, icon: 'bi bi-folder', label: 'Categories' },
      { to: ADMIN_ROUTES.ATTRIBUTES, icon: 'bi bi-tags', label: 'Attributes' },
    ],
  },
  {
    section: 'MARKETING',
    items: [
      { to: ADMIN_ROUTES.SYSTEM_VOUCHERS, icon: 'bi bi-gift', label: 'System Vouchers', matchPrefix: true },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { to: ADMIN_ROUTES.SYSTEM_CONFIG, icon: 'bi bi-gear', label: 'Configuration' },
      { to: ADMIN_ROUTES.SITE_SETTINGS, icon: 'bi bi-globe', label: 'Site Settings' },
      { to: ADMIN_ROUTES.PAYMENT_SETTINGS, icon: 'bi bi-credit-card', label: 'Payment Settings' },
    ],
  },
  {
    section: 'CONTENT',
    items: [
      { to: ADMIN_ROUTES.PAGES, icon: 'bi bi-file-earmark', label: 'Pages' },
      { to: ADMIN_ROUTES.BANNERS, icon: 'bi bi-image', label: 'Banners' },
    ],
  },
  {
    section: 'ERP MONITORING',
    items: [
      {
        to: '/erp/dashboard',
        icon: 'bi bi-eye',
        label: 'ERP Overview',
        matchPrefix: true,
        matchPath: '/erp',
        badge: 'VIEW ONLY',
      },
    ],
  },
  {
    section: 'MONITORING',
    items: [
      { to: ADMIN_ROUTES.ACTIVITY_LOGS, icon: 'bi bi-activity', label: 'Activity Logs' },
      { to: ADMIN_ROUTES.SYSTEM_HEALTH, icon: 'bi bi-heart-pulse', label: 'System Health' },
    ],
  },
];

const PAGE_TITLES = {
  [ADMIN_ROUTES.DASHBOARD]: 'Dashboard',
  [ADMIN_ROUTES.USERS]: 'User Management',
  [ADMIN_ROUTES.CATEGORIES]: 'Categories',
  [ADMIN_ROUTES.ATTRIBUTES]: 'Attributes',
  [ADMIN_ROUTES.SYSTEM_VOUCHERS]: 'System Vouchers',
  [ADMIN_ROUTES.SYSTEM_CONFIG]: 'Configuration',
  [ADMIN_ROUTES.SITE_SETTINGS]: 'Site Settings',
  [ADMIN_ROUTES.PAYMENT_SETTINGS]: 'Payment Settings',
  [ADMIN_ROUTES.PAGES]: 'Pages',
  [ADMIN_ROUTES.BANNERS]: 'Banners',
  [ADMIN_ROUTES.ACTIVITY_LOGS]: 'Activity Logs',
  [ADMIN_ROUTES.SYSTEM_HEALTH]: 'System Health',
};

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = useCallback((item) => {
    if (item.matchPath) return location.pathname.includes(item.matchPath);
    if (item.matchPrefix) return location.pathname.startsWith(item.to);
    return location.pathname === item.to;
  }, [location.pathname]);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([route]) =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    )?.[1] ??
    (location.pathname.includes('/erp') ? 'ERP Overview' : 'Admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
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
                    {item.badge && (
                      <span className={styles.navBadge}>{item.badge}</span>
                    )}
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
            <button
              className={styles.logoutBtn}
              title="Logout"
              onClick={handleLogout}
            >
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
          <button className={styles.topbarIconBtn} title="Notifications">
            <i className="bi bi-bell" />
            <span className={styles.topbarBadge} />
          </button>

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
      <main className={mainClass}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
