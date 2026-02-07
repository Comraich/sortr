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

## Code Review & Improvement Status

**Last Updated**: February 7, 2026 - Evening Session

This section tracks completed improvements and remaining tasks. Use this to pick up where you left off after interruptions.

---

### ✅ **COMPLETED IMPROVEMENTS**

#### Immediate Security ✅ (100% Complete - ALL DONE!)
- [x] **SECRET_KEY validation** - Server fails to start if missing (server.js:19-24)
- [x] **CORS properly configured** - Specific origin only (server.js:33-36)
- [x] **JWT expiration added** - 7-day expiration (uses JWT_EXPIRATION constant)
- [x] **Rate limiting** - 5 attempts per 15 minutes on auth endpoints (server.js:221-228)
- [x] **.env protection** - In .gitignore, never committed to git history ✅
- [x] **.env.example created** - With placeholder values for documentation
- [x] **OAuth tokens secured** - Changed from query params to hash fragments (server.js:258-260)
- [x] **.env credentials verified** - Development-only, never committed to git ✅

#### High Priority Stability ✅ (100% Complete - ALL DONE!)
- [x] **Input validation** - express-validator on all endpoints (throughout server.js)
- [x] **Error boundaries** - React ErrorBoundary.jsx with nested protection in App.jsx
- [x] **Centralized API client** - frontend/src/api/client.js with automatic token handling
- [x] **Token expiration handling** - Automatic redirect to login on 401/403 (client.js:24-27)
- [x] **Error handling middleware** - Comprehensive error handler (server.js:620-655)
- [x] **Safe OAuth-only user check** - Prevents crashes (server.js:373-375)
- [x] **Database migrations** - Sequelize migrations active, removed dangerous { alter: true }
- [x] **Standardized error responses** - All APIs use { error: ... } format (7 instances fixed)
- [x] **OAuth callback refactoring** - Extracted to handleOAuthCallback() helper (server.js:247-260)

#### Medium Priority Maintainability (60% Complete)
- [x] **Request logging** - Morgan middleware (server.js:28-30)
- [x] **Loading states** - Added to components (ItemList.jsx:7,22,60-62)
- [x] **Health check endpoint** - GET /health for monitoring (server.js:263-271)
- [x] **Extract magic numbers** - Constants section with JWT_EXPIRATION, RATE_LIMIT_*, DEFAULT_QUERY_LIMIT (server.js:26-30)

#### Low Priority Enhancement (20% Complete)
- [x] **Backend tests** - auth.test.js, items.test.js, basic.test.js in __tests__/ folder
- [x] **Frontend tests** - client.test.js, ErrorBoundary.test.jsx

---

### 🔴 **REMAINING TASKS**

#### High Priority

**1. Monolithic Backend Structure**
- **Current**: All 675 lines in single `server.js` file
- **Impact**: Difficult to test, maintain, and scale
- **Effort**: ~4 hours (larger refactoring project)
- **Recommended Structure**:
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
- **Note**: This is optional - current structure works fine for the app's scale

#### Medium Priority

**2. localStorage for JWT Tokens (Security Consideration)**
- **Current**: JWT stored in localStorage (vulnerable to XSS)
- **Trade-off**: localStorage is accessible to JavaScript (XSS risk) but easier to implement
- **Alternative**: httpOnly cookies (requires backend changes, more secure)
- **Current Mitigation**: Input validation and error boundaries reduce XSS risk
- **Recommendation**: Acceptable for current implementation, consider httpOnly cookies for future enhancement

#### Low Priority

**10. No API Documentation**
- **Missing**: Swagger/OpenAPI documentation
- **Impact**: Harder for frontend developers or third-party integrations
- **Solution**: Add Swagger UI with `swagger-jsdoc` and `swagger-ui-express`

**11. No TypeScript or PropTypes**
- **Impact**: Lack of type safety, harder to catch bugs
- **Options**: Add TypeScript (significant refactor) or PropTypes (simpler)

**12. Limited Accessibility**
- **Missing**: ARIA labels, keyboard navigation enhancements, screen reader support
- **Impact**: Harder to use for users with disabilities

