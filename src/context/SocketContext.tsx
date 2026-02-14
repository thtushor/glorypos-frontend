import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../api/api';

// Derive SOCKET_URL from BASE_URL (remove /api suffix)
const SOCKET_URL = BASE_URL.replace('/api', '');

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    transport: string;
    joinShop: (shopId: string | number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const { user } = useAuth();

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SOCKET_URL, {
            reconnectionAttempts: Infinity, // Never give up
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling'], // Prefer websocket
            autoConnect: true,
        });

        setSocket(newSocket);

        // Event listeners
        function onConnect() {
            setIsConnected(true);
            setTransport(newSocket.io.engine.transport.name);

            newSocket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });

            console.log("Socket Connected:", newSocket.id);
        }

        function onDisconnect(reason: string) {
            setIsConnected(false);
            setTransport("N/A");
            console.log("Socket Disconnected:", reason);
        }

        function onConnectError(err: Error) {
            console.error("Socket Connection Error:", err.message);
        }

        newSocket.on('connect', onConnect);
        newSocket.on('disconnect', onDisconnect);
        newSocket.on('connect_error', onConnectError);

        // Cleanup
        return () => {
            newSocket.off('connect', onConnect);
            newSocket.off('disconnect', onDisconnect);
            newSocket.off('connect_error', onConnectError);
            newSocket.disconnect();
        };
    }, []);

    // Handle joining shop room when user matches
    useEffect(() => {
        if (socket && isConnected && user) {
            let shopId;
            // Logic to determine Shop ID from user object
            // Assuming user.id is the shop owner ID if accountType is 'shop'
            // Or user.parentShop.id if accountType is 'staff' (needs verification from AuthContext structure)

            if (user.accountType === 'shop' || user.accountType === 'super admin') {
                shopId = user.id;
            } else if (user.parentShop) {
                // Depending on how parentShop is stored (object or ID)
                shopId = typeof user.parentShop === 'object' ? user.parentShop.id : user.parentShop;
            }

            if (shopId) {
                console.log("Joining shop room:", shopId);
                socket.emit('join-shop', shopId);
            }
        }
    }, [socket, isConnected, user]);

    const joinShop = (shopId: string | number) => {
        if (socket && isConnected) {
            socket.emit('join-shop', shopId);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, transport, joinShop }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
