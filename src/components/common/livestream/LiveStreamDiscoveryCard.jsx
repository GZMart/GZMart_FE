import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../../constants/routes';

function shopIdString(shopId) {
  if (!shopId) {
    return '';
  }
  if (typeof shopId === 'object' && shopId._id) {
    return String(shopId._id);
  }
  return String(shopId);
}

const LIVE_STREAM_CARD_DEFAULT_BANNER = '/live-stream-card-default-banner.svg';

const cardShellStyle = {
  minHeight: '232px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
};

/** Ảnh sản phẩm: ưu tiên phần trên–giữa (thumbnail thường là subject ở đó). Banner SVG: focal góc phải. */
const mediaStyle = (isProductPhoto) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: isProductPhoto ? 'center 22%' : '56% 36%',
  display: 'block',
});

export default function LiveStreamDiscoveryCard({ item }) {
  const sid = shopIdString(item.shopId);
  const href = sid ? `/shop/${sid}/live/${item.id}` : PUBLIC_ROUTES.LIVE_STREAMS;
  const label = `Watch live: ${item.titleLine} — ${item.shopLabel}`;
  const [coverFailed, setCoverFailed] = useState(false);

  const hasCover = Boolean(item.coverUrl) && !coverFailed;
  const imageSrc = hasCover ? item.coverUrl : LIVE_STREAM_CARD_DEFAULT_BANNER;

  const avatarRedundant = Boolean(
    item.coverUrl && item.avatarUrl && item.coverUrl === item.avatarUrl,
  );

  return (
    <Link
      to={href}
      className="h-100 d-block text-decoration-none"
      aria-label={label}
    >
      <motion.article
        whileHover={{
          y: -6,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="position-relative overflow-hidden h-100"
        style={cardShellStyle}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden"
          style={{ backgroundColor: '#141018' }}
        >
          <motion.img
            src={imageSrc}
            alt=""
            className="w-100 h-100"
            style={mediaStyle(hasCover)}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => {
              if (hasCover) {
                setCoverFailed(true);
              }
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background:
              'linear-gradient(105deg, rgba(12, 12, 16, 0.94) 0%, rgba(12, 12, 16, 0.72) 42%, rgba(12, 12, 16, 0.35) 68%, rgba(12, 12, 16, 0.12) 100%)',
            pointerEvents: 'none',
          }}
          role="presentation"
        />
        <div
          className="position-absolute bottom-0 start-0 w-100"
          style={{
            height: '48%',
            background: 'linear-gradient(to top, rgba(12, 12, 16, 0.82), transparent)',
            pointerEvents: 'none',
          }}
          role="presentation"
        />

        <div
          className="position-relative d-flex flex-column justify-content-between h-100 p-3 p-md-4"
          style={{ minHeight: '232px', zIndex: 1 }}
        >
          <div className="d-flex align-items-start justify-content-between gap-2">
            <motion.div
              className="d-inline-flex align-items-center gap-2 rounded-pill px-2 py-1"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.95)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
              }}
              animate={{ opacity: [1, 0.92, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <span
                className="rounded-circle shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#fff',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
                }}
                aria-hidden
              />
              <span className="text-white fw-bold small text-uppercase" style={{ letterSpacing: '0.06em' }}>
                Live
              </span>
            </motion.div>
            <span
              className="small d-flex align-items-center gap-1 rounded-pill px-2 py-1"
              style={{
                color: 'rgba(255, 255, 255, 0.92)',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <i className="bi bi-eye" aria-hidden />
              <span>{item.subtitle}</span>
            </span>
          </div>

          <div className="mt-auto">
            <div className="d-flex align-items-center gap-2 mb-2">
              {!avatarRedundant && (
                <img
                  src={item.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-circle shrink-0 border border-light border-opacity-25"
                  style={{ objectFit: 'cover' }}
                />
              )}
              <span className="text-white fw-semibold small text-truncate">{item.shopLabel}</span>
            </div>
            <h3
              className="text-white fw-bold mb-2"
              style={{
                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.titleLine}
            </h3>
            <span
              className="d-inline-flex align-items-center gap-1 small fw-semibold"
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            >
              Watch live
              <i className="bi bi-arrow-right-short fs-5" style={{ marginLeft: -2 }} aria-hidden />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

LiveStreamDiscoveryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    titleLine: PropTypes.string.isRequired,
    shopLabel: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    coverUrl: PropTypes.string,
    avatarUrl: PropTypes.string.isRequired,
    shopId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]) }),
    ]),
    viewerCount: PropTypes.number,
  }).isRequired,
};
