// Application State
let currentUser = null;
let currentPage = 'dashboard';
let currentRole = 'admin';

let inventory = [];
let sales = [];
let deliveries = [];
let users = [];

// Real-time listeners
let productsUnsubscribe;
let ordersUnsubscribe;
let deliveriesUnsubscribe;
let usersUnsubscribe;



// User roles and their accessible pages for admin
const userRoles = {
    admin: ['dashboard', 'products', 'stock', 'sales', 'delivery', 'adminUsers']
};

// Initialize the application
function init() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                if (currentUser.role !== 'admin') {
                    window.location.href = '../index.html';
                    return;
                }
                document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.username}!`;
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

// Seed default products if none exist
async function seedDefaultProducts() {
    try {
        const productsSnapshot = await db.collection('products').get();
        if (productsSnapshot.empty) {
            const defaultProducts = [
                {
                    name: 'Albany White',
                    description: 'Fresh Albany white bread loaf',
                    stock: 50,
                    price: 15.99,
                    imageUrl: 'images/products/albany%20white.jpeg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: 'Albany Brown',
                    description: 'Nutritious Albany brown bread loaf',
                    stock: 40,
                    price: 17.99,
                    imageUrl: 'images/products/albany.jpeg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: 'Brown Loaf',
                    description: 'Classic brown bread loaf',
                    stock: 30,
                    price: 12.99,
                    imageUrl: 'images/products/brown%20loaf.webp',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: 'Sasko Brown',
                    description: 'Premium Sasko brown bread',
                    stock: 45,
                    price: 18.99,
                    imageUrl: 'images/products/sasko%20brown.jpg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: 'Sasko White',
                    description: 'Premium Sasko white bread',
                    stock: 55,
                    price: 16.99,
                    imageUrl: 'images/products/sasko%20white.jpg',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    name: 'White Loaf',
                    description: 'Traditional white bread loaf',
                    stock: 35,
                    price: 13.99,
                    imageUrl: 'images/products/white%20loaf.webp',
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

// Set up real-time listeners for Firestore
function setupRealtimeListeners() {
    // Products listener
    productsUnsubscribe = db.collection('products').onSnapshot((snapshot) => {
        inventory = [];
        snapshot.forEach((doc) => {
            inventory.push({ id: doc.id, ...doc.data() });
        });
        // Update UI if on relevant pages
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

    // Users listener
    usersUnsubscribe = db.collection('users').onSnapshot((snapshot) => {
        users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'adminUsers') loadUsers();
    });
}

// Event Listeners
function setupEventListeners() {
    // Stock form
    document.getElementById('addStockForm').addEventListener('submit', handleAddStock);

    // Edit product form
    document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);

    // User form
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);

    // Role filter
    document.getElementById('roleFilter').addEventListener('change', function() {
        currentRole = this.value;
        loadUsers();
    });
}

// Setup navigation for admin
function setupNavigation() {
    const navTabs = document.getElementById('navTabs');
    navTabs.innerHTML = '';

    const pages = userRoles.admin;
    const pageNames = {
        dashboard: 'Dashboard',
        products: 'Products',
        stock: 'Stock Management',
        sales: 'Sales',
        delivery: 'Delivery',
        adminUsers: 'User Management'
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
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
        pageElement.classList.add('active');
    } else {
        console.error(`Page element '${pageName}' not found`);
        return;
    }

    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event && event.target && event.target.classList) {
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
        case 'adminUsers':
            loadUsers();
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
            <div class="product-image">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` : ''}
                <span style="display: ${product.imageUrl ? 'none' : 'block'}">🍞</span>
            </div>
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
            <td>
                <div style="width:50px;height:50px;overflow:hidden;border-radius:4px;">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=\"display:flex;align-items:center;justify-content:center;font-size:20px;\">🍞</span>'">` : `<span style="display:flex;align-items:center;justify-content:center;font-size:20px;">🍞</span>`}
                </div>
            </td>
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.stock}</td>
            <td>R${item.price.toFixed(2)}</td>
            <td>R${(item.stock * item.price).toFixed(2)}</td>
            <td><span class="stock-badge ${getStockClass(item.stock)}">${getStockStatus(item.stock)}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="editProduct(${item.id})" style="margin-right:5px;">Edit</button>
                <button class="btn btn-success" onclick="addStock(${item.id}, 1)" style="margin-right:5px;">+ Stock</button>
                <button class="btn btn-warning" onclick="removeStock(${item.id}, 1)" style="margin-right:5px;">- Stock</button>
                <button class="btn btn-danger" onclick="deleteStock(${item.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function handleAddStock(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('unitPrice').value);
    const imageUrl = document.getElementById('imageUrl').value || '';

    try {
        await db.collection('products').add({
            name,
            description,
            stock: quantity,
            price,
            imageUrl,
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

function editProduct(id) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        document.getElementById('editProductId').value = id;
        document.getElementById('editProductName').value = item.name;
        document.getElementById('editProductDescription').value = item.description;
        document.getElementById('editQuantity').value = item.stock;
        document.getElementById('editUnitPrice').value = item.price;
        document.getElementById('editImageUrl').value = item.imageUrl || '';
        openModal('editProductModal');
    }
}

async function handleEditProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value;
    const description = document.getElementById('editProductDescription').value;
    const stock = parseInt(document.getElementById('editQuantity').value);
    const price = parseFloat(document.getElementById('editUnitPrice').value);
    const imageUrl = document.getElementById('editImageUrl').value || '';

    try {
        await db.collection('products').doc(id).update({
            name,
            description,
            stock,
            price,
            imageUrl
        });
        closeModal('editProductModal');
        document.getElementById('editProductForm').reset();
        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    }
}

async function addStock(id, amount = 1) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        try {
            await db.collection('products').doc(id).update({
                stock: item.stock + amount
            });
            alert(`Added ${amount} to stock. New stock: ${item.stock + amount}`);
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Error updating stock: ' + error.message);
        }
    }
}

async function removeStock(id, amount = 1) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        if (item.stock >= amount) {
            try {
                await db.collection('products').doc(id).update({
                    stock: item.stock - amount
                });
                alert(`Removed ${amount} from stock. New stock: ${item.stock - amount}`);
            } catch (error) {
                console.error('Error updating stock:', error);
                alert('Error updating stock: ' + error.message);
            }
        } else {
            alert('Insufficient stock to remove.');
        }
    }
}

async function deleteStock(id) {
    if (confirm('Are you sure you want to delete this product?')) {
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
                <button class="btn btn-secondary" onclick="assignDriver('${delivery.id}')">Assign Driver</button>
                <button class="btn btn-primary" onclick="updateDeliveryStatus('${delivery.id}')">Update Status</button>
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

async function assignDriver(id) {
    const drivers = users.filter(u => u.role === 'driver');
    if (drivers.length === 0) {
        alert('No drivers available.');
        return;
    }
    const driverOptions = drivers.map(d => d.username).join(', ');
    const selectedDriver = prompt(`Select driver (${driverOptions}):`);
    if (selectedDriver && drivers.find(d => d.username === selectedDriver)) {
        try {
            await db.collection('deliveries').doc(id).update({
                assignedTo: selectedDriver,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error assigning driver:', error);
            alert('Error assigning driver: ' + error.message);
        }
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

// User management functions
function loadUsers() {
    const usersTable = document.getElementById('usersTable');
    const filteredUsers = users.filter(user => user.role === currentRole);
    usersTable.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="stock-badge stock-in">${user.status}</span></td>
            <td>${user.lastLogin}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser('${user.username}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteUser('${user.username}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function handleAddUser(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newUserRole').value;

    try {
        // Create Firebase Auth account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Add to Firestore using the UID as document ID
        await db.collection('users').doc(uid).set({
            username,
            email,
            role,
            status: 'active',
            lastLogin: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeModal('addUserModal');
        document.getElementById('addUserForm').reset();

        // Sign out since the new user is now signed in
        await auth.signOut();

        alert('User added successfully! Firebase Auth account created. You have been signed out. Please sign back in as admin.');
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + error.message);
    }
}

async function editUser(username) {
    const user = users.find(u => u.username === username);
    if (user) {
        const newRole = prompt('Enter new role (admin/staff/driver/student):', user.role);
        if (newRole && ['admin', 'staff', 'driver', 'student'].includes(newRole)) {
            try {
                await db.collection('users').doc(user.id).update({
                    role: newRole
                });
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Error updating user: ' + error.message);
            }
        }
    }
}

async function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user: ${username}?`)) {
        const user = users.find(u => u.username === username);
        if (user) {
            try {
                await db.collection('users').doc(user.id).delete();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user: ' + error.message);
            }
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
        if (usersUnsubscribe) usersUnsubscribe();
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
