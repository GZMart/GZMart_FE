/**
 * Google Vision API Service
 * For image recognition, product tagging, and visual search
 */

const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Analyze image using Google Vision API
 * @param {File|string} image - Image file or base64 string
 * @param {Array<string>} features - Features to detect (LABEL_DETECTION, TEXT_DETECTION, etc.)
 * @returns {Promise} Analysis results
 */
export const analyzeImage = async (image, features = ['LABEL_DETECTION']) => {
  try {
    let base64Image;

    if (image instanceof File) {
      base64Image = await fileToBase64(image);
    } else {
      base64Image = image;
    }

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
          },
          features: features.map((feature) => ({
            type: feature,
            maxResults: 10,
          })),
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Vision API request failed');
    }

    const data = await response.json();
    return data.responses[0];
  } catch (error) {
    console.error('Google Vision API Error:', error);
    throw error;
  }
};

/**
 * Extract product labels from image
 * @param {File} image - Product image
 * @returns {Promise<Array>} Detected labels
 */
export const extractProductLabels = async (image) => {
  const result = await analyzeImage(image, ['LABEL_DETECTION']);
  return result.labelAnnotations || [];
};

/**
 * Detect text in image (for product packaging, labels)
 * @param {File} image - Image with text
 * @returns {Promise<string>} Extracted text
 */
export const detectText = async (image) => {
  const result = await analyzeImage(image, ['TEXT_DETECTION']);
  return result.textAnnotations?.[0]?.description || '';
};

/**
 * Convert File to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const googleVisionService = {
  analyzeImage,
  extractProductLabels,
  detectText,
};

export default googleVisionService;
