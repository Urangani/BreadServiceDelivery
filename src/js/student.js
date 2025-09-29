// Application State
let currentUser = null;
let currentPage = 'dashboard';
let cart = [];

let inventory = [];
let sales = [];

// Real-time listeners
let productsUnsubscribe;
let ordersUnsubscribe;

// User roles and their accessible pages for student
const userRoles = {
    student: ['dashboard', 'products', 'cart', 'payment']
};

// Initialize the application
function init() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                if (currentUser.role !== 'student') {
                    window.location.href = '../index.html';
                    return;
                }
                document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name || currentUser.username}!`;
                setupEventListeners();
                setupNavigation();
                setupRealtimeListeners();
                loadPage('dashboard');
            } else {
                window.location.href = '../index.html';
            }
        } else {
            window.location.href = '../index.html';
        }
    });
}

// Set up real-time listeners for Firestore
function setupRealtimeListeners() {
    // Products listener (read-only for student)
    productsUnsubscribe = db.collection('products').onSnapshot((snapshot) => {
        inventory = [];
        snapshot.forEach((doc) => {
            inventory.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'products') loadProducts();
    });

    // Orders listener (own orders)
    ordersUnsubscribe = db.collection('orders').where('userId', '==', currentUser.uid).onSnapshot((snapshot) => {
        sales = [];
        snapshot.forEach((doc) => {
            sales.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'dashboard') {
            updateDashboardStats();
            loadRecentActivity();
        }
    });
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
    // Calculate stats from sales array
    const totalSpent = sales.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = sales.length;
    const pendingOrders = sales.filter(order => order.status === 'pending').length;
    const completedOrders = sales.filter(order => order.status === 'completed').length;

    // Update stats display
    document.getElementById('totalRevenue').textContent = 'R' + totalSpent.toFixed(2);
    document.getElementById('totalSales').textContent = totalOrders.toString();
    document.getElementById('totalStock').textContent = pendingOrders.toString();
    document.getElementById('pendingDeliveries').textContent = completedOrders.toString();
}

function loadRecentActivity() {
    const activityTable = document.getElementById('recentActivity');

    // Get recent orders (last 5)
    const recentOrders = sales.slice(-5).reverse();

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
            <div class="product-image">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` : ''}
                <span style="display: ${product.imageUrl ? 'none' : 'block'}">🍞</span>
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <div class="product-price">R${product.price.toFixed(2)}</div>
                <div class="stock-badge ${getStockClass(product.stock)}">${getStockStatus(product.stock)}</div>
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addToCart('${product.id}')">Add to Cart</button>
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
                <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                <span style="margin: 0 1rem;">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                <button class="btn btn-danger" style="margin-left: 1rem;" onclick="removeFromCart('${item.id}')">Remove</button>
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

async function handlePayment(e) {
    e.preventDefault();

    const address = e.target.querySelector('textarea').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        // Create new order
        const newOrder = {
            userId: currentUser.uid,
            customer: currentUser.username,
            items: cart.map(item => `${item.name} x${item.quantity}`).join(', '),
            total: total,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await db.collection('orders').add(newOrder);

        // Add to deliveries
        await db.collection('deliveries').add({
            orderId: orderRef.id,
            customer: currentUser.username,
            address: address,
            items: newOrder.items,
            status: 'pending',
            assignedTo: 'Unassigned',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update inventory
        for (const cartItem of cart) {
            const product = inventory.find(p => p.id === cartItem.id);
            if (product) {
                await db.collection('products').doc(cartItem.id).update({
                    stock: product.stock - cartItem.quantity
                });
            }
        }

        // Clear cart
        cart = [];

        alert('Order placed successfully! Order ID: #' + orderRef.id);
        loadPage('dashboard');
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order: ' + error.message);
    }
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
        userId: currentUser.uid,
        username: currentUser.username,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('feedback').add(feedback);
        alert('Feedback submitted successfully!');
        closeModal('feedbackModal');
        e.target.reset();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback: ' + error.message);
    }
}

// Logout function for student
async function logout() {
    try {
        await auth.signOut();
        // Unsubscribe listeners
        if (productsUnsubscribe) productsUnsubscribe();
        if (ordersUnsubscribe) ordersUnsubscribe();
    } catch (error) {
        console.error('Error signing out:', error);
    }
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
