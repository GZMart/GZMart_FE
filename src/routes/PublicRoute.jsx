import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { selectIsAuthenticated, selectUserRole } from '@store/slices/authSlice';
import { getRoleHomePath } from '@constants/routes';

/**
 * Public Route Wrapper
 * Redirects authenticated users to their dashboard
 */
const PublicRoute = ({ children, restricted = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  if (isAuthenticated && restricted) {
    // Redirect to role-based dashboard if already authenticated
    const homePath = getRoleHomePath(userRole);
    return <Navigate to={homePath} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  restricted: PropTypes.bool, // If true, authenticated users can't access (e.g., login page)
};

export default PublicRoute;
