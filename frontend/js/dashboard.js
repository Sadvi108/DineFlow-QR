// Dashboard functionality for kitchen/counter staff
let socket;
let orders = [];
let filteredOrders = [];

// Initialize dashboard
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Initialize Socket.io connection
    initializeSocket();
    
    // Load initial data
    loadOrders();
    loadStatistics();
    
    // Update last updated time
    updateLastUpdated();
}

// Initialize Socket.io connection
function initializeSocket() {
    if (typeof DashboardSocket !== 'undefined') {
        DashboardSocket.init();
        
        // Listen for new orders
        DashboardSocket.onNewOrder((order) => {
            console.log('New order received:', order);
            showNotification(`New order #${order.orderNumber} from Table ${order.tableNumber}`, 'success');
            addOrderToList(order);
            loadStatistics(); // Refresh stats
        });
        
        // Listen for order status updates
        DashboardSocket.onOrderStatusUpdate((data) => {
            console.log('Order status updated:', data);
            updateOrderInList(data.orderId, data.status);
            showNotification(`Order #${data.orderNumber} status updated to ${data.status}`, 'info');
            loadStatistics(); // Refresh stats
        });
        
        // Listen for payment status updates
        DashboardSocket.onPaymentStatusUpdate((data) => {
            console.log('Payment status updated:', data);
            updateOrderPaymentStatus(data.orderId, data.paymentStatus);
            showNotification(`Order #${data.orderNumber} payment status: ${data.paymentStatus}`, 'info');
        });
        
        // Listen for order cancellations
        DashboardSocket.onOrderCancelled((data) => {
            console.log('Order cancelled:', data);
            updateOrderInList(data.orderId, 'cancelled');
            showNotification(`Order #${data.orderNumber} has been cancelled`, 'warning');
            loadStatistics(); // Refresh stats
        });
        
        // Listen for connection status changes
        DashboardSocket.onConnectionChange((status) => {
            if (typeof SocketUtils !== 'undefined') {
                SocketUtils.showConnectionStatus(status.connected);
            }
            
            if (status.connected) {
                showNotification('Connected to server', 'success');
            } else {
                showNotification('Disconnected from server', 'error');
            }
        });
    } else {
        console.warn('DashboardSocket not available, falling back to basic functionality');
    }
}

// Load all orders
async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const result = await response.json();
        orders = result.data || [];
        filteredOrders = [...orders];
        renderOrders();
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders', 'error');
        document.getElementById('orders-grid').innerHTML = `
            <div class="error-state">
                <h3>Error loading orders</h3>
                <p>Please check your connection and try again.</p>
                <button class="btn" onclick="loadOrders()">Retry</button>
            </div>
        `;
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/orders/stats');
        if (!response.ok) throw new Error('Failed to fetch statistics');
        
        const result = await response.json();
        updateStatistics(result.data);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update statistics display
