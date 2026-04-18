import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { selectIsAuthenticated, selectUserRole } from '@store/slices/authSlice';
import { getAuthToken } from '@utils/storage';
import { PUBLIC_ROUTES, ERROR_ROUTES } from '@constants/routes';

/**
 * Private Route Wrapper
 * Protects routes that require authentication
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const storeAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const userRole = useSelector(selectUserRole);
  const authToken = getAuthToken();
  const isAuthenticated = storeAuthenticated && !!authToken;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${PUBLIC_ROUTES.LOGIN}?redirect=${redirect}`} replace />;
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
