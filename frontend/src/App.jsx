import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
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
import PrintQR from './PrintQR';
import './App.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1>📦 Sortr</h1>
      </Link>
      {isLoggedIn && !isLoginPage && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }}>
            Settings
          </Link>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="container">
          <Header />

          <div className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LocationHome />} />
                <Route path="/location/:id" element={<LocationDetail />} />
                <Route path="/items" element={<ItemList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/add" element={<ItemForm />} />
                <Route path="/edit/:id" element={<ItemForm />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/box/:id" element={<BoxDetail />} />
                <Route path="/print" element={<PrintQR />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/locations" element={<LocationList />} />
                <Route path="/boxes" element={<BoxList />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/users" element={<UserManagement />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;