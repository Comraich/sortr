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
