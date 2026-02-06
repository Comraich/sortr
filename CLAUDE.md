# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sortr is a storage inventory management application with a React frontend and Node.js/Express backend. Users can track items with categories, locations, and box numbers, with QR code generation for physical labeling.

## Development Commands

### Backend (from `/backend`)
```bash
npm install          # Install dependencies
node server.js       # Start server (runs on port 8000)
```

### Frontend (from `/frontend`)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (runs on port 5173)
npm run build        # Production build
npm run lint         # Run ESLint
```

## Architecture

### Frontend (`/frontend`)
- **Tech**: React 18 + Vite + React Router
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Components**:
  - `App.jsx` - Router setup with routes for `/`, `/login`, `/add`, `/edit/:id`
  - `Login.jsx` - Username/password and OAuth (Google, GitHub, Microsoft)
  - `ItemList.jsx` - Main inventory table with CRUD actions
  - `ItemForm.jsx` - Add/edit items, includes QR code generation for existing items
- **API URL**: Configured via `VITE_API_URL` env var (defaults to `http://localhost:8000`)
- **Auth**: JWT token stored in `localStorage`, sent as `Bearer` token in `Authorization` header

### Backend (`/backend`)
- **Tech**: Express 5 + Sequelize ORM
- **Entry**: `server.js` (single file containing all logic)
- **Database**: SQLite by default (`inventory.db`), PostgreSQL optional via `DB_DIALECT=postgres`
- **Models**:
  - `Item`: id, name, category, location, boxNumber
  - `User`: username, password (hashed), googleId, githubId, microsoftId
- **Auth**: JWT-based with Passport.js for OAuth providers

### API Endpoints
- `POST /api/register` - Create account
- `POST /api/login` - Get JWT token
- `GET/POST /api/items/` - List/create items (requires auth)
- `GET/PUT/DELETE /api/items/:id` - Item CRUD (requires auth)
- OAuth routes: `/auth/google`, `/auth/github`, `/auth/microsoft` with callbacks

## Configuration

Environment variables in root `.env` file:
- `PORT` - Backend port (default 8000)
- `DB_STORAGE` - SQLite file path
- `SECRET_KEY` - JWT signing key
- `FRONTEND_URL` - For OAuth redirect (include base path if using one)
- `VITE_API_URL` - Frontend API endpoint
- `VITE_BASE_URL` - Base path for frontend deployment (e.g., `/sortr/` for hosting at `example.com/sortr`)
- `VITE_APP_URL` - Full app URL for QR codes (optional, auto-detected from origin + base path)
- OAuth credentials for Google, GitHub, Microsoft
- PostgreSQL config (optional): `DB_DIALECT`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Vite is configured to read env from parent directory (`envDir: '../'`).

### Deploying at a Custom Path

To deploy the app at a path other than root (e.g., `https://example.com/sortr`):

1. Set `VITE_BASE_URL=/sortr/` in `.env` (trailing slash required)
2. Set `FRONTEND_URL=https://example.com/sortr` for OAuth redirects
3. Rebuild the frontend: `npm run build`
4. Configure your reverse proxy to serve the frontend at `/sortr`

---

## Code Review & Improvement Recommendations

### 🚨 CRITICAL SECURITY ISSUES

#### 1. Exposed Credentials in Repository
**Location**: `.env` file
**Severity**: CRITICAL

The `.env` file contains production OAuth credentials and secret keys that should NEVER be committed to version control.

**Required Actions**:
```bash
# Immediately:
1. Add .env to .gitignore (if not already)
2. Remove .env from git history: git rm --cached .env
3. Rotate ALL OAuth credentials at provider consoles
4. Generate new SECRET_KEY: openssl rand -base64 32
5. Create .env.example with placeholder values for documentation
```

#### 2. Wide-Open CORS Policy
**Location**: `backend/server.js:17`

Current: `app.use(cors());` allows ALL origins to access the API.

**Fix**:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

#### 3. OAuth Tokens in URL Query Parameters
**Location**: `backend/server.js:206, 220, 234`

Tokens in URLs can be logged in browser history, server logs, and referrer headers.

**Recommended**: Use POST message or httpOnly cookies instead of query parameters.

#### 4. Weak Default Secret Key
**Location**: `backend/server.js:14`

Falls back to `'default_secret'` if SECRET_KEY is not set.

**Fix**: Fail to start if SECRET_KEY is missing:
```javascript
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('SECRET_KEY environment variable is required');
}
```

#### 5. No JWT Expiration
**Locations**: `server.js:203, 217, 231, 270, 309`

JWTs never expire, so stolen tokens work forever.

**Fix**:
```javascript
const token = jwt.sign(
  { id: user.id, username: user.username },
  SECRET_KEY,
  { expiresIn: '7d' } // Add expiration
);
```

#### 6. localStorage for JWT Tokens
**Frontend locations**: Throughout (`Login.jsx:18,42`, `ItemList.jsx:16`, etc.)

Vulnerable to XSS attacks. Consider httpOnly cookies (requires backend change) or implement strict Content Security Policy.

---

### Backend Improvements

#### Architecture Issues

**1. Monolithic 524-Line File**

Everything in `server.js` makes testing and maintenance difficult.

