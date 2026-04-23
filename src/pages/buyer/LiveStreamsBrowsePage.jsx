import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import livestreamService from '../../services/api/livestreamService';
import LiveStreamDiscoveryCard from '../../components/common/livestream/LiveStreamDiscoveryCard.jsx';
import { mapPublicLiveSessionToItem } from '../../components/common/livestream/mapPublicLiveSessionToItem.js';
import { PUBLIC_ROUTES } from '../../constants/routes';

export default function LiveStreamsBrowsePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await livestreamService.listPublicLiveSessions({ limit: 50 });
        const payload = res?.data ?? [];
        const list = Array.isArray(payload) ? payload : [];
        setSessions(list.map(mapPublicLiveSessionToItem));
      } catch (e) {
        console.error('Error fetching live streams:', e);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-md-5">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link to={PUBLIC_ROUTES.HOME}>Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Live streams
          </li>
        </ol>
      </nav>

      <h1 className="h3 fw-bold text-dark mb-2">All live streams</h1>
      <p className="text-muted mb-4">Sorted by viewers — most watched first.</p>

      {sessions.length === 0 ? (
        <p className="text-muted fs-5">No live streams right now. Check back soon!</p>
      ) : (
        <div className="row g-3 g-md-4">
          {sessions.map((item) => (
            <div key={item.id} className="col-12 col-md-6 col-lg-4">
              <LiveStreamDiscoveryCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
