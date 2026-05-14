import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Fallback to current domain if env var is missing
  return `${window.location.origin}/api`;
};

const getEmbedUrl = () => {
  if (import.meta.env.VITE_EMBED_URL) return import.meta.env.VITE_EMBED_URL;
  // Fallback to current domain if env var is missing
  return `${window.location.origin}/embed/poplayer.iife.js`;
};

export const API_URL = getBaseUrl();
export const EMBED_URL = getEmbedUrl();

console.log('PopLayer Dashboard initialized with:', { API_URL, EMBED_URL, origin: window.location.origin });

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('workspaceId');
      localStorage.removeItem('siteId');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
