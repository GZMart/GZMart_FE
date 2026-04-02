import socketService from './socket/socketService';

// Compatibility export: keep new imports working while reusing the legacy singleton.
export const socket = socketService.getSocket();

export default socket;
