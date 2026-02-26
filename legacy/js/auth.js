/**
 * ==========================================
 * MediMart - Authentication Page
 * ==========================================
 * Handles login page functionality
 */

// Initialize database
const db = new Database();

// Note: Removed auto-redirect check to allow direct access to main app

// Form submission handler
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validation
    if (!username) {
        showError('Username tidak boleh kosong');
        return;
    }

    if (!password) {
        showError('Password tidak boleh kosong');
        return;
    }

    // Show loading state
    const loginBtn = document.querySelector('.btn-login');
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    // Simulate login process
    setTimeout(async () => {
        // Authenticate user
        const result = await db.login(username, password);

        if (result.success) {
            // Save remember me preference
            if (rememberMe) {
                localStorage.setItem('medimart_remember', 'true');
            }

            // Show success message
            showSuccess(`Selamat datang, ${result.user.name}! 🎉`);

            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            // Show error message
            showError(result.message);

            // Remove loading state
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }, 800); // Simulate network delay
});

/**
 * Select user role (visual only)
 */
function selectRole(role) {
    document.querySelectorAll('.role-tab').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#6b7280';
        btn.style.boxShadow = 'none';
    });

    // Find clicked button (or based on text if needed, but onclick passes role)
    // Actually we can just find by onclick attribute or restructure HTML to have IDs
    // Simpler: find the button that called this. But `this` isn't passed.
    // Let's just iterate and find matches or just update style blindly based on event?
    // User passes role string.
    // Let's rely on event.target if possible, but standard onclick might not pass it easily without `event`.
    // Let's just set active state on all buttons matching the role logic?
    // The HTML has onclick="selectRole('customer')".
    // We can assume the buttons are in order or just use text content.

    // Better implementation:
    const buttons = document.querySelectorAll('.role-tab');
    buttons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === role ||
            (role === 'customer' && btn.textContent.includes('Pelanggan'))) {
            btn.classList.add('active');
            btn.style.background = 'white';
            btn.style.color = '#FF6B35'; // Primary color
            btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        }
    });
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

/**
 * Toggle between Login and Register
 */
function toggleAuthMode() {
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');

    if (loginView.style.display === 'none') {
        loginView.style.display = 'block';
        registerView.style.display = 'none';
    } else {
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    }
}

/**
 * Continue as Guest
 */
function continueAsGuest() {
    sessionStorage.setItem('medimart_guest_mode', 'true');
    window.location.href = 'index.html';
}

/**
 * Show Error Notification
 */
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `<span>❌</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Show Success Notification
 */
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `<span>✅</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle Register Form Submission
document.getElementById('registerForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const role = document.querySelector('input[name="regRole"]:checked').value;
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !username || !email || !password) {
        showError('Mohon lengkapi semua data ⚠️');
        return;
    }

    const userData = { role, name, username, email, password };

    // Call database register
    const success = await db.register(userData);

    if (success) {
        showSuccess(`Registrasi Berhasil! Selamat datang, ${name} 🎉`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showError('Registrasi Gagal (Username/Email mungkin sudah terpakai)');
    }
});

// Add enter key support for password field
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});

// Log to console
console.log('%c MediMart Login ', 'background: #00B09B; color: white; font-size: 16px; font-weight: bold; padding: 10px;');
console.log('%c Demo Accounts ', 'background: #FF6B35; color: white; font-size: 12px; padding: 5px;');
console.log('Admin    → username: admin    | password: admin123');
console.log('Seller   → username: seller1  | password: seller123');
console.log('Customer → username: user     | password: user123');
