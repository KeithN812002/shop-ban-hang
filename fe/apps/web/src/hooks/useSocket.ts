import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket, socketHelpers } from '@/lib/socket'
import { useAuth } from '@/providers/AuthProvider'

export function useSocket(): { socket: Socket | null } & typeof socketHelpers {
    const { token, isAuthenticated } = useAuth()
    const socketRef = useRef(getSocket())

    useEffect(() => {
        if (isAuthenticated && token) {
            // Connect socket with token
            const socket = connectSocket(token)
            socketRef.current = socket
        }

        return () => {
            // Disconnect on unmount
            disconnectSocket()
        }
    }, [isAuthenticated, token])

    return {
        socket: socketRef.current,
        ...socketHelpers,
    }
}

export default useSocket
