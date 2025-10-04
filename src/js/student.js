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
    student: ['dashboard', 'products', 'cart', 'payment', 'orderTracking']
};

// Seed default products if none exist
async function seedDefaultProducts() {
    try {
        const productsSnapshot = await db.collection('products').get();
        if (productsSnapshot.empty) {
            const defaultProducts = [
                {
                    name: "Albany White",
                    description: "Fresh Albany white bread",
                    stock: 50,
                    price: 15.99,
                    imageUrl: 'images/products/albany white.jpeg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: "Albany",
                    description: "Fresh Albany bread",
                    stock: 50,
                    price: 17.99,
                    imageUrl: 'images/products/albany.jpeg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: "Brown Loaf",
                    description: "Fresh brown loaf",
                    stock: 50,
                    price: 12.99,
                    imageUrl: 'images/products/brown loaf.webp',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: "Sasko Brown",
                    description: "Fresh Sasko brown bread",
                    stock: 50,
                    price: 18.99,
                    imageUrl: 'images/products/sasko brown.jpg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: "Sasko White",
                    description: "Fresh Sasko white bread",
                    stock: 50,
                    price: 16.99,
                    imageUrl: 'images/products/sasko white.jpg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: "White Loaf",
                    description: "Fresh white loaf",
                    stock: 50,
                    price: 13.99,
                    imageUrl: 'images/products/white loaf.webp',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            ];
            const batch = db.batch();
            defaultProducts.forEach(product => {
                const docRef = db.collection('products').doc();
                batch.set(docRef, product);
            });
            await batch.commit();
            console.log('Default products seeded successfully');
        }
    } catch (error) {
        console.error('Error seeding default products:', error);
    }
}

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
                await seedDefaultProducts();
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
        payment: 'Payment',
        orderTracking: 'Order Tracking'
    };

    pages.forEach(page => {
        const tab = document.createElement('button');
        tab.className = 'nav-tab';
        tab.textContent = pageNames[page];
        tab.onclick = () => loadPage(page);
        navTabs.appendChild(tab);
    });
}

function loadPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Update navigation
    const navTabs = document.getElementById('navTabs');
    if (navTabs) {
        navTabs.style.display = 'flex';
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }
    }

    currentPage = pageName;
    loadPageContent(pageName);
}

function loadPageContent(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            if (inventory.length === 0) {
                // Fetch products if not already loaded
                db.collection('products').get().then(snapshot => {
                    inventory = [];
                    snapshot.forEach(doc => {
                        inventory.push({ id: doc.id, ...doc.data() });
                    });
                    loadProducts();
                }).catch(error => {
                    console.error('Error fetching products:', error);
                });
            } else {
                loadProducts();
            }
            break;
        case 'cart':
            loadCart();
            break;
        case 'payment':
            loadPayment();
            break;
        case 'orderTracking':
            loadOrderTracking();
            break;
    }
}

function loadOrderTracking() {
    const orderTrackingTable = document.getElementById('orderTrackingTable');
    // Sort sales by date descending (most recent first)
    const sortedSales = sales.slice().sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(a.date);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(b.date);
        return dateB - dateA;
    });

    if (sortedSales.length === 0) {
        orderTrackingTable.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
        return;
    }

    orderTrackingTable.innerHTML = sortedSales.map(order => {
        const date = new Date(order.date).toLocaleDateString();
        const actions = order.status === 'delivered' ? `<button class="btn btn-success" onclick="confirmReceipt('${order.id}')">Confirm Receipt</button>` : 'N/A';
        return `
            <tr>
                <td>${date}</td>
                <td>Order #${order.id}</td>
                <td>${order.items}</td>
                <td>R${order.total.toFixed(2)}</td>
                <td><span class="stock-badge ${getOrderStatusClass(order.status)}">${order.status}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
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
        activityTable.innerHTML = '<tr><td colspan="5">No orders yet</td></tr>';
        return;
    }

    activityTable.innerHTML = recentOrders.map(order => {
        const date = new Date(order.date).toLocaleDateString();
        const actions = order.status === 'delivered' ? `<button class="btn btn-success" onclick="confirmReceipt('${order.id}')">Confirm Receipt</button>` : '';
        return `
            <tr>
                <td>${date}</td>
                <td>Order #${order.id}</td>
                <td>R${order.total.toFixed(2)}</td>
                <td><span class="stock-badge ${order.status === 'completed' ? 'stock-in' : 'stock-low'}">${order.status}</span></td>
                <td>${actions}</td>
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

    const paymentMethod = document.getElementById('paymentMethod').value;
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const expiryDate = document.getElementById('expiryDate').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const specialInstructions = document.getElementById('specialInstructions').value.trim();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Basic validation
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }
    if (!address) {
        alert('Please enter a delivery address.');
        return;
    }
    if (paymentMethod === 'card') {
        if (!cardNumber || !expiryDate || !cvv) {
            alert('Please fill in all card details.');
            return;
        }
        // Simple card number validation (length check)
        if (cardNumber.replace(/\s+/g, '').length < 13 || cardNumber.replace(/\s+/g, '').length > 19) {
            alert('Please enter a valid card number.');
            return;
        }
        // Simple expiry date validation MM/YY
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
            alert('Please enter a valid expiry date in MM/YY format.');
            return;
        }
        // Simple CVV validation (3 or 4 digits)
        if (!/^\d{3,4}$/.test(cvv)) {
            alert('Please enter a valid CVV.');
            return;
        }
    }

    // Confirmation alert with order summary
    const confirmMsg = `Please confirm your order:\n\n` +
        `Items: ${cart.map(item => `${item.name} x${item.quantity}`).join(', ')}\n` +
        `Total: R${total.toFixed(2)}\n` +
        `Payment Method: ${paymentMethod}\n` +
        `Delivery Address: ${address}\n` +
        `Special Instructions: ${specialInstructions || 'None'}\n\n` +
        `Proceed with the order?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        // Create new order with payment info
        const newOrder = {
            userId: currentUser.uid,
            customer: currentUser.username,
            items: cart.map(item => `${item.name} x${item.quantity}`).join(', '),
            total: total,
            paymentMethod: paymentMethod,
            deliveryAddress: address,
            specialInstructions: specialInstructions,
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

// Confirm receipt function
async function confirmReceipt(orderId) {
    if (confirm('Confirm that you have received this order?')) {
        try {
            // Update order status to completed
            await db.collection('orders').doc(orderId).update({
                status: 'completed',
                confirmedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Find the delivery document with matching orderId
            const deliveryQuery = await db.collection('deliveries').where('orderId', '==', orderId).get();
            if (!deliveryQuery.empty) {
                const deliveryDoc = deliveryQuery.docs[0];
                await db.collection('deliveries').doc(deliveryDoc.id).update({
                    status: 'confirmed',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            alert('Order receipt confirmed!');
        } catch (error) {
            console.error('Error confirming receipt:', error);
            alert('Error confirming receipt: ' + error.message);
        }
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
