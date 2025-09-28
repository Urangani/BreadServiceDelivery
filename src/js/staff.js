// Application State
let currentUser = null;
let currentPage = 'dashboard';

let inventory = [];
let sales = [];
let deliveries = [];

// Real-time listeners
let productsUnsubscribe;
let ordersUnsubscribe;
let deliveriesUnsubscribe;

// User roles and their accessible pages for staff
const userRoles = {
    staff: ['dashboard', 'products', 'stock', 'sales', 'delivery']
};

// Initialize the application
function init() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                if (currentUser.role !== 'staff') {
                    window.location.href = '../index.html';
                    return;
                }
                document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.username}!`;
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
    // Products listener (read-only for staff)
    productsUnsubscribe = db.collection('products').onSnapshot((snapshot) => {
        inventory = [];
        snapshot.forEach((doc) => {
            inventory.push({ id: doc.id, ...doc.data() });
        });
        // Update UI
        if (currentPage === 'products') loadProducts();
        if (currentPage === 'stock') loadStock();
        updateDashboardStats();
    });

    // Orders listener
    ordersUnsubscribe = db.collection('orders').onSnapshot((snapshot) => {
        sales = [];
        snapshot.forEach((doc) => {
            sales.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'sales') loadSales();
        updateDashboardStats();
    });

    // Deliveries listener
    deliveriesUnsubscribe = db.collection('deliveries').onSnapshot((snapshot) => {
        deliveries = [];
        snapshot.forEach((doc) => {
            deliveries.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'delivery') loadDelivery();
        updateDashboardStats();
    });
}

// Event Listeners
function setupEventListeners() {
    // Stock form
    document.getElementById('addStockForm').addEventListener('submit', handleAddStock);
}

// Setup navigation for staff
function setupNavigation() {
    const navTabs = document.getElementById('navTabs');
    navTabs.innerHTML = '';

    const pages = userRoles.staff;
    const pageNames = {
        dashboard: 'Dashboard',
        products: 'Products',
        stock: 'Stock Management',
        sales: 'Sales',
        delivery: 'Delivery'
    };

    pages.forEach(page => {
        const tab = document.createElement('button');
        tab.className = 'nav-tab';
        tab.textContent = pageNames[page];
        tab.onclick = () => loadPage(page);
        navTabs.appendChild(tab);
    });
}

// Load page content
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
        case 'stock':
            loadStock();
            break;
        case 'sales':
            loadSales();
            break;
        case 'delivery':
            loadDelivery();
            break;
    }
}

// Dashboard functions
function loadDashboard() {
    updateDashboardStats();
    loadRecentActivity();
}

function updateDashboardStats() {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status === 'completed' ? sale.total : 0), 0);
    const totalSalesCount = sales.filter(sale => sale.status === 'completed').length;
    const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
    const pendingDeliveries = deliveries.filter(delivery => delivery.status === 'pending').length;

    document.getElementById('totalRevenue').textContent = `R${totalRevenue.toFixed(2)}`;
    document.getElementById('totalSales').textContent = totalSalesCount;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('pendingDeliveries').textContent = pendingDeliveries;
}

function loadRecentActivity() {
    const activityTable = document.getElementById('recentActivity');
    const activities = [
        { time: '10:30 AM', activity: 'New order received', amount: 'R25.00', status: 'pending' },
        { time: '09:45 AM', activity: 'Stock updated', amount: '-', status: 'completed' },
        { time: '09:15 AM', activity: 'Payment received', amount: 'R33.00', status: 'completed' },
        { time: '08:30 AM', activity: 'Delivery completed', amount: 'R24.00', status: 'completed' }
    ];

    activityTable.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.time}</td>
            <td>${activity.activity}</td>
            <td>${activity.amount}</td>
            <td><span class="stock-badge ${activity.status === 'completed' ? 'stock-in' : 'stock-low'}">${activity.status}</span></td>
        </tr>
    `).join('');
}

// Products functions
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

