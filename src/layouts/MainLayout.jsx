import { Outlet, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { PUBLIC_ROUTES, BUYER_ROUTES } from '@constants/routes';

/**
 * Main Layout - For Buyer/E-commerce pages
 */
const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      {/* Header/Navbar */}
      <header className="main-header bg-white shadow-sm">
        <Container>
          <nav className="navbar navbar-expand-lg navbar-light py-3">
            <Link className="navbar-brand fw-bold" to={PUBLIC_ROUTES.HOME}>
              GZMart
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to={PUBLIC_ROUTES.HOME}>
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={PUBLIC_ROUTES.SHOP}>
                    Shop
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={BUYER_ROUTES.CART}>
                    <i className="bi bi-cart"></i> Cart
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={BUYER_ROUTES.DASHBOARD}>
                    <i className="bi bi-person"></i> Account
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </Container>
      </header>

      {/* Main Content */}
      <main className="main-content py-4">
        <Container>{children || <Outlet />}</Container>
      </main>

      {/* Footer */}
      <footer className="main-footer bg-dark text-white py-4 mt-5">
        <Container>
          <div className="row">
            <div className="col-md-4">
              <h5>GZMart</h5>
              <p>Your trusted fashion e-commerce platform</p>
            </div>
            <div className="col-md-4">
              <h6>Quick Links</h6>
              <ul className="list-unstyled">
                <li>
                  <Link to={PUBLIC_ROUTES.ABOUT} className="text-white-50">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to={PUBLIC_ROUTES.CONTACT} className="text-white-50">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to={PUBLIC_ROUTES.FAQ} className="text-white-50">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-md-4">
              <h6>Follow Us</h6>
              <div className="social-links">
                <i className="bi bi-facebook me-3"></i>
                <i className="bi bi-instagram me-3"></i>
                <i className="bi bi-twitter"></i>
              </div>
            </div>
          </div>
          <hr className="my-3" />
          <div className="text-center">
            <small>&copy; 2024 GZMart. All rights reserved.</small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
