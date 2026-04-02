import axiosClient from '../axiosClient';

/**
 * Upload Service - Handles media (image/video/document) uploads to Cloudinary
 */

/**
 * Core function to upload a single media file
 * @param {File} file - The file to upload (image, video, etc.)
 * @param {string} fieldName - The form field name expected by the backend (default: 'image')
 * @returns {Promise<Object>} Response with uploaded file data and normalized URL
 */
const uploadMedia = async (file, fieldName = 'image') => {
  console.log('🔵 [UPLOAD MEDIA API] Request:', {
    endpoint: 'POST /api/upload/single',
    fieldName,
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`, // Chuyển sang MB dễ đọc hơn cho video
    fileType: file.type,
    timestamp: new Date().toISOString(),
  });

  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    // axiosClient interceptor unwraps response → returns response.data directly
    const data = await axiosClient.post('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Normalize URL extraction: support both { data: { url } } and { url } shapes
    const url = data?.data?.url || data?.url || data?.secure_url || '';

    console.log('✅ [UPLOAD MEDIA API] Success:', {
      fileName: file.name,
      url,
      timestamp: new Date().toISOString(),
    });

    return { ...data, url };
  } catch (error) {
    console.error('❌ [UPLOAD MEDIA API] Error:', {
      fileName: file.name,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Upload multiple media files concurrently
 * @param {File[]} files - Array of files to upload
 * @param {string} fieldName - The form field name (default: 'image')
 * @returns {Promise<Object[]>} Array of upload results containing URLs
 */
const uploadMultipleMedia = async (files, fieldName = 'image') => {
  if (!files || files.length === 0) {
return [];
}

  // Dùng Promise.all để upload song song, tối ưu tốc độ
  const uploadPromises = files.map((file) => uploadMedia(file, fieldName));
  return Promise.all(uploadPromises);
};

const uploadService = {
  // Tên mới chuẩn xác hơn
  uploadMedia,
  uploadMultipleMedia,

  // Giữ lại các alias cũ để tương thích ngược (không làm crash các component đang gọi hàm cũ)
  uploadImage: uploadMedia,
  uploadImages: uploadMultipleMedia,
  uploadFile: uploadMedia,
};

export default uploadService;