function updateStatistics(stats) {
    document.getElementById('total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('pending-orders').textContent = stats.pendingOrders || 0;
    document.getElementById('preparing-orders').textContent = stats.preparingOrders || 0;
    document.getElementById('ready-orders').textContent = stats.readyOrders || 0;
}

// Render orders
function renderOrders() {
    const ordersGrid = document.getElementById('orders-grid');
    const emptyState = document.getElementById('empty-orders');
    
    if (filteredOrders.length === 0) {
        ordersGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    ordersGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Sort orders by creation time (newest first)
    const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ordersGrid.innerHTML = sortedOrders.map(order => createOrderCard(order)).join('');
}

// Create order card HTML
function createOrderCard(order) {
    const statusColors = {
        pending: '#ff9800',
        preparing: '#2196f3',
        ready: '#4caf50',
        completed: '#9e9e9e',
        cancelled: '#f44336'
    };
    
    const statusColor = statusColors[order.status] || '#9e9e9e';
    const createdTime = new Date(order.createdAt).toLocaleTimeString();
    
    // Calculate time displays
    let timeDisplay = '';
    let timerElement = '';
    
    if (order.status === 'preparing' && order.preparationStartTime && order.estimatedCompletionTime) {
        const now = new Date();
        const startTime = new Date(order.preparationStartTime);
        const estimatedEnd = new Date(order.estimatedCompletionTime);
        const elapsed = Math.floor((now - startTime) / (1000 * 60)); // minutes elapsed
        const remaining = Math.floor((estimatedEnd - now) / (1000 * 60)); // minutes remaining
        
        timeDisplay = `Started ${elapsed}m ago • ${Math.max(0, remaining)}m remaining`;
        timerElement = `
            <div class="preparation-timer" data-order-id="${order._id}" data-estimated-end="${order.estimatedCompletionTime}">
                <div class="timer-progress">
                    <div class="progress-bar" style="width: ${Math.min(100, (elapsed / order.estimatedTime) * 100)}%"></div>
                </div>
                <div class="timer-text">${timeDisplay}</div>
            </div>
        `;
    } else {
        const estimatedTime = order.estimatedTime ? `${order.estimatedTime} min` : 'N/A';
        timeDisplay = `Est. ${estimatedTime}`;
    }
    
    return `
        <div class="order-card" data-order-id="${order._id}" data-status="${order.status}">
            <div class="order-header">
                <div>
                    <h3>Order #${order.orderNumber}</h3>
                    <p>Table ${order.tableNumber} • ${createdTime}</p>
                </div>
                <div class="order-status" style="background-color: ${statusColor}">
                    ${order.status.toUpperCase()}
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            ${timerElement}
            
            <div class="order-footer">
                <div class="order-total">
                    <strong>Total: $${order.totalAmount.toFixed(2)}</strong>
                    <small>${timeDisplay}</small>
                </div>
                <div class="order-actions">
                    ${getStatusButtons(order)}
                    <button class="btn btn-secondary" onclick="showOrderDetails('${order._id}')">
                        Details
                    </button>
                </div>
            </div>
            
            ${order.customerNotes ? `
                <div class="order-notes">
                    <strong>Notes:</strong> ${order.customerNotes}
                </div>
            ` : ''}
            
            <div class="payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">
                Payment: ${order.paymentStatus.toUpperCase()}
                ${order.paymentStatus === 'unpaid' ? `
                    <button class="btn btn-small" onclick="updatePaymentStatus('${order._id}', 'paid')">
                        Mark Paid
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Update preparation timers
function updatePreparationTimers() {
    const timers = document.querySelectorAll('.preparation-timer');
    timers.forEach(timer => {
        const orderId = timer.dataset.orderId;
        const estimatedEnd = new Date(timer.dataset.estimatedEnd);
        const now = new Date();
        
        const order = orders.find(o => o._id === orderId);
        if (!order || !order.preparationStartTime) return;
        
        const startTime = new Date(order.preparationStartTime);
        const elapsed = Math.floor((now - startTime) / (1000 * 60)); // minutes elapsed
        const remaining = Math.floor((estimatedEnd - now) / (1000 * 60)); // minutes remaining
        
        const timeText = timer.querySelector('.timer-text');
        const progressBar = timer.querySelector('.progress-bar');
        
        if (timeText) {
            timeText.textContent = `Started ${elapsed}m ago • ${Math.max(0, remaining)}m remaining`;
        }
        
        if (progressBar && order.estimatedTime) {
            const progress = Math.min(100, (elapsed / order.estimatedTime) * 100);
            progressBar.style.width = `${progress}%`;
            
            // Change color based on progress
            if (progress > 90) {
                progressBar.style.backgroundColor = '#f44336'; // Red - overdue
            } else if (progress > 75) {
                progressBar.style.backgroundColor = '#ff9800'; // Orange - almost due
            } else {
                progressBar.style.backgroundColor = '#4caf50'; // Green - on time
            }
        }
    });
}

// Start timer updates
function startTimerUpdates() {
    // Update timers every 30 seconds
    setInterval(updatePreparationTimers, 30000);
}

// Initialize dashboard with timer updates
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    startTimerUpdates();
});

// Get status buttons based on current status
function getStatusButtons(order) {
    const buttons = [];
    
    switch (order.status) {
        case 'pending':
            buttons.push(`<button class="btn btn-primary" onclick="updateOrderStatus('${order._id}', 'preparing')">Start Preparing</button>`);
            buttons.push(`<button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">Cancel</button>`);
            break;
        case 'preparing':
            buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'ready')">Mark Ready</button>`);
            break;
        case 'ready':
            buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">Complete</button>`);
            break;
        case 'completed':
        case 'cancelled':
            // No action buttons for completed/cancelled orders
            break;
    }
    
    return buttons.join('');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update order status');
        
        const updatedOrder = await response.json();
        updateOrderInList(orderId, newStatus);
        showNotification(`Order status updated to ${newStatus}`, 'success');
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Failed to update order status', 'error');
    }
}

