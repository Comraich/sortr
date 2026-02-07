const request = require('supertest');

// Mock environment variables for testing
process.env.SECRET_KEY = 'test-secret-key-for-testing-only-must-be-32-chars-long';
process.env.DB_STORAGE = ':memory:';
process.env.NODE_ENV = 'test';

// Wait for app to initialize before running tests
const app = require('../server');
const { dbReady } = require('../server');

describe('Basic API Tests', () => {
  // Wait for database to be ready before running tests
  beforeAll(async () => {
    await dbReady;
  });
  describe('Health & Security', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app).get('/api/items/');
      expect(response.status).toBe(401);
    });

    it('should reject invalid auth tokens', async () => {
      const response = await request(app)
        .get('/api/items/')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should validate registration input', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'ab', // Too short (min 3)
          password: '123' // Too short (min 6)
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require fields for login', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
