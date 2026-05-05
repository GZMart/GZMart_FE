import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radio, Eye, ChevronRight, Play, Flame, Users, Wifi } from 'lucide-react';
import livestreamService from '../../../services/api/livestreamService';
import { PUBLIC_ROUTES } from '../../../constants/routes';
import { mapPublicLiveSessionToItem } from '../livestream/mapPublicLiveSessionToItem.js';

/* ─── Helpers ─────────────────────────────────── */
function shopIdStr(s) {
  if (!s) {
return '';
}
  if (typeof s === 'object' && s._id) {
return String(s._id);
}
  return String(s);
}
function buildHref(item) {
  const sid = shopIdStr(item.shopId);
  return sid ? `/shop/${sid}/live/${item.id}` : PUBLIC_ROUTES.LIVE_STREAMS;
}
function fmtViewers(n) {
  if (typeof n !== 'number') {
return '0';
}
  if (n >= 1000) {
return `${(n / 1000).toFixed(1)}k`;
}
  return String(n);
}

/* ─── LIVE badge ──────────────────────────────── */
function LiveBadge({ lg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      gap: lg ? 5 : 3,
      background: '#e11d48', color: '#fff', borderRadius: 99,
      padding: lg ? '4px 10px' : '2px 7px',
      fontSize: lg ? 11 : 10, fontWeight: 800,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      boxShadow: '0 2px 8px rgba(225,29,72,0.38)',
      userSelect: 'none',
    }}>
      <span style={{
        width: lg ? 6 : 5, height: lg ? 6 : 5, borderRadius: '50%',
        background: '#fff', flexShrink: 0,
        animation: 'lsBlink 1.6s ease-in-out infinite',
      }} />
      Live
    </span>
  );
}

/* ─── Avatar ──────────────────────────────────── */
function Avatar({ src, name, size = 32, dark = false }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').slice(0, 2).toUpperCase();
  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg,#e11d48,#9f1239)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size * 0.36, fontWeight: 700,
        border: dark ? '2px solid rgba(255,255,255,0.25)' : '2px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }}>{initials}</div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setErr(true)} style={{
      width: size, height: size, borderRadius: '50%', objectFit: 'cover',
      flexShrink: 0,
      border: dark ? '2px solid rgba(255,255,255,0.25)' : '2px solid #fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    }} />
  );
}

/* ─── No-cover banner (hero) ─────────────────── */
function NoCoverBanner({ item }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg,#f3f4f6 0%,#f0f0f5 40%,#ede9f8 70%,#f3f0fb 100%)',
      }} />
      {/* Soft blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60%', height: '70%', borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(225,29,72,0.1) 0%,transparent 65%)',
        filter: 'blur(40px)',
        animation: 'lsBlobA 8s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-5%',
        width: '55%', height: '65%', borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%)',
        filter: 'blur(40px)',
        animation: 'lsBlobB 10s ease-in-out infinite alternate',
      }} />
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle,rgba(0,0,0,0.06) 1px,transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      {/* Centre content */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-52%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        userSelect: 'none',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(225,29,72,0.1)',
          border: '1.5px solid rgba(225,29,72,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(225,29,72,0.25)',
          animation: 'lsRingPulse 2.4s ease-in-out infinite',
        }}>
          <Radio size={24} color="#e11d48" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(1rem,2.8vw,1.35rem)', fontWeight: 900,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'linear-gradient(90deg,#e11d48 0%,#9f1239 50%,#7c3aed 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>GZMart Live</div>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em',
            color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginTop: 3,
          }}>Stream Starting Soon</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero Card ───────────────────────────────── */
