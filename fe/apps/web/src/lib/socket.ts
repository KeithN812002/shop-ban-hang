import { io, Socket } from 'socket.io-client'
import { env } from '@/config/env'

// Socket instance
let socket: Socket | null = null

// Socket Configuration
export const socketConfig = {
    url: env.socketUrl,
    options: {
        path: env.socketPath,
        transports: ['websocket', 'polling'],
        autoConnect: false, // Manual connect
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    },
}

// Initialize Socket
export const initSocket = (token?: string): Socket | null => {
    if (socket?.connected) {
        return socket
    }

    const options = {
        ...socketConfig.options,
        auth: token ? { token } : undefined,
    }

    socket = io(socketConfig.url, options)

    // Connection Events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id)
    })

    socket.on('disconnect', reason => {
        console.log('🔌 Socket disconnected:', reason)
    })

    socket.on('connect_error', error => {
        console.error('❌ Socket connection error:', error)
    })

    socket.on('reconnect', attemptNumber => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
    })

    socket.on('reconnect_error', error => {
        console.error('❌ Socket reconnection error:', error)
    })

    socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed')
    })

    return socket
}

// Connect Socket
export const connectSocket = (token?: string): Socket | null => {
    if (!socket) {
        initSocket(token)
    }
    socket?.connect()
    return socket
}

// Disconnect Socket
export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect()
        socket = null
    }
}

// Get Socket Instance
export const getSocket = (): Socket | null => socket

// Socket Event Helpers
export const socketHelpers = {
    // Emit event
    emit: (event: string, data?: any) => {
        socket?.emit(event, data)
    },

    // Listen to event
    on: (event: string, callback: (...args: any[]) => void) => {
        socket?.on(event, callback)
    },

    // Remove listener
    off: (event: string, callback?: (...args: any[]) => void) => {
        if (callback) {
            socket?.off(event, callback)
        } else {
            socket?.off(event)
        }
    },

    // Remove all listeners
    removeAllListeners: () => {
        socket?.removeAllListeners()
    },

    // Check connection status
    isConnected: () => socket?.connected || false,

    // Get socket ID
    getId: () => socket?.id,
}

export { socket }
export default socket
