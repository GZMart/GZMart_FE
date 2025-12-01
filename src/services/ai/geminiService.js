/**
 * Google Gemini AI Service
 * Alternative to OpenAI for AI features
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate content using Gemini
 * @param {string} prompt - User prompt
 * @returns {Promise<string>} AI response
 */
export const generateContent = async (prompt) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Get product search suggestions
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search suggestions
 */
export const getSearchSuggestions = async (query) => {
  const prompt = `Generate 5 fashion product search suggestions related to: "${query}". Return only the suggestions as a JSON array of strings.`;
  const response = await generateContent(prompt);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback if response isn't valid JSON
    return response.split('\n').filter((s) => s.trim());
  }
};

/**
 * Analyze customer feedback sentiment
 * @param {string} feedback - Customer feedback text
 * @returns {Promise<object>} Sentiment analysis result
 */
export const analyzeSentiment = async (feedback) => {
  const prompt = `Analyze the sentiment of this customer feedback and return a JSON object with "sentiment" (positive/negative/neutral) and "score" (0-1): "${feedback}"`;
  const response = await generateContent(prompt);

  try {
    return JSON.parse(response);
  } catch {
    return { sentiment: 'neutral', score: 0.5 };
  }
};

export const geminiService = {
  generateContent,
  getSearchSuggestions,
  analyzeSentiment,
};

export default geminiService;
