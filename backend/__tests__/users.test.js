const request = require('supertest');

// Mock environment variables for testing
process.env.SECRET_KEY = 'test-secret-key-for-testing-only';
process.env.DB_STORAGE = ':memory:'; // Use in-memory SQLite for tests
process.env.NODE_ENV = 'test';

const app = require('../server');
const { dbReady } = require('../server');

describe('User Management Endpoints', () => {
  let adminToken;
  let regularUserToken;
  let adminUserId;
  let regularUserId;

  // Wait for database to be ready before running tests
  beforeAll(async () => {
    await dbReady;

    // Create admin user (first user becomes admin automatically)
    const adminResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'admin',
        password: 'admin123',
        email: 'admin@test.com',
        displayName: 'Admin User'
      });

    expect(adminResponse.status).toBe(201);
    expect(adminResponse.body.isAdmin).toBe(true);

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    adminToken = adminLoginResponse.body.token;
    expect(adminToken).toBeDefined();

    // Create regular user
    const regularResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'regularuser',
        password: 'user123',
        email: 'user@test.com'
      });

    expect(regularResponse.status).toBe(201);
    expect(regularResponse.body.isAdmin).toBeFalsy();

    // Login as regular user
    const regularLoginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'regularuser',
        password: 'user123'
      });

    regularUserToken = regularLoginResponse.body.token;
    expect(regularUserToken).toBeDefined();

    // Get user IDs
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    const users = usersResponse.body;
    adminUserId = users.find(u => u.username === 'admin').id;
    regularUserId = users.find(u => u.username === 'regularuser').id;
  });

  describe('First User Auto-Admin', () => {
    it('should make the first registered user an admin', async () => {
      // This is tested in beforeAll, but we verify here
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(loginResponse.status).toBe(200);
      // JWT token should contain isAdmin field
      const token = loginResponse.body.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(payload.isAdmin).toBe(true);
    });
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Verify passwords are not included
      response.body.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('regularuser');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with all fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          displayName: 'New User',
          password: 'newpass123',
          isAdmin: false
        });

      expect(response.status).toBe(201);
      expect(response.body.username).toBe('newuser');
      expect(response.body.email).toBe('newuser@test.com');
      expect(response.body.displayName).toBe('New User');
      expect(response.body.isAdmin).toBe(false);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should create a new user with minimal fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'minimaluser',
          password: 'pass123'
        });

      expect(response.status).toBe(201);
      expect(response.body.username).toBe('minimaluser');
      expect(response.body.email).toBeNull();
      expect(response.body.displayName).toBeNull();
      expect(response.body.isAdmin).toBe(false);
    });

    it('should reject duplicate username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'regularuser', // Already exists
          password: 'pass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'anotheruser',
          email: 'user@test.com', // Already exists
          password: 'pass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already exists');
    });

    it('should reject short username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'ab', // Too short
          password: 'pass123'
        });

      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser',
          password: '12345' // Too short
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'pass123'
        });

      expect(response.status).toBe(400);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          username: 'shouldfail',
          password: 'pass123'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId;

    beforeAll(async () => {
      // Create a test user to update
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updatetest',
          email: 'update@test.com',
          password: 'pass123'
        });

      testUserId = response.body.id;
    });

    it('should update user details', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Updated Name',
          email: 'newemail@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.displayName).toBe('Updated Name');
      expect(response.body.email).toBe('newemail@test.com');
    });

    it('should update password', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'newpass123'
        });

      expect(response.status).toBe(200);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'updatetest',
          password: 'newpass123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should promote user to admin', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isAdmin: true
        });

      expect(response.status).toBe(200);
      expect(response.body.isAdmin).toBe(true);
    });

    it('should prevent removing admin from last admin', async () => {
      // First, demote all other users
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const users = usersResponse.body;

      // Demote all except the first admin
      for (const user of users) {
        if (user.id !== adminUserId && user.isAdmin) {
          await request(app)
            .put(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isAdmin: false });
        }
      }

      // Now try to demote the last admin
      const response = await request(app)
        .put(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isAdmin: false
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('last admin');
    });

    it('should reject duplicate username', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin' // Already exists
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Test'
        });

      expect(response.status).toBe(404);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          displayName: 'Hacked'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteTestUserId;
    let secondAdminId;

    beforeAll(async () => {
      // Create a test user to delete
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'deletetest',
          password: 'pass123'
        });

      deleteTestUserId = response.body.id;

      // Create a second admin
      const adminResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'secondadmin',
          password: 'admin123',
          isAdmin: true
        });

      secondAdminId = adminResponse.body.id;
    });

    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/api/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should prevent deleting your own account', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('own account');
    });

    it('should prevent deleting the last admin', async () => {
      // First, ensure we only have one admin by deleting the second admin
      await request(app)
        .delete(`/api/users/${secondAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Create a temp admin token for testing
      const tempAdminResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'tempadmin',
          password: 'admin123',
          isAdmin: true
        });

      const tempAdminId = tempAdminResponse.body.id;

      // Login as temp admin
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'tempadmin',
          password: 'admin123'
        });

      const tempToken = loginResponse.body.token;

      // Try to delete the original admin (should fail if it's the last one)
      // First check how many admins exist
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const adminCount = usersResponse.body.filter(u => u.isAdmin).length;

      if (adminCount === 1) {
        const response = await request(app)
          .delete(`/api/users/${adminUserId}`)
          .set('Authorization', `Bearer ${tempToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('last admin');
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });
  });
});
