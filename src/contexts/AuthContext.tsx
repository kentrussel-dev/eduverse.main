import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, isTeacher: boolean) => Promise<void>;
    logout: () => Promise<void>;
    googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const userData = await authService.checkAuthStatus();
                setUser(userData);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    useEffect(() => {
        // Check for authentication error in URL
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (error) {
            console.error('Authentication error:', decodeURIComponent(error));
        }
    }, []);

    const login = async (email: string, password: string) => {
        const userData = await authService.login({ email, password });
        setUser(userData);
    };

    const register = async (email: string, password: string, fullName: string, isTeacher: boolean) => {
        const userData = await authService.register({ email, password, fullName, isTeacher });
        setUser(userData);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const googleLogin = async () => {
        await authService.googleLogin();
        // The page will redirect to Google auth
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
