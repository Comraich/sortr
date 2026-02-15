# 📦 Sortr - Enterprise Storage Inventory Management

A **production-ready, enterprise-grade** web application for tracking and managing storage inventory with advanced features including QR codes, AI-powered suggestions, collaboration tools, expiration tracking, and comprehensive analytics.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-56%2F56%20passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

## ✨ Comprehensive Features

### 🔐 Authentication & User Management
- **Multi-user Support** with role-based access control (Admin/User)
- **Multiple Authentication Methods**: Username/password + OAuth (Google, GitHub, Microsoft)
- **JWT-based Security** with 7-day token expiration
- **Rate Limiting** on auth endpoints (5 attempts per 15 minutes)
- **User Profiles** with display names and avatars

### 📍 Organization & Storage
- **Hierarchical Location Management** - Multi-level organization (Warehouse → Building → Room → Shelf)
- **Location Hierarchy** with parent-child relationships and breadcrumb navigation
- **Box Management** within locations for container-level organization
- **Category System** with auto-suggestions based on item names
- **Tags** for flexible item classification (JSON-based, unlimited tags)
- **Favorites** to mark important items with star indicators

### 🏷️ QR Code System
- **QR Code Generation** for items, boxes, and locations
- **QR Code Scanning** with camera support (mobile/desktop)
- **Batch QR Printing** with customizable layouts
- **5mm × 5mm QR codes** optimized for small label printing

### 🔍 Search & Discovery
- **Advanced Filtering** by category, location, box, tags, and favorites
- **Full-text Search** across item names and descriptions
- **Smart Suggestions**:
  - AI-powered category recommendations based on item names
  - Duplicate detection with similarity matching
  - Box suggestions for items based on category
  - Empty box finder for efficient storage
- **Similar Items** finder using fuzzy string matching

### 📊 Analytics & Reporting
- **Interactive Dashboard** with:
  - Quick stats cards (total items, boxes, locations, categories)
  - Storage utilization metrics and charts
  - Items by category (bar chart)
  - Items by location (pie chart)
  - Top boxes by item count
  - Recent activity feed
  - Expiring items widget
- **Export Functionality**:
  - Export entire inventory to JSON
  - Import inventory from JSON (with validation)
  - Backup and restore capabilities

### 👥 Collaboration Features
- **Resource Sharing** - Share items, locations, or boxes with specific users
- **Permission Levels** - View-only or edit access per share
- **Comments** on items with threaded discussions
- **Real-time Notifications**:
  - Share notifications
  - Comment notifications
  - Expiration reminders
  - Unread badge with count
  - 30-second auto-refresh

### ⏰ Expiration Tracking
- **Expiration Dates** on items with visual indicators
- **Color-coded Status**:
  - 🔴 Red: Expired
  - 🟠 Orange: Expires today
  - 🟡 Amber: 1-3 days until expiration
  - 🟢 Green: 4+ days until expiration
- **Dashboard Widget** showing expiring/expired items
- **Automated Notifications** for items expiring soon
- **Bulk Expiration Queries** via API

### 📸 Media & Content
- **Image Upload** for items (multiple images per item)
- **Image Gallery** with thumbnails
- **Rich Text Descriptions** with multi-line support
- **Activity History** - Complete audit trail of all changes

### 🎨 User Experience
- **Dark Mode** with system preference detection
- **Recently Viewed Items** with localStorage tracking
- **Keyboard Shortcuts**:
  - `n` - New item
  - `s` - Open scanner
  - `h` - Go home
  - `i` - View all items
  - `d` - Open dashboard
  - `Esc` - Clear input focus
  - `?` - Show help
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **PWA Support** - Install as native app on mobile/desktop
- **Offline Capability** with service worker caching
- **Touch-Friendly** UI with 44px minimum touch targets

### 🔄 Bulk Operations
- **Bulk Select** with checkbox interface
- **Bulk Move** items to different locations/boxes
- **Bulk Categorize** multiple items at once
- **Bulk Delete** with confirmation

