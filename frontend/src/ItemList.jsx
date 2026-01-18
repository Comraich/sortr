import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ItemList() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch(`${API_URL}/api/items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401 || response.status === 403) return navigate('/login');
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/items/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
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
      {items.length === 0 ? (
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
                <td>{item.location || '-'}</td>
                <td>{item.boxNumber || '-'}</td>
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