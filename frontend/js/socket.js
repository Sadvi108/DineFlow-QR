// Socket.io client functionality for real-time communication
class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.callbacks = {};
    }

    // Initialize socket connection
    connect() {
        try {
            this.socket = io({
                transports: ['websocket', 'polling'],
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventListeners();
            return this.socket;
        } catch (error) {
            console.error('Failed to initialize socket connection:', error);
            return null;
        }
    }

    // Setup socket event listeners
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.emit('connection-status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.emit('connection-status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.isConnected = false;
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
                console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
            }
            
            this.emit('connection-error', { error, attempts: this.reconnectAttempts });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.isConnected = true;
            this.emit('reconnected', { attempts: attemptNumber });
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect after maximum attempts');
            this.emit('reconnect-failed');
        });

        // Order-related events
        this.socket.on('new-order', (order) => {
            console.log('New order received:', order);
            this.emit('new-order', order);
        });

        this.socket.on('order-status-updated', (data) => {
            console.log('Order status updated:', data);
            this.emit('order-status-updated', data);
        });

        this.socket.on('payment-status-updated', (data) => {
            console.log('Payment status updated:', data);
            this.emit('payment-status-updated', data);
        });

        this.socket.on('order-cancelled', (data) => {
            console.log('Order cancelled:', data);
            this.emit('order-cancelled', data);
        });

        this.socket.on('order-ready', (data) => {
            console.log('Order ready notification:', data);
            this.emit('order-ready', data);
        });

        // System events
        this.socket.on('system-message', (data) => {
            console.log('System message:', data);
            this.emit('system-message', data);
        });
    }

    // Join a specific room (e.g., table room for notifications)
    joinRoom(roomName) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-room', roomName);
            console.log(`Joined room: ${roomName}`);
        }
    }

    // Leave a specific room
    leaveRoom(roomName) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave-room', roomName);
            console.log(`Left room: ${roomName}`);
        }
    }

    // Send a message to the server
    send(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected. Cannot send:', event, data);
        }
    }

    // Register event callback
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    // Unregister event callback
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    // Emit event to registered callbacks
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for event ${event}:`, error);
                }
            });
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket ? this.socket.id : null,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Manually reconnect
    reconnect() {
        if (this.socket) {
            this.socket.connect();
        } else {
            this.connect();
        }
    }
}

// Create global socket manager instance
const socketManager = new SocketManager();

// Customer-specific socket functions
const CustomerSocket = {
    init(tableNumber) {
        const socket = socketManager.connect();
        if (socket && tableNumber) {
            // Join table-specific room for notifications
            socketManager.joinRoom(`table-${tableNumber}`);
        }
        return socket;
    },

    // Listen for order ready notifications
    onOrderReady(callback) {
        socketManager.on('order-ready', callback);
    },

    // Listen for connection status changes
    onConnectionChange(callback) {
        socketManager.on('connection-status', callback);
    },

    // Send order confirmation
    confirmOrder(orderData) {
        socketManager.send('order-confirmed', orderData);
    }
};

// Dashboard-specific socket functions
const DashboardSocket = {
    init() {
        const socket = socketManager.connect();
        if (socket) {
            // Join dashboard room for all order notifications
            socketManager.joinRoom('dashboard');
        }
        return socket;
    },

    // Listen for new orders
    onNewOrder(callback) {
        socketManager.on('new-order', callback);
    },

    // Listen for order status updates
    onOrderStatusUpdate(callback) {
        socketManager.on('order-status-updated', callback);
    },

    // Listen for payment status updates
    onPaymentStatusUpdate(callback) {
        socketManager.on('payment-status-updated', callback);
    },

    // Listen for order cancellations
    onOrderCancelled(callback) {
        socketManager.on('order-cancelled', callback);
    },

    // Listen for connection status changes
    onConnectionChange(callback) {
        socketManager.on('connection-status', callback);
    },

    // Send status update
    updateOrderStatus(orderId, status) {
        socketManager.send('update-order-status', { orderId, status });
    },

    // Send payment status update
    updatePaymentStatus(orderId, paymentStatus) {
        socketManager.send('update-payment-status', { orderId, paymentStatus });
    }
};

// Utility functions for connection management
const SocketUtils = {
    // Show connection status indicator
    showConnectionStatus(connected, container = document.body) {
        let indicator = container.querySelector('.connection-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'connection-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            container.appendChild(indicator);
        }
        
        if (connected) {
            indicator.textContent = '🟢 Connected';
            indicator.style.backgroundColor = '#4caf50';
            indicator.style.color = 'white';
        } else {
            indicator.textContent = '🔴 Disconnected';
            indicator.style.backgroundColor = '#f44336';
            indicator.style.color = 'white';
        }
    },

    // Show reconnection status
    showReconnectionStatus(attempts, maxAttempts) {
        let status = document.querySelector('.reconnection-status');
        
        if (!status) {
            status = document.createElement('div');
            status.className = 'reconnection-status';
            status.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
                background-color: #ff9800;
                color: white;
                z-index: 1000;
            `;
            document.body.appendChild(status);
        }
        
        if (attempts > 0) {
            status.textContent = `Reconnecting... (${attempts}/${maxAttempts})`;
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    },

    // Remove status indicators
    removeStatusIndicators() {
        const indicators = document.querySelectorAll('.connection-indicator, .reconnection-status');
        indicators.forEach(indicator => indicator.remove());
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { socketManager, CustomerSocket, DashboardSocket, SocketUtils };
} else {
    // Browser environment - attach to window
    window.socketManager = socketManager;
    window.CustomerSocket = CustomerSocket;
    window.DashboardSocket = DashboardSocket;
    window.SocketUtils = SocketUtils;
}