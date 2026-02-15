import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';
import ImageUpload from './ImageUpload';
import ActivityFeed from './ActivityFeed';
import { apiClient, isAuthenticated } from './api/client';
import { addToRecentlyViewed } from './RecentlyViewed';

const APP_URL = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);

  useEffect(() => {
    fetchItem();
    fetchSimilarItems();
  }, [id]);

  const fetchItem = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get(`/api/items/${id}`);
      setItem(data);
      // Add to recently viewed
      addToRecentlyViewed(id);
    } catch (err) {
      setError(err.message || 'Error loading item');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarItems = async () => {
    try {
      const data = await apiClient.get(`/api/suggestions/similar/${id}`);
      setSimilarItems(data.similar || []);
    } catch (err) {
      console.error('Error fetching similar items:', err);
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
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {item.isFavorite && <span style={{ color: '#fbbf24', fontSize: '1.5rem' }}>⭐</span>}
            {item.name}
          </h2>
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #3b82f6',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#1e40af'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
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

      {/* Similar Items */}
      {similarItems.length > 0 && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>🔍 Similar Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {similarItems.map((similar) => (
              <Link
                key={similar.id}
                to={`/item/${similar.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{similar.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {similar.category || 'Uncategorized'} • {similar.location} {similar.box !== '-' ? `• ${similar.box}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '500' }}>
                  {similar.similarity} match
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
