import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function ItemList() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesCategory = item.category?.toLowerCase().includes(query);
    const matchesLocation = (item.Box?.Location?.name || item.Location?.name)?.toLowerCase().includes(query);
    const matchesBox = item.Box?.name?.toLowerCase().includes(query);

    return matchesName || matchesCategory || matchesLocation || matchesBox;
  });

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

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items by name, category, location, or box..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        />
        {searchQuery && (
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading items...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredItems.length === 0 ? (
        <p>{searchQuery ? 'No items match your search.' : 'No items in storage.'}</p>
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
            {filteredItems.map((item) => (
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