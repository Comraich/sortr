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
- **Key Components**:
  - `App.jsx` - Router setup with protected routes
  - `Login.jsx` - Username/password authentication
  - `LocationHome.jsx` - Main location/box navigation
  - `ItemList.jsx` - Inventory table with search and CRUD actions
  - `ItemForm.jsx` - Add/edit items with QR code generation
  - `UserManagement.jsx` - Admin-only user management
  - `QRCodeDisplay.jsx` - QR code display with print/download (secure Blob URL implementation)
- **API URL**: Configured via `VITE_API_URL` env var (defaults to `http://localhost:8000`)
- **Auth**: JWT token stored in `localStorage`, sent as `Bearer` token in `Authorization` header

### Backend (`/backend`)
- **Tech**: Express 5 + Sequelize ORM
- **Structure**: Modular architecture (~2,700 lines across 16+ modules)
  - `server.js` (144 lines) - Application entry point
  - `config/` - Database, constants configuration
  - `models/` - User, Item, Box, Location, Category models
  - `routes/` - Modular route handlers (auth, items, boxes, locations, users, profile, categories, health)
  - `middleware/` - Auth, validation, admin middleware
  - `migrations/` - Database schema migrations (6 migrations)
- **Database**: SQLite by default (`inventory.db`), PostgreSQL optional via `DB_DIALECT=postgres`
- **Models**:
  - `User`: username, password (hashed), email, displayName, isAdmin
  - `Item`: id, name, category, description, locationId, boxId
  - `Box`: id, name, locationId
  - `Location`: id, name
  - `Category`: id, name
- **Auth**: JWT-based authentication (username/password only)

### API Endpoints
- `GET /health` - Health check endpoint
- `POST /api/register` - Create account (first user is auto-admin)
- `POST /api/login` - Get JWT token
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update current user profile
- `GET/POST /api/items/` - List/create items (requires auth)
- `GET/PUT/DELETE /api/items/:id` - Item CRUD (requires auth)
- `GET/POST /api/boxes/` - List/create boxes (requires auth)
- `GET/PUT/DELETE /api/boxes/:id` - Box CRUD (requires auth)
- `GET/POST /api/locations/` - List/create locations (requires auth)
- `GET/PUT/DELETE /api/locations/:id` - Location CRUD (requires auth)
- `GET/POST /api/categories/` - List/create categories (requires auth)
- `DELETE /api/categories/:id` - Delete category (requires auth)
- `GET/POST /api/users/` - List/create users (admin only)
- `PUT/DELETE /api/users/:id` - Update/delete user (admin only)

## Configuration