### 📱 Mobile & Progressive Web App
- **Mobile-Optimized** interface with responsive layouts
- **PWA Manifest** for app installation
- **Service Worker** with network-first caching
- **Install Prompts** for iOS and Android
- **Floating Action Button** for quick access to scanner
- **App Shortcuts** for common actions

### 🛡️ Security & Reliability
- **Input Validation** on all endpoints with express-validator
- **SQL Injection Protection** via Sequelize ORM
- **XSS Protection** with React's built-in escaping
- **CORS Configuration** with specific origin whitelisting
- **Rate Limiting** to prevent brute force attacks
- **Error Boundaries** to prevent app crashes
- **Comprehensive Error Handling** with user-friendly messages
- **Database Migrations** for safe schema changes
- **Health Check Endpoint** for monitoring

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router 6** - Client-side routing
- **Vite** - Lightning-fast build tool
- **Recharts** - Data visualization
- **QRCode.react** - QR code generation
- **jsQR** - QR code scanning
- **Service Workers** - Offline support

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5** - Web framework
- **Sequelize ORM** - Database abstraction
- **SQLite/PostgreSQL** - Database options
- **Passport.js** - OAuth authentication
- **JWT** - Token-based auth
- **Multer** - File uploads
- **Morgan** - HTTP logging
- **Helmet** - Security headers
- **Jest** - Testing framework

### Database Schema
```
Users (id, username, password, email, displayName, isAdmin, googleId, githubId, microsoftId)
  ↓
Locations (id, name, parentId)  ← Hierarchical
  ↓
Boxes (id, name, locationId)
  ↓
Items (id, name, category, description, expirationDate, tags[], isFavorite, images[], locationId, boxId)
  ↓
Comments (id, userId, itemId, content)
  ↓
Shares (id, userId, sharedByUserId, resourceType, resourceId, permission)
  ↓
Notifications (id, userId, type, message, resourceType, resourceId, isRead)
  ↓
Activities (id, userId, entityType, entityId, action, changes)
  ↓
Categories (id, name, itemCount)
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **SQLite** (default) or **PostgreSQL** (recommended for production)
- **Git** for version control
- OAuth credentials (optional, for social login)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sortr.git
cd sortr
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment

```bash
# In project root
cp .env.example .env
```

Edit `.env` with your settings. **Minimum required:**

```bash
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -base64 32
```

### 4. Run Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### 5. Start the Application

**Development Mode:**

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access the app:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

### 6. Create Admin User

**Option 1: Via Registration**
- Register a new account through the UI
- Manually set `isAdmin=1` in the database for that user

**Option 2: Via Database**
```bash
cd backend
sqlite3 inventory.db
UPDATE Users SET isAdmin = 1 WHERE username = 'yourusername';
.quit
```

## ⚙️ Configuration

### Environment Variables

Create `.env` in project root:

```bash
# Server Configuration
PORT=8000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000
VITE_BASE_URL=/  # Base path for deployment (e.g., /sortr/)
VITE_APP_URL=http://localhost:5173  # Full app URL for QR codes

# Security (REQUIRED)
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -base64 32
JWT_EXPIRATION=7d

# Database - SQLite (Default)
DB_STORAGE=./inventory.db

# Database - PostgreSQL (Production)
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_NAME=sortr
# DB_USER=postgres
# DB_PASSWORD=yourpassword

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common

# Environment
NODE_ENV=development  # production | development | test
```

### OAuth Setup

#### Google OAuth
1. Go to https://console.cloud.google.com/
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`

#### GitHub OAuth
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:8000/auth/github/callback`

#### Microsoft OAuth
1. Go to https://portal.azure.com/
2. App registrations → New registration
3. Redirect URI: `http://localhost:8000/auth/microsoft/callback`

## 📁 Project Structure

