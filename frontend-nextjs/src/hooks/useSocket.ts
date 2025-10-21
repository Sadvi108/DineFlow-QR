'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order, SocketEvents } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError('Failed to connect to server');
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Join table room for table-specific updates
  const joinTable = (tableNumber: number) => {
    if (socketRef.current) {
      socketRef.current.emit('joinTable', tableNumber);
      console.log(`Joined table ${tableNumber}`);
    }
  };

  // Leave table room
  const leaveTable = (tableNumber: number) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveTable', tableNumber);
      console.log(`Left table ${tableNumber}`);
    }
  };

  // Join dashboard room for kitchen staff
  const joinDashboard = () => {
    if (socketRef.current) {
      socketRef.current.emit('joinDashboard');
      console.log('Joined dashboard');
    }
  };

  // Subscribe to order updates
  const onOrderUpdate = (callback: (order: Order) => void) => {
    if (socketRef.current) {
      socketRef.current.on('orderUpdate', callback);
    }
  };

  // Subscribe to new orders (for dashboard)
  const onNewOrder = (callback: (order: Order) => void) => {
    if (socketRef.current) {
      socketRef.current.on('newOrder', callback);
    }
  };

  // Subscribe to order status changes
  const onOrderStatusChanged = (callback: (data: { orderId: string; status: Order['status'] }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('orderStatusChanged', callback);
    }
  };

  // Unsubscribe from events
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  // Emit order status update (for dashboard)
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    if (socketRef.current) {
      socketRef.current.emit('updateOrderStatus', { orderId, status });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinTable,
    leaveTable,
    joinDashboard,
    onOrderUpdate,
    onNewOrder,
    onOrderStatusChanged,
    updateOrderStatus,
    off,
  };
};

export default useSocket;