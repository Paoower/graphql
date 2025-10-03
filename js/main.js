// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the router
    router.init();

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    // Hide previous error
    errorMessage.style.display = 'none';
    
    try {
        await authManager.login(identifier, password);
        router.navigateToHome();
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

function handleLogout() {
    authManager.logout();
    router.navigateToLogin();
}