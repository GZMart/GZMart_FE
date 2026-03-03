import { io } from 'socket.io-client';

const getSocketURL = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:3000';
    }
    // Adjust this for production
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

class SocketService {
    constructor() {
        this.socket = null;
        this.socketURL = getSocketURL();
    }

    connect() {
        if (this.socket) return this.socket;

        console.log('Connecting to socket at:', this.socketURL);
        this.socket = io(this.socketURL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        if (!this.socket) return this.connect();
        return this.socket;
    }

    joinUserRoom(userId) {
        if (this.socket && userId) {
            this.socket.emit('join_user_room', userId);
        }
    }
    
    joinConversation(conversationId) {
        if(this.socket && conversationId) {
            this.socket.emit('join_conversation', conversationId);
        }
    }

    sendMessage(message) {
        if (this.socket) {
            this.socket.emit('send_message', message);
        }
    }
}

const socketService = new SocketService();
export default socketService;
