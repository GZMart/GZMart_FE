/* eslint-disable no-console */
import { io } from 'socket.io-client';
import { getAuthToken } from '@utils/storage';
import { SOCKET_EVENTS } from '@constants';

const resolveSocketUrl = () => {
  const stripApiSuffix = (value) => value.replace(/\/+$/, '').replace(/\/api(?:\/v\d+)?$/i, '');

  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl) {
    return explicitSocketUrl.replace(/\/+$/, '');
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    const trimmed = apiBaseUrl.trim();

    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        const pathname = stripApiSuffix(parsed.pathname || '');
        return `${parsed.origin}${pathname}`.replace(/\/+$/, '');
      } catch (_error) {
        return stripApiSuffix(trimmed);
      }
    }

    return stripApiSuffix(trimmed);
  }

  return 'http://localhost:3000';
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (_error) {
    return null;
  }
};

const getUserIdFromToken = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return payload._id || payload.id || payload.userId || payload.sub || null;
};

/**
 * Socket.io Client Service
 * For real-time notifications and updates
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.socketURL = resolveSocketUrl();
    this.listenersBound = false;
  }

  /**
   * Connect to socket server
   */
  connect(userId) {
    const token = getAuthToken();
    this.userId = userId || this.userId || getUserIdFromToken(token);

    console.log(
      '[SocketService] connect() called, userId:',
      this.userId,
      'socketURL:',
      this.socketURL
    );

    if (this.socket?.connected) {
      console.log('[SocketService] Already connected, socket.id:', this.socket.id);
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      return this.socket;
    }

    if (this.socket) {
      console.log('[SocketService] Socket exists but disconnected, reconnecting...');
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    console.log('[SocketService] Creating new socket connection to:', this.socketURL);
    this.socket = io(this.socketURL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    if (!this.socket || this.listenersBound) {
      return;
    }

    this.listenersBound = true;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.isConnected = true;
      console.log('[SocketService] ✅ Connected! socket.id:', this.socket.id);

      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.isConnected = false;
      console.log('[SocketService] ❌ Disconnected, reason:', reason);
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('[SocketService] Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listenersBound = false;
    }
  }

  /**
   * Get active socket instance (auto-connect if needed)
   */
  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  /**
   * Attach user room after login/profile load
   * @param {string} userId
   */
  setUserId(userId) {
    this.userId = userId || null;
    if (this.userId && this.socket?.connected) {
      this.joinUserRoom(this.userId);
    }
  }

  /**
   * Join user room
   * @param {string} userId
   */
  joinUserRoom(userId) {
    this.userId = userId || this.userId;
    if (this.socket && this.userId) {
      this.socket.emit('join_user_room', this.userId);
    }
  }

  /**
   * Join conversation room
   * @param {string} conversationId
   */
  joinConversation(conversationId) {
    if (this.socket && conversationId) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  /**
   * Emit event to server
   * Waits for the socket to be connected before emitting.
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return;
    }
    // Queue: retry once when connected, then clean up the listener
    let fired = false;
    const retry = () => {
      if (fired) {
return;
}
      fired = true;
      if (this.socket?.connected) {
        this.socket.emit(event, data);
      }
      this.socket?.off(SOCKET_EVENTS.CONNECT, retry);
    };
    this.socket?.on(SOCKET_EVENTS.CONNECT, retry);
  }

  /**
   * Listen to event from server
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    const socket = this.getSocket();
    console.log(
      '[SocketService] Registering listener for:',
      event,
      'socket connected:',
      socket?.connected
    );
    socket?.on(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function (optional)
   */
  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Join a room
   * @param {string} room - Room name
   */
  joinRoom(room) {
    this.emit('join_room', { room });
  }

  /**
   * Leave a room
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    this.emit('leave_room', { room });
  }

  /**
   * Subscribe to order updates
   * @param {Function} callback - Callback for order updates
   */
  subscribeToOrderUpdates(callback) {
    this.on('new_order', callback);
    this.on('seller:new-order', callback);
    this.on('order_updated', callback);
    this.on(SOCKET_EVENTS.NEW_ORDER, callback);
    this.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, callback);
  }

  /**
   * Subscribe to inventory updates
   * @param {Function} callback - Callback for inventory updates
   */
  subscribeToInventoryUpdates(callback) {
    this.on(SOCKET_EVENTS.INVENTORY_UPDATED, callback);
  }

  /**
   * Subscribe to notifications
   * @param {Function} callback - Callback for notifications
   */
  subscribeToNotifications(callback) {
    this.on(SOCKET_EVENTS.NOTIFICATION, callback);
  }

  /**
   * Subscribe to chat messages
   * @param {Function} callback - Callback for new messages
   */
  subscribeToChatMessages(callback) {
    this.on(SOCKET_EVENTS.NEW_MESSAGE, callback);
  }

  /**
   * Send chat message
   * @param {object} message - Message data
   */
  sendChatMessage(message) {
    this.emit('send_message', message);
  }

  // Backward-compatible alias used by old chat pages
  sendMessage(message) {
    this.sendChatMessage(message);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
