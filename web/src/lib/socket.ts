import { io } from 'socket.io-client'

const URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://realtime-api-nykk.onrender.com'

const socket = io(URL, {
  transports: ['websocket', 'polling'],
})

export default socket