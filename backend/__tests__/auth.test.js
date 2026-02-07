const request = require('supertest');
const express = require('express');

// Mock environment variables for testing
process.env.SECRET_KEY = 'test-secret-key-for-testing-only';
process.env.DB_STORAGE = ':memory:'; // Use in-memory SQLite for tests
process.env.NODE_ENV = 'test';

const app = require('../server');
const { dbReady } = require('../server');

describe('Authentication Endpoints', () => {
  // Wait for database to be ready before running tests
  beforeAll(async () => {
    await dbReady;
  });
  describe('POST /api/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created');
    });

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'ab', // Less than 3 chars
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser2',
          password: '12345' // Less than 6 chars
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser3'
          // Missing password
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/register')
        .send({
          username: 'duplicate',
          password: 'password123'
        });

      // Try to register same username again
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'duplicate',
          password: 'password456'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/register')
        .send({
          username: 'loginuser',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid password');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'loginuser'
          // Missing password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should bypass rate limiting in test mode', async () => {
      // Note: Rate limiting is intentionally disabled in test mode (NODE_ENV=test)
      // This allows tests to run quickly without hitting rate limits
      // In production, rate limiting is active (5 requests per 15 minutes)

      const attempts = [];

      // Make 6 requests (would be rate limited in production)
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/login')
            .send({
              username: 'ratelimituser',
              password: 'password123'
            })
        );
      }

      const responses = await Promise.all(attempts);
      const lastResponse = responses[5];

      // In test mode, all requests should go through (not rate limited)
      // They'll fail with 400 (user not found) instead of 429 (rate limited)
      expect(lastResponse.status).toBe(400);
      expect(lastResponse.body).toHaveProperty('error');
      expect(lastResponse.body.error).toContain('User not found');
    }, 10000); // Increase timeout for this test
  });
});
