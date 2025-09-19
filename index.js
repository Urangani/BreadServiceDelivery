

        // Application State
        let currentUser = null;
        let currentPage = 'dashboard';
        let cart = [];

        // Mock Data
        let inventory = [
            { id: 1, name: 'White Bread', stock: 50, price: 12.00, description: 'Fresh white bread, perfect for sandwiches' },
            { id: 2, name: 'Whole Wheat Bread', stock: 30, price: 15.00, description: 'Healthy whole wheat bread' },
            { id: 3, name: 'Sourdough Bread', stock: 20, price: 25.00, description: 'Artisan sourdough bread' },
            { id: 4, name: 'Rye Bread', stock: 15, price: 18.00, description: 'Traditional rye bread' },
            { id: 5, name: 'Baguette', stock: 25, price: 20.00, description: 'French baguette' }
        ];

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

        // User roles and their accessible pages
        const userRoles = {
            admin: ['dashboard', 'products', 'stock', 'sales', 'delivery', 'adminUsers'],
            staff: ['dashboard', 'products', 'stock', 'sales', 'delivery'],
            student: ['dashboard', 'products', 'cart', 'payment']
        };

        // Initialize the application
        function init() {
            setupEventListeners();
            updateDashboardStats();
        }

        // Event Listeners
        function setupEventListeners() {
            // Login form
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            
            // Stock form
            document.getElementById('addStockForm').addEventListener('submit', handleAddStock);
            
            // User form
            document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
            
            // Payment form
            document.getElementById('paymentForm').addEventListener('submit', handlePayment);
            
            // Payment method change
            document.getElementById('paymentMethod').addEventListener('change', function() {
                const cardDetails = document.getElementById('cardDetails');
                cardDetails.style.display = this.value === 'card' ? 'block' : 'none';
            });
        }

        // Login handling
        function handleLogin(e) {
            e.preventDefault();
            const userType = document.getElementById('userType').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Mock authentication
            if (username && password && userType) {
                currentUser = { username, role: userType };
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                document.getElementById('welcomeMessage').textContent = `Welcome, ${username}!`;
                
                setupNavigation();
                loadPage('dashboard');
            } else {
                alert('Please fill in all fields');
            }
        }

        // Setup navigation based on user role
        function setupNavigation() {
            const navTabs = document.getElementById('navTabs');
            navTabs.innerHTML = '';
            
            const pages = userRoles[currentUser.role];
            const pageNames = {
                dashboard: 'Dashboard',
                products: 'Products',
                stock: 'Stock Management',
                sales: 'Sales',
                delivery: 'Delivery',
                cart: 'Cart',
                payment: 'Payment',
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
                case 'cart':
                    loadCart();
                    break;
                case 'payment':
                    loadPayment();
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
                    <div class="product-image">🍞</div>
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                        <div class="product-price">R${product.price.toFixed(2)}</div>
                        <div class="stock-badge ${getStockClass(product.stock)}">${getStockStatus(product.stock)}</div>
                        ${currentUser.role === 'student' ? `
                            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addToCart(${product.id})">Add to Cart</button>
                        ` : ''}
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

        function handleAddStock(e) {
            e.preventDefault();
            const name = document.getElementById('productName').value;
            const quantity = parseInt(document.getElementById('quantity').value);
            const price = parseFloat(document.getElementById('unitPrice').value);
            const description = document.getElementById('productDescription').value;

            const newProduct = {
                id: Date.now(),
                name,
                stock: quantity,
                price,
                description
            };

            inventory.push(newProduct);
            closeModal('addStockModal');
            document.getElementById('addStockForm').reset();
            loadStock();
            updateDashboardStats();
            alert('Stock added successfully!');
        }

        function updateStock(id) {
            const newStock = prompt('Enter new stock quantity:');
            if (newStock !== null) {
                const item = inventory.find(item => item.id === id);
                if (item) {
                    item.stock = parseInt(newStock);
                    loadStock();
                    updateDashboardStats();
                }
            }
        }

        function deleteStock(id) {
            if (confirm('Are you sure you want to delete this item?')) {
                inventory = inventory.filter(item => item.id !== id);
                loadStock();
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

            // Add to sales
            sales.push(newOrder);

            // Add to deliveries
            const address = e.target.querySelector('textarea').value;
            deliveries.push({
                id: newOrder.id,
                customer: currentUser.username,
                address: address,
                items: newOrder.items,
                status: 'pending',
                assignedTo: 'Unassigned'
            });

            // Update inventory
            cart.forEach(cartItem => {
                const product = inventory.find(p => p.id === cartItem.id);
                if (product) {
                    product.stock -= cartItem.quantity;
                }
            });

            // Clear cart
            cart = [];

            alert('Order placed successfully! Order ID: #' + newOrder.id);
            loadPage('dashboard');
            updateDashboardStats();
        }

        // User management functions
        function loadUsers() {
            const usersTable = document.getElementById('usersTable');
            usersTable.innerHTML = users.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
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
            cart = [];
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('loginPage').style.display = 'block';
            document.getElementById('loginForm').reset();
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
