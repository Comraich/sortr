# Backend Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test basic.test.js
```

## Test Structure

Tests are located in `__tests__/` directory:
- `basic.test.js` - Health checks, security, input validation
- `auth.test.js` - Authentication endpoints (work in progress)
- `items.test.js` - Items CRUD operations (work in progress)

## Test Environment

- **Database**: Uses in-memory SQLite (`:memory:`) for fast,isolated tests
- **Rate Limiting**: Disabled in test mode to allow rapid requests
- **Logging**: Disabled in test mode to reduce noise
- **Database Sync**: Uses `force: true` to reset database between test runs

## Writing Tests

### Basic Structure

```javascript
const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .send({ data: 'value' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('field');
  });
});
```

### Testing Authenticated Endpoints

```javascript
let authToken;

beforeAll(async () => {
  // Register and login
  await request(app)
    .post('/api/register')
    .send({ username: 'testuser', password: 'password123' });

  const loginResponse = await request(app)
    .post('/api/login')
    .send({ username: 'testuser', password: 'password123' });

  authToken = loginResponse.body.token;
});

it('should access protected route', async () => {
  const response = await request(app)
    .get('/api/items/')
    .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(200);
});
```

## Current Test Coverage

✅ **Implemented:**
- 404 error handling
- Authentication requirement
- Invalid token rejection
- Input validation (username/password length)
- Required fields validation

🚧 **In Progress:**
- Full authentication flow tests
- Complete CRUD operations for items
- Locations and boxes endpoints
- Rate limiting tests
- Error handling edge cases

## Known Issues

1. **Database State**: Each test file loads the app independently, which can cause issues with shared state. Consider using `beforeEach` to clear data.

2. **Async Setup**: Some tests may timeout if database initialization takes too long. Increase timeout with `jest.setTimeout(10000)` in `beforeAll` hooks.

3. **Rate Limiting**: Currently disabled in test mode. If you want to test rate limiting, you'll need to mock the time or use a separate test configuration.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Cleanup**: Use `afterEach` or `afterAll` to clean up test data
3. **Descriptive Names**: Use clear test names that describe what is being tested
4. **Arrange-Act-Assert**: Structure tests with setup, execution, and verification
5. **Edge Cases**: Test both success and failure scenarios

## Future Improvements

- [ ] Add integration tests for complete workflows
- [ ] Add tests for OAuth endpoints (requires mocking)
- [ ] Increase coverage to 80%+
- [ ] Add performance tests
- [ ] Set up CI/CD pipeline for automated testing
- [ ] Add database migration tests
