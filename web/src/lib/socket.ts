import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL ?? 'https://realtime-api-nykk.onrender.com';

const socket = URL ? io(URL) : io();

export default socket;