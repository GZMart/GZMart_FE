/**
 * OpenAI/ChatGPT Service
 * For chatbot, product recommendations, and content generation
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Send message to ChatGPT
 * @param {Array} messages - Chat messages array
 * @param {string} model - Model to use (default: gpt-3.5-turbo)
 * @returns {Promise} AI response
 */
export const sendChatMessage = async (messages, model = 'gpt-3.5-turbo') => {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
};

/**
 * Get product recommendation using AI
 * @param {object} userPreferences - User preferences and history
 * @returns {Promise<string>} AI recommendation
 */
export const getProductRecommendation = async (userPreferences) => {
  const messages = [
    {
      role: 'system',
      content:
        'You are a fashion retail expert helping customers find the perfect products based on their preferences.',
    },
    {
      role: 'user',
      content: `Based on these preferences: ${JSON.stringify(userPreferences)}, what products would you recommend?`,
    },
  ];

  return sendChatMessage(messages);
};

/**
 * Generate product description using AI
 * @param {object} productInfo - Product information
 * @returns {Promise<string>} Generated description
 */
export const generateProductDescription = async (productInfo) => {
  const messages = [
    {
      role: 'system',
      content:
        'You are a professional copywriter creating compelling product descriptions for fashion e-commerce.',
    },
    {
      role: 'user',
      content: `Create a product description for: ${JSON.stringify(productInfo)}`,
    },
  ];

  return sendChatMessage(messages);
};

/**
 * Chatbot conversation handler
 * @param {Array} conversationHistory - Previous messages
 * @param {string} userMessage - New user message
 * @returns {Promise<string>} Bot response
 */
export const chatWithBot = async (conversationHistory, userMessage) => {
  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful customer service assistant for GZMart, a fashion e-commerce platform. Help customers with product inquiries, order tracking, and general questions.',
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  return sendChatMessage(messages);
};

export const openAIService = {
  sendChatMessage,
  getProductRecommendation,
  generateProductDescription,
  chatWithBot,
};

export default openAIService;
