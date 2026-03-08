import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

// Attach access token on every request
api.interceptors.request.use(config => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }
            original._retry = true;
            isRefreshing = true;
            try {
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
                    {}, { withCredentials: true }
                );
                const newToken = data.data.accessToken;
                useAuthStore.getState().setAccessToken(newToken);
                failedQueue.forEach(p => p.resolve(newToken));
                failedQueue = [];
                return api(original);
            } catch (refreshErr) {
                failedQueue.forEach(p => p.reject(refreshErr));
                useAuthStore.getState().logout();
                window.location.href = '/';
                return Promise.reject(refreshErr);
            } finally { isRefreshing = false; }
        }
        return Promise.reject(err);
    }
);

export default api;
