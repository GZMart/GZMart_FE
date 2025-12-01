import { Container, Row, Col, Card } from 'react-bootstrap';

const RegisterPage = () => {
  return (
    <div className="register-page bg-light" style={{ minHeight: '100vh' }}>
      <Container>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <Col md={6}>
            <Card className="shadow">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4">Create Account</h2>
                <p className="text-center text-muted">Registration form coming soon...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterPage;
