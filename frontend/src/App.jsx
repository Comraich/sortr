import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import LocationHome from './LocationHome';
import LocationDetail from './LocationDetail';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import ItemDetail from './ItemDetail';
import BoxDetail from './BoxDetail';
import Login from './Login';
import Settings from './Settings';
import LocationList from './LocationList';
import BoxList from './BoxList';
import CategoryList from './CategoryList';
import UserManagement from './UserManagement';
import UserProfile from './UserProfile';
import PrintQR from './PrintQR';
import Scanner from './Scanner';
import ExportImport from './ExportImport';
import Dashboard from './Dashboard';
import PWAInstallPrompt from './PWAInstallPrompt';
import { ThemeProvider, useTheme } from './ThemeContext';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import NotificationsDropdown from './NotificationsDropdown';
import { isAdmin, getCurrentUser } from './api/client';
import './App.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  const isLoginPage = location.pathname === '/login';
  const currentUser = getCurrentUser();
  const userIsAdmin = currentUser?.isAdmin;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1>📦 Sortr</h1>
      </Link>
      {isLoggedIn && !isLoginPage && currentUser && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.9rem' }}>
            📊 Dashboard
          </Link>
          <Link to="/scan" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.9rem' }}>
            📷 Scan
          </Link>
          <NotificationsDropdown />
          <Link to="/profile" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500' }}>
            {currentUser.displayName || currentUser.username}
          </Link>
          {userIsAdmin && (
            <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }}>
              Settings
            </Link>
          )}
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');

  // Don't show FAB on login page or scanner page
  if (!isLoggedIn || location.pathname === '/login' || location.pathname === '/scan') {
    return null;
  }

  return (
    <button
      className="fab"
      onClick={() => navigate('/scan')}
      title="Quick Scan"
    >
      📷
    </button>
  );
}

function AppContent() {
  useKeyboardShortcuts();

  return (
    <div className="container">
      <Header />

      <div className="main-content">
        <ErrorBoundary>
          <Routes>
                <Route path="/" element={<LocationHome />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/location/:id" element={<LocationDetail />} />
                <Route path="/items" element={<ItemList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/add" element={<ItemForm />} />
                <Route path="/edit/:id" element={<ItemForm />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/box/:id" element={<BoxDetail />} />
                <Route path="/print" element={<PrintQR />} />
                <Route path="/scan" element={<Scanner />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/export-import" element={<ExportImport />} />
                <Route path="/settings" element={<ProtectedAdminRoute><Settings /></ProtectedAdminRoute>} />
                <Route path="/locations" element={<ProtectedAdminRoute><LocationList /></ProtectedAdminRoute>} />
                <Route path="/boxes" element={<ProtectedAdminRoute><BoxList /></ProtectedAdminRoute>} />
                <Route path="/categories" element={<ProtectedAdminRoute><CategoryList /></ProtectedAdminRoute>} />
                <Route path="/users" element={<ProtectedAdminRoute><UserManagement /></ProtectedAdminRoute>} />
              </Routes>
            </ErrorBoundary>
          </div>

      {/* Floating Action Button for mobile */}
      <FloatingActionButton />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;