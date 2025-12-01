import { Outlet, Link } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { SELLER_ROUTES } from '@constants/routes';

/**
 * ERP Layout - For Seller pages
 */
const ERPLayout = ({ children }) => {
  return (
    <div className="erp-layout d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <header className="erp-header bg-primary text-white shadow-sm">
        <Container fluid>
          <nav className="navbar navbar-dark py-2">
            <Link className="navbar-brand fw-bold" to={SELLER_ROUTES.DASHBOARD}>
              <i className="bi bi-shop me-2"></i>
              GZMart ERP
            </Link>
            <div className="ms-auto d-flex align-items-center">
              <div className="dropdown">
                <button
                  className="btn btn-link text-white dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-bell"></i>
                  <span className="badge bg-danger ms-1">3</span>
                </button>
                {/* Notifications dropdown */}
              </div>
              <div className="dropdown ms-3">
                <button
                  className="btn btn-link text-white dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle"></i> Seller
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to={SELLER_ROUTES.PROFILE}>
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to={SELLER_ROUTES.SETTINGS}>
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
      <div className="erp-body flex-grow-1">
        <Container fluid>
          <Row>
            {/* Sidebar */}
            <Col md={2} className="erp-sidebar bg-light border-end p-0">
              <Nav className="flex-column p-3">
                <Nav.Link as={Link} to={SELLER_ROUTES.DASHBOARD} className="py-2">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.PO_LIST} className="py-2">
                  <i className="bi bi-file-text me-2"></i>
                  Purchase Orders
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.LANDED_COST_CALCULATOR} className="py-2">
                  <i className="bi bi-calculator me-2"></i>
                  Landed Cost
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.INVENTORY} className="py-2">
                  <i className="bi bi-box-seam me-2"></i>
                  Inventory
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.PRODUCTS} className="py-2">
                  <i className="bi bi-tag me-2"></i>
                  Products
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.ORDERS} className="py-2">
                  <i className="bi bi-cart-check me-2"></i>
                  Orders
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.SUPPLIERS} className="py-2">
                  <i className="bi bi-building me-2"></i>
                  Suppliers
                </Nav.Link>
                <Nav.Link as={Link} to={SELLER_ROUTES.REPORTS} className="py-2">
                  <i className="bi bi-bar-chart me-2"></i>
                  Reports
                </Nav.Link>
              </Nav>
            </Col>

            {/* Main Content */}
            <Col md={10} className="erp-content p-4">
              {children || <Outlet />}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

ERPLayout.propTypes = {
  children: PropTypes.node,
};

export default ERPLayout;
