import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@constants/routes';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section bg-light py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold">Welcome to GZMart</h1>
              <p className="lead">Your premier destination for fashion e-commerce</p>
              <Button as={Link} to={PUBLIC_ROUTES.SHOP} variant="primary" size="lg">
                Shop Now
              </Button>
            </Col>
            <Col md={6}>
              <div className="text-center">
                <i className="bi bi-bag-heart display-1 text-primary"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="featured-section py-5">
        <Container>
          <h2 className="text-center mb-4">Featured Products</h2>
          <Row>
            <Col md={3}>
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-image display-4 text-muted"></i>
                  <h5 className="card-title mt-3">Product 1</h5>
                  <p className="text-muted">$99.99</p>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-image display-4 text-muted"></i>
                  <h5 className="card-title mt-3">Product 2</h5>
                  <p className="text-muted">$149.99</p>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-image display-4 text-muted"></i>
                  <h5 className="card-title mt-3">Product 3</h5>
                  <p className="text-muted">$79.99</p>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-image display-4 text-muted"></i>
                  <h5 className="card-title mt-3">Product 4</h5>
                  <p className="text-muted">$129.99</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
