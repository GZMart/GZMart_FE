import { Outlet, Link } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { ADMIN_ROUTES } from '@constants/routes';

/**
 * Admin Layout - For Admin pages
 */
const AdminLayout = ({ children }) => {
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
                    <button className="dropdown-item" onClick={() => console.log('Logout')}>
                      Logout
                    </button>
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
            <Col md={2} className="admin-sidebar bg-light border-end p-0">
              <Nav className="flex-column p-3">
                <Nav.Link as={Link} to={ADMIN_ROUTES.DASHBOARD} className="py-2">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Nav.Link>
                <hr />
                <small className="text-muted px-2">USER MANAGEMENT</small>
                <Nav.Link as={Link} to={ADMIN_ROUTES.USERS} className="py-2">
                  <i className="bi bi-people me-2"></i>
                  Users
                </Nav.Link>
                <hr />
                <small className="text-muted px-2">SYSTEM</small>
                <Nav.Link as={Link} to={ADMIN_ROUTES.SYSTEM_CONFIG} className="py-2">
                  <i className="bi bi-gear me-2"></i>
                  Configuration
                </Nav.Link>
                <Nav.Link as={Link} to={ADMIN_ROUTES.SITE_SETTINGS} className="py-2">
                  <i className="bi bi-globe me-2"></i>
                  Site Settings
                </Nav.Link>
                <Nav.Link as={Link} to={ADMIN_ROUTES.PAYMENT_SETTINGS} className="py-2">
                  <i className="bi bi-credit-card me-2"></i>
                  Payment Settings
                </Nav.Link>
                <hr />
                <small className="text-muted px-2">CONTENT</small>
                <Nav.Link as={Link} to={ADMIN_ROUTES.PAGES} className="py-2">
                  <i className="bi bi-file-earmark me-2"></i>
                  Pages
                </Nav.Link>
                <Nav.Link as={Link} to={ADMIN_ROUTES.BANNERS} className="py-2">
                  <i className="bi bi-image me-2"></i>
                  Banners
                </Nav.Link>
                <hr />
                <small className="text-muted px-2">MONITORING</small>
                <Nav.Link as={Link} to={ADMIN_ROUTES.ACTIVITY_LOGS} className="py-2">
                  <i className="bi bi-activity me-2"></i>
                  Activity Logs
                </Nav.Link>
                <Nav.Link as={Link} to={ADMIN_ROUTES.SYSTEM_HEALTH} className="py-2">
                  <i className="bi bi-heart-pulse me-2"></i>
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
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
