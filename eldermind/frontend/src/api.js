/**
 * ElderMind — Axios API Client
 * Owner: Shivani
 *
 * All components import this instead of calling axios directly.
 * - Automatically attaches JWT token to every request
 * - Redirects to /login on 401 (token expired)
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// ── Attach JWT token to every outgoing request ─────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('eldermind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 — token expired or missing ─────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eldermind_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
