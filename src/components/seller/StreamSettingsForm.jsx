import styles from '@assets/styles/buyer/LiveStreamPage.module.css';
import PropTypes from 'prop-types';

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook Live',  icon: 'bi-facebook' },
  { id: 'tiktok',    label: 'TikTok Shop',     icon: 'bi-tiktok',      active: true },
  { id: 'instagram', label: 'Instagram',        icon: 'bi-instagram' },
];

export default function StreamSettingsForm({ form, onChange }) {
  const togglePlatform = (id) => {
    const current = form.platforms || [];
    const next = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];
    onChange({ ...form, platforms: next });
  };

  return (
    <div className={styles.settingsCard}>
      <div className={styles.settingsGrid}>
        {/* Broadcast Title — full width, no category field */}
        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <label className={styles.fieldLabel} htmlFor="broadcast-title">
            Broadcast Title
          </label>
          <input
            id="broadcast-title"
            className={styles.fieldInput}
            type="text"
            placeholder="Enter stream title..."
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            maxLength={120}
          />
        </div>

        {/* Share to */}
        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <div className={styles.platformsLabel}>
            Share to
          </div>
          <div className={styles.platformsRow}>
            {PLATFORMS.map((p) => {
              const isActive = (form.platforms || []).includes(p.id);
              return (
                <button
                  key={p.id}
                  className={`${styles.platformBtn} ${isActive ? styles.platformBtnActive : ''}`}
                  onClick={() => togglePlatform(p.id)}
                  title={p.label}
                  type="button"
                >
                  <i className={`bi ${p.icon}`} style={{ fontSize: 18 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

StreamSettingsForm.propTypes = {
  form: PropTypes.shape({
    title: PropTypes.string,
    platforms: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func,
};