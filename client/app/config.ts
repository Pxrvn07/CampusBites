export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const AUTH_API = `${API_BASE_URL}/api/auth`;
export const MENU_API = `${API_BASE_URL}/api/menu`;
export const ORDER_API = `${API_BASE_URL}/api/orders`;
export const SETTINGS_API = `${API_BASE_URL}/api/settings`;
export const PAYMENT_API = `${API_BASE_URL}/api/payment`;
export const SOCKET_URL = API_BASE_URL;
