import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import livestreamService from '../../../services/api/livestreamService';
import { PUBLIC_ROUTES } from '../../../constants/routes';
import LiveStreamDiscoveryCard from '../livestream/LiveStreamDiscoveryCard.jsx';
import { mapPublicLiveSessionToItem } from '../livestream/mapPublicLiveSessionToItem.js';

const ITEMS_PER_PAGE = 2;

export default function HomepageLiveStreamsSection() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await livestreamService.listPublicLiveSessions({ limit: 12 });
        const payload = res?.data ?? [];
        const list = Array.isArray(payload) ? payload : [];
        setSessions(list.map(mapPublicLiveSessionToItem));
      } catch (e) {
        console.error('Error fetching live sessions:', e);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1;
  const pageItems = sessions.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );
  const singleCardOnPage = pageItems.length === 1;

  useEffect(() => {
    const tp = Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1;
    setCurrentPage((p) => Math.min(p, Math.max(0, tp - 1)));
  }, [sessions.length]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0 flex-wrap">
            <h3 className="fw-bold text-dark m-0">Live streams</h3>
            <span className="text-muted fw-semibold d-none d-sm-inline">·</span>
            <p className="text-muted mb-0 small fw-medium d-none d-sm-block">Happening now on GZMart</p>
          </div>
          <Link to={PUBLIC_ROUTES.LIVE_STREAMS} style={{ textDecoration: 'none' }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="d-flex align-items-center justify-content-center px-4 py-2 rounded-pill fw-bold text-white border-0"
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              View all live
            </motion.button>
          </Link>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        {sessions.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5 mb-0">No live streams right now. Check back soon!</p>
          </div>
        ) : (
          <div className="position-relative">
            {totalPages > 1 && (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevPage}
                  aria-label="Previous live streams"
                  className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center rounded-circle bg-white shadow d-none d-md-flex"
                  style={{
                    left: '-20px',
                    width: 50,
                    height: 50,
                    border: '2px solid var(--color-border, #dee2e6)',
                    zIndex: 10,
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={28} color="var(--color-primary)" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextPage}
                  aria-label="Next live streams"
                  className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center rounded-circle bg-white shadow d-none d-md-flex"
                  style={{
                    right: '-20px',
                    width: 50,
                    height: 50,
                    border: '2px solid var(--color-border, #dee2e6)',
                    zIndex: 10,
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={28} color="var(--color-primary)" />
                </motion.button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="row g-3 g-md-4">
                  {pageItems.map((item) => (
                    <div
                      key={item.id}
                      className={
                        singleCardOnPage ? 'col-12 col-md-6 mx-auto' : 'col-12 col-md-6'
                      }
                    >
                      <LiveStreamDiscoveryCard item={item} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(index)}
                    aria-label={`Live streams page ${index + 1} of ${totalPages}`}
                    className="rounded-circle border-0"
                    style={{
                      width: currentPage === index ? 12 : 8,
                      height: currentPage === index ? 12 : 8,
                      backgroundColor: currentPage === index ? 'var(--color-primary)' : '#dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="d-flex d-md-none justify-content-center gap-3 mt-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevPage}
                  className="btn btn-outline-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-1"
                >
                  <ChevronLeft size={20} />
                  Prev
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextPage}
                  className="btn btn-outline-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-1"
                >
                  Next
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