**13. No Monitoring/Error Tracking**
- **Missing**: Sentry, LogRocket, or similar service
- **Impact**: Harder to debug production issues

**14. API Versioning**
- **Current**: Routes like `/api/items`
- **Recommendation**: Version as `/api/v1/items` for future compatibility

---

### 📋 **RECOMMENDED NEXT STEPS**

#### Optional Enhancements (No Critical Items Remaining!)

**Larger Projects (> 3 hours):**
- Split backend into modular structure (~4 hours)
- Add comprehensive API documentation (Swagger/OpenAPI)
- Implement httpOnly cookie authentication (more secure than localStorage)
- Add TypeScript to frontend

**Medium Priority:**
- Improve accessibility (ARIA labels, keyboard navigation)
- Add more comprehensive tests
- Implement monitoring/error tracking (Sentry)
- API versioning (prefix routes with /api/v1/)

**Low Priority:**
- Add PropTypes or TypeScript for type safety
- Optimize bundle size
- Add service worker for offline support

---

### 🎯 **CURRENT STATE SUMMARY**

**Security**: 100% complete ✅ - All critical issues resolved!
**Stability**: 100% complete ✅ - Excellent error handling and validation
**Maintainability**: 60% complete - Good logging, health checks, clean constants
**Testing**: 20% complete - Basic tests in place, can be expanded
**Documentation**: 40% complete - Excellent CLAUDE.md, migration docs, missing API docs

**Overall Progress**: ~80% of critical/high priority items complete

### 🎉 **Recent Achievements (Feb 7, 2026 Full Day Session)**

#### Morning - Critical Security Fixes
- ✅ Fixed OAuth token security (hash fragments instead of query params)
- ✅ Verified .env credentials are secure and not committed
- ✅ Implemented database migrations (production-safe schema management)
- ✅ Standardized all error responses ({ error: ... } format)

#### Afternoon - Major Refactoring
- ✅ **Backend modular refactoring** - 677 lines → 112 lines, 16 separate modules
  - config/ (database.js, passport.js, constants.js)
  - models/ (User.js, Item.js, Box.js, Location.js, index.js)
  - routes/ (auth.js, items.js, boxes.js, locations.js, health.js)
  - middleware/ (auth.js, validation.js)
- ✅ Fixed all 15 failing tests (database race condition with dbReady promise)
- ✅ Created comprehensive README.md (427 lines with full documentation)

#### Evening - Docker & Infrastructure
- ✅ **Complete Docker setup** (production + development modes)
  - Production: docker-compose.yml with optimized multi-stage builds
  - Development: docker-compose.dev.yml with hot reloading
  - Dockerfiles for backend and frontend (prod + dev versions)
  - Nginx configuration for React SPA
  - DOCKER.md documentation (285 lines)
  - test-docker.sh automated testing script
- ✅ Added health check endpoint
- ✅ Extracted magic numbers to named constants
- ✅ Refactored OAuth callback logic (DRY principle)

---

### ✅ **POSITIVE ASPECTS**

#### Architecture & Code Quality
- ✅ Clean component structure with good separation of concerns
- ✅ Modern React hooks usage throughout
- ✅ RESTful API design with proper HTTP methods
- ✅ Location/Box/Item hierarchy is well-designed
- ✅ Readable and well-formatted code
- ✅ Named constants instead of magic numbers

#### Security
- ✅ JWT authentication with expiration (7-day tokens)
- ✅ Multiple OAuth providers (Google, GitHub, Microsoft)
- ✅ OAuth tokens secured via hash fragments (not in server logs)
- ✅ Sequelize ORM protects against SQL injection
- ✅ Rate limiting prevents brute force attacks (5 attempts per 15 min)
- ✅ Input validation on all endpoints
- ✅ CORS properly configured
- ✅ Environment variables for secure configuration
- ✅ .env never committed to git

#### Stability & Operations
- ✅ Database migrations for safe schema changes
- ✅ Error boundaries prevent app crashes
- ✅ Centralized API client with automatic token expiration handling
- ✅ Comprehensive error handling middleware
- ✅ Health check endpoint for monitoring
- ✅ Request logging with Morgan
- ✅ Loading states for better UX
- ✅ Consistent error response format