**Recommended Structure**:
```
backend/
├── config/
│   ├── database.js
│   └── passport.js
├── models/
│   ├── User.js
│   ├── Item.js
│   ├── Box.js
│   └── Location.js
├── routes/
│   ├── auth.js
│   ├── items.js
│   ├── boxes.js
│   └── locations.js
├── middleware/
│   └── auth.js
└── server.js
```

**2. Database Sync in Production**
**Location**: `server.js:108`

`sequelize.sync({ alter: true })` can cause data loss by automatically modifying tables.

**Fix**: Use proper migrations with Sequelize CLI:
```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init
npx sequelize-cli migration:generate --name initial-schema
```

**3. Repeated OAuth Callback Logic**
**Lines**: 199-208, 213-222, 227-236

Extract to helper function:
```javascript
const handleOAuthCallback = (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, username: req.user.username },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Consider using POST or httpOnly cookie instead of URL param
  res.redirect(`${frontendUrl}/login?token=${token}`);
};
```

#### Missing Features

1. **Input Validation**: Use `joi` or `express-validator` to validate request bodies
2. **Rate Limiting**: Add `express-rate-limit` to prevent brute force attacks on `/api/login`
3. **Request Logging**: Add `morgan` for HTTP request logging
4. **Error Handling Middleware**: Centralized error handler for consistent responses
5. **Health Check Endpoint**: Add `GET /health` for monitoring
6. **Password Strength**: Enforce minimum password requirements
7. **API Versioning**: Prefix routes with `/api/v1/` for future compatibility

#### Code Quality

**1. Inconsistent Error Responses**

Sometimes `{ error: ... }`, sometimes `{ detail: ... }`. Standardize to one format.

**2. Unsafe Bcrypt Comparison**
**Location**: `server.js:306`

Will crash if `user.password` is null (OAuth-only users).

**Fix**:
```javascript
if (!user.password) {
  return res.status(400).json({ error: 'Please use OAuth to sign in' });
}
const validPassword = await bcrypt.compare(password, user.password);
```

**3. Magic Numbers**

Extract constants like default limit (100) to named constants at top of file.

---

### Frontend Improvements

#### Security

1. **Token Expiration Handling**: Intercept 401/403 responses and redirect to login
2. **CSRF Protection**: Add CSRF tokens for state-changing operations
3. **Content Security Policy**: Implement CSP headers to prevent XSS

#### Code Quality

**1. Repeated Auth Header Logic**

Create centralized API client:
```javascript
// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const apiClient = {
  get: async (path) => {
    const response = await fetch(`${API_URL}${path}`, {
      headers: getAuthHeaders()
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return response;
  },
  post: async (path, data) => {
    // Similar implementation
  },
  // ... put, delete
};
```

**2. No Loading States**

Add loading indicators for better UX:
```javascript
const [loading, setLoading] = useState(true);
// ... in fetchItems:
try {
  setLoading(true);
  // ... fetch logic
} finally {
  setLoading(false);
}
// ... in render:
{loading ? <p>Loading...</p> : <ItemTable items={items} />}
```

**3. Inline Styles Mixed with CSS Classes**

Choose one approach (CSS Modules, styled-components, or Tailwind) and be consistent.

**4. No Error Boundaries**

Add error boundaries to prevent entire app crashes:
```javascript
// src/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  // Implementation
}
```

#### Missing Features

1. **PropTypes or TypeScript**: Add type safety
2. **Tests**: Add Jest + React Testing Library
3. **Accessibility**: Add ARIA labels, keyboard navigation, screen reader support
4. **Responsive Design**: Add mobile-friendly layouts
5. **Loading/Error States**: Consistent loading and error UI across all components
6. **Form Validation**: Client-side validation before submission
7. **Optimistic Updates**: Update UI before server response for better UX

---

### Implementation Priority

#### Immediate (Security)
- [ ] Remove .env from git and rotate all credentials
- [ ] Configure CORS properly
- [ ] Add JWT expiration
- [ ] Fail on missing SECRET_KEY
- [ ] Add rate limiting to login endpoint

#### High Priority (Stability)
- [ ] Add input validation on all endpoints
- [ ] Add error boundaries in React
- [ ] Centralize API client in frontend
- [ ] Add database migrations
- [ ] Handle token expiration in frontend
- [ ] Add error handling middleware

#### Medium Priority (Maintainability)
- [ ] Split backend into modules
- [ ] Add request logging
- [ ] Add health check endpoint
- [ ] Standardize error responses
- [ ] Add loading states to all async operations
- [ ] Extract repeated OAuth logic

#### Low Priority (Enhancement)
- [ ] Add tests (frontend + backend)
- [ ] Add TypeScript or PropTypes
- [ ] Improve accessibility
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement proper logging service (Winston, Pino)
- [ ] Add monitoring and error tracking (Sentry)

---

### Positive Aspects

- ✅ Clean component structure with good separation of concerns
- ✅ Modern React hooks usage
- ✅ Sequelize ORM protects against SQL injection
- ✅ JWT authentication (industry standard)
- ✅ Multiple OAuth providers for user convenience
- ✅ Environment variables for configuration
- ✅ Readable and well-formatted code
- ✅ RESTful API design with proper HTTP methods
- ✅ Location/Box/Item hierarchy is well-designed
