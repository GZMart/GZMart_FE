/**
 * AI Services Index
 * Centralized export for all AI integrations
 */

export { default as googleVisionService } from './googleVisionService';
export { default as openAIService } from './openAIService';
export { default as geminiService } from './geminiService';

// AI Service Factory - Use environment variable to switch between AI providers
export const getAIService = () => {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'openai';

  switch (provider) {
    case 'gemini':
      return require('./geminiService').default;
    case 'openai':
    default:
      return require('./openAIService').default;
  }
};

export default {
  googleVisionService,
  openAIService,
  geminiService,
  getAIService,
};
