// Auth Module
const Auth = {
    init: () => {
        // Check if user is logged in
        if (Utils.isAuthenticated()) {
            Auth.updateUI();
        }
        
        // Setup event listeners
        document.getElementById('loginBtn').addEventListener('click', () => {
            Auth.showLoginModal();
        });
        
        document.getElementById('registerBtn').addEventListener('click', () => {
            Auth.showRegisterModal();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
        });
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.handleLogin(e.target);
        });
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.handleRegister(e.target);
        });
    },
    
    showLoginModal: () => {
        document.getElementById('loginModal').classList.add('show');
    },
    
    showRegisterModal: () => {
        document.getElementById('registerModal').classList.add('show');
    },
    
    handleLogin: async (form) => {
        try {
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const response = await API.auth.login(email, password);
            
            Utils.setAuth(response.token, response.user);
            Utils.showToast('Inicio de sesión exitoso', 'success');
            
            document.getElementById('loginModal').classList.remove('show');
            form.reset();
            
            Auth.updateUI();
            
            // Redirect to dashboard
            App.navigateTo('dashboard');
            Dashboard.init();
            
        } catch (error) {
            Utils.showToast(error.message || 'Error al iniciar sesión', 'error');
        }
    },
    
    handleRegister: async (form) => {
        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone')
            };
            
            const response = await API.auth.register(data);
            
            Utils.setAuth(response.token, response.user);
            Utils.showToast('Registro exitoso', 'success');
            
            document.getElementById('registerModal').classList.remove('show');
            form.reset();
            
            Auth.updateUI();
            
            // Redirect to dashboard
            App.navigateTo('dashboard');
            Dashboard.init();
            
        } catch (error) {
            Utils.showToast(error.message || 'Error en el registro', 'error');
        }
    },
    
    logout: () => {
        Utils.clearAuth();
        Auth.updateUI();
        App.navigateTo('calendar');
        Utils.showToast('Sesión cerrada', 'success');
    },
    
    updateUI: () => {
        const user = Utils.getUser();
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const dashboardSection = document.getElementById('dashboard');
        const dashboardBtn = document.getElementById('dashboardBtn');
        
        if (user) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userMenu.querySelector('.user-name').textContent = user.name || user.email;
            
            // Show dashboard button
            dashboardBtn.style.display = 'block';
            
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
            dashboardSection.style.display = 'none';
        }
    }
};