import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api, { setAccessToken } from '../lib/api';

interface User {
    id: string;
    email: string;
    displayName: string;
    homeCurrency: string;
    timezone: string;
    emailVerified: boolean;
    plan: 'free' | 'pro';
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Try to restore session on mount
    useEffect(() => {
        const restore = async () => {
            try {
                const res = await api.post('/auth/refresh');
                setAccessToken(res.data.data.accessToken);
                const meRes = await api.get('/auth/me');
                setUser(meRes.data.data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restore();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
    };

    const register = async (email: string, password: string, displayName: string) => {
        const res = await api.post('/auth/register', { email, password, displayName });
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch { }
        setAccessToken(null);
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        setUser((prev) => prev ? { ...prev, ...updates } : null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
