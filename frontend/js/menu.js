// Menu functionality
let menuItems = [];
let currentCategory = 'all';

async function initializeMenu(tableNumber) {
    try {
        await loadMenuItems();
        await loadCategories();
        renderMenuItems();
    } catch (error) {
        console.error('Error initializing menu:', error);
        showError('Failed to load menu. Please refresh the page.');
    }
}

async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu?available=true');
        const data = await response.json();
        
        if (data.success) {
            menuItems = data.data;
        } else {
            throw new Error(data.message || 'Failed to load menu items');
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        throw error;
    }
}

async function loadCategories() {
    try {
        // Extract unique categories from menu items
        const categories = [...new Set(menuItems.map(item => item.category))];
        const categoriesContainer = document.getElementById('categories');
        
        // Clear existing categories except "All Items"
        const allButton = categoriesContainer.querySelector('[data-category="all"]');
        categoriesContainer.innerHTML = '';
        categoriesContainer.appendChild(allButton);
        
        // Add category buttons
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.setAttribute('data-category', category);
            button.textContent = formatCategoryName(category);
            button.addEventListener('click', () => filterByCategory(category));
            categoriesContainer.appendChild(button);
        });
        
        // Add event listener for "All Items" button
        allButton.addEventListener('click', () => filterByCategory('all'));
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function formatCategoryName(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function filterByCategory(category) {
    currentCategory = category;
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    renderMenuItems();
}

function renderMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    const emptyMenu = document.getElementById('empty-menu');
    
    // Filter items based on current category
    const filteredItems = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === currentCategory);
    
    if (filteredItems.length === 0) {
        menuGrid.style.display = 'none';
        emptyMenu.style.display = 'block';
        return;
    }
    
    menuGrid.style.display = 'grid';
    emptyMenu.style.display = 'none';
    
    menuGrid.innerHTML = filteredItems.map(item => createMenuItemHTML(item)).join('');
    
    // Add event listeners for quantity controls
    addQuantityControlListeners();
}

function createMenuItemHTML(item) {
    const cartItem = getCartItem(item._id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    return `
        <div class="menu-item" data-item-id="${item._id}">
            <div class="menu-item-image">
                ${item.image && item.image !== '/images/default-food.jpg' 
                    ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                    : `<span>🍽️ ${item.name}</span>`
                }
            </div>
            <div class="menu-item-content">
                <h3>${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-item-id="${item._id}" ${quantity === 0 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display" id="quantity-${item._id}">${quantity}</span>
                        <button class="quantity-btn plus" data-item-id="${item._id}">+</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addQuantityControlListeners() {
    // Plus buttons
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            const item = menuItems.find(i => i._id === itemId);
            if (item) {
                addToCart(item);
                updateQuantityDisplay(itemId);
            }
        });
    });
    
    // Minus buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            removeFromCart(itemId);
            updateQuantityDisplay(itemId);
        });
    });
}

function updateQuantityDisplay(itemId) {
    const cartItem = getCartItem(itemId);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    const quantityDisplay = document.getElementById(`quantity-${itemId}`);
    const minusBtn = document.querySelector(`.quantity-btn.minus[data-item-id="${itemId}"]`);
    
    if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
    }
    
    if (minusBtn) {
        minusBtn.disabled = quantity === 0;
    }
}

function showError(message) {
    const menuGrid = document.getElementById('menu-grid');
    menuGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Search functionality (optional enhancement)
function searchMenuItems(query) {
    if (!query.trim()) {
        renderMenuItems();
        return;
    }
    
    const searchResults = menuItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );
    
    const menuGrid = document.getElementById('menu-grid');
    
    if (searchResults.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No results found</h3>
                <p>Try searching with different keywords.</p>
            </div>
        `;
        return;
    }
    
    menuGrid.innerHTML = searchResults.map(item => createMenuItemHTML(item)).join('');
    addQuantityControlListeners();
}