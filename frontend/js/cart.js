// Cart functionality
let cart = [];

function initializeCart() {
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('restaurant-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
    
    // Add event listeners
    document.getElementById('cart-toggle').addEventListener('click', toggleCart);
    document.getElementById('cart-close').addEventListener('click', closeCart);
    document.getElementById('confirm-order').addEventListener('click', confirmOrder);
    
    // Close cart when clicking outside
    document.getElementById('cart-sidebar').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCart();
        }
    });
}

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: item._id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartDisplay();
    showCartAnimation();
}

function removeFromCart(itemId) {
    const itemIndex = cart.findIndex(item => item._id === itemId);
    
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        
        saveCart();
        updateCartDisplay();
    }
}

function getCartItem(itemId) {
    return cart.find(item => item._id === itemId);
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('restaurant-cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartBadge = document.getElementById('cart-badge');
    
    // Update cart badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
    
    // Update cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-state">
                <h4>Your cart is empty</h4>
                <p>Add some delicious items to get started!</p>
            </div>
        `;
        cartTotal.style.display = 'none';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => createCartItemHTML(item)).join('');
    cartTotal.style.display = 'block';
    
    // Update total amount
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('total-amount').textContent = totalAmount.toFixed(2);
    
    // Add event listeners for cart item controls
    addCartItemListeners();
}

function createCartItemHTML(item) {
    return `
        <div class="cart-item" data-item-id="${item._id}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn minus" data-item-id="${item._id}">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn plus" data-item-id="${item._id}">+</button>
            </div>
        </div>
    `;
}

function addCartItemListeners() {
    // Plus buttons in cart
    document.querySelectorAll('#cart-items .quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            const menuItem = menuItems.find(i => i._id === itemId);
            if (menuItem) {
                addToCart(menuItem);
                // Update menu display if item is visible
                updateQuantityDisplay(itemId);
            }
        });
    });
    
    // Minus buttons in cart
    document.querySelectorAll('#cart-items .quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            removeFromCart(itemId);
            // Update menu display if item is visible
            updateQuantityDisplay(itemId);
        });
    });
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('open');
}

function closeCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.remove('open');
}

function showCartAnimation() {
    const cartToggle = document.getElementById('cart-toggle');
    cartToggle.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartToggle.style.transform = 'scale(1)';
    }, 200);
}

async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-order');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Placing Order...';
    confirmBtn.disabled = true;
    
    try {
        const tableNumber = getTableNumberFromURL();
        const customerNotes = document.getElementById('customer-notes').value.trim();
        
        const orderData = {
            tableNumber: parseInt(tableNumber),
            items: cart.map(item => ({
                menuItemId: item._id,
                quantity: item.quantity
            })),
            customerNotes: customerNotes
        };
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show order confirmation modal
            showOrderConfirmation(result.data);
            closeCart();
            showNotification('Order placed successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to place order');
        }
        
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order. Please try again.', 'error');
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

function showOrderConfirmation(order) {
    const modal = document.getElementById('order-modal');
    const orderNumberDisplay = document.getElementById('order-number-display');
    const orderTotalDisplay = document.getElementById('order-total-display');
    
    orderNumberDisplay.textContent = order.orderNumber;
    orderTotalDisplay.textContent = order.totalAmount.toFixed(2);
    
    modal.style.display = 'flex';
}

// Utility functions for cart management
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function isItemInCart(itemId) {
    return cart.some(item => item._id === itemId);
}

function getCartItemQuantity(itemId) {
    const item = cart.find(item => item._id === itemId);
    return item ? item.quantity : 0;
}

// Initialize socket connection for table
function initializeSocket() {
    if (typeof CustomerSocket !== 'undefined') {
        const tableNumber = getTableNumber();
        CustomerSocket.init(tableNumber);
        
        // Listen for order ready notifications
        CustomerSocket.onOrderReady((data) => {
            if (data.tableNumber === tableNumber) {
                showOrderReadyNotification(data);
            }
        });
        
        // Listen for connection status changes
        CustomerSocket.onConnectionChange((status) => {
            if (typeof SocketUtils !== 'undefined') {
                SocketUtils.showConnectionStatus(status.connected);
            }
        });
    }
}

// Show order ready notification
function showOrderReadyNotification(data) {
    showNotification(`🎉 Your order #${data.orderNumber} is ready for pickup!`, 'success');
    
    // Play notification sound if available
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
        console.log('Audio notification not available');
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    initializeSocket(); // Initialize socket connection
    
    // Close cart when clicking outside
    document.addEventListener('click', function(e) {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartButton = document.querySelector('.cart-button');
        
        if (!cartSidebar.contains(e.target) && !cartButton.contains(e.target)) {
            cartSidebar.classList.remove('open');
        }
    });
});

// Auto-save cart periodically
setInterval(saveCart, 30000); // Save every 30 seconds

// Handle page visibility change to save cart
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        saveCart();
    }
});

// Handle page unload to save cart
window.addEventListener('beforeunload', function() {
    saveCart();
});