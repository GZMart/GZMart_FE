const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const MAX_HISTORY_TURNS = 10;
const REQUEST_TIMEOUT_MS = 120000;

class AIChatService {
  constructor() {
    this.conversationId = null;
    this.storageKey = 'ai_chat_messages';
    this.userId = null;
    this.abortController = null;
  }

  setUserId(userId) {
    this.userId = userId;
    this.storageKey = `ai_chat_messages_${userId}`;
  }

  saveMessages(messages) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }

  loadMessages() {
    try {
      const messages = localStorage.getItem(this.storageKey);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  }

  clearMessages() {
    try {
      localStorage.removeItem(this.storageKey);
      this.conversationId = null;
    } catch (error) {
      console.error('Error clearing messages from localStorage:', error);
    }
  }

  cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  buildConversationHistory(currentMessages) {
    const relevant = currentMessages
      .filter((m) => m.role === 'user' || (m.role === 'ai' && m.content && !m.isStreaming))
      .slice(-(MAX_HISTORY_TURNS * 2));

    return relevant.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));
  }

  async sendMessage(message, onStream, onComplete, onError, currentMessages = [], onThinking) {
    this.cancelRequest();
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), REQUEST_TIMEOUT_MS);

    try {
      const conversationHistory = this.buildConversationHistory(currentMessages);

      const response = await fetch(`${API_BASE_URL}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: this.conversationId || null,
          conversationHistory,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'message') {
              fullResponse += data.content;
              onStream(data.content);
            } else if (data.type === 'final') {
              clearTimeout(timeoutId);
              const finalResponse = data.content.final_response;
              this.conversationId = data.content.conversation_id || this.conversationId;
              onComplete(finalResponse, data.content);
              return;
            } else if (data.type === 'error') {
              throw new Error(data.content || 'AI encountered an error');
            } else if (data.type === 'thinking') {
              if (onThinking) {
onThinking(data.content);
}
            } else if (data.type === 'heartbeat') {
              // keep-alive, no action needed
            }
          } catch (parseError) {
            if (parseError.message?.includes('AI encountered')) {
              throw parseError;
            }
            console.warn('Failed to parse JSON line:', line);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('AI Chat request timed out');
        onError(new Error('Yêu cầu đã quá thời gian chờ. Vui lòng thử lại.'));
      } else {
        console.error('AI Chat API Error:', error);
        onError(error);
      }
    } finally {
      clearTimeout(timeoutId);
      this.abortController = null;
    }
  }
}

const aiChatService = new AIChatService();
export default aiChatService;
