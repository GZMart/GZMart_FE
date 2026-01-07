import { Outlet, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { SELLER_ROUTES } from '@constants/routes';

/**
 * ERP Layout - For Seller pages
 */
const ERPLayout = ({ children }) => {
  const [listingsOpen, setListingsOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="erp-layout d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <header className="erp-header bg-primary text-white shadow-sm">
        <Container fluid>
          <nav className="navbar navbar-dark py-2">
            <Link className="navbar-brand fw-bold" to={SELLER_ROUTES.DASHBOARD}>
              <i className="bi bi-box-seam me-2"></i>
              Seller Portal
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
                    <button className="dropdown-item">Logout</button>
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
            <Col
              md={2}
              className="erp-sidebar bg-white border-end p-0"
              style={{ borderColor: '#e5e7eb' }}
            >
              <Nav className="flex-column py-3" style={{ fontSize: '14px' }}>
                {/* Header Section */}
                <div
                  className="px-4 mb-3 mt-1"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  ORDER MANAGER
                </div>

                <Nav.Link
                  as={Link}
                  to={SELLER_ROUTES.DASHBOARD}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === SELLER_ROUTES.DASHBOARD ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === SELLER_ROUTES.DASHBOARD ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-speedometer2"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Dashboard
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to={SELLER_ROUTES.ORDERS}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === SELLER_ROUTES.ORDERS ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === SELLER_ROUTES.ORDERS ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-cart3" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Orders
                </Nav.Link>

                {/* Listings */}
                <Nav.Link
                  as={Link}
                  to="/seller/listings"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/listings' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/listings' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-list-ul"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Listings
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/seller/returns"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/returns' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/returns' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-arrow-return-left"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Returns
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/seller/invoices"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/invoices' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/invoices' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-receipt"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Invoice
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/seller/messages"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/messages' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/messages' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-chat-dots"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Messages
                </Nav.Link>

                <hr className="my-3 mx-3" style={{ borderColor: '#e5e7eb', opacity: 1 }} />

                <div
                  className="px-4 mb-2"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  SETTINGS
                </div>

                <Nav.Link
                  as={Link}
                  to={SELLER_ROUTES.PROFILE}
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === SELLER_ROUTES.PROFILE ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === SELLER_ROUTES.PROFILE ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-person" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Profile
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/seller/billing"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/billing' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/billing' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-credit-card"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Billing
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/seller/pricing-plans"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/pricing-plans' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/pricing-plans' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-tag" style={{ fontSize: '18px', marginRight: '12px' }}></i>
                  Pricing Plans
                </Nav.Link>

                <hr className="my-3 mx-3" style={{ borderColor: '#e5e7eb', opacity: 1 }} />

                <div
                  className="px-4 mb-2"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    letterSpacing: '0.5px',
                  }}
                >
                  HELP
                </div>

                <Nav.Link
                  as={Link}
                  to="/seller/help-center"
                  className="px-4 py-2 d-flex align-items-center"
                  style={{
                    color: location.pathname === '/seller/help-center' ? '#0066cc' : '#6b7280',
                    fontWeight: location.pathname === '/seller/help-center' ? '500' : '400',
                    textDecoration: 'none',
                  }}
                >
                  <i
                    className="bi bi-question-circle"
                    style={{ fontSize: '18px', marginRight: '12px' }}
                  ></i>
                  Help Center
                </Nav.Link>
              </Nav>
            </Col>

            {/* Main Content */}
            <Col md={10} className="erp-content p-4" style={{ backgroundColor: '#fafafa' }}>
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