function HeroCard({ item }) {
  const [failed, setFailed] = useState(false);
  const hasCover = Boolean(item.coverUrl) && !failed;
  const href = buildHref(item);

  return (
    <Link to={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <motion.article
        whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 18, height: '100%', minHeight: 320,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          border: '1px solid rgba(0,0,0,0.06)',
          cursor: 'pointer',
        }}
      >
        {/* Cover image */}
        {hasCover && (
          <motion.img
            src={item.coverUrl} alt="" loading="lazy" decoding="async"
            onError={() => setFailed(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center center',
            }}
          />
        )}

        {/* No cover placeholder */}
        {!hasCover && <NoCoverBanner item={item} />}

        {/* Gradient overlay (always) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: hasCover
            ? 'linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.18) 40%,rgba(0,0,0,0.82) 100%)'
            : 'linear-gradient(180deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.92) 100%)',
        }} />

        {/* Top badges */}
        <div style={{
          position: 'absolute', top: 14, left: 14, right: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2,
        }}>
          <LiveBadge lg />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: hasCover ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(6px)',
            border: hasCover ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
            color: hasCover ? 'rgba(255,255,255,0.92)' : '#374151',
            borderRadius: 99, padding: '4px 9px', fontSize: 11.5, fontWeight: 600,
          }}>
            <Eye size={11} />
            {fmtViewers(item.viewerCount)} watching
          </span>
        </div>

        {/* Bottom info */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '18px 18px 18px', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <Avatar src={item.avatarUrl} name={item.shopLabel} size={28} dark={hasCover} />
            <span style={{
              color: hasCover ? 'rgba(255,255,255,0.82)' : '#6b7280',
              fontSize: 12, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.shopLabel}</span>
          </div>
          <h3 style={{
            color: hasCover ? '#fff' : '#111827',
            fontWeight: 800, margin: '0 0 12px',
            fontSize: 'clamp(0.95rem,2vw,1.2rem)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{item.titleLine}</h3>
          <motion.span
            whileHover={{ scale: 1.04 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#e11d48,#9f1239)',
              color: '#fff', borderRadius: 99, padding: '7px 16px',
              fontSize: 12.5, fontWeight: 700,
              boxShadow: '0 3px 14px rgba(225,29,72,0.38)',
              cursor: 'pointer',
            }}
          >
            <Play size={11} fill="#fff" />
            Watch Live
          </motion.span>
        </div>
      </motion.article>
    </Link>
  );
}

/* ─── Side Card ───────────────────────────────── */
function SideCard({ item, onClick }) {
  const [failed, setFailed] = useState(false);
  const hasCover = Boolean(item.coverUrl) && !failed;
  const href = buildHref(item);

  return (
    <motion.div
      whileHover={{ scale: 1.015, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      onClick={onClick}
      style={{
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        background: '#fff',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        transition: 'border-color 0.2s',
      }}
    >
      <Link to={href} style={{ textDecoration: 'none', display: 'flex' }}>
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: 96, flexShrink: 0, background: '#f3f4f6' }}>
          {hasCover ? (
            <img src={item.coverUrl} alt="" loading="lazy" decoding="async"
              onError={() => setFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 84,
              background: 'linear-gradient(135deg,#fff0f3,#fce4ec)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Avatar src={item.avatarUrl} name={item.shopLabel} size={32} />
            </div>
          )}
          {/* Overlay on cover */}
          {hasCover && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right,transparent 50%,rgba(255,255,255,0.5) 100%)',
              pointerEvents: 'none',
            }} />
          )}
          <div style={{ position: 'absolute', top: 6, left: 6 }}>
            <LiveBadge />
          </div>
        </div>

        {/* Info */}
        <div style={{
          flex: 1, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          gap: 4, minWidth: 0,
          borderLeft: '2px solid #f3e8ff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Avatar src={item.avatarUrl} name={item.shopLabel} size={16} />
            <span style={{
              color: '#9ca3af', fontSize: 11, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.shopLabel}</span>
          </div>
          <p style={{
            color: '#111827', fontSize: 12.5, fontWeight: 700,
            margin: 0, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{item.titleLine}</p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: '#9ca3af', fontSize: 11, fontWeight: 500,
          }}>
            <Eye size={10} />
            {fmtViewers(item.viewerCount)} watching
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Skeletons ───────────────────────────────── */
function HeroSkel() {
  return <div style={{ borderRadius: 18, minHeight: 320, background: '#f3f4f6', animation: 'lsShimmer 1.5s ease-in-out infinite' }} />;
}
function SideSkel() {
  return <div style={{ borderRadius: 14, height: 84, background: '#f3f4f6', animation: 'lsShimmer 1.5s ease-in-out infinite' }} />;
}

/* ─── Section ─────────────────────────────────── */
export default function HomepageLiveStreamsSection() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await livestreamService.listPublicLiveSessions({ limit: 12 });
        const payload = res?.data ?? [];
        setSessions((Array.isArray(payload) ? payload : []).map(mapPublicLiveSessionToItem));
      } catch (e) {
        console.error(e);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cycleHero = useCallback(() => {
    setSessions((prev) => {
 if (prev.length > 1) {
setHeroIdx((i) => (i + 1) % prev.length);
} return prev; 
});
  }, []);

  useEffect(() => {
    if (sessions.length > 1) {
      timerRef.current = setInterval(cycleHero, 7000);
      return () => clearInterval(timerRef.current);
    }
  }, [sessions.length, cycleHero]);

  const heroItem = sessions[heroIdx] ?? null;
  const sideItems = sessions.filter((_, i) => i !== heroIdx).slice(0, 4);
  const totalViewers = sessions.reduce((s, x) => s + (x.viewerCount || 0), 0);

  return (
    <>
      <style>{`
        @keyframes lsBlink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lsShimmer { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes lsBlobA   { from{transform:translate(0,0) scale(1)} to{transform:translate(10%,8%) scale(1.15)} }
        @keyframes lsBlobB   { from{transform:translate(0,0) scale(1)} to{transform:translate(-8%,-10%) scale(1.2)} }
        @keyframes lsRingPulse {
          0%,100%{box-shadow:0 0 16px rgba(225,29,72,0.25)}
          50%    {box-shadow:0 0 32px rgba(225,29,72,0.5)}
        }
        .ls-wrap {
          padding: 48px 0;
        }
        .ls-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 14px;
          align-items: stretch;
        }
        .ls-side { display:flex; flex-direction:column; gap:10px; }
        @media(max-width:767px){
          .ls-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <section className="ls-wrap">
        <div className="container">

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24, flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg,#e11d48,#9f1239)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(225,29,72,0.3)',
              }}>
                <Radio size={19} color="#fff" />
              </div>
              <div>
                <h2 style={{ color: '#111827', fontWeight: 800, margin: 0, fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', lineHeight: 1.2 }}>
                  Live Streams
                </h2>
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0, fontWeight: 500 }}>
                  Happening live on GZMart
                </p>
              </div>
            </div>

            <Link to={PUBLIC_ROUTES.LIVE_STREAMS} style={{ textDecoration: 'none' }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#fff', color: '#374151',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 99, padding: '8px 16px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                View all <ChevronRight size={14} />
              </motion.button>
            </Link>
          </div>

          {/* Stats */}
          {!loading && sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                <Flame size={13} color="#e11d48" />
                <strong style={{ color: '#e11d48', fontWeight: 800 }}>{sessions.length}</strong>&nbsp;streams live now
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                <Users size={13} color="#6366f1" />
                <strong style={{ color: '#6366f1', fontWeight: 800 }}>{fmtViewers(totalViewers)}</strong>&nbsp;watching
              </span>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="ls-grid">
              <HeroSkel />
              <div className="ls-side">{[0,1,2,3].map(k => <SideSkel key={k} />)}</div>
            </div>
          )}

          {/* Empty */}
          {!loading && sessions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center', padding: '52px 0',
                background: '#fafafa', borderRadius: 16,
                border: '1.5px dashed #e5e7eb',
              }}
            >
              <Wifi size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0 }}>No live streams right now</p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 5 }}>Check back soon — shops go live all the time!</p>
            </motion.div>
          )}

          {/* Grid */}
          {!loading && sessions.length > 0 && (
            <div className="ls-grid" style={sessions.length === 1 ? { gridTemplateColumns: '1fr' } : {}}>
              {/* Hero */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIdx}
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ minHeight: 300 }}
                >
                  <HeroCard item={heroItem} />
                </motion.div>
              </AnimatePresence>

              {/* Side */}
              {sessions.length > 1 && (
                <div className="ls-side">
                  {sideItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ flex: 1 }}
                    >
                      <SideCard item={item} onClick={() => {
                        const ri = sessions.findIndex(s => s.id === item.id);
                        if (ri !== -1) {
 setHeroIdx(ri); clearInterval(timerRef.current); 
}
                      }} />
                    </motion.div>
                  ))}

                  {/* Dots */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 2 }}>
                    {sessions.map((_, idx) => (
                      <motion.button
                        key={idx} type="button"
                        onClick={() => {
 setHeroIdx(idx); clearInterval(timerRef.current); 
}}
                        whileHover={{ scale: 1.3 }}
                        style={{
                          width: heroIdx === idx ? 20 : 6, height: 6,
                          borderRadius: 99, border: 'none', padding: 0, cursor: 'pointer',
                          background: heroIdx === idx
                            ? 'linear-gradient(90deg,#e11d48,#9f1239)'
                            : '#e5e7eb',
                          transition: 'width 0.3s, background 0.2s',
                          boxShadow: heroIdx === idx ? '0 2px 6px rgba(225,29,72,0.35)' : 'none',
                        }}
                        aria-label={`Stream ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
