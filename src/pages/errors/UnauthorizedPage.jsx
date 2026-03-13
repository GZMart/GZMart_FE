import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@constants/routes';

const UnauthorizedPage = () => (
  <Container className="text-center py-5">
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h1 className="display-1 fw-bold">401</h1>
      <h2>Unauthorized</h2>
      <p className="text-muted">You need to login to access this page.</p>
      <div className="mt-4">
        <Button as={Link} to={PUBLIC_ROUTES.LOGIN} variant="primary">
          Login
        </Button>
      </div>
    </div>
  </Container>
);

export default UnauthorizedPage;
