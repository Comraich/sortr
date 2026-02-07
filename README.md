# 📦 Sortr - Storage Inventory Management

A modern web application for tracking and managing your storage inventory with QR code support. Keep track of items across multiple locations and boxes with an intuitive interface and powerful search capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-29%2F29%20passing-brightgreen)

## ✨ Features

- 📍 **Location-based Organization** - Organize items by physical locations and boxes
- 🏷️ **QR Code Generation** - Generate QR codes for locations, boxes, and items
- 🔐 **Multiple Authentication Methods** - Username/password and OAuth (Google, GitHub, Microsoft)
- 🔍 **Fast Search & Filtering** - Quickly find items across your entire inventory
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile devices
- 🌐 **RESTful API** - Clean API for integrations and mobile apps
- 🔄 **Database Migrations** - Safe schema changes with Sequelize migrations
- ✅ **Comprehensive Tests** - 29 passing tests ensuring reliability

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server
- **QR Code Generation** - Built-in QR code support

### Backend
- **Node.js & Express 5** - Server framework
- **Sequelize ORM** - Database abstraction
- **SQLite/PostgreSQL** - Flexible database options
- **Passport.js** - Authentication with OAuth support
- **JWT** - Secure token-based authentication
- **Jest** - Testing framework

### Security & Quality
- Input validation with express-validator
- Rate limiting on authentication endpoints
- CORS protection
- Error boundaries
- Comprehensive error handling

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **SQLite** (default) or **PostgreSQL** (optional)
- OAuth credentials (optional, for social login)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
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

Copy the example environment file and configure:

```bash
# In project root
cp .env.example .env
```

Edit `.env` with your settings (see Configuration section below).

### 4. Run Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### 5. Start the Application

**Option A: Using the start script (both services)**
```bash
# From project root
./start.sh
```

**Option B: Manual start (separate terminals)**
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# Server Configuration
PORT=8000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000

# Security (REQUIRED)
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -base64 32

# Database Configuration
DB_STORAGE=./inventory.db  # SQLite file path

# PostgreSQL (optional - uncomment to use instead of SQLite)
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_NAME=sortr
# DB_USER=postgres
# DB_PASSWORD=yourpassword

# OAuth Providers (optional - for social login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
```

### OAuth Setup (Optional)

To enable social login, create OAuth applications:

1. **Google**: https://console.cloud.google.com/
2. **GitHub**: https://github.com/settings/developers
3. **Microsoft**: https://portal.azure.com/

Set the callback URLs to:
- Google: `http://localhost:8000/auth/google/callback`
- GitHub: `http://localhost:8000/auth/github/callback`
- Microsoft: `http://localhost:8000/auth/microsoft/callback`

## 📁 Project Structure

```
sortr/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Configuration files
│   │   ├── constants.js    # App constants
│   │   ├── database.js     # Database config
│   │   └── passport.js     # OAuth strategies
│   ├── models/             # Sequelize models
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── Box.js
│   │   ├── Item.js
│   │   └── index.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # JWT authentication
│   │   └── validation.js   # Input validation
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── locations.js    # Location CRUD
│   │   ├── boxes.js        # Box CRUD
│   │   ├── items.js        # Item CRUD
│   │   └── health.js       # Health check
│   ├── migrations/         # Database migrations
│   ├── __tests__/          # Test suite
│   └── server.js           # Main entry point (112 lines!)
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── public/
│
├── android/               # Android app (optional)
├── .env.example          # Example environment variables
├── CLAUDE.md             # Development documentation
└── README.md             # This file
```

## 🧪 Testing

### Run All Tests

```bash
cd backend
npm test
```

### Run Specific Test Suite

```bash
npm test -- __tests__/auth.test.js
npm test -- __tests__/items.test.js
npm test -- __tests__/basic.test.js
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

**Current Test Results**: ✅ 29/29 passing (100%)

## 🔌 API Documentation

### Authentication

```bash
# Register
POST /api/register
Body: { username, password }

# Login
POST /api/login
Body: { username, password }
Response: { token }

