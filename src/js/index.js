// Simple JWT decode function for Google ID token
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding JWT:', e);
        return null;
    }
}

// Google Sign-In callback
window.handleGoogleSignIn = function(response) {
    const payload = decodeJWT(response.credential);
    if (payload) {
        const username = payload.email;
        const name = payload.name;
        const currentUser = { username, name, role: 'student', google: true };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'src/student.html';
    } else {
        alert('Google Sign-In failed. Please try again.');
    }
};

// Login handling
function handleLogin(e) {
    e.preventDefault();
    const userType = document.getElementById('userType').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Mock authentication
    if (username && password && userType) {
        const currentUser = { username, role: userType };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        if (userType === 'admin') {
            window.location.href = 'src/admin.html';
        } else if (userType === 'staff') {
            window.location.href = 'src/staff.html';
        } else if (userType === 'student') {
            window.location.href = 'src/student.html';
        }
    } else {
        alert('Please fill in all fields');
    }
}

// Initialize the application
function init() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Initialize the application
window.onload = init;
