import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';
import ImageUpload from './ImageUpload';
import ActivityFeed from './ActivityFeed';
import { apiClient, isAuthenticated } from './api/client';

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
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get(`/api/items/${id}`);
      setItem(data);
    } catch (err) {
      setError(err.message || 'Error loading item');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUpdate = (newImages) => {
    setItem({ ...item, images: newImages });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/items/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.message || 'Error deleting item');
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
          {item.description && (
            <div className="detail-row" style={{ marginTop: '15px' }}>
              <span className="detail-label">Description: </span>
              <p style={{ margin: '5px 0 0 0', color: '#374151', whiteSpace: 'pre-wrap' }}>{item.description}</p>
            </div>
          )}
        </div>

        <QRCodeDisplay
          value={`${APP_URL}/item/${item.id}`}
          label={item.name}
        />
      </div>

      {/* Image Upload Section */}
      <ImageUpload
        itemId={item.id}
        existingImages={item.images || []}
        onImagesUpdate={handleImagesUpdate}
      />

      {/* Activity History */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <ActivityFeed entityType="item" entityId={item.id} limit={20} />
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
