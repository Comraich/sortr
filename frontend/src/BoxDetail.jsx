import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const APP_URL = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));

function BoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [box, setBox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBox();
    fetchItems();
  }, [id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchBox = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes`, { headers });
      if (response.status === 401 || response.status === 403) return navigate('/login');

      if (response.ok) {
        const data = await response.json();
        const foundBox = data.find(b => b.id === parseInt(id));
        if (foundBox) {
          setBox(foundBox);
        } else {
          setError('Box not found');
        }
      }
    } catch (err) {
      setError('Error loading box');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/items/`, { headers });
      if (response.ok) {
        const data = await response.json();
        const boxItems = data.filter(item => item.boxId === parseInt(id));
        setItems(boxItems);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${box.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        navigate('/');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete box');
      }
    } catch (err) {
      console.error('Error deleting box:', err);
      alert('Error deleting box');
    }
  };

  if (loading) {
    return (
      <section className="card">
        <p>Loading...</p>
      </section>
    );
  }

  if (error || !box) {
    return (
      <section className="card">
        <h2>Box Not Found</h2>
        <p>{error || 'The requested box could not be found.'}</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 20px', textDecoration: 'none', marginTop: '15px' }}>
          Back to Inventory
        </Link>
      </section>
    );
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{box.name}</h2>
        <Link
          to={`/add?boxId=${box.id}`}
          className="btn-small"
          style={{ textDecoration: 'none' }}
        >
          Add Item
        </Link>
      </div>

      <div className="detail-grid">
        <div className="detail-info">
          <div className="detail-row">
            <span className="detail-label">Location: </span>
            <span className="detail-value">{box.Location?.name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Items in box: </span>
            <span className="detail-value">{items.length}</span>
          </div>
        </div>

        <QRCodeDisplay
          value={`${APP_URL}/box/${box.id}`}
          label={box.name}
        />
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Contents</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category || '-'}</td>
                  <td>
                    <Link to={`/item/${item.id}`} className="btn-small" style={{ textDecoration: 'none' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>This box is empty</p>
        </div>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Inventory
        </Link>
        {items.length === 0 && (
          <button
            onClick={handleDelete}
            className="btn-danger"
            style={{ padding: '10px 15px' }}
          >
            Delete Empty Box
          </button>
        )}
      </div>
    </section>
  );
}

export default BoxDetail;
