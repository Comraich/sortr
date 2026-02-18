/**
 * Centralized API client for making authenticated requests
 * Handles authentication, token expiration, and error responses
 *
 * Authentication uses httpOnly cookies (set by the server on login).
 * JavaScript never has access to the JWT token itself — only the server does.
 * User metadata (non-sensitive) is stored in localStorage for UI state.
 */

const API_URL = import.meta.env.VITE_API_URL || (() => {
  if (import.meta.env.PROD) {
    console.error('VITE_API_URL is not set in production. API calls will fail.');
  }
  return 'http://localhost:8000';
})();

/**
 * Handle API response and check for authentication errors
 */
const handleResponse = async (response) => {
  // Handle token expiration (401 = Unauthorized - invalid/expired token)
  if (response.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/login?expired=true';
    throw new Error('Authentication expired');
  }

  // Parse JSON response
  const data = await response.json();

  // Handle non-OK responses
  if (!response.ok) {
    // 403 = Forbidden - user is authenticated but lacks permission
    // Don't log out, just throw error message
    throw new Error(data.error || data.detail || 'Request failed');
  }

  return data;
};

/**
 * API client with common HTTP methods.
 * All requests include credentials: 'include' so the httpOnly auth cookie
 * is automatically sent with every request.
 */
export const apiClient = {
  /**
   * GET request
   * @param {string} path - API endpoint path (e.g., '/api/items')
   * @returns {Promise} Response data
   */
  get: async (path) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  /**
   * POST request
   * @param {string} path - API endpoint path
   * @param {object} data - Request body data
   * @returns {Promise} Response data
   */
  post: async (path, data) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /**
   * PUT request
   * @param {string} path - API endpoint path
   * @param {object} data - Request body data
   * @returns {Promise} Response data
   */
  put: async (path, data) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /**
   * DELETE request
   * @param {string} path - API endpoint path
   * @returns {Promise} Response data
   */
  delete: async (path) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  }
};

/**
 * Check if user is authenticated (based on stored user metadata).
 * The actual JWT lives in an httpOnly cookie — not accessible to JS.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('user');
};

/**
 * Get current user info from localStorage (non-sensitive metadata only).
 * Set on login, cleared on logout. Never contains the JWT token.
 * @returns {object|null} User object with id, username, displayName, isAdmin
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Store user metadata in localStorage after successful login.
 * @param {object} user - { id, username, displayName, isAdmin }
 */
export const setCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Clear user metadata from localStorage on logout.
 */
export const clearCurrentUser = () => {
  localStorage.removeItem('user');
};

/**
 * Check if user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user ? user.isAdmin : false;
};

/**
 * Get API base URL (useful for OAuth redirects)
 * @returns {string}
 */
export const getApiUrl = () => API_URL;
