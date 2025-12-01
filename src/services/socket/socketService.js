import { io } from 'socket.io-client';
import { getAuthToken } from '@utils/storage';
import { SOCKET_EVENTS } from '@constants';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket.io Client Service
 * For real-time notifications and updates
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Connect to socket server
   */
  connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = getAuthToken();

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.isConnected = true;
      console.log('✅ Socket connected');
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      this.isConnected = false;
      console.log('❌ Socket disconnected');
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Listen to event from server
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
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
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