// Stock management functions
function loadStock() {
    const stockTable = document.getElementById('stockTable');
    stockTable.innerHTML = inventory.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.stock}</td>
            <td>R${item.price.toFixed(2)}</td>
            <td>R${(item.stock * item.price).toFixed(2)}</td>
            <td><span class="stock-badge ${getStockClass(item.stock)}">${getStockStatus(item.stock)}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="updateStock(${item.id})">Update</button>
                <button class="btn btn-danger" onclick="deleteStock(${item.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function handleAddStock(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('unitPrice').value);
    const description = document.getElementById('productDescription').value;

    try {
        await db.collection('products').add({
            name,
            description,
            stock: quantity,
            price,
            imageUrl: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('addStockModal');
        document.getElementById('addStockForm').reset();
        alert('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
    }
}

async function updateStock(id) {
    const newStock = prompt('Enter new stock quantity:');
    if (newStock !== null) {
        const item = inventory.find(item => item.id === id);
        if (item) {
            try {
                await db.collection('products').doc(id).update({
                    stock: parseInt(newStock)
                });
            } catch (error) {
                console.error('Error updating stock:', error);
                alert('Error updating stock: ' + error.message);
            }
        }
    }
}

async function deleteStock(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await db.collection('products').doc(id).delete();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product: ' + error.message);
        }
    }
}

// Sales functions
function loadSales() {
    const salesTable = document.getElementById('salesTable');
    salesTable.innerHTML = sales.map(sale => `
        <tr>
            <td>#${sale.id}</td>
            <td>${sale.customer}</td>
            <td>${sale.items}</td>
            <td>R${sale.total.toFixed(2)}</td>
            <td>${sale.date}</td>
            <td><span class="stock-badge ${sale.status === 'completed' ? 'stock-in' : 'stock-low'}">${sale.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="viewSale(${sale.id})">View</button>
                ${sale.status === 'pending' ? `<button class="btn btn-success" onclick="completeSale(${sale.id})">Complete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function viewSale(id) {
    const sale = sales.find(s => s.id === id);
    if (sale) {
        alert(`Sale Details:\nID: #${sale.id}\nCustomer: ${sale.customer}\nItems: ${sale.items}\nTotal: R${sale.total.toFixed(2)}\nStatus: ${sale.status}`);
    }
}

async function completeSale(id) {
    try {
        await db.collection('orders').doc(id).update({
            status: 'completed'
        });
    } catch (error) {
        console.error('Error completing sale:', error);
        alert('Error completing sale: ' + error.message);
    }
}

// Delivery functions
function loadDelivery() {
    const deliveryTable = document.getElementById('deliveryTable');
    deliveryTable.innerHTML = deliveries.map(delivery => `
        <tr>
            <td>#${delivery.id}</td>
            <td>${delivery.customer}</td>
            <td>${delivery.address}</td>
            <td>${delivery.items}</td>
            <td><span class="stock-badge ${getDeliveryStatusClass(delivery.status)}">${delivery.status}</span></td>
            <td>${delivery.assignedTo}</td>
            <td>
                <button class="btn btn-secondary" onclick="updateDeliveryStatus(${delivery.id})">Update Status</button>
            </td>
        </tr>
    `).join('');
}

function getDeliveryStatusClass(status) {
    switch(status) {
        case 'delivered': return 'stock-in';
        case 'in-transit': return 'stock-low';
        case 'pending': return 'stock-out';
        default: return 'stock-low';
    }
}

async function updateDeliveryStatus(id) {
    const newStatus = prompt('Enter new status (pending/in-transit/delivered):');
    if (newStatus && ['pending', 'in-transit', 'delivered'].includes(newStatus)) {
        try {
            await db.collection('deliveries').doc(id).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating delivery status:', error);
            alert('Error updating delivery status: ' + error.message);
        }
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        // Unsubscribe listeners
        if (productsUnsubscribe) productsUnsubscribe();
        if (ordersUnsubscribe) ordersUnsubscribe();
        if (deliveriesUnsubscribe) deliveriesUnsubscribe();
    } catch (error) {
        console.error('Error signing out:', error);
    }
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Close modals when clicking outside
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
