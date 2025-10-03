// Router module
class Router {
    constructor() {
        this.currentPage = null;
        this.pages = {
            login: document.getElementById('login-page'),
            home: document.getElementById('home-page')
        };
    }

    showPage(pageName) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            page.style.display = 'none';
        });

        // Show requested page
        if (this.pages[pageName]) {
            this.pages[pageName].style.display = 'block';
            this.currentPage = pageName;
        }
    }

    async navigateToHome() {
        try {
            await authManager.loadUser();
            if (authManager.user) {
                this.updateUserInfo();
                await chartsManager.loadAndRenderCharts();
                this.showPage('home');
            } else {
                this.navigateToLogin();
            }
        } catch (error) {
            console.error('Navigation error:', error);
            this.navigateToLogin();
        }
    }

    navigateToLogin() {
        this.showPage('login');
    }

    updateUserInfo() {
        const user = authManager.user;
        if (user) {
            document.getElementById('user-login').textContent = user.login;
            document.getElementById('user-level').textContent = `Level ${user.level}`;
            document.getElementById('user-audit-ratio').textContent = 
                `Audit Ratio ${Math.round(user.auditRatio * 100) / 100}`;
        }
    }

    init() {
        // Check if user is already authenticated
        if (authManager.isAuthenticated()) {
            this.navigateToHome();
        } else {
            this.navigateToLogin();
        }
    }
}

// Global router instance
const router = new Router();