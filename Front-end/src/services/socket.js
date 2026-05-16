import { io } from 'socket.io-client';

// In a real production app, this would come from an environment variable
const SOCKET_URL = 'http://localhost:8866';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
});
