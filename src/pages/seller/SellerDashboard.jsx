import { Row, Col, Card } from 'react-bootstrap';

const SellerDashboard = () => {
  return (
    <div className="seller-dashboard">
      <h1 className="mb-4">ERP Dashboard</h1>

      <Row>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <i className="bi bi-file-text display-4 text-primary"></i>
              <h3 className="mt-3">15</h3>
              <p className="text-muted">Active POs</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <i className="bi bi-box-seam display-4 text-success"></i>
              <h3 className="mt-3">234</h3>
              <p className="text-muted">Inventory Items</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <i className="bi bi-exclamation-triangle display-4 text-warning"></i>
              <h3 className="mt-3">8</h3>
              <p className="text-muted">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <i className="bi bi-cart-check display-4 text-info"></i>
              <h3 className="mt-3">42</h3>
              <p className="text-muted">Orders</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SellerDashboard;
