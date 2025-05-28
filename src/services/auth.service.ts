import axios from 'axios';
import { LoginFormData, RegisterFormData, User } from '../types/auth.types';

const API_URL = process.env.REACT_APP_API_URL;

export const authService = {
    async login(data: LoginFormData) {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && error.response?.data.includes('confirm')) {
                throw new Error('Please confirm your email address before logging in. Check your inbox for the confirmation link.');
            } else if (error.response?.status === 400 || error.response?.status === 401) {
                throw new Error('Invalid email or password');
            }
            throw error;
        }
    },

    async register(data: RegisterFormData) {
        const response = await axios.post(`${API_URL}/auth/register`, data);
        return response.data;
    },

    async getCurrentUser() {
        const response = await axios.get(`${API_URL}/auth/me`);
        return response.data;
    },

    async logout() {
        const response = await axios.post(`${API_URL}/auth/logout`);
        return response.data;
    },

    async googleLogin() {
        window.location.href = `${API_URL}/GoogleAuth/login`;
        return new Promise<User>(() => { }); // This promise will never resolve due to redirect
    },

    async checkAuthStatus() {
        try {
            const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
            return response.data;
        } catch (error) {
            return null;
        }
    }
};
