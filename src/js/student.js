// Application State
let currentUser = null;
let currentPage = 'dashboard';
let cart = [];

// Mock Data for student (only inventory needed)
let inventory = [
    { id: 1, name: 'White Bread', stock: 50, price: 12.00, description: 'Fresh white bread, perfect for sandwiches' },
    { id: 2, name: 'Whole Wheat Bread', stock: 30, price: 15.00, description: 'Healthy whole wheat bread' },
    { id: 3, name: 'Sourdough Bread', stock: 20, price: 25.00, description: 'Artisan sourdough bread' },
    { id: 4, name: 'Rye Bread', stock: 15, price: 18.00, description: 'Traditional rye bread' },
    { id: 5, name: 'Baguette', stock: 25, price: 20.00, description: 'French baguette' }
];

// User roles and their accessible pages for student
const userRoles = {
    student: ['dashboard', 'products', 'cart', 'payment']
};

// Initialize the application
function init() {
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        if (currentUser.role !== 'student') {
            window.location.href = '../index.html';
            return;
        }
        document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name || currentUser.username}!`;
        setupNavigation();
        loadPage('dashboard');
    } else {
        window.location.href = '../index.html';
        return;
    }

    // Load inventory from localStorage if available
    const storedInventory = localStorage.getItem('inventory');
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
    }

    setupEventListeners();
}

// Event Listeners for student
function setupEventListeners() {
    // Payment form
    document.getElementById('paymentForm').addEventListener('submit', handlePayment);

    // Payment method change
    document.getElementById('paymentMethod').addEventListener('change', function() {
        const cardDetails = document.getElementById('cardDetails');
        cardDetails.style.display = this.value === 'card' ? 'block' : 'none';
    });

    // Feedback form
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmit);
}

// Setup navigation for student
function setupNavigation() {
    const navTabs = document.getElementById('navTabs');
    navTabs.innerHTML = '';

    const pages = userRoles.student;
    const pageNames = {
        dashboard: 'Dashboard',
        products: 'Products',
        cart: 'Cart',
        payment: 'Payment'
    };

    pages.forEach(page => {
        const tab = document.createElement('button');
        tab.className = 'nav-tab';
        tab.textContent = pageNames[page];
        tab.onclick = () => loadPage(page);
        navTabs.appendChild(tab);
    });
}

// Load page content for student
function loadPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    currentPage = pageName;

    // Load page-specific content
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            break;
        case 'cart':
            loadCart();
            break;
        case 'payment':
            loadPayment();
            break;
    }
}

// Dashboard functions
function loadDashboard() {
    updateDashboardStats();
    loadRecentActivity();
}

function updateDashboardStats() {
    // Get user's order history
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const userOrders = sales.filter(order => order.customer === currentUser.username);

    // Calculate stats
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = userOrders.length;
    const pendingOrders = userOrders.filter(order => order.status === 'pending').length;
    const completedOrders = userOrders.filter(order => order.status === 'completed').length;

    // Update stats display
    document.getElementById('totalRevenue').textContent = 'R' + totalSpent.toFixed(2);
    document.getElementById('totalSales').textContent = totalOrders.toString();
    document.getElementById('totalStock').textContent = pendingOrders.toString();
    document.getElementById('pendingDeliveries').textContent = completedOrders.toString();
}

function loadRecentActivity() {
    const activityTable = document.getElementById('recentActivity');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const userOrders = sales.filter(order => order.customer === currentUser.username);

    // Get recent orders (last 5)
    const recentOrders = userOrders.slice(-5).reverse();

    if (recentOrders.length === 0) {
        activityTable.innerHTML = '<tr><td colspan="4">No orders yet</td></tr>';
        return;
    }

    activityTable.innerHTML = recentOrders.map(order => {
        const date = new Date(order.date).toLocaleDateString();
        return `
            <tr>
                <td>${date}</td>
                <td>Order #${order.id}</td>
                <td>R${order.total.toFixed(2)}</td>
                <td><span class="stock-badge ${order.status === 'completed' ? 'stock-in' : 'stock-low'}">${order.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Products functions for student
function loadProducts() {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = inventory.map(product => `
        <div class="product-card">
            <div class="product-image">🍞</div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <div class="product-price">R${product.price.toFixed(2)}</div>
                <div class="stock-badge ${getStockClass(product.stock)}">${getStockStatus(product.stock)}</div>
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function getStockClass(stock) {
    if (stock > 20) return 'stock-in';
    if (stock > 5) return 'stock-low';
    return 'stock-out';
}

function getStockStatus(stock) {
    if (stock > 20) return 'In Stock';
    if (stock > 5) return 'Low Stock';
    return 'Out of Stock';
}

// Cart functions
function addToCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (product && product.stock > 0) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        alert(`${product.name} added to cart!`);
    } else {
        alert('Product out of stock!');
    }
}

function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>R${item.price.toFixed(2)} each</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span style="margin: 0 1rem;">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-danger" style="margin-left: 1rem;" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
            <div>
                <strong>R${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

function updateCartQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            loadCart();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    loadCart();
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    loadPage('payment');
}

// Payment functions
function loadPayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('finalTotal').textContent = total.toFixed(2);
}

function handlePayment(e) {
    e.preventDefault();

    // Create new order
    const newOrder = {
        id: Date.now(),
        customer: currentUser.username,
        items: cart.map(item => `${item.name} x${item.quantity}`).join(', '),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    // Add to sales (mock)
    // Note: sales and deliveries are not defined here, as they are admin/staff, but for demo
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(newOrder);
    localStorage.setItem('sales', JSON.stringify(sales));

    // Add to deliveries
    let deliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
    const address = e.target.querySelector('textarea').value;
    deliveries.push({
        id: newOrder.id,
        customer: currentUser.username,
        address: address,
        items: newOrder.items,
        status: 'pending',
        assignedTo: 'Unassigned'
    });
    localStorage.setItem('deliveries', JSON.stringify(deliveries));

    // Update inventory
    cart.forEach(cartItem => {
        const product = inventory.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.quantity;
        }
    });
    localStorage.setItem('inventory', JSON.stringify(inventory));

    // Clear cart
    cart = [];

    alert('Order placed successfully! Order ID: #' + newOrder.id);
    loadPage('dashboard');
    updateDashboardStats();
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Feedback submission
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feedback = {
        name: formData.get('feedbackName'),
        mobile: formData.get('feedbackMobile'),
        email: formData.get('feedbackEmail'),
        message: formData.get('feedbackMessage'),
        userId: currentUser.username,
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, 'feedback'), feedback);
        alert('Feedback submitted successfully!');
        closeModal('feedbackModal');
        e.target.reset();
    } catch (error) {
        alert('Error submitting feedback: ' + error.message);
    }
}

// Logout function for student
function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Close modals when clicking outside (if any)
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize the application
window.onload = init;
