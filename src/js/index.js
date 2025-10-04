// Login handling with Firebase Auth
async function handleLogin(e) {
    e.preventDefault();
    const userType = document.getElementById('userType').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password || !userType) {
        alert('Please fill in all fields');
        return;
    }

    try {
        // For demo, assume email is username@unibread.com or something, but since it's username, perhaps use email.
        // The guide assumes email/password, so perhaps change to email input.
        // But to keep, assume username is email for now.
        const email = username.includes('@') ? username : `${username}@unibread.com`;
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Fetch role from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const role = userDoc.data().role;
            if (role !== userType) {
                alert('Role mismatch. Please select the correct role.');
                await auth.signOut();
                return;
            }
            localStorage.setItem('currentUser', JSON.stringify({ uid: user.uid, role, username: userDoc.data().username }));
            // Update lastLogin
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (role === 'admin') {
                window.location.href = 'src/admin.html';
            } else if (role === 'staff') {
                window.location.href = 'src/staff.html';
            } else if (role === 'driver') {
                window.location.href = 'src/driver.html';
            } else if (role === 'student') {
                window.location.href = 'src/student.html';
            }
        } else {
            alert('User not found in database.');
            await auth.signOut();
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Initialize the application
function init() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Add event listener for the toggle password button
    const togglePasswordButton = document.getElementById('togglePassword');
    togglePasswordButton.addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordButton.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            togglePasswordButton.textContent = 'Show';
        }
    });
}

// Initialize the application
window.onload = init;
