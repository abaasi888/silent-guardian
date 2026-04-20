import io from 'socket.io-client';
let socket;
export const connectWebSocket = () => { socket = io(import.meta.env.VITE_WS_URL); return socket; };
