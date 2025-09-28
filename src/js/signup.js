// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Add to Firestore
        await db.collection('users').doc(user.uid).set({
            username,
            email,
            role: 'student', // default role
            status: 'active',
            lastLogin: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Sign up successful! Please log in.');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
}

// Initialize the application
function init() {
    document.querySelector('.login-form').addEventListener('submit', handleSignup);
}

window.onload = init;
