import axiosClient from '../axiosClient';

/**
 * Upload Service - Handles file uploads to Cloudinary
 */

/**
 * Upload a single image
 * @param {File} file - The image file to upload
 * @returns {Promise<Object>} Response with uploaded image URL
 */
const uploadImage = async (file) => {
  console.log('🔵 [UPLOAD IMAGE API] Request:', {
    endpoint: 'POST /api/upload/single',
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(2)} KB`,
    fileType: file.type,
    timestamp: new Date().toISOString(),
  });

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axiosClient.post('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ [UPLOAD IMAGE API] Response:', {
      status: response.status,
      data: response.data,
      url: response.data?.data?.url || response.data?.url,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error) {
    console.error('❌ [UPLOAD IMAGE API] Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files to upload
 * @returns {Promise<Object[]>} Array of responses with uploaded image URLs
 */
const uploadImages = async (files) => {
  const uploadPromises = files.map((file) => uploadImage(file));
  return Promise.all(uploadPromises);
};

/**
 * Upload a single file (generic)
 * @param {File} file - The file to upload
 * @param {string} fieldName - The form field name (default: 'image')
 * @returns {Promise<Object>} Response with uploaded file URL
 */
const uploadFile = async (file, fieldName = 'image') => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const response = await axiosClient.post('/api/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

const uploadService = {
  uploadImage,
  uploadImages,
  uploadFile,
};

export default uploadService;
