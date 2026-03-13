import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@constants/routes';

const NotFoundPage = () => (
  <Container className="text-center py-5">
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h1 className="display-1 fw-bold">404</h1>
      <h2>Page Not Found</h2>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <div className="mt-4">
        <Button as={Link} to={PUBLIC_ROUTES.HOME} variant="primary">
          Go Home
        </Button>
      </div>
    </div>
  </Container>
);

export default NotFoundPage;