```
sortr/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Configuration
│   │   ├── constants.js       # App constants
│   │   ├── database.js        # Sequelize config
│   │   └── passport.js        # OAuth strategies
│   ├── models/                # Sequelize models
│   │   ├── index.js           # Model loader with associations
│   │   ├── User.js            # User authentication
│   │   ├── Location.js        # Storage locations (hierarchical)
│   │   ├── Box.js             # Boxes within locations
│   │   ├── Item.js            # Inventory items
│   │   ├── Category.js        # Item categories
│   │   ├── Activity.js        # Audit log
│   │   ├── Share.js           # Resource sharing
│   │   ├── Comment.js         # Item comments
│   │   └── Notification.js    # User notifications
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT authentication
│   │   └── validation.js      # Input validation
│   ├── routes/                # API endpoints
│   │   ├── auth.js            # Authentication & OAuth
│   │   ├── profile.js         # User profiles
│   │   ├── users.js           # User management (admin)
│   │   ├── locations.js       # Location CRUD + hierarchy
│   │   ├── boxes.js           # Box CRUD
│   │   ├── items.js           # Item CRUD + images
│   │   ├── categories.js      # Category management
│   │   ├── activities.js      # Activity logs
│   │   ├── export.js          # Export/import
│   │   ├── stats.js           # Dashboard statistics
│   │   ├── suggestions.js     # AI suggestions
│   │   ├── shares.js          # Sharing system
│   │   ├── comments.js        # Comment system
│   │   ├── notifications.js   # Notification system
│   │   ├── expiration.js      # Expiration tracking
│   │   └── health.js          # Health check
│   ├── migrations/            # Database migrations
│   ├── uploads/               # Uploaded images
│   ├── __tests__/             # Test suite (56 tests)
│   ├── server.js              # Main entry point
│   └── package.json
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js      # Centralized API client
│   │   ├── components/        # React components (30+)
│   │   │   ├── App.jsx        # Main app + routing
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Dashboard.jsx  # Analytics dashboard
│   │   │   ├── ItemList.jsx   # Item table with bulk ops
│   │   │   ├── ItemForm.jsx   # Add/edit items
│   │   │   ├── ItemDetail.jsx # Item detail view
│   │   │   ├── LocationHome.jsx      # Location overview
│   │   │   ├── LocationList.jsx      # Location management
│   │   │   ├── LocationDetail.jsx    # Location detail
│   │   │   ├── BoxList.jsx           # Box management
│   │   │   ├── BoxDetail.jsx         # Box detail
│   │   │   ├── CategoryList.jsx      # Category management
│   │   │   ├── UserManagement.jsx    # User admin
│   │   │   ├── UserProfile.jsx       # User profile
│   │   │   ├── PrintQR.jsx           # QR code printing
│   │   │   ├── Scanner.jsx           # QR scanner
│   │   │   ├── ExportImport.jsx      # Data export/import
│   │   │   ├── ShareModal.jsx        # Sharing UI
│   │   │   ├── CommentsSection.jsx   # Comments UI
│   │   │   ├── NotificationsDropdown.jsx  # Notification bell
│   │   │   ├── ExpiringItemsWidget.jsx    # Expiration widget
│   │   │   ├── RecentlyViewed.jsx    # Recent items
│   │   │   ├── PWAInstallPrompt.jsx  # PWA install
│   │   │   ├── ThemeContext.jsx      # Dark mode
│   │   │   ├── ErrorBoundary.jsx     # Error handling
│   │   │   └── ...
│   │   ├── App.css            # Styles with dark mode
│   │   ├── main.jsx           # Entry point
│   │   └── useKeyboardShortcuts.js  # Keyboard navigation
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   └── sw.js              # Service worker
│   └── package.json
│
├── .env.example               # Example environment config
├── CLAUDE.md                  # Development guide
├── README.md                  # This file
├── DOCKER.md                  # Docker deployment guide
└── package.json
```

## 🔌 API Documentation

### Authentication

```http
POST /api/register
Content-Type: application/json

{
  "username": "john",
  "password": "secure123",
  "email": "john@example.com",
  "displayName": "John Doe"
}

Response: { "token": "jwt-token-here", "user": {...} }
```

```http
POST /api/login
Content-Type: application/json

{
  "username": "john",
  "password": "secure123"
}

Response: { "token": "jwt-token-here", "user": {...} }
```

