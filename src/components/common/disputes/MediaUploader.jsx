import PropTypes from 'prop-types';
import { Typography } from 'antd';

const { Text } = Typography;

const MediaUploader = ({
  title,
  hint,
  files,
  previews,
  inputRef,
  disabled,
  onPick,
  onRemove,
  maxFiles,
}) => (
  <div style={{ display: 'grid', gap: 10 }}>
    <div>
      <Text strong>{title}</Text>
      {hint ? (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hint}
          </Text>
        </div>
      ) : null}
    </div>

    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'stretch',
      }}
    >
      {previews.map((media, index) => (
        <div
          key={`${media.url}-${index}`}
          style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}
        >
          {media.type === 'video' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0f172a, #334155)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              VIDEO
            </div>
          ) : (
            <img
              src={media.url}
              alt={media.name || 'evidence'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
            }}
          >
            ×
          </button>
        </div>
      ))}

      {files.length < maxFiles ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{
            width: 92,
            height: 92,
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          +
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={onPick}
        style={{ display: 'none' }}
      />
    </div>
  </div>
);

MediaUploader.propTypes = {
  title: PropTypes.string.isRequired,
  hint: PropTypes.string,
  files: PropTypes.arrayOf(PropTypes.any).isRequired,
  previews: PropTypes.arrayOf(PropTypes.any).isRequired,
  inputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  disabled: PropTypes.bool,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  maxFiles: PropTypes.number,
};

MediaUploader.defaultProps = {
  maxFiles: 5,
  hint: '',
  disabled: false,
};

export default MediaUploader;
