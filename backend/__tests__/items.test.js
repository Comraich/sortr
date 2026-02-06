const request = require('supertest');

// Mock environment variables for testing
process.env.SECRET_KEY = 'test-secret-key-for-testing-only';
process.env.DB_STORAGE = ':memory:';

const app = require('../server');

let authToken;
let locationId;
let boxId;

describe('Items API', () => {
  // Setup: Create user, login, create location and box
  beforeAll(async () => {
    jest.setTimeout(30000); // Increase timeout for setup
    // Register and login to get token
    await request(app)
      .post('/api/register')
      .send({
        username: 'itemstestuser',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'itemstestuser',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create a location
    const locationResponse = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Garage' });

    locationId = locationResponse.body.id;

    // Create a box
    const boxResponse = await request(app)
      .post('/api/boxes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Box A',
        locationId: locationId
      });

    boxId = boxResponse.body.id;
  });

  describe('POST /api/items/', () => {
    it('should create an item with valid data', async () => {
      const response = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hammer',
          category: 'Tools',
          boxId: boxId
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Hammer');
      expect(response.body.category).toBe('Tools');
      expect(response.body.boxId).toBe(boxId);
    });

    it('should create an item without box', async () => {
      const response = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Screwdriver',
          category: 'Tools'
          // No boxId
        });

      expect(response.status).toBe(200);
      expect(response.body.boxId).toBeNull();
    });

    it('should reject item without name', async () => {
      const response = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'Tools',
          boxId: boxId
          // Missing name
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/items/')
        .send({
          name: 'Wrench',
          category: 'Tools'
        });

      expect(response.status).toBe(401);
    });

    it('should reject invalid box ID', async () => {
      const response = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pliers',
          boxId: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/items/', () => {
    it('should return list of items', async () => {
      const response = await request(app)
        .get('/api/items/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should include box and location data', async () => {
      const response = await request(app)
        .get('/api/items/')
        .set('Authorization', `Bearer ${authToken}`);

      const itemWithBox = response.body.find(item => item.boxId === boxId);
      expect(itemWithBox).toBeDefined();
      expect(itemWithBox).toHaveProperty('Box');
      expect(itemWithBox.Box).toHaveProperty('Location');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/items/');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/items/:id', () => {
    let itemId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item',
          category: 'Test',
          boxId: boxId
        });

      itemId = createResponse.body.id;
    });

    it('should return item by ID', async () => {
      const response = await request(app)
        .get(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(itemId);
      expect(response.body.name).toBe('Test Item');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Item',
          category: 'Original',
          boxId: boxId
        });

      itemId = createResponse.body.id;
    });

    it('should update item successfully', async () => {
      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Item',
          category: 'Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Item');
      expect(response.body.category).toBe('Updated');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/items/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Item to Delete',
          category: 'Temporary'
        });

      itemId = createResponse.body.id;
    });

    it('should delete item successfully', async () => {
      const response = await request(app)
        .delete(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify item is deleted
      const getResponse = await request(app)
        .get(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
