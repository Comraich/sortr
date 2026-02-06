import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, isAuthenticated, getApiUrl } from './client';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.getItem.mockReturnValue('fake-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getApiUrl', () => {
    it('should return API URL', () => {
      const url = getApiUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });
  });

  describe('apiClient.get', () => {
    it('should make GET request with auth headers', async () => {
      localStorage.getItem.mockReturnValue('test-token');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await apiClient.get('/api/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );

      expect(result).toEqual({ data: 'test' });
    });

    it('should handle 401 errors and redirect', async () => {
      localStorage.getItem.mockReturnValue('expired-token');

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      // apiClient.get should redirect and throw
      await expect(apiClient.get('/api/items')).rejects.toThrow();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.location.href).toBe('/login?expired=true');
    });
  });

  describe('apiClient.post', () => {
    it('should make POST request with data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' })
      });

      const result = await apiClient.post('/api/items', { name: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ name: 'Test' })
        })
      );

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should throw error for failed requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed' })
      });

      await expect(
        apiClient.post('/api/items', { name: '' })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('apiClient.put', () => {
    it('should make PUT request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Updated' })
      });

      const result = await apiClient.put('/api/items/1', { name: 'Updated' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.objectContaining({
          method: 'PUT'
        })
      );

      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });

  describe('apiClient.delete', () => {
    it('should make DELETE request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Deleted' })
      });

      const result = await apiClient.delete('/api/items/1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(result).toEqual({ message: 'Deleted' });
    });
  });
});