// Update payment status
async function updatePaymentStatus(orderId, paymentStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update payment status');
        
        updateOrderPaymentStatus(orderId, paymentStatus);
        showNotification(`Payment status updated to ${paymentStatus}`, 'success');
        
    } catch (error) {
        console.error('Error updating payment status:', error);
        showNotification('Failed to update payment status', 'error');
    }
}

// Add new order to the list
function addOrderToList(order) {
    orders.unshift(order); // Add to beginning
    applyFilters();
    renderOrders();
}

// Update order in the list
function updateOrderInList(orderId, newStatus) {
    const orderIndex = orders.findIndex(order => order._id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        applyFilters();
        renderOrders();
    }
}

// Update order payment status in the list
function updateOrderPaymentStatus(orderId, paymentStatus) {
    const orderIndex = orders.findIndex(order => order._id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].paymentStatus = paymentStatus;
        applyFilters();
        renderOrders();
    }
}

// Filter orders by status
function filterOrders() {
    applyFilters();
    renderOrders();
}

// Search orders
function searchOrders() {
    applyFilters();
    renderOrders();
}

// Apply all filters
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-order').value.toLowerCase();
    
    filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch = !searchTerm || 
            order.orderNumber.toString().includes(searchTerm) ||
            order.tableNumber.toString().includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });
}

// Show order details modal
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Failed to fetch order details');
        
        const order = await response.json();
        displayOrderDetails(order);
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Failed to load order details', 'error');
    }
}

// Display order details in modal
function displayOrderDetails(order) {
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    const createdTime = new Date(order.createdAt).toLocaleString();
    const estimatedTime = order.estimatedTime ? `${order.estimatedTime} minutes` : 'Not specified';
    
    content.innerHTML = `
        <div class="order-details">
            <div class="detail-section">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> #${order.orderNumber}</p>
                <p><strong>Table Number:</strong> ${order.tableNumber}</p>
                <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></p>
                <p><strong>Payment:</strong> <span class="payment-badge ${order.paymentStatus}">${order.paymentStatus.toUpperCase()}</span></p>
                <p><strong>Created:</strong> ${createdTime}</p>
                <p><strong>Estimated Time:</strong> ${estimatedTime}</p>
            </div>
            
            <div class="detail-section">
                <h3>Ordered Items</h3>
                <div class="items-list">
                    ${order.items.map(item => `
                        <div class="item-detail">
                            <div class="item-info">
                                <h4>${item.menuItem.name}</h4>
                                <p>${item.menuItem.description || ''}</p>
                                <p><strong>Quantity:</strong> ${item.quantity}</p>
                                <p><strong>Unit Price:</strong> $${item.price.toFixed(2)}</p>
                                <p><strong>Subtotal:</strong> $${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Order Total</h3>
                <p class="total-amount"><strong>$${order.totalAmount.toFixed(2)}</strong></p>
            </div>
            
            ${order.customerNotes ? `
                <div class="detail-section">
                    <h3>Customer Notes</h3>
                    <p class="customer-notes">${order.customerNotes}</p>
                </div>
            ` : ''}
            
            <div class="detail-actions">
                <div class="status-actions">
                    <h4>Update Status:</h4>
                    ${getStatusButtons(order)}
                </div>
                ${order.paymentStatus === 'unpaid' ? `
                    <div class="payment-actions">
                        <h4>Payment:</h4>
                        <button class="btn btn-success" onclick="updatePaymentStatus('${order._id}', 'paid'); closeOrderDetails();">
                            Mark as Paid
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Refresh orders
function refreshOrders() {
    showNotification('Refreshing orders...', 'info');
    loadOrders();
    loadStatistics();
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.querySelector('#last-updated span').textContent = timeString;
}

// Export functions for global access
window.updateOrderStatus = updateOrderStatus;
window.updatePaymentStatus = updatePaymentStatus;
window.showOrderDetails = showOrderDetails;
window.refreshOrders = refreshOrders;
window.filterOrders = filterOrders;
window.searchOrders = searchOrders;