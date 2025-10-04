// Application State
let currentUser = null;
let currentPage = 'dashboard';

let deliveries = [];

// Real-time listeners
let deliveriesUnsubscribe;

// User roles and their accessible pages for driver
const userRoles = {
    driver: ['dashboard']
};

// Initialize the application
function init() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                if (currentUser.role !== 'driver') {
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
    // Deliveries listener (assigned to this driver)
    deliveriesUnsubscribe = db.collection('deliveries').where('assignedTo', '==', currentUser.username).onSnapshot((snapshot) => {
        deliveries = [];
        snapshot.forEach((doc) => {
            deliveries.push({ id: doc.id, ...doc.data() });
        });
        if (currentPage === 'dashboard') {
            updateDashboardStats();
            loadDeliveries();
        }
    });

    // Availability listener
    db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const availabilityToggle = document.getElementById('availabilityToggle');
            if (availabilityToggle) {
                availabilityToggle.checked = data.available || false;
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Availability toggle
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.addEventListener('click', async function () {
            const isActive = availabilityToggle.classList.toggle('active');
            availabilityToggle.textContent = isActive ? 'Available' : 'Unavailable';

            try {
                await db.collection('users').doc(currentUser.uid).update({
                    available: isActive
                });
            } catch (error) {
                console.error('Error updating availability:', error);
                alert('Error updating availability: ' + error.message);
            }
        });
    }
}

// Setup navigation for driver
function setupNavigation() {
    const navTabs = document.getElementById('navTabs');
    navTabs.innerHTML = '';

    const pages = userRoles.driver;
    const pageNames = {
        dashboard: 'Dashboard'
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
    }
}

// Dashboard functions
function loadDashboard() {
    updateDashboardStats();
    loadDeliveries();
}

function updateDashboardStats() {
    const assigned = deliveries.length;
    const completed = deliveries.filter(d => d.status === 'delivered').length;
    const pending = deliveries.filter(d => d.status === 'pending' || d.status === 'in-transit').length;

    document.getElementById('assignedDeliveries').textContent = assigned;
    document.getElementById('completedDeliveries').textContent = completed;
    document.getElementById('pendingDeliveries').textContent = pending;
}

function loadDeliveries() {
    const deliveriesTable = document.getElementById('deliveriesTable');
    deliveriesTable.innerHTML = deliveries.map(delivery => `
        <tr>
            <td>#${delivery.id}</td>
            <td>${delivery.customer}</td>
            <td>${delivery.address}</td>
            <td>${delivery.items}</td>
            <td><span class="stock-badge ${getDeliveryStatusClass(delivery.status)}">${delivery.status}</span></td>
            <td>
                ${delivery.status !== 'delivered' ? `<button class="btn btn-success" onclick="markDelivered('${delivery.id}')">Mark Delivered</button>` : 'Completed'}
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

async function markDelivered(id) {
    if (confirm('Mark this delivery as completed?')) {
        try {
            // Update delivery status
            await db.collection('deliveries').doc(id).update({
                status: 'delivered',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Find the order associated with this delivery by orderId field
            const deliveryDoc = await db.collection('deliveries').doc(id).get();
            if (deliveryDoc.exists) {
                const deliveryData = deliveryDoc.data();
                const orderId = deliveryData.orderId || id; // fallback to id if orderId missing

                // Update order status to delivered
                await db.collection('orders').doc(orderId).update({
                    status: 'delivered',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                console.warn('Delivery document not found for id:', id);
            }

            alert('Delivery marked as completed!');
        } catch (error) {
            console.error('Error marking delivery:', error);
            alert('Error marking delivery: ' + error.message);
        }
    }
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        // Unsubscribe listeners
        if (deliveriesUnsubscribe) deliveriesUnsubscribe();
    } catch (error) {
        console.error('Error signing out:', error);
    }
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Close modals when clicking outside (if any)
window.onclick = function(event) {
    // No modals for now
}

// Initialize the application
window.onload = init;
