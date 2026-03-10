import { useState } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../../services/axiosClient';
import styles from '../../assets/styles/common/CloudinaryUpload.module.css';

/**
 * CloudinaryUpload
 * A reusable image uploader that POSTs to /api/upload/single
 * and returns the Cloudinary URL via onChange(url).
 *
 * Props:
 *   value    — current URL (controlled by Ant Form)
 *   onChange — called with the new URL after upload
 *   hint     — optional helper text below the button
 */
const CloudinaryUpload = ({ value, onChange, hint }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async ({ file }) => {
    // Validate type client-side
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files are allowed (JPG, PNG, WEBP, GIF)');
      return;
    }
    // Validate size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      message.error('Image must be smaller than 5 MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await axiosClient.post('/api/upload/single', formData);
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('No URL returned from server');
      onChange?.(url);
      message.success('Image uploaded!');
    } catch (err) {
      message.error(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div className={styles.wrapper}>
      {value ? (
        /* ── Preview ── */
        <div className={styles.preview}>
          <img src={value} alt="Category" className={styles.previewImg} />
          <div className={styles.previewOverlay}>
            <Upload
              showUploadList={false}
              customRequest={handleUpload}
              accept="image/*"
            >
              <button className={styles.overlayBtn} type="button" title="Change image">
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <span>{uploading ? 'Uploading…' : 'Change'}</span>
              </button>
            </Upload>
            <button
              className={`${styles.overlayBtn} ${styles.removeBtn}`}
              type="button"
              title="Remove image"
              onClick={handleRemove}
            >
              <DeleteOutlined />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload trigger ── */
        <Upload
          showUploadList={false}
          customRequest={handleUpload}
          accept="image/*"
          disabled={uploading}
        >
          <div className={styles.uploadTrigger}>
            {uploading ? <LoadingOutlined className={styles.uploadIcon} /> : <PlusOutlined className={styles.uploadIcon} />}
            <span className={styles.uploadText}>
              {uploading ? 'Uploading…' : 'Click to upload'}
            </span>
            {hint && <span className={styles.uploadHint}>{hint}</span>}
          </div>
        </Upload>
      )}
    </div>
  );
};

export default CloudinaryUpload;
