/**
 * Centralized API client for making authenticated requests
 * Handles authentication, token expiration, and error responses
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Handle API response and check for authentication errors
 */
const handleResponse = async (response) => {
  // Handle token expiration (401 = Unauthorized - invalid/expired token)
  if (response.status === 401) {
    localStorage.removeItem('token');
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
 * API client with common HTTP methods
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
      headers: getAuthHeaders()
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Check if user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Decode JWT token (format: header.payload.signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.isAdmin === true;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

/**
 * Get API base URL (useful for OAuth redirects)
 * @returns {string}
 */
export const getApiUrl = () => API_URL;
