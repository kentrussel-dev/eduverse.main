import axios from 'axios';
import { LoginFormData, RegisterFormData, User } from '../types/auth.types';

const API_URL = process.env.REACT_APP_API_URL;
const TOKEN_KEY = 'eduverse_token';

/**
 * Signing in gives a token. The server also keeps it in a cookie so the browser stays signed
 * in; the app keeps a copy here to send to the world server and with API calls.
 */
export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token?: string) => {
        if (token) localStorage.setItem(TOKEN_KEY, token);
    },
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Send the sign-in cookie and the saved token with every API call.
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const messageOf = (error: any, fallback: string) => {
    const data = error?.response?.data;
    if (typeof data === 'string' && data) return data;
    return data?.message || data?.Message || fallback;
};

export const authService = {
    async login(data: LoginFormData): Promise<User> {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, data);
            tokenStore.set(response.data.token);
            return response.data;
        } catch (error: any) {
            if (!error.response) throw new Error('Could not reach the server. Is it running?');
            throw new Error(messageOf(error, 'Invalid email or password'));
        }
    },

    /** Creates the account and signs you in. */
    async register(data: RegisterFormData): Promise<User> {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, data);
            tokenStore.set(response.data.token);
            return response.data;
        } catch (error: any) {
            if (!error.response) throw new Error('Could not reach the server. Is it running?');
            throw new Error(messageOf(error, 'Registration failed.'));
        }
    },

    async logout() {
        try {
            // The server clears the sign-in cookie.
            await axios.post(`${API_URL}/auth/logout`);
        } finally {
            tokenStore.clear();
        }
    },

    async googleLogin() {
        window.location.href = `${API_URL}/GoogleAuth/login`;
        return new Promise<User>(() => { }); // This promise will never resolve due to redirect
    },

    /** Who is signed in (from the saved token or the sign-in cookie), or null. */
    async checkAuthStatus(): Promise<User | null> {
        try {
            const response = await axios.get(`${API_URL}/auth/me`);
            tokenStore.set(response.data.token);
            return response.data;
        } catch (error: any) {
            if (error?.response?.status === 401) tokenStore.clear();
            return null;
        }
    },
};
