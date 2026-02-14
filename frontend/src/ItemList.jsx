import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/items/');
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await apiClient.delete(`/api/items/${id}`);
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert('Failed to delete item. Please try again.');
    }
  };

  return (
    <section className="card list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Current Stock</h2>
        <Link to="/add" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
          Add New Item
        </Link>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <Link to="/" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          &larr; Back to Locations
        </Link>
      </div>

      {loading ? (
        <p>Loading items...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : items.length === 0 ? (
        <p>No items in storage.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Box #</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || '-'}</td>
                <td>{item.Box?.Location?.name || item.Location?.name || '-'}</td>
                <td>{item.Box?.name || '-'}</td>
                <td>
                  <button 
                    className="btn-small" 
                    onClick={() => navigate(`/edit/${item.id}`)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ItemList;