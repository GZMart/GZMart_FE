import { Navigate } from 'react-router-dom';
import { BUYER_ROUTES } from '@constants/routes';

const TrackOrderDetailsPage = () => {
  return <Navigate to={BUYER_ROUTES.ORDERS} replace />;
};

export default TrackOrderDetailsPage;
