const rawBase = import.meta?.env?.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : '';
const normalizedBase = rawBase ? rawBase.replace(/\/+$/, '') : '';

// If VITE_API_URL is not set:
// - Dev: fall back to local backend on :5000
// - Prod: use same-origin relative "/api" (works behind a reverse proxy)
export const SERVER_BASE_URL = normalizedBase || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

export const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

