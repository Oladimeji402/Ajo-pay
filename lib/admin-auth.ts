export const ADMIN_EMAIL = "admin@ajopay.com";
export const ADMIN_PASSWORD = "Admin@1234";

const SESSION_KEY = "ajopay_admin_session";

export interface AdminSession {
    email: string;
    isAdmin: boolean;
    lastLogin: string;
}

export const adminLogin = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const session: AdminSession = {
            email,
            isAdmin: true,
            lastLogin: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    }
    return false;
};

export const adminLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    if (typeof window !== 'undefined') {
        window.location.href = '/admin-login';
    }
};

export const isAdminAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return false;

    try {
        const session: AdminSession = JSON.parse(sessionStr);
        return session.isAdmin === true && session.email === ADMIN_EMAIL;
    } catch (e) {
        return false;
    }
};