```http
# OAuth flows (redirects to provider)
GET /auth/google
GET /auth/github
GET /auth/microsoft

# Callback (handled by backend)
GET /auth/{provider}/callback
```

### Items

```http
GET /api/items
Headers: Authorization: Bearer {token}
Query: ?category=Electronics&location=1&search=laptop&limit=50&offset=0

Response: [{ id, name, category, description, expirationDate, tags, isFavorite, images, ... }]
```

```http
POST /api/items
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Laptop Charger",
  "category": "Electronics",
  "description": "65W USB-C charger",
  "expirationDate": "2026-12-31",
  "tags": ["electronics", "accessories"],
  "isFavorite": false,
  "boxId": 5
}

Response: { id, name, ... }
```

```http
GET /api/items/:id
Headers: Authorization: Bearer {token}

Response: { id, name, category, Box: {...}, Location: {...}, ... }
```

```http
PUT /api/items/:id
Headers: Authorization: Bearer {token}
Content-Type: application/json

{ "name": "Updated Name", "category": "New Category" }

Response: { id, name, ... }
```

```http
DELETE /api/items/:id
Headers: Authorization: Bearer {token}

Response: { message: "Item deleted successfully" }
```

### Locations (with Hierarchy)

```http
GET /api/locations
Headers: Authorization: Bearer {token}

Response: [
  {
    id: 1,
    name: "Main Warehouse",
    parentId: null,
    parent: null,
    children: [{ id: 2, name: "Building A" }]
  }
]
```

```http
POST /api/locations
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Storage Room",
  "parentId": 2  // Optional parent location
}

Response: { id, name, parentId }
```

### Boxes

```http
GET /api/boxes?locationId=1
Headers: Authorization: Bearer {token}

Response: [{ id, name, locationId, Location: {...} }]
```

```http
POST /api/boxes
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Box A-01",
  "locationId": 1
}

Response: { id, name, locationId }
```

### Sharing

```http
GET /api/shares
Headers: Authorization: Bearer {token}

Response: [
  {
    id, userId, sharedByUserId, resourceType, resourceId, permission,
    user: {...}, sharedBy: {...}, resource: {...}
  }
]
```

```http
POST /api/shares
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 2,
  "resourceType": "item",
  "resourceId": 10,
  "permission": "edit"  // "view" or "edit"
}

Response: { id, userId, resourceType, resourceId, permission }
```

```http
GET /api/shares/resource/item/10
Headers: Authorization: Bearer {token}

Response: [{ id, user: {...}, permission, ... }]
```

### Comments

```http
GET /api/comments/item/:itemId
Headers: Authorization: Bearer {token}

Response: [
  {
    id, userId, itemId, content, createdAt,
    user: { id, username, displayName }
  }
]
```

```http
POST /api/comments
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "itemId": 10,
  "content": "This item needs replacement soon"
}

Response: { id, userId, itemId, content, createdAt, user: {...} }
```

### Notifications

```http
GET /api/notifications?unreadOnly=true
Headers: Authorization: Bearer {token}

Response: [
  {
    id, userId, type, message, resourceType, resourceId, isRead, createdAt
  }
]
```

```http
GET /api/notifications/unread/count
Headers: Authorization: Bearer {token}

Response: { count: 5 }
```

```http
PUT /api/notifications/:id/read
Headers: Authorization: Bearer {token}

Response: { id, isRead: true, ... }
```

```http
PUT /api/notifications/read-all
Headers: Authorization: Bearer {token}

Response: { message: "All notifications marked as read" }
```

### Expiration Tracking

```http
GET /api/expiration/expired
Headers: Authorization: Bearer {token}

Response: [{ id, name, expirationDate, ... }]
```

```http
GET /api/expiration/expiring-soon?days=7
Headers: Authorization: Bearer {token}

Response: [{ id, name, expirationDate, ... }]
```

### Statistics

```http
GET /api/stats
Headers: Authorization: Bearer {token}

Response: {
  overview: { totalItems, totalBoxes, totalLocations, ... },
  itemsByCategory: [{ category, count }],
  itemsByLocation: [{ location, count }],
  topBoxes: [...],
  emptyBoxes: [...],
  recentItems: [...],
  recentActivity: [...]
}
```

