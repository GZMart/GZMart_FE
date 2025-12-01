import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { selectIsAuthenticated, selectUserRole } from '@store/slices/authSlice';
import { PUBLIC_ROUTES, ERROR_ROUTES } from '@constants/routes';

/**
 * Private Route Wrapper
 * Protects routes that require authentication
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to={PUBLIC_ROUTES.LOGIN} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page if role not allowed
    return <Navigate to={ERROR_ROUTES.FORBIDDEN} replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default PrivateRoute;
