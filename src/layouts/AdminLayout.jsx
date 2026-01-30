import { Outlet, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { ADMIN_ROUTES } from '@constants/routes';

/**
 * Admin Layout - For Admin pages
 */
const AdminLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="admin-layout d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <header className="admin-header bg-dark text-white shadow-sm">
        <Container fluid>
          <nav className="navbar navbar-dark py-2">
            <Link className="navbar-brand fw-bold" to={ADMIN_ROUTES.DASHBOARD}>
              <i className="bi bi-shield-lock me-2"></i>
              GZMart Admin
            </Link>
            <div className="ms-auto d-flex align-items-center">
              <div className="dropdown">
                <button
                  className="btn btn-link text-white dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-bell"></i>
                  <span className="badge bg-warning ms-1">5</span>
                </button>
              </div>
              <div className="dropdown ms-3">
                <button
                  className="btn btn-link text-white dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle"></i> Admin
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to={ADMIN_ROUTES.PROFILE}>
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to={ADMIN_ROUTES.SITE_SETTINGS}>
                      Settings
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item">Logout</button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </Container>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="admin-body flex-grow-1">
        <Container fluid>
          <Row>
            {/* Sidebar */}
            <Col
              md={2}
              className="admin-sidebar bg-white border-end p-0"
              style={{ borderColor: '#e5e7eb' }}
            >
              <Nav className="flex-column py-3" style={{ fontSize: '14px' }}>
                {/* Dashboard */}
                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.DASHBOARD}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.DASHBOARD ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.DASHBOARD ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-speedometer2"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Dashboard
                </Nav.Link>

                {/* User Management Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  USER MANAGEMENT
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.USERS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.USERS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.USERS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-people" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Users
                </Nav.Link>

                {/* Catalog Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  CATALOG
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.CATEGORIES}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.CATEGORIES ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.CATEGORIES ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-folder" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Categories
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.ATTRIBUTES}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.ATTRIBUTES ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.ATTRIBUTES ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-tags" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Attributes
                </Nav.Link>

                {/* Marketing Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  MARKETING
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.SYSTEM_VOUCHERS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname.includes(ADMIN_ROUTES.SYSTEM_VOUCHERS) ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname.includes(ADMIN_ROUTES.SYSTEM_VOUCHERS) ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-gift" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  System Vouchers
                </Nav.Link>

                {/* System Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  SYSTEM
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.SYSTEM_CONFIG}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.SYSTEM_CONFIG ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.SYSTEM_CONFIG ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-gear" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Configuration
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.SITE_SETTINGS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.SITE_SETTINGS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.SITE_SETTINGS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-globe" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Site Settings
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.PAYMENT_SETTINGS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color:
                      location.pathname === ADMIN_ROUTES.PAYMENT_SETTINGS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.PAYMENT_SETTINGS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-credit-card"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Payment Settings
                </Nav.Link>

                {/* Content Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  CONTENT
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.PAGES}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.PAGES ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.PAGES ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-file-earmark"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Pages
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.BANNERS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.BANNERS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.BANNERS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-image" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Banners
                </Nav.Link>

                {/* Monitoring Section */}
                <div
                  className="px-4 mb-2 mt-4"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  MONITORING
                </div>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.ACTIVITY_LOGS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.ACTIVITY_LOGS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.ACTIVITY_LOGS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-activity"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Activity Logs
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={ADMIN_ROUTES.SYSTEM_HEALTH}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === ADMIN_ROUTES.SYSTEM_HEALTH ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === ADMIN_ROUTES.SYSTEM_HEALTH ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-heart-pulse"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  System Health
                </Nav.Link>
              </Nav>
            </Col>

            {/* Main Content */}
            <Col md={10} className="admin-content p-4">
              {children || <Outlet />}
            </Col>
          </Row>
        </Container>
      </div>
    </div >
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
