// Application State
let currentUser = null;
let currentPage = 'dashboard';
let currentRole = 'admin';

let inventory = [];

// Load inventory from localStorage on init
function loadInventory() {
    const stored = localStorage.getItem('unibreadInventory');
    if (stored) {
        inventory = JSON.parse(stored);
    } else {
        // Default mock data if no stored data
        inventory = [
            { id: 1, name: 'White Bread', stock: 50, price: 12.00, description: 'Fresh white bread, perfect for sandwiches', imageUrl: '' },
            { id: 2, name: 'Whole Wheat Bread', stock: 30, price: 15.00, description: 'Healthy whole wheat bread', imageUrl: '' },
            { id: 3, name: 'Sourdough Bread', stock: 20, price: 25.00, description: 'Artisan sourdough bread', imageUrl: '' },
            { id: 4, name: 'Rye Bread', stock: 15, price: 18.00, description: 'Traditional rye bread', imageUrl: '' },
            { id: 5, name: 'Baguette', stock: 25, price: 20.00, description: 'French baguette', imageUrl: '' }
        ];
        saveInventory();
    }
}

// Save inventory to localStorage
function saveInventory() {
    localStorage.setItem('unibreadInventory', JSON.stringify(inventory));
}

let sales = [
    { id: 1001, customer: 'John Smith', items: 'White Bread x2', total: 24.00, date: '2025-09-17', status: 'completed' },
    { id: 1002, customer: 'Jane Doe', items: 'Sourdough x1', total: 25.00, date: '2025-09-17', status: 'pending' },
    { id: 1003, customer: 'Mike Wilson', items: 'Whole Wheat x1, Rye x1', total: 33.00, date: '2025-09-16', status: 'completed' }
];

let deliveries = [
    { id: 1001, customer: 'John Smith', address: 'Res A, Room 204', items: 'White Bread x2', status: 'delivered', assignedTo: 'Driver 1' },
    { id: 1002, customer: 'Jane Doe', address: 'Res B, Room 105', items: 'Sourdough x1', status: 'pending', assignedTo: 'Driver 2' },
    { id: 1003, customer: 'Mike Wilson', address: 'Off-campus: 123 Main St', items: 'Whole Wheat x1, Rye x1', status: 'in-transit', assignedTo: 'Driver 1' }
];

let users = [
    { username: 'admin', role: 'admin', email: 'admin@unibread.com', status: 'active', lastLogin: '2025-09-17' },
    { username: 'staff1', role: 'staff', email: 'staff1@unibread.com', status: 'active', lastLogin: '2025-09-17' },
    { username: 'student1', role: 'student', email: 'student1@university.edu', status: 'active', lastLogin: '2025-09-16' }
];

// User roles and their accessible pages for admin
const userRoles = {
    admin: ['dashboard', 'products', 'stock', 'sales', 'delivery', 'adminUsers']
};

// Initialize the application
function init() {
    loadInventory();
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        if (currentUser.role !== 'admin') {
            window.location.href = '../index.html';
            return;
        }
        document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.username}!`;
        setupEventListeners();
        setupNavigation();
        loadPage('dashboard');
    } else {
        window.location.href = '../index.html';
    }
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

function handleAddStock(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('unitPrice').value);
    const imageUrl = document.getElementById('imageUrl').value || '';

    const newProduct = {
        id: Date.now(),
        name,
        description,
        stock: quantity,
        price,
        imageUrl
    };

    inventory.push(newProduct);
    saveInventory();
    closeModal('addStockModal');
    document.getElementById('addStockForm').reset();
    loadStock();
    loadProducts();
    updateDashboardStats();
    alert('Product added successfully!');
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

function handleEditProduct(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editProductId').value);
    const name = document.getElementById('editProductName').value;
    const description = document.getElementById('editProductDescription').value;
    const stock = parseInt(document.getElementById('editQuantity').value);
    const price = parseFloat(document.getElementById('editUnitPrice').value);
    const imageUrl = document.getElementById('editImageUrl').value || '';

    const item = inventory.find(item => item.id === id);
    if (item) {
        item.name = name;
        item.description = description;
        item.stock = stock;
        item.price = price;
        item.imageUrl = imageUrl;
        saveInventory();
        closeModal('editProductModal');
        document.getElementById('editProductForm').reset();
        loadStock();
        loadProducts();
        updateDashboardStats();
        alert('Product updated successfully!');
    }
}

function addStock(id, amount = 1) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        item.stock += amount;
        saveInventory();
        loadStock();
        updateDashboardStats();
        alert(`Added ${amount} to stock. New stock: ${item.stock}`);
    }
}

function removeStock(id, amount = 1) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        if (item.stock >= amount) {
            item.stock -= amount;
            saveInventory();
            loadStock();
            updateDashboardStats();
            alert(`Removed ${amount} from stock. New stock: ${item.stock}`);
        } else {
            alert('Insufficient stock to remove.');
        }
    }
}

function deleteStock(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveInventory();
        loadStock();
        loadProducts();
        updateDashboardStats();
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

function completeSale(id) {
    const sale = sales.find(s => s.id === id);
    if (sale) {
        sale.status = 'completed';
        loadSales();
        updateDashboardStats();
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

function updateDeliveryStatus(id) {
    const newStatus = prompt('Enter new status (pending/in-transit/delivered):');
    if (newStatus && ['pending', 'in-transit', 'delivered'].includes(newStatus)) {
        const delivery = deliveries.find(d => d.id === id);
        if (delivery) {
            delivery.status = newStatus;
            loadDelivery();
            updateDashboardStats();
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

function handleAddUser(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const role = document.getElementById('newUserRole').value;

    const newUser = {
        username,
        email,
        role,
        status: 'active',
        lastLogin: 'Never'
    };

    users.push(newUser);
    closeModal('addUserModal');
    document.getElementById('addUserForm').reset();
    loadUsers();
    alert('User added successfully!');
}

function editUser(username) {
    const user = users.find(u => u.username === username);
    if (user) {
        const newRole = prompt('Enter new role (admin/staff/student):', user.role);
        if (newRole && ['admin', 'staff', 'student'].includes(newRole)) {
            user.role = newRole;
            loadUsers();
        }
    }
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user: ${username}?`)) {
        users = users.filter(u => u.username !== username);
        loadUsers();
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
function logout() {
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