Environment variables in root `.env` file:
- `PORT` - Backend port (default 8000)
- `DB_STORAGE` - SQLite file path
- `SECRET_KEY` - JWT signing key (required, use: `openssl rand -base64 32`)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `VITE_API_URL` - Backend API endpoint (default: http://localhost:8000)
- `VITE_BASE_URL` - Base path for frontend deployment (e.g., `/sortr/` for hosting at `example.com/sortr`)
- `VITE_APP_URL` - Full app URL for QR codes (optional, auto-detected from origin + base path)
- PostgreSQL config (optional): `DB_DIALECT`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Vite is configured to read env from parent directory (`envDir: '../'`).

### Deploying at a Custom Path

To deploy the app at a path other than root (e.g., `https://example.com/sortr`):

1. Set `VITE_BASE_URL=/sortr/` in `.env` (trailing slash required)
2. Set `FRONTEND_URL=https://example.com/sortr` for CORS
3. Rebuild the frontend: `npm run build`
4. Configure your reverse proxy to serve the frontend at `/sortr`

---

## Code Review & Improvement Status

**Last Updated**: February 15, 2026 - Morning Session

This section tracks completed improvements and remaining tasks. Use this to pick up where you left off after interruptions.

---

### ✅ **COMPLETED IMPROVEMENTS**

#### Immediate Security ✅ (100% Complete - ALL DONE!)
- [x] **SECRET_KEY validation** - Server fails to start if missing (middleware/auth.js:4-9)
- [x] **CORS properly configured** - Multiple allowed origins (server.js:34-57)
- [x] **JWT expiration added** - 7-day expiration (config/constants.js:4)
- [x] **Rate limiting** - 5 attempts per 15 minutes on auth endpoints (middleware/validation.js:19-27)
- [x] **.env protection** - In .gitignore, never committed to git history ✅
- [x] **.env.example created** - With placeholder values for documentation
- [x] **.env credentials verified** - Development-only, never committed to git ✅
- [x] **OAuth completely removed** - All OAuth code, dependencies, and database fields removed (Feb 15, 2026)

#### High Priority Stability ✅ (100% Complete - ALL DONE!)
- [x] **Input validation** - express-validator on all endpoints (middleware/validation.js)
- [x] **Error boundaries** - React ErrorBoundary.jsx with nested protection in App.jsx
- [x] **Centralized API client** - frontend/src/api/client.js with automatic token handling
- [x] **Token expiration handling** - Automatic redirect to login on 401/403 (api/client.js:24-27)
- [x] **Error handling middleware** - Comprehensive error handler (server.js:105-133)
- [x] **Database migrations** - 6 migrations active, removed dangerous { alter: true } (server.js:66-68)
- [x] **Standardized error responses** - All APIs use { error: ... } format consistently
- [x] **QRCodeDisplay security** - Replaced innerHTML with outerHTML, replaced document.write() with Blob URLs (Feb 15, 2026)

#### Medium Priority Maintainability ✅ (100% Complete - ALL DONE!)
- [x] **Request logging** - Morgan middleware (server.js:29-31)
- [x] **Loading states** - Added to components (ItemList.jsx:8,23,61-63)
- [x] **Health check endpoint** - GET /health for monitoring (routes/health.js)
- [x] **Extract magic numbers** - Constants file with JWT_EXPIRATION, RATE_LIMIT_*, DEFAULT_QUERY_LIMIT (config/constants.js)
- [x] **Modular backend structure** - 16+ modules across config/, models/, routes/, middleware/ (Feb 7, 2026)

#### Testing ✅ (Good Coverage)
- [x] **Backend tests** - 56 tests across 4 suites (auth, items, users, basic) - 100% passing
- [x] **Frontend tests** - api/client.test.js, ErrorBoundary.test.jsx

---

### 🎯 **REMAINING TASKS (Optional Enhancements)**

**Note**: All critical and high-priority issues have been resolved. The items below are optional enhancements for future consideration.

#### Medium Priority (Optional Enhancements)

**1. localStorage for JWT Tokens**
- **Current**: JWT stored in localStorage (XSS vulnerability if compromised)
- **Alternative**: httpOnly cookies (more secure, requires backend changes)
- **Current Mitigation**: Input validation, error boundaries, Content Security Policy
- **Status**: Acceptable for current implementation

#### Low Priority (Nice-to-Have)

**2. API Documentation**
- **Missing**: Swagger/OpenAPI documentation
- **Impact**: Harder for third-party integrations
- **Solution**: Add Swagger UI with `swagger-jsdoc` and `swagger-ui-express`

**3. TypeScript or PropTypes**
- **Impact**: Lack of type safety
- **Options**: Add TypeScript (significant refactor) or PropTypes (simpler)

**4. Accessibility Improvements**
- **Missing**: ARIA labels, enhanced keyboard navigation, screen reader support
- **Impact**: Reduced usability for users with disabilities

**5. Monitoring & Error Tracking**
- **Missing**: Production monitoring (Sentry, LogRocket)
- **Impact**: Harder to debug production issues

**6. API Versioning**
- **Current**: Routes like `/api/items`
- **Recommendation**: Version as `/api/v1/items` for future compatibility

---

### 📋 **OPTIONAL ENHANCEMENTS**

All critical and high-priority items are complete. Consider these optional enhancements:

**Medium Priority:**
- Add comprehensive API documentation (Swagger/OpenAPI)
- Implement httpOnly cookie authentication (more secure than localStorage)
- Improve accessibility (ARIA labels, keyboard navigation)
- Expand test coverage (currently 56 tests)
- Implement monitoring/error tracking (Sentry)
- API versioning (prefix routes with /api/v1/)

**Low Priority:**
- Add TypeScript or PropTypes for type safety
- Optimize bundle size
- Add service worker for offline support
- Add more granular user permissions (beyond admin/user)

---

### 🎯 **CURRENT STATE SUMMARY**

**Security**: 100% complete ✅ - All critical issues resolved, OAuth removed!
**Stability**: 100% complete ✅ - Excellent error handling and validation
**Maintainability**: 100% complete ✅ - Modular backend, logging, health checks, constants
**Testing**: Good ✅ - 56 passing tests (can expand for more coverage)
**Documentation**: 80% complete - Excellent CLAUDE.md, README.md, migration docs, missing API docs

**Overall Progress**: 100% of critical/high priority items complete! 🎉

### 🎉 **Recent Achievements**

#### February 15, 2026 - Code Cleanup
- ✅ **Removed all OAuth code** - Deleted passport.js, removed OAuth dependencies (26 packages), created migration to remove OAuth fields from User model
- ✅ **Fixed QRCodeDisplay.jsx security** - Replaced innerHTML with outerHTML, replaced document.write() with Blob URLs, added HTML escaping
- ✅ **Updated documentation** - CLAUDE.md and MEMORY.md now reflect current modular architecture and removal of OAuth

#### February 7, 2026 - Full Day Session

**Morning - Critical Security Fixes**
- ✅ Fixed OAuth token security (hash fragments instead of query params)
- ✅ Verified .env credentials are secure and not committed
- ✅ Implemented database migrations (production-safe schema management)
- ✅ Standardized all error responses ({ error: ... } format)

**Afternoon - Major Refactoring**
- ✅ **Backend modular refactoring** - 677 lines → 144 lines server.js, 16 separate modules
  - config/ (database.js, constants.js)
  - models/ (User.js, Item.js, Box.js, Location.js, Category.js, index.js)
  - routes/ (auth.js, items.js, boxes.js, locations.js, categories.js, users.js, profile.js, health.js)
  - middleware/ (auth.js, validation.js, admin.js, index.js)
- ✅ Fixed all 15 failing tests (database race condition with dbReady promise)
- ✅ Created comprehensive README.md (427 lines with full documentation)

**Evening - Docker & Infrastructure**
- ✅ **Complete Docker setup** (production + development modes)
- ✅ Added health check endpoint
- ✅ Extracted magic numbers to named constants
- ✅ User management features (admin controls, user profiles)

---

### ✅ **POSITIVE ASPECTS**

#### Architecture & Code Quality
- ✅ Modular backend structure (config/, models/, routes/, middleware/, migrations/)
- ✅ Clean component structure with good separation of concerns
- ✅ Modern React hooks usage throughout
- ✅ Centralized API client with automatic error handling
- ✅ RESTful API design with proper HTTP methods
- ✅ Location/Box/Item hierarchy is well-designed
- ✅ Readable and well-formatted code
- ✅ Named constants instead of magic numbers

#### Security
- ✅ JWT authentication with expiration (7-day tokens)
- ✅ Username/password authentication with bcrypt hashing
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
