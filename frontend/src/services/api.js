import axios from 'axios';

/**
 * Centralized Axios instance for all API calls.
 * Base URL comes from environment variable or defaults to Vite proxy path.
 * withCredentials: true enables HTTP-only cookie auth.
 */
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://sanghini-ride-1.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Send Authorization Bearer header as reliable cross-domain fallback
    const token = typeof window !== 'undefined' ? localStorage.getItem('sanghini_token') || localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