### Export/Import

```http
GET /api/export/all
Headers: Authorization: Bearer {token}

Response: {
  exportDate, version,
  locations: [...],
  boxes: [...],
  items: [...],
  categories: [...]
}
```

```http
POST /api/export/import
Headers: Authorization: Bearer {token}
Content-Type: application/json

{ locations: [...], boxes: [...], items: [...] }

Response: {
  imported: { locations: 5, boxes: 20, items: 150 },
  skipped: { ... },
  errors: []
}
```

### Health Check

```http
GET /health

Response: {
  status: "ok",
  timestamp: "2026-02-15T18:30:00.000Z",
  uptime: 3600,
  environment: "production"
}
```

## 🧪 Testing

### Run All Tests

```bash
cd backend
npm test
```

**Output:**
```
Test Suites: 4 passed, 4 total
Tests:       56 passed, 56 total
Snapshots:   0 total
Time:        2.2s
```

### Test Coverage

```bash
npm run test:coverage
```

### Run Specific Tests

```bash
npm test -- __tests__/auth.test.js
npm test -- __tests__/items.test.js
npm test -- __tests__/basic.test.js
npm test -- __tests__/routes.test.js
```

### Watch Mode

```bash
npm run test:watch
```

## 🗄️ Database

### Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status

# Create new migration
npx sequelize-cli migration:generate --name add-new-feature
```

### Available Migrations

1. `20260207-initial-setup.js` - Initial tables (Users, Locations, Boxes, Items)
2. `20260207-add-categories.js` - Categories table
3. `20260207-add-activities.js` - Activity logging
4. `20260215-add-tags-and-favorites.js` - Tags and favorites for items
5. `20260215-add-location-hierarchy.js` - Parent-child locations
6. `20260215-add-collaboration-features.js` - Shares, Comments, Notifications
7. `20260215-add-expiration-tracking.js` - Expiration dates for items

### Switching to PostgreSQL

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE sortr;
   CREATE USER sortr_user WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE sortr TO sortr_user;
   ```
3. Update `.env`:
   ```bash
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_NAME=sortr
   DB_USER=sortr_user
   DB_PASSWORD=yourpassword
   ```
4. Run migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

## 🚢 Deployment

### Production Checklist

- [x] Set strong `SECRET_KEY` (32+ characters)
- [x] Use PostgreSQL (not SQLite)
- [x] Set `NODE_ENV=production`
- [x] Configure production OAuth credentials
- [x] Set up HTTPS/SSL
- [x] Configure CORS for production domain
- [x] Run database migrations
- [x] Set up monitoring (health check endpoint available)
- [x] Configure backup strategy
- [x] Set up process manager (PM2, systemd)
- [x] Configure reverse proxy (nginx, Apache)
- [x] Set up logging

### Docker Deployment

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

**Quick start:**

```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up
```

### Traditional Deployment

#### 1. Build Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

#### 2. Serve Static Files

