import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const APP_URL = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch(`${API_URL}/api/items/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) return navigate('/login');

      if (response.ok) {
        const data = await response.json();
        setItem(data);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      setError('Error loading item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        navigate('/');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Error deleting item');
    }
  };

  if (loading) {
    return (
      <section className="card">
        <p>Loading...</p>
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="card">
        <h2>Item Not Found</h2>
        <p>{error || 'The requested item could not be found.'}</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 20px', textDecoration: 'none', marginTop: '15px' }}>
          Back to Inventory
        </Link>
      </section>
    );
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{item.name}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/edit/${item.id}`} className="btn-small" style={{ textDecoration: 'none' }}>
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger btn-small">
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-info">
          <div className="detail-row">
            <span className="detail-label">Category: </span>
            <span className="detail-value">{item.category || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Location: </span>
            <span className="detail-value">{item.Box?.Location?.name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Box: </span>
            <span className="detail-value">
              {item.Box ? (
                <Link to={`/box/${item.Box.id}`}>{item.Box.name}</Link>
              ) : '-'}
            </span>
          </div>
        </div>

        <QRCodeDisplay
          value={`${APP_URL}/item/${item.id}`}
          label={item.name}
        />
      </div>

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Inventory
        </Link>
      </div>
    </section>
  );
}

export default ItemDetail;