# OAuth
GET /auth/google
GET /auth/github
GET /auth/microsoft
```

### Locations

```bash
GET    /api/locations          # List all locations
POST   /api/locations          # Create location
PUT    /api/locations/:id      # Update location
DELETE /api/locations/:id      # Delete location
```

### Boxes

```bash
GET    /api/boxes              # List all boxes
GET    /api/boxes?locationId=1 # Filter by location
POST   /api/boxes              # Create box
PUT    /api/boxes/:id          # Update box
DELETE /api/boxes/:id          # Delete box
```

### Items

```bash
GET    /api/items              # List all items (paginated)
GET    /api/items/:id          # Get single item
POST   /api/items              # Create item
PUT    /api/items/:id          # Update item
DELETE /api/items/:id          # Delete item
```

### Monitoring

```bash
GET /health                    # Health check endpoint
Response: { status, timestamp, uptime, environment }
```

All endpoints except `/health` and auth routes require JWT authentication via `Authorization: Bearer <token>` header.

## 🗄️ Database

### Migrations

```bash
# Run pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status

# Create new migration
npx sequelize-cli migration:generate --name your-migration-name
```

See `backend/MIGRATIONS.md` for detailed migration documentation.

### Database Schema

- **Users** - Authentication (username/password + OAuth IDs)
- **Locations** - Physical storage locations
- **Boxes** - Containers within locations
- **Items** - Individual items within boxes

**Relationships:**
- Location → hasMany → Boxes
- Box → hasMany → Items
- Box → belongsTo → Location
- Item → belongsTo → Box

## 🚢 Deployment

### Production Checklist

- [ ] Set strong `SECRET_KEY` (32+ random characters)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set `NODE_ENV=production`
- [ ] Configure production OAuth credentials
- [ ] Set up HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Run database migrations
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Environment-Specific Configs

Create separate `.env` files:
- `.env.development` - Local development
- `.env.production` - Production deployment
- `.env.test` - Testing (already configured)

### Docker Deployment ✅

**Quick Start with Docker:**

```bash
# Production mode
docker-compose up -d

# Development mode (with hot reloading)
docker-compose -f docker-compose.dev.yml up
```

**Access**:
- Frontend: http://localhost (production) or http://localhost:5173 (dev)
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

**See [DOCKER.md](DOCKER.md) for complete Docker documentation**, including:
- Detailed setup instructions
- Database management with Docker
- Production deployment guide
- Troubleshooting tips
- PostgreSQL configuration

## 👥 Development

### Code Style

- **Backend**: Modular architecture with clear separation of concerns
- **Frontend**: React hooks and functional components
- **Testing**: Jest for backend, comprehensive test coverage
- **Error Handling**: Centralized error handling with proper status codes

### Key Files

- `backend/server.js` - Main server entry point (112 lines)
- `backend/CLAUDE.md` - Detailed development documentation
- `backend/MIGRATIONS.md` - Database migration guide

### Making Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Update migrations if schema changes
5. Update documentation if needed
6. Submit pull request

## 🐛 Troubleshooting

### "FATAL ERROR: SECRET_KEY environment variable is required"

Generate a secure key:
```bash
openssl rand -base64 32
```
Add it to your `.env` file.

### "SQLITE_ERROR: no such table"

Run migrations:
```bash
cd backend
npx sequelize-cli db:migrate
```

### OAuth redirect errors

Ensure your OAuth callback URLs match exactly:
- Development: `http://localhost:8000/auth/{provider}/callback`
- Production: `https://yourdomain.com/auth/{provider}/callback`

### Port already in use

Change the port in `.env`:
```bash
PORT=8080
VITE_API_URL=http://localhost:8080
```

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with modern web technologies
- Security-focused architecture
- Modular and maintainable codebase
- Comprehensive test coverage

## 📞 Support

For issues, questions, or contributions, please:
1. Check existing documentation (CLAUDE.md, MIGRATIONS.md)
2. Review troubleshooting section above
3. Open an issue on GitHub

---

**Made with ❤️ using Node.js, React, and modern web standards**
