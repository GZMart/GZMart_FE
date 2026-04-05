import { useState } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CropModal from './CropModal';
import axiosClient from '../../services/axiosClient';

const IconCrop = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.75 6A1.75 1.75 0 0 0 16 7.75v10.5A1.75 1.75 0 0 0 17.75 20h4.25A1.75 1.75 0 0 0 23.75 18.25V6H17.75zm4.25 11.5H17V7.75A1.75 1.75 0 0 0 15.25 6H6v2.25A1.75 1.75 0 0 0 7.75 10h12.25v7.5z"/>
    <circle cx="10" cy="15" r="2"/>
  </svg>
);
import styles from '@assets/styles/common/CloudinaryUpload.module.css';

/**
 * CloudinaryUpload
 * A reusable image uploader that POSTs to /api/upload/single
 * and returns the Cloudinary URL via onChange(url).
 *
 * Props:
 *   value        — current URL
 *   onChange     — called with the new URL after upload
 *   hint         — optional helper text below the button
 *   aspectRatio  — '2:1' | '16:9' | '1:1' | '4:3' | null  (enables Crop button)
 */
const CloudinaryUpload = ({ value, onChange, hint, aspectRatio }) => {
  const [uploading, setUploading] = useState(false);
  const [cropModalUrl, setCropModalUrl] = useState(null); // image being cropped

  const uploadFile = async (file, targetRatio) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files are allowed (JPG, PNG, WEBP, GIF)');
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2 MB (carousel banner)
    if (file.size > maxSize) {
      message.error(`Image must be smaller than ${Math.round(maxSize / 1024 / 1024)} MB`);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    // If aspectRatio is specified, open crop modal first
    if (targetRatio) {
      const objectUrl = URL.createObjectURL(file);
      setCropModalUrl(objectUrl);
      return;
    }

    // No crop requested — upload directly
    try {
      setUploading(true);
      const res = await axiosClient.post('/api/upload/single', formData);
      const url = res?.data?.url || res?.url;
      if (!url) {
throw new Error('No URL returned from server');
}
      onChange?.(url);
      message.success('Image uploaded!');
    } catch (err) {
      message.error(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async ({ file }) => {
    await uploadFile(file, aspectRatio);
  };

  const handleCropApply = (croppedUrl) => {
    // CropModal already uploaded the cropped blob → croppedUrl is the final URL.
    setCropModalUrl(null);
    if (!croppedUrl) {
return;
}
    onChange?.(croppedUrl);
    message.success('Anh da cat va tai len!');
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
            {aspectRatio && (
              <Upload showUploadList={false} customRequest={handleUpload} accept="image/*">
                <button className={`${styles.overlayBtn} ${styles.cropBtn}`} type="button" title="Crop image">
                  <IconCrop />
                  <span>Cat anh</span>
                </button>
              </Upload>
            )}
            <Upload showUploadList={false} customRequest={handleUpload} accept="image/*">
              <button className={styles.overlayBtn} type="button" title="Change image">
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <span>{uploading ? 'Dang tai…' : 'Doi anh'}</span>
              </button>
            </Upload>
            <button
              className={`${styles.overlayBtn} ${styles.removeBtn}`}
              type="button"
              title="Remove image"
              onClick={handleRemove}
            >
              <DeleteOutlined />
              <span>Xoa</span>
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
            {uploading ? (
              <LoadingOutlined className={styles.uploadIcon} />
            ) : (
              <PlusOutlined className={styles.uploadIcon} />
            )}
            <span className={styles.uploadText}>
              {uploading ? 'Dang tai…' : 'Tai anh len'}
            </span>
            {hint && <span className={styles.uploadHint}>{hint}</span>}
          </div>
        </Upload>
      )}

      {cropModalUrl && (
        <CropModal
          imageUrl={cropModalUrl}
          aspectRatio={aspectRatio}
          onApply={handleCropApply}
          onClose={() => setCropModalUrl(null)}
        />
      )}
    </div>
  );
};

export default CloudinaryUpload;
