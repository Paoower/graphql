// Authentication module
class AuthManager {
    constructor() {
        this.jwt = localStorage.getItem('jwt');
        this.user = null;
    }

    async login(identifier, password) {
        const credentials = btoa(`${identifier}:${password}`);
        
        try {
            const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`,
                },
            });

            if (!response.ok) {
                throw new Error('Incorrect identifier');
            }

            const data = await response.json();
            localStorage.setItem('jwt', data);
            this.jwt = data;
            await this.loadUser();
            return true;
        } catch (error) {
            throw new Error(error.message || 'Unexpected error');
        }
    }

    async loadUser() {
        if (!this.jwt) return null;

        const query = `
            {
                user {
                    id
                    login
                    events(where: {event: {id: {_eq: 303}}}) {
                        level
                        userAuditRatio
                    }
                }
            }
        `;

        try {
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.jwt}`,
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) throw new Error('Invalid token');

            const result = await response.json();
            const data = result?.data;
            
            if (Array.isArray(data?.user) && data.user.length > 0) {
                const userData = data.user[0];
                if (Array.isArray(userData.events) && userData.events.length > 0) {
                    this.user = {
                        id: userData.id,
                        login: userData.login,
                        level: userData.events[0].level,
                        auditRatio: userData.events[0].userAuditRatio
                    };
                    return this.user;
                }
            }
            
            throw new Error('Invalid token structure');
        } catch (error) {
            console.warn('JWT invalid, logging out');
            this.logout();
            return null;
        }
    }

    logout() {
        this.jwt = null;
        this.user = null;
        localStorage.removeItem('jwt');
    }

    isAuthenticated() {
        return !!this.jwt;
    }
}

// Global auth instance
const authManager = new AuthManager();