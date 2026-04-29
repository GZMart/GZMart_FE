import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { WifiOff } from 'lucide-react';

/**
 * EndLiveConfirmModal
 * Replaces the native window.confirm() when the seller clicks "End Live".
 *
 * Props:
 *  - isOpen     {boolean}   – controls visibility
 *  - onConfirm  {function}  – called when user clicks "End Stream"
 *  - onCancel   {function}  – called when user clicks "Keep Streaming" or backdrop
 */
export default function EndLiveConfirmModal({ isOpen, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
              cursor: 'pointer',
            }}
          />

          {/* Dialog Wrapper for centering without transform conflicts */}
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '16px',
          }}>
            {/* Dialog */}
            <motion.div
              key="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="end-live-title"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              style={{
                width: '100%',
                maxWidth: 440,
                background: '#fff',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                pointerEvents: 'auto',
              }}
            >
            {/* Red header strip */}
            <div style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
              padding: '28px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}>
              {/* Icon ring */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WifiOff size={24} color="#fff" />
              </div>
              <h2
                id="end-live-title"
                style={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                End Live Stream?
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.82)',
                fontSize: 13.5,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.55,
              }}>
                Viewers will no longer be able to watch this broadcast.
                Your session summary will be available after ending.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Warning note */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                <span style={{ color: '#ea580c', fontSize: 15, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>⚠</span>
                <p style={{ color: '#9a3412', fontSize: 12.5, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  This action cannot be undone. Once ended, you cannot resume this session.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {/* Cancel */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 12,
                    border: '1.5px solid #e5e7eb',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Keep Streaming
                </motion.button>

                {/* Confirm */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, background: '#9f1239' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(225,29,72,0.35)',
                  }}
                >
                  End Stream
                </motion.button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

EndLiveConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
