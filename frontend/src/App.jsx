import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import Login from './Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <header>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>📦 Storage Inventory</h1>
          </Link>
        </header>

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