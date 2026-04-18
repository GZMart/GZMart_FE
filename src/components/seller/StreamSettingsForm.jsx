import styles from '@assets/styles/buyer/LiveStreamPage.module.css';
import PropTypes from 'prop-types';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook Live', icon: 'bi-facebook' },
  { id: 'tiktok', label: 'TikTok Shop', icon: 'bi-tiktok', active: true },
  { id: 'instagram', label: 'Instagram', icon: 'bi-instagram' },
];

export default function StreamSettingsForm({
  form,
  onChange,
  audioInputs = [],
  videoInputs = [],
  selectedMicId = '',
  selectedCamId = '',
  onMicChange,
  onCamChange,
  onRequestDevicePermission,
  devicesError,
}) {
  const togglePlatform = (id) => {
    const current = form.platforms || [];
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    onChange({ ...form, platforms: next });
  };

  return (
    <div className={styles.settingsCard}>
      <div className={styles.settingsGrid}>
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

        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <div className={styles.deviceSectionHeader}>
            <span className={styles.deviceSectionTitle}>Input devices</span>
            <span className={styles.deviceSectionHint}>Choose your microphone and camera before going live.</span>
          </div>
        </div>

        <div className={styles.settingsField}>
          <label className={styles.fieldLabelWithIcon} htmlFor="seller-mic-select">
            <span className={styles.deviceFieldIcon} aria-hidden>
              <i className="bi bi-mic-fill" />
            </span>
            Microphone
          </label>
          <select
            id="seller-mic-select"
            className={styles.fieldSelect}
            value={selectedMicId}
            onChange={(e) => onMicChange?.(e.target.value)}
            aria-label="Microphone"
          >
            <option value="">System default</option>
            {audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.settingsField}>
          <label className={styles.fieldLabelWithIcon} htmlFor="seller-cam-select">
            <span className={styles.deviceFieldIcon} aria-hidden>
              <i className="bi bi-camera-video-fill" />
            </span>
            Camera
          </label>
          <select
            id="seller-cam-select"
            className={styles.fieldSelect}
            value={selectedCamId}
            onChange={(e) => onCamChange?.(e.target.value)}
            aria-label="Camera"
          >
            <option value="">System default</option>
            {videoInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <div className={styles.devicePermissionCard}>
            <p className={styles.devicePermissionText}>
              If the list is empty or devices have no name, your browser may need permission to access the microphone
              and camera.
            </p>
            <button
              type="button"
              className={styles.btnDevicePermission}
              onClick={() => onRequestDevicePermission?.()}
            >
              <i className={`bi bi-unlock-fill ${styles.btnDevicePermissionIcon}`} aria-hidden />
              Allow microphone &amp; camera
            </button>
            {devicesError && <p className={styles.deviceErr}>{devicesError}</p>}
          </div>
        </div>

        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <div className={styles.platformsLabel}>Share to</div>
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
  audioInputs: PropTypes.arrayOf(PropTypes.shape({ deviceId: PropTypes.string, label: PropTypes.string })),
  videoInputs: PropTypes.arrayOf(PropTypes.shape({ deviceId: PropTypes.string, label: PropTypes.string })),
  selectedMicId: PropTypes.string,
  selectedCamId: PropTypes.string,
  onMicChange: PropTypes.func,
  onCamChange: PropTypes.func,
  onRequestDevicePermission: PropTypes.func,
  devicesError: PropTypes.string,
};
