import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import Login from './Login';
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
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      )}
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="container">
        <Header />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<ItemList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add" element={<ItemForm />} />
            <Route path="/edit/:id" element={<ItemForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;