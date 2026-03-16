import { io, Socket } from 'socket.io-client'

// Derive socket URL from API base — just keep the origin (protocol + host + port)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || new URL(API_BASE).origin

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    })
  }
  return socket
}

export function connectSocket(): void {
  const s = getSocket()
  if (!s.connected) s.connect()
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect()
}