**Option A: Express serves frontend**
```javascript
// In backend/server.js
app.use(express.static('../frontend/dist'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

**Option B: Nginx**
```nginx
server {
  listen 80;
  server_name your-domain.com;

  # Frontend
  location / {
    root /var/www/sortr/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # Health check
  location /health {
    proxy_pass http://localhost:8000;
  }

  # OAuth callbacks
  location /auth {
    proxy_pass http://localhost:8000;
  }
}
```

#### 3. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name sortr-backend

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

### Environment-Specific Configs

```bash
# Development
.env.development

# Production
.env.production

# Testing
.env.test  # (auto-loaded by Jest)
```

## 👥 Development

### Getting Started with Development

1. **Read the docs**:
   - `CLAUDE.md` - Comprehensive development guide
   - `MIGRATIONS.md` - Database migration guide
   - `DOCKER.md` - Docker deployment guide

2. **Set up development environment**:
   ```bash
   npm install  # In both backend and frontend
   ```

3. **Run in development mode**:
   ```bash
   # Backend (with auto-reload)
   npm run dev

   # Frontend (with hot reload)
   npm run dev
   ```

### Code Style

- **Backend**: Modular architecture with routes, models, middleware
- **Frontend**: React hooks and functional components
- **Testing**: Jest for backend, comprehensive coverage
- **Error Handling**: Centralized with proper HTTP status codes
- **Validation**: Input validation on all endpoints
- **Security**: Follow OWASP best practices

### Adding New Features

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes**:
   - Backend: Add route → Add model/migration → Add tests
   - Frontend: Add component → Add routing → Style
3. **Run tests**: `npm test`
4. **Update docs**: Update README.md if needed
5. **Commit with message**: Follow conventional commits
6. **Submit PR**: Include description and testing notes

### Key Technologies to Learn

- **Sequelize**: ORM for database operations
- **Express middleware**: Authentication, validation, error handling
- **React hooks**: useState, useEffect, useContext
- **JWT**: Token-based authentication
- **Service Workers**: PWA and offline support

## 🐛 Troubleshooting

### Common Issues

#### "FATAL ERROR: SECRET_KEY environment variable is required"

**Solution:**
```bash
# Generate a secure key
openssl rand -base64 32

# Add to .env
echo "SECRET_KEY=<generated-key>" >> .env
```

#### "SQLITE_ERROR: no such table"

**Solution:**
```bash
cd backend
npx sequelize-cli db:migrate
```

#### OAuth redirect errors

**Solution:**
- Ensure callback URLs match exactly
- Development: `http://localhost:8000/auth/{provider}/callback`
- Production: `https://yourdomain.com/auth/{provider}/callback`
- Check provider console for allowed redirects

#### Port already in use

**Solution:**
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=8080
VITE_API_URL=http://localhost:8080
```

#### Images not loading

**Solution:**
- Check `uploads/` directory exists and is writable
- Verify backend is serving static files: `app.use('/uploads', express.static('uploads'))`
- Check CORS allows image domain

#### Tests failing

**Solution:**
```bash
# Clear test database
rm backend/test-inventory.db

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --verbose
```

#### Dark mode not working

**Solution:**
- Clear localStorage: `localStorage.removeItem('darkMode')`
- Check ThemeProvider wraps entire app
- Verify CSS custom properties are defined

#### Notifications not appearing

**Solution:**
- Check browser console for errors
- Verify backend notification routes are working: `GET /api/notifications/unread/count`
- Check user has notifications: `GET /api/notifications`
- Verify 30-second polling interval is running

## 📊 Performance Optimization

### Backend

- **Database Indexes**: All foreign keys indexed
- **Query Optimization**: Use `include` for eager loading
- **Pagination**: Limit/offset on list endpoints
- **Caching**: Consider Redis for frequently accessed data

### Frontend

- **Code Splitting**: Use `React.lazy()` for route-based splitting
- **Image Optimization**: Compress images before upload
- **Service Worker**: Caches static assets
- **Debouncing**: Used on search inputs (500ms)

## 🔒 Security Best Practices

### Implemented

- ✅ JWT with expiration (7 days)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on auth endpoints
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection (React escaping)
- ✅ CORS configuration
- ✅ Helmet for security headers
- ✅ OAuth state parameter validation

### Recommendations

- Use HTTPS in production
- Implement CSP headers
- Add 2FA for admin accounts
- Regular dependency updates
- Security audits: `npm audit`
- Implement session management
- Add brute force protection
- Enable database encryption

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Security-focused architecture
- Modular and maintainable codebase
- Comprehensive test coverage (56/56 tests passing)
- Production-ready with enterprise features

## 📞 Support & Contributing

### Getting Help

1. Check documentation (README.md, CLAUDE.md, DOCKER.md)
2. Review troubleshooting section
3. Search existing issues
4. Open a new issue with:
   - Environment details (OS, Node version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Update documentation
5. Submit a pull request

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community

---

**Built with ❤️ using Node.js, React, and modern web standards**

**Version 2.0.0** - Enterprise-ready inventory management system with 17+ major feature sets
